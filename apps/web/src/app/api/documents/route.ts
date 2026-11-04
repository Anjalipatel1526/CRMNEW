import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// Helper to ensure default tenant exists
async function getOrCreateTenant(): Promise<string> {
  try {
    const { data: existingTenants } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .limit(1);

    if (existingTenants && existingTenants.length > 0) {
      return existingTenants[0].id;
    }

    const defaultTenantId = 't-apex-001';
    await supabaseAdmin.from('tenants').upsert(
      {
        id: defaultTenantId,
        name: 'Apex Luxury Motors',
        slug: 'apex-luxury-motors',
        status: 'active',
        dealer_model: 'mixed',
        primary_contact_name: 'Dealership Admin',
        primary_email: 'admin@apexmotors.com',
        primary_phone: '+91 98765 43210',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
      { onConflict: 'id' }
    );
    return defaultTenantId;
  } catch (err) {
    console.warn('[API/documents] Tenant resolution warning:', err);
    return 't-apex-001';
  }
}

// GET /api/documents - Retrieve all compliance / vault documents
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: [], error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API/documents] GET error:', error.message);
      return NextResponse.json({ data: [], error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error('[API/documents] GET unexpected error:', err);
    return NextResponse.json({ data: [], error: err.message }, { status: 500 });
  }
}

// POST /api/documents - Upload and save document metadata & record
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const tenantId = await getOrCreateTenant();

    const docId = body.id || 'doc-' + Date.now();
    const fileName = body.fileName || body.file_name || 'document.pdf';
    const storageKey = body.storageKey || body.storage_key || `vault/${docId}/${fileName.replace(/\s+/g, '_')}`;

    const metadata: Record<string, any> = {
      ...(body.metadata || {}),
      title: body.title || fileName,
      entityName: body.entityName || body.entity_name || 'Customer KYC',
    };

    // If client supplied base64/data URL, store it in metadata for preview
    if (body.fileDataUrl) {
      metadata.fileDataUrl = body.fileDataUrl;
    }

    const payload = {
      id: docId,
      tenant_id: tenantId,
      entity_type: body.entityType || body.entity_type || 'compliance',
      entity_id: body.entityId || body.entity_id || 'general',
      document_type: body.documentType || body.document_type || 'kyc',
      file_name: fileName,
      file_size_bytes: body.fileSizeBytes || body.file_size_bytes || 0,
      mime_type: body.mimeType || body.mime_type || 'application/pdf',
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

// PATCH /api/documents - Update document status or verification
export async function PATCH(req: Request) {
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

// DELETE /api/documents - Delete document by id
export async function DELETE(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API/documents] DELETE error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('[API/documents] DELETE unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

