import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || 't_default';

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
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { drive } = body;

    if (!drive) {
      return NextResponse.json({ error: 'Missing drive data' }, { status: 400 });
    }

    const tenantId = drive.tenantId || drive.tenant_id || 't_default';

    // 1. Ensure tenant & branch exist so foreign key constraint passes
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

    const branchId = `b_${tenantId}_main`;
    await supabaseAdmin.from('branches').upsert(
      {
        id: branchId,
        tenant_id: tenantId,
        code: 'MAIN',
        name: 'Main Showroom',
        address: {},
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 2. Ensure customer exists if customerId is given or create walk-in customer
    const customerId = drive.customerId || `cust_${Date.now()}`;
    await supabaseAdmin.from('customers').upsert(
      {
        id: customerId,
        tenant_id: tenantId,
        branch_id: branchId,
        first_name: drive.customerName || 'Test Drive Customer',
        phone: drive.customerPhone || '+91 98000 00000',
        email: drive.customerEmail || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 3. Ensure vehicle exists if vehicleId is given or create vehicle placeholder
    const vehicleId = drive.vehicleId || `veh_${Date.now()}`;
    await supabaseAdmin.from('vehicles').upsert(
      {
        id: vehicleId,
        tenant_id: tenantId,
        branch_id: branchId,
        stock_number: `STK-${Date.now().toString().slice(-4)}`,
        vin: `VIN-${Date.now()}`,
        registration_number: drive.vehicleReg || 'MH01TEST01',
        make: drive.vehicleName?.split(' ')[0] || 'Showroom',
        model: drive.vehicleName?.split(' ').slice(1).join(' ') || 'Stock',
        variant: 'Demo',
        year: 2024,
        color: 'White',
        asking_price: 1500000,
        status: 'available',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 4. Upsert test drive into Supabase backend
    const payload = {
      id: drive.id || `td_${Date.now()}`,
      tenant_id: tenantId,
      branch_id: branchId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      start_odometer: Number(drive.startOdo) || 5000,
      end_odometer: drive.endOdo ? Number(drive.endOdo) : null,
      route: drive.route || 'Western Express Highway Sprint',
      feedback: drive.feedback || null,
      rating: drive.rating ? Number(drive.rating) : 5,
      created_at: drive.createdAt || new Date().toISOString(),
    };

    const { data: savedDrive, error: driveErr } = await supabaseAdmin
      .from('test_drives')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (driveErr) {
      console.error('[API/test-drives] Save error:', driveErr.message);
      return NextResponse.json({ error: driveErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, drive: savedDrive });
  } catch (err: any) {
    console.error('[API/test-drives] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

