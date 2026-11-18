import { supabase, isSupabaseConfigured } from './supabase';
import { getActiveTenantId, getScopedKey } from './tenant-context';

export interface VaultDocument {
  id: string;
  title: string;
  type: string;
  classificationLabel: string;
  entityType: string;
  entityId: string;
  entityName: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storageKey: string;
  status: 'uploaded' | 'under_review' | 'verified' | 'rejected' | 'expired';
  uploadedAt: string;
  verifiedAt?: string;
  fileDataUrl?: string;
}

const STORAGE_KEY_BASE = 'crm_compliance_documents_v2';

export const INITIAL_DOCUMENTS: VaultDocument[] = [];

export function getDocuments(): VaultDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    localStorage.removeItem('crm_compliance_documents_v1');
    const scopedKey = getScopedKey(STORAGE_KEY_BASE);
    const raw = localStorage.getItem(scopedKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to read documents from storage:', err);
    return [];
  }
}

export function saveDocuments(docs: VaultDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    const scopedKey = getScopedKey(STORAGE_KEY_BASE);
    localStorage.setItem(scopedKey, JSON.stringify(docs));
    window.dispatchEvent(new Event('crm-documents-changed'));
  } catch (err) {
    console.error('Failed to save documents to storage:', err);
  }
}

function mapSupabaseRowToVaultDoc(row: any, localMap: Map<string, VaultDocument>): VaultDocument {
  const existing = localMap.get(row.id);
  const metadata = row.metadata || {};

  const type = row.document_type || existing?.type || 'kyc';
  const labelMap: Record<string, string> = {
    kyc: 'Customer KYC (PAN / Aadhaar)',
    rc: 'Vehicle RC / Fitness Certificate',
    insurance: 'Insurance Policy Certificate',
    pdi: 'PDI Technical Checklist',
    gate_pass: 'Delivery Gate Pass & Handover',
  };

  const uploadDate = row.created_at
    ? new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : existing?.uploadedAt || 'Today';

  return {
    id: row.id,
    title: metadata.title || existing?.title || row.file_name || 'Compliance Document',
    type: type,
    classificationLabel: labelMap[type] || 'Compliance Document',
    entityType: row.entity_type || existing?.entityType || 'customer',
    entityId: row.entity_id || existing?.entityId || 'general',
    entityName: metadata.entityName || existing?.entityName || 'Verified Account',
    fileName: row.file_name || existing?.fileName || 'document.pdf',
    fileSizeBytes: row.file_size_bytes || existing?.fileSizeBytes || 0,
    mimeType: row.mime_type || existing?.mimeType || 'application/pdf',
    storageKey: row.storage_key || existing?.storageKey || '',
    status: row.status || existing?.status || 'uploaded',
    uploadedAt: uploadDate,
    verifiedAt: row.verified_at ? new Date(row.verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : existing?.verifiedAt,
  };
}

export async function fetchDocuments(): Promise<VaultDocument[]> {
  if (typeof window === 'undefined') return [];

  const tenantId = getActiveTenantId();

  if (isSupabaseConfigured()) {
    try {
      let data: any[] | null = null;

      // 1. Fetch from server API route /api/documents (scoped by tenantId)
      try {
        const res = await fetch(`/api/documents?tenantId=${encodeURIComponent(tenantId)}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            data = json.data;
          }
        }
      } catch (err) {
        console.warn('[DocumentStore] /api/documents fetch error, trying direct client:', err);
      }

      // 2. Fallback to direct client
      if (data === null) {
        const { data: directData, error } = await supabase
          .from('documents')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(directData)) {
          data = directData;
        }
      }

      if (data !== null && Array.isArray(data)) {
        const localList = getDocuments();
        const localMap = new Map<string, VaultDocument>();
        localList.forEach((d) => localMap.set(d.id, d));

        // Supabase is the source of truth!
        const remoteList: VaultDocument[] = data.map((row) => mapSupabaseRowToVaultDoc(row, localMap));

        saveDocuments(remoteList);
        return remoteList;
      }
    } catch (err) {
      console.error('[DocumentStore] Failed to fetch documents from Supabase:', err);
    }
  }

  return getDocuments();
}

// Supabase Realtime Listener for Documents: deletes row in frontend immediately when deleted in Supabase
let isDocRealtimeActive = false;

export function initDocumentsRealtime(): void {
  if (typeof window === 'undefined' || isDocRealtimeActive || !isSupabaseConfigured()) return;
  isDocRealtimeActive = true;

  try {
    supabase
      .channel('public-documents-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              const current = getDocuments();
              const updated = current.filter((d) => d.id !== deletedId);
              saveDocuments(updated);
            } else {
              fetchDocuments();
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            fetchDocuments();
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('[DocumentStore] Realtime subscription error:', err);
  }
}

function dataUrlToBlob(dataUrl: string, fallbackMime: string = 'application/pdf'): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : fallbackMime;
  const b64 = parts[1] || parts[0];
  const byteChars = atob(b64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mime });
}

export async function addDocument(docData: {
  title: string;
  type: string;
  entityName: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  fileDataUrl?: string;
  status?: 'uploaded' | 'under_review' | 'verified';
}): Promise<VaultDocument> {
  const current = getDocuments();
  const docId = 'doc-' + Date.now();
  const tenantId = getActiveTenantId();
  const category = docData.type === 'signature' ? 'signatures' : (docData.type || 'kyc');
  const entityId = 'gen-' + Date.now();
  const cleanFileName = docData.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.');
  const storageKey = `${tenantId}/${category}/${entityId}/${docId}/${cleanFileName}`;

  // Direct binary upload to Supabase storage bucket via supabase.storage.from('dealership-documents').upload()
  if (isSupabaseConfigured() && docData.fileDataUrl) {
    try {
      const blob = dataUrlToBlob(docData.fileDataUrl, docData.mimeType);
      const bucket = docData.type === 'signature' ? 'signatures' : 'dealership-documents';
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storageKey, blob, {
          contentType: docData.mimeType || 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[DocumentStore] Direct Supabase storage upload warning:', uploadError.message);
      } else {
        console.log('[DocumentStore] Direct upload to Supabase storage succeeded:', storageKey);
      }
    } catch (e: any) {
      console.warn('[DocumentStore] Storage upload exception:', e?.message);
    }
  }

  const labelMap: Record<string, string> = {
    kyc: 'Customer KYC (PAN / Aadhaar)',
    rc: 'Vehicle RC / Fitness Certificate',
    insurance: 'Insurance Policy Certificate',
    pdi: 'PDI Technical Checklist',
    gate_pass: 'Delivery Gate Pass & Handover',
  };

  // Note: Omit fileDataUrl so base64 strings are NOT persisted into localStorage
  const newDoc: VaultDocument = {
    id: docId,
    title: docData.title.trim() || docData.fileName,
    type: docData.type,
    classificationLabel: labelMap[docData.type] || 'Compliance Document',
    entityType: docData.type === 'kyc' ? 'customer' : 'vehicle',
    entityId: entityId,
    entityName: docData.entityName.trim() || 'Direct Compliance Upload',
    fileName: docData.fileName,
    fileSizeBytes: docData.fileSizeBytes,
    mimeType: docData.mimeType,
    storageKey: storageKey,
    status: docData.status || 'under_review',
    uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  };

  const updated = [newDoc, ...current];
  saveDocuments(updated);

  // Sync to Supabase metadata via /api/documents
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newDoc.id,
          tenantId: getActiveTenantId(),
          title: newDoc.title,
          entityType: newDoc.entityType,
          entityId: newDoc.entityId,
          entityName: newDoc.entityName,
          documentType: newDoc.type,
          fileName: newDoc.fileName,
          fileSizeBytes: newDoc.fileSizeBytes,
          mimeType: newDoc.mimeType,
          storageKey: newDoc.storageKey,
          status: newDoc.status,
          fileDataUrl: docData.fileDataUrl,
          metadata: {
            title: newDoc.title,
            entityName: newDoc.entityName,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[DocumentStore] API upload warning:', errJson);
      } else {
        console.log('[DocumentStore] Document metadata saved to Supabase successfully:', newDoc.fileName);
      }
    } catch (err) {
      console.error('[DocumentStore] Failed to post document to /api/documents:', err);
    }
  }

  return newDoc;
}

export async function updateDocumentStatus(id: string, status: VaultDocument['status']): Promise<boolean> {
  const current = getDocuments();
  const doc = current.find((d) => d.id === id);
  if (!doc) return false;

  doc.status = status;
  if (status === 'verified') {
    doc.verifiedAt = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  saveDocuments(current);

  if (typeof window !== 'undefined') {
    fetch('/api/documents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch((err) => console.warn('[DocumentStore] Status update error:', err));
  }

  return true;
}

export function getDocumentDownloadUrl(id: string): string {
  return `/api/documents/download?id=${encodeURIComponent(id)}`;
}

export async function getDocumentSignedUrl(id: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`/api/documents/signed-url?id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      return data.signedUrl || null;
    }
  } catch (err) {
    console.warn('[DocumentStore] Failed to obtain signed URL:', err);
  }
  return null;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const current = getDocuments();
  const filtered = current.filter((d) => d.id !== id);
  saveDocuments(filtered);

  if (typeof window !== 'undefined') {
    fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('[DocumentStore] Document delete error:', err));
  }

  return true;
}
