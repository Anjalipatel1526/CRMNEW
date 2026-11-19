import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isServerSupabaseConfigured } from '@/lib/server/supabase';
import { requireAuth } from '@/lib/server/auth';
import { fetchAuthorizedDocument } from '@/lib/server/documents';

/**
 * GET/POST /api/documents/signed-url
 * Generates a short-lived, authenticated signed URL for downloading or previewing
 * a private KYC document or digital signature.
 */
async function handleSignedUrlRequest(req: NextRequest, docIdParam?: string, expiresInParam?: number) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  if (!docIdParam) {
    return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 });
  }

  const authDoc = await fetchAuthorizedDocument(docIdParam, auth.session.tenantId);
  if ('errorResponse' in authDoc) return authDoc.errorResponse;

  const { document: doc, bucket, storageKey } = authDoc;

  let expiresIn = 300;
  if (expiresInParam && !isNaN(expiresInParam)) {
    expiresIn = Math.max(30, Math.min(3600, Math.floor(expiresInParam)));
  }

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
    const expiresIn = body.expiresIn ? Number(body.expiresIn) : undefined;

    if (!id) {
      return NextResponse.json({ error: 'Missing documentId in request body' }, { status: 400 });
    }

    return handleSignedUrlRequest(req, id, expiresIn);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid JSON body' }, { status: 400 });
  }
}
