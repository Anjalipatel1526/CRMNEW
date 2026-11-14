import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

async function ensureTenantAndBranch(tenantId: string) {
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

  return { primaryBranchId };
}

// GET: Fetch all CRM data for tenant
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || 't_default';

  try {
    const [vehiclesRes, customersRes, leadsRes, dealsRes, appointmentsRes] = await Promise.all([
      supabaseAdmin.from('vehicles').select('*').eq('tenant_id', tenantId),
      supabaseAdmin.from('customers').select('*').eq('tenant_id', tenantId),
      supabaseAdmin.from('leads').select('*').eq('tenant_id', tenantId),
      supabaseAdmin.from('deals').select('*').eq('tenant_id', tenantId),
      supabaseAdmin.from('appointments').select('*').eq('tenant_id', tenantId),
    ]);

    return NextResponse.json({
      vehicles: vehiclesRes.data || [],
      customers: customersRes.data || [],
      leads: leadsRes.data || [],
      deals: dealsRes.data || [],
      appointments: appointmentsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST: Save or update CRM entity (vehicle, customer, lead, deal, etc.) into Supabase backend
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { entity, type, data } = body;

    if (!entity || !data) {
      return NextResponse.json({ error: 'Missing entity or data' }, { status: 400 });
    }

    const tenantId = data.tenant_id || data.tenantId || 't_default';
    const { primaryBranchId } = await ensureTenantAndBranch(tenantId);

    // Normalize branch_id
    if (!data.branch_id && !data.branchId) {
      data.branch_id = primaryBranchId;
    }

    let result: any = null;
    let error: any = null;

    switch (entity) {
      case 'vehicle': {
        const payload = {
          id: data.id || `veh_${Date.now()}`,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || primaryBranchId,
          stock_number: data.stock_number || data.stockNumber || `STK-${Date.now().toString().slice(-4)}`,
          vin: data.vin || `VIN-${Date.now()}`,
          registration_number: data.registration_number || data.registrationNumber || '',
          make: data.make || '',
          model: data.model || '',
          variant: data.variant || 'Base',
          year: Number(data.year) || 2024,
          color: data.color || 'White',
          mileage_km: Number(data.mileage_km || data.mileageKm) || 0,
          fuel_type: data.fuel_type || data.fuelType || 'Petrol',
          transmission: data.transmission || 'Manual',
          ownership_mode: data.ownership_mode || data.ownershipMode || 'owned',
          acquisition_cost: Number(data.acquisition_cost || data.acquisitionCost) || 0,
          total_cost: Number(data.total_cost || data.totalCost) || 0,
          asking_price: Number(data.asking_price || data.askingPrice) || 0,
          minimum_price: Number(data.minimum_price || data.minimumPrice) || 0,
          status: data.status || 'available',
          updated_at: new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('vehicles').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;
        break;
      }

      case 'customer': {
        const payload = {
          id: data.id || `cust_${Date.now()}`,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || primaryBranchId,
          type: data.type || 'individual',
          first_name: data.first_name || data.firstName || '',
          last_name: data.last_name || data.lastName || '',
          email: data.email || null,
          phone: data.phone || '',
          pan_number: data.pan_number || data.panNumber || null,
          company_name: data.company_name || data.companyName || null,
          city: data.city || data.address?.city || '',
          state: data.state || data.address?.state || '',
          pincode: data.pincode || data.address?.pincode || '',
          address: data.address || {},
          consent: data.consent || { whatsapp: true, sms: true, email: true },
          updated_at: new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('customers').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;
        break;
      }

      case 'lead': {
        // Ensure customer exists if customer_id is provided
        if (data.customer_id || data.customerId) {
          const custId = data.customer_id || data.customerId;
          await supabaseAdmin.from('customers').upsert({
            id: custId,
            tenant_id: tenantId,
            branch_id: data.branch_id || primaryBranchId,
            first_name: data.customer_name || data.customerName || 'Lead Contact',
            phone: data.customer_phone || data.customerPhone || '+91 98000 00000',
            email: data.customer_email || data.customerEmail || null,
          }, { onConflict: 'id' });
        }

        const payload = {
          id: data.id || `lead_${Date.now()}`,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || primaryBranchId,
          customer_id: data.customer_id || data.customerId || null,
          source: data.source || 'walk_in',
          status: data.status || 'new',
          budget_min: Number(data.budget_min || data.budgetMin) || 0,
          budget_max: Number(data.budget_max || data.budgetMax) || 0,
          preferred_make: data.preferred_make || data.preferredMake || '',
          preferred_model: data.preferred_model || data.preferredModel || '',
          preferred_fuel_type: data.preferred_fuel_type || data.preferredFuelType || 'Petrol',
          score: Number(data.score) || 75,
          notes: data.notes || '',
          updated_at: new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('leads').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;
        break;
      }

      case 'deal': {
        const payload = {
          id: data.id || `deal_${Date.now()}`,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || primaryBranchId,
          customer_id: data.customer_id || data.customerId,
          vehicle_id: data.vehicle_id || data.vehicleId,
          deal_number: data.deal_number || data.dealNumber || `DEAL-${Date.now().toString().slice(-4)}`,
          stage: data.stage || 'draft',
          vehicle_price: Number(data.vehicle_price || data.vehiclePrice) || 0,
          accessories_total: Number(data.accessories_total || data.accessoriesTotal) || 0,
          discount_total: Number(data.discount_total || data.discountTotal) || 0,
          tax_total: Number(data.tax_total || data.taxTotal) || 0,
          fees_total: Number(data.fees_total || data.feesTotal) || 0,
          trade_in_credit: Number(data.trade_in_credit || data.tradeInCredit) || 0,
          grand_total: Number(data.grand_total || data.grandTotal) || 0,
          amount_paid: Number(data.amount_paid || data.amountPaid) || 0,
          balance_due: Number(data.balance_due || data.balanceDue) || 0,
          currency: data.currency || 'INR',
          finance_type: data.finance_type || data.financeType || 'cash',
          updated_at: new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('deals').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    if (error) {
      console.error(`[API/crm] Error saving ${entity}:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, entity, data: result });
  } catch (err: any) {
    console.error('[API/crm] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

