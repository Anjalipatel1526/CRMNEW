import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * GET/POST /api/documents/signed-url
 * Generates a short-lived, authenticated signed URL for downloading or previewing
 * a private KYC document or digital signature.
 *
 * Mandatory Security Checks:
 * 1. User must be authenticated with a valid session.
 * 2. Document must belong to the caller's tenant (tenant isolation).
 * 3. Expiration time is bounded between 30 and 3600 seconds.
 */

async function handleSignedUrlRequest(req: NextRequest, docIdParam?: string, expiresInParam?: number) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  const callerTenantId = auth.session.tenantId;

  // 1. Fetch document record by ID
  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', docIdParam)
    .maybeSingle();

  if (fetchError || !doc) {
    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
  }

  // 2. Strict Tenant Authorization: Document must belong to caller's tenant
  if (doc.tenant_id !== callerTenantId) {
    return NextResponse.json(
      { error: 'Cross-tenant document access forbidden' },
      { status: 403 }
    );
  }

  // 3. Bound expiresIn between 30 seconds and 3600 seconds (default: 300s / 5 mins)
  let expiresIn = 300;
  if (expiresInParam && !isNaN(expiresInParam)) {
    expiresIn = Math.max(30, Math.min(3600, Math.floor(expiresInParam)));
  }

  // 4. Determine bucket
  const bucket = doc.document_type === 'signature' || doc.metadata?.bucket === 'signatures'
    ? 'signatures'
    : 'dealership-documents';

  const storageKey = doc.storage_key;
  if (!storageKey) {
    return NextResponse.json(
      { error: 'Document does not have an associated storage object' },
      { status: 400 }
    );
  }

  // 5. Generate signed URL via Supabase Storage
  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(storageKey, expiresIn);

  if (signError || !signedData?.signedUrl) {
    console.error('[API/documents/signed-url] Supabase createSignedUrl error:', signError?.message);
    return NextResponse.json(
      { error: `Failed to generate signed URL: ${signError?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    documentId: doc.id,
    fileName: doc.file_name,
    mimeType: doc.mime_type,
    bucket,
    storageKey,
    signedUrl: signedData.signedUrl,
    expiresIn,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const expiresIn = searchParams.get('expiresIn') ? parseInt(searchParams.get('expiresIn')!, 10) : undefined;

  if (!id) {
    return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 });
  }

  return handleSignedUrlRequest(req, id, expiresIn);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || body.documentId;
    const expiresIn = body.expiresIn;

    if (!id) {
      return NextResponse.json({ error: 'Missing document id in request body' }, { status: 400 });
    }

    return handleSignedUrlRequest(req, id, expiresIn);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 });
  }
}
