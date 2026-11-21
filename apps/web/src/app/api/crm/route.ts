import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isServerSupabaseConfigured } from '@/lib/server/supabase';
import { requireAuth } from '@/lib/server/auth';
import { ensureTenantAndBranch } from '@/lib/server/tenant';
import { randomUUID } from 'crypto';

function isUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

// Ensures an app_users row exists for staff assignment foreign key compliance
async function ensureAppUser(id: string, fullName: string, email: string) {
  if (!isUuid(id)) return null;
  const { data } = await supabaseAdmin.from('app_users').select('id').eq('id', id).maybeSingle();
  if (!data) {
    await supabaseAdmin.from('app_users').upsert(
      {
        id,
        full_name: fullName || 'Dealership Consultant',
        email: email || `${id.slice(0, 8)}@dealership.internal`,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  }
  return id;
}

// GET: Fetch all CRM data strictly scoped to caller's tenant
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  const tenantId = auth.session.tenantId;

  try {
    const [vehiclesRes, customersRes, leadsRes, dealsRes, appointmentsRes, employeesRes, testDrivesRes, quotationsRes, invoicesRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from('vehicles').select('*').eq('tenant_id', tenantId),
      supabaseAdmin.from('customers').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('deals').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('appointments').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('employees').select('id, full_name, email, role, department').eq('tenant_id', tenantId),
      supabaseAdmin.from('test_drives').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('quotations').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('invoices').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('payments').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    ]);

    const employees = employeesRes.data || [];
    const { primaryBranchId } = await ensureTenantAndBranch(tenantId);

    // Requirement 3: Ensure every customer (both old and newly registered) appears in the pipeline
    // as an enquiry lead in "New Enquiries" (status: 'new') until they are contacted.
    const allLeads = leadsRes.data || [];
    const leadsByCustomer = new Map<string, any[]>();
    for (const l of allLeads) {
      if (l.customer_id) {
        if (!leadsByCustomer.has(l.customer_id)) leadsByCustomer.set(l.customer_id, []);
        leadsByCustomer.get(l.customer_id)!.push(l);
      }
    }

    const missingCustomerLeads: any[] = [];
    const leadIdsToResetToNew: string[] = [];
    const duplicateLeadIdsToDelete: string[] = [];

    for (const cust of (customersRes.data || [])) {
      const custLeads = leadsByCustomer.get(cust.id) || [];
      const hasRealActivity =
        (appointmentsRes.data || []).some((a: any) => a.customer_id === cust.id || custLeads.some((l) => l.id === a.lead_id)) ||
        (testDrivesRes.data || []).some((td: any) => td.customer_id === cust.id);

      const isContactedOrBeyond = custLeads.some((l) =>
        ['contacted', 'qualified', 'appointment_set', 'test_drive', 'negotiation', 'converted', 'lost'].includes(l.status)
      );

      if (!isContactedOrBeyond && !hasRealActivity) {
        // Uncontacted customer without active bookings: ensure enquiry in "New Enquiries" (status: 'new')
        const newLead = custLeads.find((l) => l.status === 'new');
        if (!newLead) {
          if (custLeads.length > 0) {
            // Uncontacted lead without actual appointments: reset to 'new'
            const primaryLead = custLeads[0];
            primaryLead.status = 'new';
            leadIdsToResetToNew.push(primaryLead.id);
            // Deduplicate redundant duplicate uncontacted cards
            if (custLeads.length > 1) {
              for (let i = 1; i < custLeads.length; i++) {
                duplicateLeadIdsToDelete.push(custLeads[i].id);
              }
            }
          } else {
            // Customer has no lead at all — create one in "New Enquiries"
            const leadId = randomUUID();
            const preferredVehicle = (cust as any).preferred_model || (cust as any).preferredVehicle || '';
            const missingLead = {
              id: leadId,
              tenant_id: tenantId,
              branch_id: cust.branch_id || primaryBranchId,
              customer_id: cust.id,
              source: cust.source || 'Customer Registration',
              status: 'new', // Enters pipeline in "New Enquiries" until contacted
              assigned_to: cust.assigned_to || null,
              budget_min: Number((cust as any).budget_min) || 1200000,
              budget_max: Number((cust as any).budget_max) || 2000000,
              preferred_make: '',
              preferred_model: preferredVehicle || 'Enquiry',
              preferred_fuel_type: (cust as any).preferred_fuel_type || 'Petrol',
              score: 80,
              notes: preferredVehicle ? `Customer expressed preference for ${preferredVehicle}.` : 'New customer enquiry in CRM pipeline.',
              next_action_at: new Date(Date.now() + 86400000 * 2).toISOString(),
              created_at: cust.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            missingCustomerLeads.push(missingLead);
            allLeads.push(missingLead);
          }
        } else if (custLeads.length > 1) {
          // If a 'new' lead exists, prune any uncontacted duplicates
          const duplicates = custLeads.filter((l) => l.id !== newLead.id && !['contacted', 'qualified', 'negotiation', 'converted'].includes(l.status));
          for (const d of duplicates) {
            duplicateLeadIdsToDelete.push(d.id);
          }
        }
      }
    }

    if (missingCustomerLeads.length > 0) {
      await supabaseAdmin.from('leads').insert(missingCustomerLeads);
    }
    if (leadIdsToResetToNew.length > 0) {
      await supabaseAdmin
        .from('leads')
        .update({ status: 'new', updated_at: new Date().toISOString() })
        .in('id', leadIdsToResetToNew);
    }
    if (duplicateLeadIdsToDelete.length > 0) {
      const dupSet = new Set(duplicateLeadIdsToDelete);
      await supabaseAdmin.from('leads').delete().in('id', duplicateLeadIdsToDelete);
      leadsRes.data = allLeads.filter((l: any) => !dupSet.has(l.id));
    } else {
      leadsRes.data = allLeads;
    }

    const customersMap = new Map((customersRes.data || []).map((c) => [c.id, c]));
    const employeesMap = new Map(employees.map((e) => [e.id, e]));
    const vehiclesMap = new Map((vehiclesRes.data || []).map((v) => [v.id, v]));

    // Map latest active appointment for each lead and customer
    const appointmentsByLead = new Map<string, any>();
    const appointmentsByCustomer = new Map<string, any>();
    for (const apt of appointmentsRes.data || []) {
      if (apt.status === 'cancelled') continue;
      if (apt.lead_id && !appointmentsByLead.has(apt.lead_id)) {
        appointmentsByLead.set(apt.lead_id, apt);
      }
      if (apt.customer_id && !appointmentsByCustomer.has(apt.customer_id)) {
        appointmentsByCustomer.set(apt.customer_id, apt);
      }
    }

    // Enrich leads with live customer, team member assignee, and appointment details
    const enrichedLeads = (leadsRes.data || []).map((l) => {
      const cust = customersMap.get(l.customer_id);
      const emp = l.assigned_to ? employeesMap.get(l.assigned_to) : null;
      const linkedApt = appointmentsByLead.get(l.id) || appointmentsByCustomer.get(l.customer_id);
      let appointmentDetails: any = null;
      if (linkedApt) {
        const aptEmp = linkedApt.assigned_to ? employeesMap.get(linkedApt.assigned_to) : null;
        const aptVeh = linkedApt.vehicle_id ? vehiclesMap.get(linkedApt.vehicle_id) : null;
        const vehName = aptVeh
          ? `${aptVeh.make} ${aptVeh.model}${aptVeh.variant ? ` ${aptVeh.variant}` : ''}`.trim()
          : (linkedApt.outcome || l.preferred_model || 'Showroom Vehicle');

        appointmentDetails = {
          id: linkedApt.id,
          appointment_type: linkedApt.appointment_type,
          scheduled_at: linkedApt.scheduled_at,
          duration_minutes: linkedApt.duration_minutes || 45,
          status: linkedApt.status || 'confirmed',
          outcome: linkedApt.outcome,
          vehicle_id: linkedApt.vehicle_id,
          vehicle_name: vehName,
          notes: linkedApt.notes || '',
          assigned_to: linkedApt.assigned_to,
          assignee_name: aptEmp ? aptEmp.full_name : (emp ? emp.full_name : undefined),
        };
      }

      return {
        ...l,
        customer_name: cust ? `${cust.first_name} ${cust.last_name}`.trim() : undefined,
        customer_phone: cust?.phone,
        customer_email: cust?.email,
        assignee_name: emp
          ? `${emp.full_name} (${(emp.role || 'Staff').replace(/_/g, ' ')})`
          : (l.assigned_to ? 'Assigned Consultant' : 'Unassigned Consultant'),
        appointment: appointmentDetails,
        appointment_details: appointmentDetails,
      };
    });

    // Enrich appointments with live customer, vehicle, and assignee details
    const enrichedAppointments = (appointmentsRes.data || []).map((a) => {
      const cust = customersMap.get(a.customer_id);
      const emp = a.assigned_to ? employeesMap.get(a.assigned_to) : null;
      const veh = a.vehicle_id ? vehiclesMap.get(a.vehicle_id) : null;
      const vehName = veh
        ? `${veh.make} ${veh.model}${veh.variant ? ` ${veh.variant}` : ''}`.trim()
        : (a.outcome || 'Showroom Vehicle');

      return {
        ...a,
        customer_name: cust ? `${cust.first_name} ${cust.last_name}`.trim() : undefined,
        customer_phone: cust?.phone,
        assignee_name: emp ? emp.full_name : undefined,
        vehicle_name: vehName,
      };
    });

    return NextResponse.json({
      vehicles: vehiclesRes.data || [],
      customers: customersRes.data || [],
      leads: enrichedLeads,
      deals: dealsRes.data || [],
      appointments: enrichedAppointments,
      employees: employees,
      test_drives: testDrivesRes.data || [],
      quotations: quotationsRes.data || [],
      invoices: invoicesRes.data || [],
      payments: paymentsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST: Save or update CRM entity (strictly scoped to caller's tenant)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { entity, data } = body;

    if (!entity || !data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid entity or data object' }, { status: 400 });
    }

    const ALLOWED_ENTITIES = ['vehicle', 'customer', 'lead', 'deal', 'appointment', 'test_drive'];
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
        const vehicleId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        const payload = {
          id: vehicleId,
          tenant_id: tenantId,
          branch_id: resolvedBranchId,
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
        const customerId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        const payload = {
          id: customerId,
          tenant_id: tenantId,
          branch_id: resolvedBranchId,
          type: data.type || 'individual',
          first_name: (data.first_name || data.firstName || 'Customer').trim(),
          last_name: (data.last_name || data.lastName || '').trim(),
          email: data.email || null,
          phone: data.phone || '',
          pan_number: data.pan_number || data.panNumber || null,
          company_name: data.company_name || data.companyName || null,
          city: data.city || data.address?.city || '',
          state: data.state || data.address?.state || '',
          pincode: data.pincode || data.address?.pincode || '',
          address: data.address || { city: data.city || '' },
          consent: data.consent || { whatsapp: true, sms: true, email: true },
          updated_at: new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('customers').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;

        if (!error) {
          // Resolve assigned staff member UUID if provided
          let assignedToUuid: string | null = null;
          const candidateStaff = data.assigned_to || data.assignedTo;
          if (candidateStaff && isUuid(candidateStaff)) {
            assignedToUuid = String(candidateStaff);
            await ensureAppUser(assignedToUuid, data.assignedToName || 'Sales Consultant', `${assignedToUuid.slice(0, 8)}@dealership.internal`);
          }

          // Check whether an enquiry lead already exists for this customer in Supabase
          const { data: existingLeads } = await supabaseAdmin
            .from('leads')
            .select('id, status')
            .eq('customer_id', customerId)
            .eq('tenant_id', tenantId)
            .limit(1);

          const preferredMake = data.preferred_make || data.preferredMake || '';
          const preferredModel = data.preferred_model || data.preferredModel || data.preferredVehicle || '';
          const notesText = data.notes || (preferredModel ? `Customer enquiring about ${preferredModel}.` : 'Customer registered from Customer Directory.');

          if (!existingLeads || existingLeads.length === 0) {
            // Automatically insert a new enquiry lead so it immediately appears in Pipeline "New Enquiries"
            const leadId = randomUUID();
            await supabaseAdmin.from('leads').insert({
              id: leadId,
              tenant_id: tenantId,
              branch_id: resolvedBranchId,
              customer_id: customerId,
              source: data.source || 'Showroom Customer Registration',
              status: 'new', // Enters pipeline in "New Enquiries"
              assigned_to: assignedToUuid,
              budget_min: Number(data.budget_min || data.budgetMin) || 1200000,
              budget_max: Number(data.budget_max || data.budgetMax) || 2000000,
              preferred_make: preferredMake,
              preferred_model: preferredModel,
              preferred_fuel_type: data.preferred_fuel_type || data.preferredFuelType || 'Petrol',
              score: 85,
              notes: notesText,
              next_action_at: new Date(Date.now() + 86400000 * 2).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } else if (assignedToUuid || preferredModel) {
            // Update assigned consultant or vehicle preferences on existing lead
            const updatePayload: any = { updated_at: new Date().toISOString() };
            if (assignedToUuid) updatePayload.assigned_to = assignedToUuid;
            if (preferredModel) updatePayload.preferred_model = preferredModel;
            await supabaseAdmin.from('leads').update(updatePayload).eq('id', existingLeads[0].id);
          }
        }
        break;
      }

      case 'lead': {
        const leadId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        let custId = data.customer_id || data.customerId;

        // If customer ID is not a valid UUID or not yet in database, create or find customer
        if (!custId || !isUuid(custId)) {
          custId = randomUUID();
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
              phone: data.customer_phone || data.customerPhone || '',
              email: data.customer_email || data.customerEmail || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } else {
          // Check if customer exists with this UUID
          const { data: existingCust } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('id', custId)
            .maybeSingle();

          if (!existingCust) {
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
                phone: data.customer_phone || data.customerPhone || '',
                email: data.customer_email || data.customerEmail || null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          }
        }

        // Validate and normalize assigned_to
        let assignedToUuid: string | null = null;
        const candidateStaff = data.assigned_to || data.assignedTo;
        if (candidateStaff && isUuid(candidateStaff)) {
          assignedToUuid = String(candidateStaff);
          await ensureAppUser(assignedToUuid, data.assignee_name || data.assigneeName || 'Sales Consultant', `${assignedToUuid.slice(0, 8)}@dealership.internal`);
        }

        const newStatus = data.status || 'new';
        const leadPayload = {
          id: leadId,
          tenant_id: tenantId,
          branch_id: resolvedBranchId,
          customer_id: custId,
          source: data.source || 'Showroom Walk-in',
          status: newStatus,
          assigned_to: assignedToUuid,
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

        const res = await supabaseAdmin.from('leads').upsert(leadPayload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;

        if (!error) {
          // Automation 1: When lead enters 'appointment_set', ensure row in appointments table
          if (newStatus === 'appointment_set') {
            const { data: existingApt } = await supabaseAdmin
              .from('appointments')
              .select('id')
              .eq('lead_id', leadId)
              .maybeSingle();

            if (!existingApt) {
              const aptId = randomUUID();
              await supabaseAdmin.from('appointments').insert({
                id: aptId,
                tenant_id: tenantId,
                branch_id: resolvedBranchId,
                customer_id: custId,
                lead_id: leadId,
                appointment_type: 'showroom_visit',
                scheduled_at: data.next_action_at || new Date(Date.now() + 86400000).toISOString(),
                duration_minutes: 45,
                status: 'confirmed',
                notes: data.notes || 'Showroom appointment scheduled from Pipeline',
                assigned_to: assignedToUuid,
                created_at: new Date().toISOString(),
              });
            }
          }

          // Automation 2: When lead enters 'test_drive', ensure row in test_drives table
          if (newStatus === 'test_drive') {
            const { data: existingTd } = await supabaseAdmin
              .from('test_drives')
              .select('id')
              .eq('customer_id', custId)
              .eq('tenant_id', tenantId)
              .maybeSingle();

            if (!existingTd) {
              // Ensure a vehicle exists to link vehicle_id
              const { data: anyVeh } = await supabaseAdmin
                .from('vehicles')
                .select('id')
                .eq('tenant_id', tenantId)
                .limit(1);

              let vehId = anyVeh?.[0]?.id;
              if (!vehId || !isUuid(vehId)) {
                vehId = randomUUID();
                await supabaseAdmin.from('vehicles').insert({
                  id: vehId,
                  tenant_id: tenantId,
                  branch_id: resolvedBranchId,
                  stock_number: `STK-${Date.now().toString().slice(-4)}`,
                  vin: `VIN-${Date.now()}`,
                  make: data.preferred_make || 'Vehicle',
                  model: data.preferred_model || 'Showroom Vehicle',
                  variant: 'Standard',
                  year: new Date().getFullYear(),
                  status: 'available',
                });
              }

              const tdId = randomUUID();
              await supabaseAdmin.from('test_drives').insert({
                id: tdId,
                tenant_id: tenantId,
                vehicle_id: vehId,
                customer_id: custId,
                start_odometer: Number(data.start_odometer || 0),
                start_time: data.next_action_at || new Date().toISOString(),
                route: data.route || 'Dealership Test Drive Route',
                notes: data.notes || 'Test drive scheduled from Sales Pipeline',
                rating: 5,
                created_at: new Date().toISOString(),
              });
            }
          }

          // Automation 3: When lead enters 'converted', ensure deal in deals table
          if (newStatus === 'converted') {
            const { data: existingDeal } = await supabaseAdmin
              .from('deals')
              .select('id')
              .eq('customer_id', custId)
              .eq('tenant_id', tenantId)
              .maybeSingle();

            if (!existingDeal) {
              const dealId = randomUUID();
              const price = Number(data.budget_max || data.budgetMin) || 1850000;
              const vehId = data.vehicle_id || data.vehicleId || null;
              await supabaseAdmin.from('deals').insert({
                id: dealId,
                tenant_id: tenantId,
                branch_id: resolvedBranchId,
                customer_id: custId,
                vehicle_id: vehId,
                deal_number: `DEAL-${Date.now().toString().slice(-4)}`,
                stage: 'ready',
                vehicle_price: price,
                grand_total: price,
                amount_paid: 50000,
                balance_due: Math.max(0, price - 50000),
                currency: 'INR',
                finance_type: 'cash',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

              if (vehId) {
                await supabaseAdmin.from('vehicles').update({ status: 'reserved' }).eq('id', vehId);
              }
            }
          }
        }
        break;
      }

      case 'deal': {
        const dealId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        const validStages = ['initiated', 'documents', 'finance', 'pdi', 'ready', 'delivered', 'cancelled'];
        let resolvedStage = data.stage || 'initiated';
        if (resolvedStage === 'closed_won' || resolvedStage === 'won') resolvedStage = 'ready';
        if (!validStages.includes(resolvedStage)) resolvedStage = 'initiated';

        const payload = {
          id: dealId,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || resolvedBranchId,
          customer_id: data.customer_id || data.customerId,
          vehicle_id: data.vehicle_id || data.vehicleId || null,
          deal_number: data.deal_number || data.dealNumber || `DEAL-${Date.now().toString().slice(-4)}`,
          stage: resolvedStage,
          vehicle_price: Number(data.vehicle_price || data.vehiclePrice) || 0,
          accessories_total: Number(data.accessories_total || data.accessoriesTotal) || 0,
          discount_total: Number(data.discount_total || data.discountTotal) || 0,
          tax_total: Number(data.tax_total || data.taxTotal) || 0,
          fees_total: Number(data.fees_total || data.feesTotal) || 0,
          trade_in_credit: Number(data.trade_in_credit || data.tradeInCredit) || 0,
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

        // Auto-update connected vehicle status based on deal stage
        if (payload.vehicle_id) {
          if (resolvedStage === 'delivered') {
            await supabaseAdmin.from('vehicles').update({ status: 'delivered' }).eq('id', payload.vehicle_id);
          } else if (resolvedStage === 'ready' || resolvedStage === 'initiated') {
            await supabaseAdmin.from('vehicles').update({ status: 'reserved' }).eq('id', payload.vehicle_id);
          } else if (resolvedStage === 'cancelled') {
            await supabaseAdmin.from('vehicles').update({ status: 'available' }).eq('id', payload.vehicle_id);
          }
        }
        break;
      }

      case 'quotation': {
        const quoteId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        const payload = {
          id: quoteId,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || resolvedBranchId,
          customer_id: data.customer_id || data.customerId,
          opportunity_id: data.opportunity_id || data.opportunityId || null,
          quote_number: data.quote_number || data.quoteNumber || `Q-2024-${Math.floor(100 + Math.random() * 900)}`,
          revision: data.revision || 1,
          status: data.status || 'issued',
          subtotal: Number(data.subtotal || data.totals?.subtotal) || 0,
          discount_total: Number(data.discount_total || data.totals?.discountTotal) || 0,
          tax_total: Number(data.tax_total || data.totals?.taxTotal) || 0,
          fees_total: Number(data.fees_total || data.totals?.feesTotal) || 0,
          grand_total: Number(data.grand_total || data.totals?.grandTotal) || 0,
          valid_until: data.valid_until || data.validUntil || new Date(Date.now() + 86400000 * 14).toISOString(),
          notes: data.notes || '',
          updated_at: new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('quotations').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;
        break;
      }

      case 'invoice': {
        const invId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        const payload = {
          id: invId,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || resolvedBranchId,
          customer_id: data.customer_id || data.customerId,
          deal_id: (data.deal_id || data.dealId) && isUuid(data.deal_id || data.dealId) ? (data.deal_id || data.dealId) : null,
          invoice_number: data.invoice_number || data.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
          status: data.status || 'paid',
          subtotal: Number(data.subtotal) || Number(data.grand_total || data.grandTotal) || 0,
          tax_total: Number(data.tax_total || data.taxTotal) || 0,
          grand_total: Number(data.grand_total || data.grandTotal || data.amount) || 0,
          paid_amount: Number(data.paid_amount || data.paidAmount || data.amount) || 0,
          balance_due: Number(data.balance_due || data.balanceDue) || 0,
          currency: data.currency || 'INR',
          issued_at: data.issued_at || data.issuedAt || new Date().toISOString(),
          due_date: data.due_date || data.dueDate || new Date().toISOString(),
          created_at: data.created_at || new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('invoices').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;
        break;
      }

      case 'payment': {
        const paymentId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        const amount = Number(data.amount) || 0;
        const dealId = (data.deal_id || data.dealId) && isUuid(data.deal_id || data.dealId) ? (data.deal_id || data.dealId) : null;
        const invoiceId = (data.invoice_id || data.invoiceId) && isUuid(data.invoice_id || data.invoiceId) ? (data.invoice_id || data.invoiceId) : null;
        const payload = {
          id: paymentId,
          tenant_id: tenantId,
          branch_id: data.branch_id || data.branchId || resolvedBranchId,
          customer_id: data.customer_id || data.customerId,
          deal_id: dealId,
          invoice_id: invoiceId,
          payment_number: data.payment_number || data.paymentNumber || `PMT-${Date.now().toString().slice(-4)}`,
          method: data.method || 'upi',
          status: data.status || 'settled',
          amount: amount,
          currency: data.currency || 'INR',
          reference_number: data.reference_number || data.referenceNumber || 'TXN/' + Date.now(),
          notes: data.notes || '',
          settled_at: data.settled_at || data.settledAt || new Date().toISOString(),
          created_at: data.created_at || new Date().toISOString(),
        };
        const res = await supabaseAdmin.from('payments').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;

        // Auto-update connected deal balance
        if (dealId && amount > 0) {
          const { data: curDeal } = await supabaseAdmin.from('deals').select('amount_paid, grand_total').eq('id', dealId).maybeSingle();
          if (curDeal) {
            const newPaid = (Number(curDeal.amount_paid) || 0) + amount;
            const newBalance = Math.max(0, (Number(curDeal.grand_total) || 0) - newPaid);
            await supabaseAdmin.from('deals').update({
              amount_paid: newPaid,
              balance_due: newBalance,
              updated_at: new Date().toISOString(),
            }).eq('id', dealId);
          }
        }

        // Auto-update connected invoice balance
        if (invoiceId && amount > 0) {
          const { data: curInv } = await supabaseAdmin.from('invoices').select('paid_amount, grand_total').eq('id', invoiceId).maybeSingle();
          if (curInv) {
            const newPaid = (Number(curInv.paid_amount) || 0) + amount;
            const newBalance = Math.max(0, (Number(curInv.grand_total) || 0) - newPaid);
            await supabaseAdmin.from('invoices').update({
              paid_amount: newPaid,
              balance_due: newBalance,
              status: newBalance <= 0 ? 'paid' : 'partially_paid',
            }).eq('id', invoiceId);
          }
        }
        break;
      }

      case 'appointment': {
        const VALID_TYPES = ['showroom_visit', 'test_drive', 'document_pickup', 'delivery', 'service', 'other'];
        const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

        const rawType = String(data.appointment_type || data.appointmentType || 'showroom_visit');
        const safeType = VALID_TYPES.includes(rawType) ? rawType : 'showroom_visit';
        const rawStatus = String(data.status || 'confirmed');
        const safeStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'confirmed';

        let customerId = data.customer_id || data.customerId;
        if (!customerId || !isUuid(customerId)) {
          customerId = randomUUID();
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
              phone: data.customer_phone || data.customerPhone || '',
              email: data.customer_email || data.customerEmail || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }

        let validLeadId: string | null = null;
        const candidateLeadId = data.lead_id || data.leadId;
        if (candidateLeadId && isUuid(candidateLeadId)) {
          const { data: existingLead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('id', candidateLeadId)
            .maybeSingle();
          if (existingLead) validLeadId = existingLead.id;
        }

        let assignedToUuid: string | null = null;
        const candidateStaff = data.assigned_to || data.assignedTo;
        if (candidateStaff && isUuid(candidateStaff)) {
          assignedToUuid = String(candidateStaff);
          await ensureAppUser(
            assignedToUuid,
            data.assignee_name || data.assigneeName || 'Sales Consultant',
            `${assignedToUuid.slice(0, 8)}@dealership.internal`
          );
        }

        let vehicleUuid: string | null = null;
        const candidateVeh = data.vehicle_id || data.vehicleId;
        if (candidateVeh && isUuid(candidateVeh)) {
          vehicleUuid = String(candidateVeh);
        }

        const scheduledAt = data.scheduled_at || data.scheduledAt || new Date().toISOString();
        const isoScheduledAt = isNaN(Date.parse(scheduledAt))
          ? new Date().toISOString()
          : new Date(scheduledAt).toISOString();

        const appointmentId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        const resolvedVehicleName = data.vehicle_name || data.vehicleName || data.outcome || null;
        const payload = {
          id: appointmentId,
          tenant_id: tenantId,
          branch_id: resolvedBranchId,
          customer_id: customerId,
          lead_id: validLeadId,
          vehicle_id: vehicleUuid,
          assigned_to: assignedToUuid,
          appointment_type: safeType,
          scheduled_at: isoScheduledAt,
          duration_minutes: Number(data.duration_minutes || data.durationMinutes) || 45,
          status: safeStatus,
          outcome: resolvedVehicleName,
          notes: data.notes || '',
        };

        const res = await supabaseAdmin.from('appointments').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;

        if (!error) {
          // As specified by user: uncontacted leads must ALWAYS remain in 'new'
          const targetLeadRes = validLeadId
            ? await supabaseAdmin.from('leads').select('id, status').eq('id', validLeadId).maybeSingle()
            : await supabaseAdmin.from('leads').select('id, status').eq('customer_id', customerId).eq('tenant_id', tenantId).limit(1);

          const existingTargetLead = targetLeadRes?.data ? (Array.isArray(targetLeadRes.data) ? targetLeadRes.data[0] : targetLeadRes.data) : null;
          const isContactedOrBeyond = existingTargetLead && ['contacted', 'qualified', 'negotiation', 'converted'].includes(existingTargetLead.status);
          const nextStatus = isContactedOrBeyond ? 'appointment_set' : 'new';

          const leadUpdates: any = {
            status: nextStatus,
            updated_at: new Date().toISOString(),
          };
          if (assignedToUuid) leadUpdates.assigned_to = assignedToUuid;

          if (existingTargetLead?.id) {
            await supabaseAdmin.from('leads').update(leadUpdates).eq('id', existingTargetLead.id);
          } else if (customerId) {
            await supabaseAdmin.from('leads').insert({
              id: randomUUID(),
              tenant_id: tenantId,
              branch_id: resolvedBranchId,
              customer_id: customerId,
              source: 'Appointment Desk',
              status: 'new',
              assigned_to: assignedToUuid,
              preferred_make: '',
              preferred_model: resolvedVehicleName || 'Showroom Vehicle',
              budget_min: 1200000,
              budget_max: 2000000,
              score: 85,
              notes: data.notes ? `Appointment: ${data.notes}` : 'Appointment booked',
              next_action_at: isoScheduledAt,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'test_drive': {
        const driveId = (data.id && isUuid(data.id)) ? data.id : randomUUID();
        let customerId = data.customer_id || data.customerId;
        if (!customerId || !isUuid(customerId)) {
          customerId = randomUUID();
          const fullName = String(data.customer_name || data.customerName || 'Test Drive Client').trim();
          const nameParts = fullName.split(/\s+/);
          await supabaseAdmin.from('customers').upsert(
            {
              id: customerId,
              tenant_id: tenantId,
              branch_id: resolvedBranchId,
              type: 'individual',
              first_name: nameParts[0] || 'Client',
              last_name: nameParts.slice(1).join(' ') || '',
              phone: data.customer_phone || data.customerPhone || '',
              email: data.customer_email || data.customerEmail || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }

        // Ensure vehicle exists in DB to satisfy vehicle_id UUID constraint
        let vehicleId = data.vehicle_id || data.vehicleId;
        if (!vehicleId || !isUuid(vehicleId)) {
          const { data: anyVeh } = await supabaseAdmin
            .from('vehicles')
            .select('id')
            .eq('tenant_id', tenantId)
            .limit(1);

          if (anyVeh?.[0]?.id) {
            vehicleId = anyVeh[0].id;
          } else {
            vehicleId = randomUUID();
            await supabaseAdmin.from('vehicles').insert({
              id: vehicleId,
              tenant_id: tenantId,
              branch_id: resolvedBranchId,
              stock_number: `STK-${Date.now().toString().slice(-4)}`,
              vin: `VIN-${Date.now()}`,
              make: data.vehicle_name?.split(' ')[0] || 'Vehicle',
              model: data.vehicle_name || 'Showroom Stock',
              variant: 'Standard',
              year: new Date().getFullYear(),
              status: 'available',
            });
          }
        }

        const payload = {
          id: driveId,
          tenant_id: tenantId,
          vehicle_id: vehicleId,
          customer_id: customerId,
          route: data.route || 'Dealership Circuit',
          start_odometer: Number(data.start_odometer || data.startOdo) || 0,
          end_odometer: data.end_odometer ? Number(data.end_odometer) : null,
          feedback: data.feedback || '',
          rating: Number(data.rating) || 5,
          notes: data.notes || '',
          created_at: new Date().toISOString(),
        };

        const res = await supabaseAdmin.from('test_drives').upsert(payload, { onConflict: 'id' }).select();
        result = res.data;
        error = res.error;

        if (!error && customerId) {
          // Auto-advance associated lead to 'test_drive' stage in pipeline
          await supabaseAdmin
            .from('leads')
            .update({ status: 'test_drive', updated_at: new Date().toISOString() })
            .eq('customer_id', customerId)
            .eq('tenant_id', tenantId);
        }
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
