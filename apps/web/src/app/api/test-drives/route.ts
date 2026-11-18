import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin, createServerClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const tenantId = auth.session.tenantId; // Enforce caller's authentic tenant

  try {
    const { data, error } = await supabaseAdmin
      .from('test_drives')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ testDrives: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { drive } = body;

    if (!drive) {
      return NextResponse.json({ error: 'Missing drive data' }, { status: 400 });
    }

    const tenantId = auth.session.tenantId; // Enforce caller's authentic tenant

    // 1. Ensure tenant exists
    await supabaseAdmin.from('tenants').upsert(
      {
        id: tenantId,
        name: 'Dealership Workspace',
        slug: (tenantId.replace(/^t_/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'dealership').slice(0, 48),
        status: 'active',
        dealer_model: 'mixed',
        primary_contact_name: 'Dealership Admin',
        primary_email: 'admin@dealership.com',
        primary_phone: '+91 98000 00000',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 2. Ensure default primary branch exists
    const primaryBranchId = `b_${tenantId}_main`;
    await supabaseAdmin.from('branches').upsert(
      {
        id: primaryBranchId,
        tenant_id: tenantId,
        code: 'MAIN',
        name: 'Main Showroom',
        address: {},
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 3. Ensure vehicle exists in DB if vehicle_id provided
    let vehicleId = drive.vehicle_id || drive.vehicleId || 'veh_default';
    const { data: existingVeh } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('tenant_id', tenantId)
      .limit(1);

    if (!existingVeh || existingVeh.length === 0) {
      vehicleId = `veh_${tenantId}_demo`;
      await supabaseAdmin.from('vehicles').upsert(
        {
          id: vehicleId,
          tenant_id: tenantId,
          branch_id: primaryBranchId,
          stock_number: 'DEMO-01',
          vin: `VIN-${Date.now()}`,
          make: drive.vehicleName?.split(' ')[0] || 'Showroom',
          model: drive.vehicleName || 'Certified Vehicle',
          year: 2024,
          status: 'available',
        },
        { onConflict: 'id' }
      );
    }

    // 4. Ensure customer exists in DB if customer_id provided
    let customerId = drive.customer_id || drive.customerId || 'cust_default';
    const { data: existingCust } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .limit(1);

    if (!existingCust || existingCust.length === 0) {
      customerId = `cust_${tenantId}_demo`;
      await supabaseAdmin.from('customers').upsert(
        {
          id: customerId,
          tenant_id: tenantId,
          branch_id: primaryBranchId,
          first_name: drive.customerName || 'Test Drive Client',
          phone: drive.customerPhone || '+91 98000 00000',
          email: drive.customerEmail || null,
        },
        { onConflict: 'id' }
      );
    }

    const payload = {
      id: drive.id || `td_${Date.now()}`,
      tenant_id: tenantId,
      branch_id: primaryBranchId,
      vehicle_id: vehicleId,
      customer_id: customerId,
      route: drive.route || 'Dealership Circuit',
      start_odometer: Number(drive.startOdo || drive.start_odometer) || 0,
      end_odometer: drive.endOdo ? Number(drive.endOdo) : null,
      feedback: drive.feedback || '',
      rating: Number(drive.rating) || 5,
      status: drive.status || 'scheduled',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('test_drives')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('[API/test-drives] Insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, testDrive: data?.[0] || payload });
  } catch (err: any) {
    console.error('[API/test-drives] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
