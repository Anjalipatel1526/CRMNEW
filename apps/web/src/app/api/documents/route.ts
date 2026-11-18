import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin, createServerClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import { DocumentUploadMetadataSchema } from '@crm/validators';

// Strict file validation constants
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

const BLOCKED_EXTENSIONS = new Set([
  'exe', 'sh', 'bat', 'cmd', 'js', 'mjs', 'ts', 'py', 'php', 'bin',
  'msi', 'dll', 'vbs', 'ps1', 'com', 'scr', 'html', 'htm', 'svg', 'jar'
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB maximum

// GET /api/documents - Retrieve compliance / vault documents scoped to caller's tenant
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: [], error: 'Supabase not configured' });
  }

  try {
    const tenantId = auth.session.tenantId;
    const { searchParams } = new URL(req.url);
    const documentType = searchParams.get('documentType');
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (documentType) query = query.eq('document_type', documentType);
    if (entityId) query = query.eq('entity_id', entityId);
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;

    if (error) {
      console.error('[API/documents] GET error:', error.message);
      return NextResponse.json({ data: [], error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count ?? (data?.length || 0),
        page,
        limit,
        totalPages: Math.ceil((count ?? (data?.length || 0)) / limit),
      },
    });
  } catch (err: any) {
    console.error('[API/documents] GET unexpected error:', err);
    return NextResponse.json({ data: [], error: err.message }, { status: 500 });
  }
}

// POST /api/documents - Upload and save document record strictly in caller's tenant
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();

    const validation = DocumentUploadMetadataSchema.safeParse({
      fileName: body.fileName || body.file_name,
      fileType: body.fileType || body.file_type || body.mimeType || body.mime_type,
      documentType: body.documentType || body.document_type,
      entityType: body.entityType || body.entity_type || 'general',
      entityId: body.entityId || body.entity_id,
      fileSize: Number(body.fileSize || body.file_size || body.fileSizeBytes || body.file_size_bytes || 0),
      base64Data: body.base64Data || body.base64_data,
      tenantId: body.tenantId || body.tenant_id,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validation.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        },
        { status: 400 }
      );
    }

    const callerTenantId = auth.session.tenantId;

    // Security Control 1: Strict Tenant Isolation (Cross-tenant upload forbidden)
    if (body.tenantId && body.tenantId !== callerTenantId) {
      return NextResponse.json(
        { error: 'Cross-tenant upload forbidden. You can only upload documents to your own tenant.' },
        { status: 403 }
      );
    }
    const tenantId = callerTenantId;

    // Security Control 2: File Name & Extension Validation
    const rawFileName = body.fileName || body.file_name || 'document.pdf';
    const cleanFileName = rawFileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.');

    const ext = (cleanFileName.split('.').pop() || '').toLowerCase();

    if (BLOCKED_EXTENSIONS.has(ext) || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File type '.${ext}' is not permitted. Only PDF, JPEG, PNG, and WebP are allowed.` },
        { status: 400 }
      );
    }

    // Security Control 3: MIME Type Whitelist
    const mimeType = (body.mimeType || body.mime_type || 'application/pdf').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported MIME type '${mimeType}'. Allowed types: PDF, JPEG, PNG, WebP.` },
        { status: 400 }
      );
    }

    // Security Control 4: File Size Validation
    const fileSizeBytes = Number(body.fileSizeBytes || body.file_size_bytes || 0);
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size (${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum permitted limit of 15MB.` },
        { status: 400 }
      );
    }

    // Security Control 5: Path Structure & Bucket Routing
    const docType = body.documentType || body.document_type || 'kyc';
    const isSignature = docType === 'signature' || body.category === 'signatures';
    const bucket = isSignature ? 'signatures' : 'dealership-documents';
    const category = isSignature ? 'signatures' : (body.category || 'kyc').replace(/[^a-zA-Z0-9_-]/g, '_');
    const entityId = (body.entityId || body.entity_id || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
    const docId = body.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Collision-resistant, tenant-isolated path
    const storageKey = `${tenantId}/${category}/${entityId}/${docId}/${cleanFileName}`;

    // Security Control 6: Direct Binary Upload to Private Bucket
    let uploadedToStorage = false;
    let fileBuffer: Buffer | null = null;

    if (body.fileDataUrl && typeof body.fileDataUrl === 'string') {
      const base64Index = body.fileDataUrl.indexOf(';base64,');
      if (base64Index !== -1) {
        fileBuffer = Buffer.from(body.fileDataUrl.slice(base64Index + 8), 'base64');
      }
    } else if (body.fileBase64 && typeof body.fileBase64 === 'string') {
      fileBuffer = Buffer.from(body.fileBase64, 'base64');
    }

    if (fileBuffer) {
      if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Decoded file size exceeds maximum permitted limit of 15MB.` },
          { status: 400 }
        );
      }

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(storageKey, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error('[API/documents] Supabase storage upload error:', uploadError.message);
        return NextResponse.json(
          { error: `Storage upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }
      uploadedToStorage = true;
    }

    // Security Control 7: Lightweight Metadata Persistence
    const metadata: Record<string, any> = {
      title: body.title || cleanFileName,
      entityName: body.entityName || body.entity_name || 'Customer KYC',
      uploadedBy: auth.session.user.email,
      bucket,
      category,
      hasBinaryInStorage: uploadedToStorage,
      uploadedAt: new Date().toISOString(),
    };

    const payload = {
      id: docId,
      tenant_id: tenantId,
      entity_type: body.entityType || body.entity_type || 'compliance',
      entity_id: entityId,
      document_type: docType,
      file_name: cleanFileName,
      file_size_bytes: fileBuffer ? fileBuffer.length : fileSizeBytes,
      mime_type: mimeType,
      storage_key: storageKey,
      status: body.status || 'uploaded',
      metadata: metadata,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('documents')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('[API/documents] POST insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] || payload });
  } catch (err: any) {
    console.error('[API/documents] POST unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/documents - Update document status (tenant isolated)
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { id, status, rejection_reason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status) {
      updates.status = status;
      if (status === 'verified') {
        updates.verified_at = new Date().toISOString();
      }
    }
    if (rejection_reason !== undefined) {
      updates.rejection_reason = rejection_reason;
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', auth.session.tenantId) // Tenant isolation check
      .select();

    if (error) {
      console.error('[API/documents] PATCH error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err: any) {
    console.error('[API/documents] PATCH unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/documents - Delete document by id (tenant isolated, privileged roles only)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['tenant_admin', 'branch_manager']);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    // 1. Fetch document record to get storage key and verify tenant ownership
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.session.tenantId)
      .maybeSingle();

    if (fetchError || !doc) {
      return NextResponse.json(
        { error: 'Document not found or access forbidden' },
        { status: 404 }
      );
    }

    // 2. Remove file from private storage bucket
    if (doc.storage_key) {
      const bucket = doc.document_type === 'signature' ? 'signatures' : 'dealership-documents';
      try {
        await supabaseAdmin.storage.from(bucket).remove([doc.storage_key]);
      } catch (storageErr) {
        console.warn('[API/documents] Storage delete warning:', storageErr);
      }
    }

    // 3. Delete metadata row
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.session.tenantId);

    if (deleteError) {
      console.error('[API/documents] DELETE error:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('[API/documents] DELETE unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
