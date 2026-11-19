import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isServerSupabaseConfigured } from '@/lib/server/supabase';
import { requireAuth } from '@/lib/server/auth';
import { ensureTenantAndBranch } from '@/lib/server/tenant';
import { randomUUID } from 'crypto';

function isUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isServerSupabaseConfigured()) {
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

  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { drive } = body;

    if (!drive) {
      return NextResponse.json({ error: 'Missing drive data' }, { status: 400 });
    }

    const tenantId = auth.session.tenantId;
    const { primaryBranchId } = await ensureTenantAndBranch(tenantId);

    // 3. Ensure vehicle exists in DB if vehicle_id provided
    let vehicleId = drive.vehicle_id || drive.vehicleId;
    if (!vehicleId || !isUuid(vehicleId)) {
      const { data: existingVeh } = await supabaseAdmin
        .from('vehicles')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1);

      if (existingVeh?.[0]?.id) {
        vehicleId = existingVeh[0].id;
      } else {
        vehicleId = randomUUID();
        await supabaseAdmin.from('vehicles').insert({
          id: vehicleId,
          tenant_id: tenantId,
          branch_id: primaryBranchId,
          stock_number: 'DEMO-01',
          vin: `VIN-${Date.now()}`,
          make: drive.vehicleName?.split(' ')[0] || 'Showroom',
          model: drive.vehicleName || 'Certified Vehicle',
          year: 2024,
          status: 'available',
        });
      }
    }

    // 4. Ensure customer exists in DB if customer_id provided
    let customerId = drive.customer_id || drive.customerId;
    if (!customerId || !isUuid(customerId)) {
      customerId = randomUUID();
      await supabaseAdmin.from('customers').upsert(
        {
          id: customerId,
          tenant_id: tenantId,
          branch_id: primaryBranchId,
          type: 'individual',
          first_name: drive.customerName || 'Test Drive Client',
          phone: drive.customerPhone || '+91 98000 00000',
          email: drive.customerEmail || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    const driveId = (drive.id && isUuid(drive.id)) ? drive.id : randomUUID();
    const payload = {
      id: driveId,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      customer_id: customerId,
      route: drive.route || 'Dealership Circuit',
      start_odometer: Number(drive.startOdo || drive.start_odometer) || 0,
      end_odometer: drive.endOdo ? Number(drive.endOdo) : null,
      feedback: drive.feedback || '',
      rating: Number(drive.rating) || 5,
      notes: drive.notes || (drive.vehicleName ? `Test drive of ${drive.vehicleName}` : 'Test drive scheduled'),
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

    // Auto-advance associated customer lead to 'test_drive' stage in pipeline
    if (customerId) {
      await supabaseAdmin
        .from('leads')
        .update({ status: 'test_drive', updated_at: new Date().toISOString() })
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId);
    }

    return NextResponse.json({ success: true, testDrive: data?.[0] || payload });
  } catch (err: any) {
    console.error('[API/test-drives] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
