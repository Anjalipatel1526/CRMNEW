import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export function resolveDocumentBucket(doc: {
  document_type?: string | null;
  documentType?: string | null;
  metadata?: { bucket?: string } | null;
}): 'signatures' | 'dealership-documents' {
  const docType = doc.document_type || doc.documentType;
  if (docType === 'signature' || doc.metadata?.bucket === 'signatures') {
    return 'signatures';
  }
  return 'dealership-documents';
}

export async function fetchAuthorizedDocument(
  documentId: string,
  callerTenantId: string
): Promise<
  | { document: any; bucket: 'signatures' | 'dealership-documents'; storageKey: string }
  | { errorResponse: NextResponse }
> {
  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError || !doc) {
    return {
      errorResponse: NextResponse.json({ error: 'Document not found' }, { status: 404 }),
    };
  }

  if (doc.tenant_id !== callerTenantId) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Cross-tenant document access forbidden' },
        { status: 403 }
      ),
    };
  }

  if (!doc.storage_key) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Document has no associated storage object' },
        { status: 404 }
      ),
    };
  }

  return {
    document: doc,
    bucket: resolveDocumentBucket(doc),
    storageKey: doc.storage_key,
  };
}

