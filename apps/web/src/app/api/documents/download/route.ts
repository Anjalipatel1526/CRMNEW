import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isServerSupabaseConfigured } from '@/lib/server/supabase';
import { requireAuth } from '@/lib/server/auth';
import { fetchAuthorizedDocument } from '@/lib/server/documents';

/**
 * GET /api/documents/download?id=<documentId>
 * Streams a private document directly to authorized clients with non-cacheable security headers.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 });
  }

  try {
    const authDoc = await fetchAuthorizedDocument(id, auth.session.tenantId);
    if ('errorResponse' in authDoc) return authDoc.errorResponse;

    const { document: doc, bucket, storageKey } = authDoc;

    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from(bucket)
      .download(storageKey);

    if (downloadError || !blob) {
      console.error('[API/documents/download] Download error:', downloadError?.message);
      return NextResponse.json(
        { error: 'Failed to retrieve document content from storage' },
        { status: 404 }
      );
    }

    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': doc.mime_type || 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.file_name)}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (err: any) {
    console.error('[API/documents/download] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
