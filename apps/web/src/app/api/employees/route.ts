import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// Helper to ensure tenant and branch exist so foreign key constraints never fail
async function getOrCreateTenantAndBranch(): Promise<{ tenantId: string; branchId: string }> {
  try {
    // 1. Check if a tenant already exists
    const { data: existingTenants } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .limit(1);

    let tenantId = existingTenants?.[0]?.id;

    if (!tenantId) {
      tenantId = 't-apex-001';
      await supabaseAdmin.from('tenants').upsert(
        {
          id: tenantId,
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
    }

    // 2. Check if a branch already exists for this tenant
    const { data: existingBranches } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    let branchId = existingBranches?.[0]?.id;

    if (!branchId) {
      branchId = 'b-dt-001';
      await supabaseAdmin.from('branches').upsert(
        {
          id: branchId,
          tenant_id: tenantId,
          code: 'DT-01',
          name: 'Apex Downtown Flagship',
          is_active: true,
        },
        { onConflict: 'id' }
      );
    }

    return { tenantId, branchId };
  } catch (err) {
    console.warn('[API/employees] Tenant/Branch resolution warning:', err);
    return { tenantId: 't-apex-001', branchId: 'b-dt-001' };
  }
}

// GET /api/employees - Fetch all employees from Supabase
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: [], error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API/employees] GET error:', error.message);
      return NextResponse.json({ data: [], error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error('[API/employees] GET unexpected error:', err);
    return NextResponse.json({ data: [], error: err.message }, { status: 500 });
  }
}

// POST /api/employees - Add or Upsert an employee into Supabase table
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { tenantId, branchId } = await getOrCreateTenantAndBranch();

    const empId = body.id || 'emp-' + Date.now();
    const payloadWithKeys: Record<string, any> = {
      id: empId,
      tenant_id: tenantId,
      branch_id: branchId,
      full_name: body.fullName || body.full_name || 'Staff Member',
      email: body.email,
      phone: body.phone || '+91 98000 00000',
      role: body.designation || body.role || 'Sales Executive',
      department: body.department || 'Sales',
      is_active: body.status !== 'inactive',
      joined_at: body.joiningDate || body.joined_at || new Date().toISOString().split('T')[0],
    };

    // Attempt insert with tenant_id and branch_id
    let { data, error } = await supabaseAdmin
      .from('employees')
      .upsert(payloadWithKeys, { onConflict: 'id' })
      .select();

    // If foreign key constraint failed, fall back to null tenant_id / branch_id
    if (error && error.message && error.message.includes('foreign key')) {
      console.warn('[API/employees] Foreign key constraint warning, retrying with null foreign keys:', error.message);
      const fallbackPayload = {
        ...payloadWithKeys,
        tenant_id: null,
        branch_id: null,
      };
      const retryResult = await supabaseAdmin
        .from('employees')
        .upsert(fallbackPayload, { onConflict: 'id' })
        .select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('[API/employees] POST insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] || payloadWithKeys });
  } catch (err: any) {
    console.error('[API/employees] POST unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/employees - Delete employee from Supabase table
export async function DELETE(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing employee id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API/employees] DELETE error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
