import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin, createServerClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';
import { EmployeeCreateSchema } from '@crm/validators';

// Helper to ensure tenant and primary branch exist in Supabase
async function getOrCreateTenantAndBranch(requestedTenantId?: string): Promise<{ tenantId: string; branchId: string }> {
  const tenantId = requestedTenantId || 't_default';

  try {
    await supabaseAdmin.from('tenants').upsert(
      {
        id: tenantId,
        name: 'Dealership Workspace',
        slug: (tenantId.replace(/^t_/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'dealership').slice(0, 48),
        status: 'active',
        dealer_model: 'mixed',
        primary_contact_name: 'Dealership Admin',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
      { onConflict: 'id' }
    );

    const { data: existingBranches } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    let branchId = existingBranches?.[0]?.id;

    if (!branchId) {
      branchId = `b_${tenantId.slice(0, 8)}_01`;
      await supabaseAdmin.from('branches').upsert(
        {
          id: branchId,
          tenant_id: tenantId,
          code: 'BR-01',
          name: 'Main Showroom',
          is_active: true,
        },
        { onConflict: 'id' }
      );
    }

    return { tenantId, branchId };
  } catch (err) {
    console.warn('[API/employees] Tenant/Branch resolution warning:', err);
    return { tenantId: requestedTenantId || 't_default', branchId: 'b_default' };
  }
}

// GET /api/employees - Fetch all employees scoped to caller's authentic tenant
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: [], error: 'Supabase not configured' });
  }

  try {
    const tenantId = auth.session.tenantId;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API/employees] GET error:', error.message);
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
    console.error('[API/employees] GET unexpected error:', err);
    return NextResponse.json({ data: [], error: err.message }, { status: 500 });
  }
}

// POST /api/employees - Add or Upsert employee (Requires tenant_admin or branch_manager)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['tenant_admin', 'branch_manager']);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();

    const roleMap: Record<string, string> = {
      'Sales Executive': 'sales_executive',
      'Branch Manager': 'branch_manager',
      'Finance Manager': 'finance_manager',
      'Inventory Manager': 'inventory_manager',
      'Service Advisor': 'service_advisor',
      'Technician': 'technician',
      'Receptionist': 'receptionist',
      'Administrator': 'tenant_admin',
    };
    const normalizedRole = roleMap[body.role || body.designation] || body.role || 'sales_executive';

    const validation = EmployeeCreateSchema.safeParse({
      id: body.id,
      fullName: body.fullName || body.full_name || '',
      email: body.email || '',
      phone: body.phone,
      role: normalizedRole,
      department: body.department,
      branchId: body.branchId || body.branch_id,
      designation: body.designation,
      status: body.status === 'inactive' ? 'inactive' : 'active',
      isActive: body.status !== 'inactive',
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

    const tenantId = auth.session.tenantId; // Enforce caller's tenant
    const resolved = await getOrCreateTenantAndBranch(tenantId);
    const branchId = body.branchId || body.branch_id || resolved.branchId;

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

    let { data, error } = await supabaseAdmin
      .from('employees')
      .upsert(payloadWithKeys, { onConflict: 'id' })
      .select();

    if (error && error.message && error.message.includes('foreign key')) {
      console.warn('[API/employees] Foreign key warning, retrying with resolved tenant/branch:', error.message);
      const fallbackPayload = {
        ...payloadWithKeys,
        tenant_id: resolved.tenantId,
        branch_id: resolved.branchId,
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

// DELETE /api/employees - Delete employee (Requires tenant_admin role)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['tenant_admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

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
      .eq('id', id)
      .eq('tenant_id', auth.session.tenantId); // Tenant isolation check

    if (error) {
      console.error('[API/employees] DELETE error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
