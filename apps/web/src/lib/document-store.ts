import { supabase, isSupabaseConfigured } from './supabase';

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

const STORAGE_KEY = 'crm_compliance_documents_v1';

export const INITIAL_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc-001',
    title: 'Customer Aadhaar & PAN Card KYC Dossier',
    type: 'kyc',
    classificationLabel: 'Customer KYC (PAN / Aadhaar)',
    entityType: 'customer',
    entityId: 'cust-101',
    entityName: 'Rahul Verma',
    fileName: 'rahul_verma_kyc_pan_aadhaar.pdf',
    fileSizeBytes: 2457600,
    mimeType: 'application/pdf',
    storageKey: 'vault/doc-001/rahul_verma_kyc.pdf',
    status: 'verified',
    uploadedAt: '02 Nov 2026',
    verifiedAt: '03 Nov 2026',
  },
  {
    id: 'doc-002',
    title: 'Vehicle Registration Certificate (RC Form 23)',
    type: 'rc',
    classificationLabel: 'Vehicle RC / Fitness Certificate',
    entityType: 'vehicle',
    entityId: 'veh-201',
    entityName: 'Mercedes-Benz E-Class E200',
    fileName: 'rc_copy_dl01ab1234.pdf',
    fileSizeBytes: 1843200,
    mimeType: 'application/pdf',
    storageKey: 'vault/doc-002/rc_copy_dl01ab1234.pdf',
    status: 'verified',
    uploadedAt: '01 Nov 2026',
    verifiedAt: '02 Nov 2026',
  },
  {
    id: 'doc-003',
    title: 'Comprehensive Zero-Dep Motor Insurance Policy',
    type: 'insurance',
    classificationLabel: 'Insurance Policy Certificate',
    entityType: 'vehicle',
    entityId: 'veh-202',
    entityName: 'BMW X5 xDrive40i',
    fileName: 'icici_lombard_zero_dep_policy.pdf',
    fileSizeBytes: 3145728,
    mimeType: 'application/pdf',
    storageKey: 'vault/doc-003/icici_lombard_zero_dep_policy.pdf',
    status: 'under_review',
    uploadedAt: '03 Nov 2026',
  },
  {
    id: 'doc-004',
    title: '150-Point Technical Pre-Delivery Inspection (PDI)',
    type: 'pdi',
    classificationLabel: 'PDI Technical Checklist',
    entityType: 'vehicle',
    entityId: 'veh-203',
    entityName: 'Audi A6 Technology 45 TFSI',
    fileName: 'pdi_passed_inspection_checklist.pdf',
    fileSizeBytes: 1258291,
    mimeType: 'application/pdf',
    storageKey: 'vault/doc-004/pdi_checklist.pdf',
    status: 'verified',
    uploadedAt: '04 Nov 2026',
    verifiedAt: '04 Nov 2026',
  },
];

export function getDocuments(): VaultDocument[] {
  if (typeof window === 'undefined') return INITIAL_DOCUMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DOCUMENTS));
      return INITIAL_DOCUMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DOCUMENTS;
  } catch (err) {
    console.error('Failed to read documents from storage:', err);
    return INITIAL_DOCUMENTS;
  }
}

export function saveDocuments(docs: VaultDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
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
    fileDataUrl: metadata.fileDataUrl || existing?.fileDataUrl,
  };
}

export async function fetchDocuments(): Promise<VaultDocument[]> {
  if (typeof window === 'undefined') return INITIAL_DOCUMENTS;

  if (isSupabaseConfigured()) {
    try {
      let data: any[] | null = null;

      // 1. Fetch from server API route /api/documents (uses service role key to bypass RLS)
      try {
        const res = await fetch('/api/documents');
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
        // If a document was deleted in Supabase, it is NOT in data and will be removed from frontend.
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

  const labelMap: Record<string, string> = {
    kyc: 'Customer KYC (PAN / Aadhaar)',
    rc: 'Vehicle RC / Fitness Certificate',
    insurance: 'Insurance Policy Certificate',
    pdi: 'PDI Technical Checklist',
    gate_pass: 'Delivery Gate Pass & Handover',
  };

  const newDoc: VaultDocument = {
    id: docId,
    title: docData.title.trim() || docData.fileName,
    type: docData.type,
    classificationLabel: labelMap[docData.type] || 'Compliance Document',
    entityType: docData.type === 'kyc' ? 'customer' : 'vehicle',
    entityId: 'gen-' + Date.now(),
    entityName: docData.entityName.trim() || 'Direct Compliance Upload',
    fileName: docData.fileName,
    fileSizeBytes: docData.fileSizeBytes,
    mimeType: docData.mimeType,
    storageKey: `vault/${docId}/${docData.fileName.replace(/\s+/g, '_')}`,
    status: docData.status || 'under_review',
    uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    fileDataUrl: docData.fileDataUrl,
  };

  const updated = [newDoc, ...current];
  saveDocuments(updated);

  // Sync to Supabase via /api/documents
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newDoc.id,
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
          fileDataUrl: newDoc.fileDataUrl,
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
        console.log('[DocumentStore] Document saved to Supabase successfully:', newDoc.fileName);
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
