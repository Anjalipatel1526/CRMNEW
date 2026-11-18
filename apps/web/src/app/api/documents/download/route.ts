import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

/**
 * GET /api/documents/download?id=<documentId>
 * Streams a private document directly to authorized clients with non-cacheable security headers.
 *
 * Mandatory Security Checks:
 * 1. User must be authenticated with a valid session.
 * 2. Document must belong to the caller's tenant (tenant isolation).
 * 3. Prevents caching with `Cache-Control: private, no-store`.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 });
  }

  try {
    const callerTenantId = auth.session.tenantId;

    // 1. Fetch document record
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 2. Strict Tenant Authorization
    if (doc.tenant_id !== callerTenantId) {
      return NextResponse.json(
        { error: 'Cross-tenant document access forbidden' },
        { status: 403 }
      );
    }

    // 3. Determine bucket
    const bucket = doc.document_type === 'signature' || doc.metadata?.bucket === 'signatures'
      ? 'signatures'
      : 'dealership-documents';

    const storageKey = doc.storage_key;
    if (!storageKey) {
      return NextResponse.json(
        { error: 'Document has no associated storage object' },
        { status: 404 }
      );
    }

    // 4. Download file binary from private bucket
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

    // 5. Stream response with anti-caching and security headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': doc.mime_type || 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.file_name)}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (err: any) {
    console.error('[API/documents/download] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
