import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/server-auth';

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

// GET: Fetch all CRM data strictly scoped to caller's tenant
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const tenantId = auth.session.tenantId;

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

// POST: Save or update CRM entity (strictly scoped to caller's tenant)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { entity, data } = body;

    if (!entity || !data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid entity or data object' }, { status: 400 });
    }

    const ALLOWED_ENTITIES = ['vehicle', 'customer', 'lead', 'deal', 'appointment'];
    if (!ALLOWED_ENTITIES.includes(entity)) {
      return NextResponse.json(
        { error: `Invalid entity '${entity}'. Allowed entities: ${ALLOWED_ENTITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Entity-specific input validations
    if (entity === 'customer') {
      const name = (data.first_name || data.firstName || '').trim();
      const phone = (data.phone || '').trim();
      if (!name) {
        return NextResponse.json({ error: 'Validation failed', issues: [{ field: 'firstName', message: 'First name is required' }] }, { status: 400 });
      }
      if (!phone || phone.length < 5) {
        return NextResponse.json({ error: 'Validation failed', issues: [{ field: 'phone', message: 'Valid phone number is required' }] }, { status: 400 });
      }
    } else if (entity === 'lead') {
      const VALID_LEAD_STATUSES = ['new', 'assigned', 'contacted', 'qualified', 'appointment_set', 'test_drive', 'negotiation', 'converted', 'lost', 'nurture'];
      const status = data.status || 'new';
      if (!VALID_LEAD_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Validation failed', issues: [{ field: 'status', message: `Invalid lead status. Allowed: ${VALID_LEAD_STATUSES.join(', ')}` }] }, { status: 400 });
      }
    }

    const tenantId = auth.session.tenantId; // Enforce caller's authentic tenant
    const { primaryBranchId } = await ensureTenantAndBranch(tenantId);

    // Normalize branch_id (replace placeholder/legacy branch IDs with valid tenant branch)
    const rawBranch = data.branch_id || data.branchId;
    const resolvedBranchId = !rawBranch || rawBranch === 'b-dt-001' || rawBranch === 'b_default'
      ? primaryBranchId
      : rawBranch;
    data.branch_id = resolvedBranchId;
    data.branchId = resolvedBranchId;

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
        const custId = data.customer_id || data.customerId || `cust_${Date.now()}`;
        const { data: existingLeadCust } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('id', custId)
          .maybeSingle();

        if (!existingLeadCust) {
          const fullName = String(data.customer_name || data.customerName || 'Lead Contact').trim();
          const nameParts = fullName.split(/\s+/);
          await supabaseAdmin.from('customers').upsert(
            {
              id: custId,
              tenant_id: tenantId,
              branch_id: resolvedBranchId,
              type: 'individual',
              first_name: nameParts[0] || 'Lead',
              last_name: nameParts.slice(1).join(' ') || '',
              phone: data.customer_phone || data.customerPhone || '+91 98000 00000',
              email: data.customer_email || data.customerEmail || null,
            },
            { onConflict: 'id' }
          );
        }

        const payload = {
          id: data.id || `lead_${Date.now()}`,
          tenant_id: tenantId,
          branch_id: resolvedBranchId,
          customer_id: custId,
          source: data.source || 'walk_in',
          status: data.status || 'new',
          budget_min: Number(data.budget_min || data.budgetMin) || 0,
          budget_max: Number(data.budget_max || data.budgetMax) || 0,
          preferred_make: data.preferred_make || data.preferredMake || '',
          preferred_model: data.preferred_model || data.preferredModel || '',
          preferred_fuel_type: data.preferred_fuel_type || data.preferredFuelType || 'Petrol',
          score: Number(data.score) || 75,
          notes: data.notes || '',
          next_action_at: data.next_action_at || data.nextActionAt || null,
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
          // Authoritative server-side financial calculation (never blindly trust client grand total)
          grand_total: Math.max(
            0,
            Math.round(
              ((Number(data.vehicle_price || data.vehiclePrice) || 0) +
                (Number(data.accessories_total || data.accessoriesTotal) || 0) +
                (Number(data.fees_total || data.feesTotal) || 0) +
                (Number(data.tax_total || data.taxTotal) || 0) -
                (Number(data.discount_total || data.discountTotal) || 0) -
                (Number(data.trade_in_credit || data.tradeInCredit) || 0)) *
                100
            ) / 100
          ),
          amount_paid: Number(data.amount_paid || data.amountPaid) || 0,
          balance_due: Math.max(
            0,
            Math.round(
              (((Number(data.vehicle_price || data.vehiclePrice) || 0) +
                (Number(data.accessories_total || data.accessoriesTotal) || 0) +
                (Number(data.fees_total || data.feesTotal) || 0) +
                (Number(data.tax_total || data.taxTotal) || 0) -
                (Number(data.discount_total || data.discountTotal) || 0) -
                (Number(data.trade_in_credit || data.tradeInCredit) || 0)) -
                (Number(data.amount_paid || data.amountPaid) || 0)) *
                100
            ) / 100
          ),
          currency: data.currency || 'INR',
          finance_type: data.finance_type || data.financeType || 'cash',
          updated_at: new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('deals').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;
        break;
      }

      case 'appointment': {
        const VALID_TYPES = ['showroom_visit', 'test_drive', 'document_pickup', 'delivery', 'service', 'other'];
        const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

        const rawType = String(data.appointment_type || data.appointmentType || 'showroom_visit');
        const safeType = VALID_TYPES.includes(rawType) ? rawType : 'showroom_visit';
        const rawStatus = String(data.status || 'confirmed');
        const safeStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'confirmed';

        // Ensure referenced customer exists so FK constraint on appointments.customer_id succeeds
        const customerId = data.customer_id || data.customerId || `cust_${Date.now()}`;
        const { data: existingCust } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('id', customerId)
          .maybeSingle();

        if (!existingCust) {
          const fullName = String(data.customer_name || data.customerName || 'Walk-in Customer').trim();
          const nameParts = fullName.split(/\s+/);
          await supabaseAdmin.from('customers').upsert(
            {
              id: customerId,
              tenant_id: tenantId,
              branch_id: resolvedBranchId,
              type: 'individual',
              first_name: nameParts[0] || 'Customer',
              last_name: nameParts.slice(1).join(' ') || '',
              phone: data.customer_phone || data.customerPhone || '+91 98000 00000',
              email: data.customer_email || data.customerEmail || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }

        // Only link lead_id if it actually exists in leads table (prevents FK error)
        let validLeadId: string | null = null;
        const candidateLeadId = data.lead_id || data.leadId;
        if (candidateLeadId) {
          const { data: existingLead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('id', candidateLeadId)
            .maybeSingle();
          if (existingLead) validLeadId = existingLead.id;
        }

        const scheduledAt = data.scheduled_at || data.scheduledAt || new Date().toISOString();
        const isoScheduledAt = isNaN(Date.parse(scheduledAt))
          ? new Date().toISOString()
          : new Date(scheduledAt).toISOString();

        // Store either inventory vehicle ID or chosen default car model name in vehicle_id (TEXT column)
        const storedVehicleRef =
          data.vehicle_id || data.vehicleId || data.vehicle_name || data.vehicleName || null;

        const payload = {
          id: data.id || `apt_${Date.now()}`,
          tenant_id: tenantId,
          branch_id: resolvedBranchId,
          customer_id: customerId,
          lead_id: validLeadId,
          vehicle_id: storedVehicleRef,
          appointment_type: safeType,
          scheduled_at: isoScheduledAt,
          duration_minutes: Number(data.duration_minutes || data.durationMinutes) || 45,
          status: safeStatus,
          outcome: data.outcome || (data.vehicleName || data.vehicle_name || null),
          notes: data.notes || '',
        };

        const res = await supabaseAdmin.from('appointments').upsert(payload, { onConflict: 'id' }).select();
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
