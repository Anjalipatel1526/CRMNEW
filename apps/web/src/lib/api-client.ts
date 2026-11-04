import {
  Customer,
  Branch,
  Lead,
  Vehicle,
  VehicleCatalog,
  Appointment,
  Quotation,
  Deal,
  Booking,
  Payment,
  ServiceAppointment,
  JobCard,
  Campaign,
  Referral,
  Plan,
  Subscription,
  UserContext,
  LeadScore,
  ValuationEstimate,
} from '@crm/shared-types';
import { PricingEngine } from '@crm/business-rules';
import { supabase, isSupabaseConfigured } from './supabase';

interface DataStore {
  tenant: any;
  branches: Branch[];
  userContext: UserContext;
  customers: Customer[];
  leads: Lead[];
  vehicles: Vehicle[];
  deals: Deal[];
  quotations: Quotation[];
  appointments: Appointment[];
  payments: Payment[];
  jobCards: JobCard[];
  campaigns: Campaign[];
}

const initialData: DataStore = {
  tenant: {
    id: 't-apex-001',
    name: 'Dealership Group',
    slug: 'dealership',
    status: 'active' as const,
    dealerModel: 'mixed' as const,
    primaryContactName: 'Administrator',
    primaryEmail: 'admin@dealership.com',
    primaryPhone: '+91 98000 00000',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  branches: [],
  userContext: {
    user: {
      id: 'u-admin-001',
      email: 'admin@dealership.com',
      fullName: 'Administrator',
      phone: '+91 98000 00000',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    tenant: {
      id: 't-apex-001',
      name: 'Dealership Group',
      slug: 'dealership',
      status: 'active' as const,
      dealerModel: 'mixed' as const,
      primaryContactName: 'Administrator',
      primaryEmail: 'admin@dealership.com',
      primaryPhone: '+91 98000 00000',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    membership: {
      id: 'm-01',
      tenantId: 't-apex-001',
      userId: 'u-admin-001',
      roleKey: 'tenant_admin' as const,
      branchIds: [],
      branchScope: 'all' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    permissions: ['all'],
    branches: [],
  },
  customers: [],
  leads: [],
  vehicles: [],
  deals: [],
  quotations: [],
  appointments: [],
  payments: [],
  jobCards: [],
  campaigns: [],
};

class DataService {
  private data: DataStore = initialData;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crm_store');
      localStorage.removeItem('crm_store_clean_v1');
      const saved = localStorage.getItem('crm_store_clean_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Sanitize any stale mock records from earlier versions
          const mockCustIds = new Set(['cust-101', 'cust-102', 'cust-103', 'cust-001', 'cust-002', 'cust-003']);
          const mockLeadIds = new Set(['lead-201', 'lead-202', 'lead-203', 'lead-001', 'lead-002', 'lead-003']);
          const mockDealIds = new Set(['deal-301', 'deal-001']);
          const mockBranchIds = new Set(['b-dt-001', 'b-wb-002', 'b-001', 'b-002']);
          if (Array.isArray(parsed.customers)) {
            parsed.customers = parsed.customers.filter((c: any) => !mockCustIds.has(c.id));
          }
          if (Array.isArray(parsed.leads)) {
            parsed.leads = parsed.leads.filter((l: any) => !mockLeadIds.has(l.id));
          }
          if (Array.isArray(parsed.deals)) {
            parsed.deals = parsed.deals.filter((d: any) => !mockDealIds.has(d.id));
          }
          if (Array.isArray(parsed.branches)) {
            parsed.branches = parsed.branches.filter((b: any) => !mockBranchIds.has(b.id));
          }
          this.data = parsed;
        } catch (e) {
          console.error('Failed to parse local storage', e);
        }
      }
      // Automatically trigger sync from Supabase database
      setTimeout(() => {
        this.syncAllFromSupabase().catch((err) =>
          console.warn('[API] Background Supabase sync note:', err)
        );
      }, 100);
    }
  }

  private sanitizeForStorage(data: DataStore): DataStore {
    try {
      return {
        ...data,
        vehicles: (data.vehicles || []).map((v) => {
          const isLarge = (s?: string) => typeof s === 'string' && s.startsWith('data:') && s.length > 100000;
          const cleanImageUrl = isLarge(v.imageUrl) ? '' : v.imageUrl;
          const cleanImages = (v.images || []).map((img) => (isLarge(img) ? '' : img)).filter(Boolean);
          const cleanPhotos = (v.photos || []).map((p) => ({
            ...p,
            url: isLarge(p.url) ? '' : p.url,
          }));

          return {
            ...v,
            imageUrl: cleanImageUrl || cleanImages[0] || '',
            images: cleanImages,
            photos: cleanPhotos,
          };
        }),
      };
    } catch {
      return data;
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('crm_store_clean_v2', JSON.stringify(this.data));
    } catch (err) {
      console.warn('[API] localStorage quota exceeded, applying asset optimization...', err);
      try {
        const sanitized = this.sanitizeForStorage(this.data);
        localStorage.setItem('crm_store_clean_v2', JSON.stringify(sanitized));
      } catch (retryErr) {
        console.warn('[API] Storage still exceeding quota, stripping cached photos from local backup...', retryErr);
        try {
          const minimal: DataStore = {
            ...this.data,
            vehicles: (this.data.vehicles || []).map((v) => ({
              ...v,
              imageUrl: v.imageUrl?.startsWith('data:') ? '' : v.imageUrl,
              images: (v.images || []).filter((u) => !u.startsWith('data:')),
              photos: (v.photos || []).filter((p) => !p.url?.startsWith('data:')),
            })),
          };
          localStorage.setItem('crm_store_clean_v2', JSON.stringify(minimal));
        } catch (finalErr) {
          console.error('[API] Unable to persist to localStorage, keeping in-memory state active:', finalErr);
        }
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('crm-data-changed'));
    } catch {
      // ignore
    }
  }

  // ==========================================
  // Full Supabase Sync
  // ==========================================
  async syncAllFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured() || this.isSyncing) return;
    this.isSyncing = true;
    try {
      await Promise.allSettled([
        this.fetchBranches(),
        this.fetchCustomers(),
        this.fetchLeads(),
        this.fetchVehicles(),
        this.fetchDeals(),
      ]);
    } finally {
      this.isSyncing = false;
    }
  }

  // ==========================================
  // Auth & Context
  // ==========================================
  getUserContext() {
    return this.data.userContext;
  }

  getBranches(): Branch[] {
    return this.data.branches || [];
  }

  async fetchBranches(): Promise<Branch[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('[API] Supabase fetchBranches error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteBranches: Branch[] = data.map((r: any) => ({
            id: r.id,
            tenantId: r.tenant_id || 't-apex-001',
            code: r.code || '',
            name: r.name || '',
            address: r.address || { line1: '', city: '', state: '', pincode: '' },
            phone: r.phone || '',
            email: r.email || '',
            timezone: r.timezone || 'Asia/Kolkata',
            isActive: r.is_active !== false,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString(),
          }));

          const remoteIds = new Set(remoteBranches.map((b) => b.id));
          const localOnly = (this.data.branches || []).filter(
            (b) => !remoteIds.has(b.id) && !['b-dt-001', 'b-wb-002', 'b-001', 'b-002'].includes(b.id)
          );
          this.data.branches = [...remoteBranches, ...localOnly];
          this.persist();
          return this.data.branches;
        }
      } catch (err) {
        console.warn('[API] fetchBranches unexpected error:', err);
      }
    }
    return this.data.branches || [];
  }

  async saveBranch(branch: Branch): Promise<Branch> {
    if (!this.data.branches) this.data.branches = [];
    const existingIndex = this.data.branches.findIndex((b) => b.id === branch.id);
    if (existingIndex >= 0) {
      this.data.branches[existingIndex] = { ...branch, updatedAt: new Date().toISOString() };
    } else {
      this.data.branches.push(branch);
    }
    this.persist();

    if (isSupabaseConfigured()) {
      try {
        const payload = {
          id: branch.id,
          tenant_id: branch.tenantId || 't-apex-001',
          code: branch.code,
          name: branch.name,
          address: branch.address || {},
          phone: branch.phone || null,
          email: branch.email || null,
          timezone: branch.timezone || 'Asia/Kolkata',
          is_active: branch.isActive !== false,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('branches').upsert(payload);
        if (error) {
          console.warn('[API] Supabase saveBranch upsert error:', error.message);
        }
      } catch (err) {
        console.warn('[API] saveBranch unexpected error:', err);
      }
    }
    return branch;
  }

  async deleteBranch(id: string): Promise<boolean> {
    this.data.branches = (this.data.branches || []).filter((b) => b.id !== id);
    this.persist();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('branches').delete().eq('id', id);
        if (error) {
          console.warn('[API] Supabase deleteBranch error:', error.message);
        }
      } catch (err) {
        console.warn('[API] deleteBranch unexpected error:', err);
      }
    }
    return true;
  }

  // ==========================================
  // Customers
  // ==========================================
  getCustomers(): Customer[] {
    return this.data.customers;
  }

  async fetchCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchCustomers error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteCustomers: Customer[] = data.map((r: any) => ({
            id: r.id,
            tenantId: r.tenant_id || 't-apex-001',
            branchId: r.branch_id || 'b-dt-001',
            type: r.type || 'individual',
            firstName: r.first_name || '',
            lastName: r.last_name || '',
            email: r.email || undefined,
            phone: r.phone || '',
            panNumber: r.pan_number || undefined,
            aadhaarNumber: r.aadhaar_number || undefined,
            companyName: r.company_name || undefined,
            gstin: r.gstin || undefined,
            address: r.address && Object.keys(r.address).length > 0
              ? r.address
              : { city: r.city || '', state: r.state || '', pincode: r.pincode || '' },
            consent: r.consent || { whatsapp: true, sms: true, email: true },
            version: r.version || 1,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString(),
          }));

          // Preserve any local customers not yet in remote
          const remoteIds = new Set(remoteCustomers.map((c) => c.id));
          const unsyncedLocal = this.data.customers.filter((c) => !remoteIds.has(c.id));
          this.data.customers = [...unsyncedLocal, ...remoteCustomers];
          this.persist();
          return this.data.customers;
        }
      } catch (err) {
        console.error('[API] Failed to fetch customers from Supabase:', err);
      }
    }
    return this.data.customers;
  }

  addCustomer(customerData: Partial<Customer>): Customer {
    const newCust: Customer = {
      id: customerData.id || 'cust-' + Date.now(),
      tenantId: customerData.tenantId || 't-apex-001',
      branchId: customerData.branchId || 'b-dt-001',
      type: customerData.type || 'individual',
      firstName: customerData.firstName || 'New',
      lastName: customerData.lastName || 'Customer',
      email: customerData.email,
      phone: customerData.phone || '+91 99000 00000',
      panNumber: customerData.panNumber,
      companyName: customerData.companyName,
      address: customerData.address || { city: 'Mumbai' },
      consent: { whatsapp: true, sms: true, email: true },
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Keep any custom UI fields (preferredVehicle, budget, etc.)
    if ((customerData as any).preferredVehicle) {
      (newCust as any).preferredVehicle = (customerData as any).preferredVehicle;
    }
    if ((customerData as any).budget) {
      (newCust as any).budget = (customerData as any).budget;
    }

    this.data.customers.unshift(newCust);
    this.persist();

    // Persist to Supabase backend
    if (isSupabaseConfigured()) {
      supabase
        .from('customers')
        .insert({
          id: newCust.id,
          tenant_id: newCust.tenantId,
          branch_id: newCust.branchId,
          type: newCust.type,
          first_name: newCust.firstName,
          last_name: newCust.lastName,
          email: newCust.email || null,
          phone: newCust.phone,
          pan_number: newCust.panNumber || null,
          company_name: newCust.companyName || null,
          city: newCust.address?.city || '',
          state: newCust.address?.state || '',
          pincode: newCust.address?.pincode || '',
          address: newCust.address || {},
          consent: newCust.consent || { whatsapp: true, sms: true, email: true },
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('[API] Supabase addCustomer error:', error.message);
          } else {
            console.log('[API] Successfully saved customer to Supabase database:', newCust.firstName, newCust.lastName);
          }
        });
    }

    return newCust;
  }

  updateCustomer(id: string, customerData: Partial<Customer>): Customer | null {
    const index = this.data.customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.data.customers[index] = {
      ...this.data.customers[index],
      ...customerData,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (isSupabaseConfigured()) {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (customerData.firstName !== undefined) payload.first_name = customerData.firstName;
      if (customerData.lastName !== undefined) payload.last_name = customerData.lastName;
      if (customerData.email !== undefined) payload.email = customerData.email;
      if (customerData.phone !== undefined) payload.phone = customerData.phone;
      if (customerData.panNumber !== undefined) payload.pan_number = customerData.panNumber;
      if (customerData.companyName !== undefined) payload.company_name = customerData.companyName;
      if (customerData.type !== undefined) payload.type = customerData.type;
      if (customerData.address !== undefined) {
        payload.address = customerData.address;
        if (customerData.address.city) payload.city = customerData.address.city;
        if (customerData.address.state) payload.state = customerData.address.state;
        if (customerData.address.pincode) payload.pincode = customerData.address.pincode;
      }

      supabase
        .from('customers')
        .update(payload)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[API] Supabase updateCustomer error:', error.message);
          else console.log('[API] Successfully updated customer in Supabase:', id);
        });
    }

    return this.data.customers[index];
  }

  deleteCustomer(id: string): Customer[] {
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    this.persist();

    if (isSupabaseConfigured()) {
      supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[API] Supabase deleteCustomer error:', error.message);
          else console.log('[API] Deleted customer from Supabase:', id);
        });
    }

    return this.data.customers;
  }

  // ==========================================
  // Leads
  // ==========================================
  getLeads(): Lead[] {
    return this.data.leads;
  }

  async fetchLeads(): Promise<Lead[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchLeads error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteLeads: Lead[] = data.map((r: any) => {
            const cust = this.data.customers.find((c) => c.id === r.customer_id);
            const mappedLead: Lead = {
              id: r.id,
              tenantId: r.tenant_id || 't-apex-001',
              branchId: r.branch_id || 'b-dt-001',
              customerId: r.customer_id,
              source: r.source || 'Showroom Walk-in',
              status: r.status || 'new',
              assignedTo: r.assigned_to || 'u-sales-003',
              budgetMin: Number(r.budget_min) || 1500000,
              budgetMax: Number(r.budget_max) || 2000000,
              preferredMake: r.preferred_make || '',
              preferredModel: r.preferred_model || '',
              preferredFuelType: r.preferred_fuel_type || 'Petrol',
              timeline: r.timeline || 'Within 7 days',
              score: Number(r.score) || 75,
              notes: r.notes || '',
              nextActionAt: r.next_action_at || new Date(Date.now() + 86400000 * 2).toISOString(),
              version: r.version || 1,
              createdAt: r.created_at || new Date().toISOString(),
              updatedAt: r.updated_at || new Date().toISOString(),
              customerName: cust
                ? `${cust.firstName} ${cust.lastName}`
                : r.preferred_model
                ? `Buyer for ${r.preferred_model}`
                : 'Walk-in Client',
              customer: cust,
              assigneeName: '',
              branchName: 'Main Showroom',
            };
            if (cust?.phone) (mappedLead as any).customerPhone = cust.phone;
            if (cust?.email) (mappedLead as any).customerEmail = cust.email;
            return mappedLead;
          });

          const remoteIds = new Set(remoteLeads.map((l) => l.id));
          const unsyncedLocal = this.data.leads.filter((l) => !remoteIds.has(l.id));
          this.data.leads = [...unsyncedLocal, ...remoteLeads];
          this.persist();
          return this.data.leads;
        }
      } catch (err) {
        console.error('[API] Failed to fetch leads from Supabase:', err);
      }
    }
    return this.data.leads;
  }

  addLead(leadData: any): Lead {
    const cust = this.data.customers.find((c) => c.id === leadData.customerId);
    const branch = this.data.branches.find((b) => b.id === leadData.branchId);

    const newLead: Lead = {
      id: leadData.id || 'lead-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: leadData.branchId || 'b-dt-001',
      customerId: leadData.customerId || (this.data.customers[0]?.id || 'cust-101'),
      source: leadData.source || 'Website',
      status: leadData.status || 'new',
      assignedTo: leadData.assignedTo || 'u-sales-003',
      budgetMin: Number(leadData.budgetMin) || 1500000,
      budgetMax: Number(leadData.budgetMax) || 2000000,
      preferredMake: leadData.preferredMake || '',
      preferredModel: leadData.preferredModel || '',
      preferredFuelType: leadData.preferredFuelType || 'Petrol',
      score: Number(leadData.score) || 75,
      notes: leadData.notes || '',
      nextActionAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: leadData.customerName || (cust ? `${cust.firstName} ${cust.lastName}` : 'Walk-in Customer'),
      customer: cust,
      assigneeName: leadData.assignedToName || '',
      branchName: branch ? branch.name : 'Main Showroom',
    };
    if (leadData.customerPhone || cust?.phone) {
      (newLead as any).customerPhone = leadData.customerPhone || cust?.phone;
    }
    if (leadData.customerEmail || cust?.email) {
      (newLead as any).customerEmail = leadData.customerEmail || cust?.email;
    }

    this.data.leads.unshift(newLead);
    this.persist();

    // Persist to Supabase backend
    if (isSupabaseConfigured()) {
      supabase
        .from('leads')
        .insert({
          id: newLead.id,
          tenant_id: newLead.tenantId,
          branch_id: newLead.branchId,
          customer_id: newLead.customerId,
          source: newLead.source,
          status: newLead.status,
          budget_min: newLead.budgetMin,
          budget_max: newLead.budgetMax,
          preferred_make: newLead.preferredMake,
          preferred_model: newLead.preferredModel,
          preferred_fuel_type: newLead.preferredFuelType,
          score: newLead.score,
          notes: newLead.notes,
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('[API] Supabase addLead error:', error.message);
          } else {
            console.log('[API] Successfully saved lead to Supabase database:', newLead.id);
          }
        });
    }

    return newLead;
  }

  updateLeadStatus(leadId: string, status: any): Lead | null {
    const lead = this.data.leads.find((l) => l.id === leadId);
    if (lead) {
      lead.status = status;
      lead.updatedAt = new Date().toISOString();
      this.persist();

      if (isSupabaseConfigured()) {
        supabase
          .from('leads')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', leadId)
          .then(({ error }) => {
            if (error) console.error('[API] Supabase updateLeadStatus error:', error.message);
            else console.log('[API] Updated lead status in Supabase:', leadId, status);
          });
      }

      return lead;
    }
    return null;
  }

  updateLead(leadId: string, leadData: Partial<Lead>): Lead | null {
    const lead = this.data.leads.find((l) => l.id === leadId);
    if (lead) {
      Object.assign(lead, leadData);
      lead.updatedAt = new Date().toISOString();
      this.persist();

      if (isSupabaseConfigured()) {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (leadData.status !== undefined) payload.status = leadData.status;
        if (leadData.source !== undefined) payload.source = leadData.source;
        if (leadData.budgetMin !== undefined) payload.budget_min = leadData.budgetMin;
        if (leadData.budgetMax !== undefined) payload.budget_max = leadData.budgetMax;
        if (leadData.preferredMake !== undefined) payload.preferred_make = leadData.preferredMake;
        if (leadData.preferredModel !== undefined) payload.preferred_model = leadData.preferredModel;
        if (leadData.preferredFuelType !== undefined) payload.preferred_fuel_type = leadData.preferredFuelType;
        if (leadData.score !== undefined) payload.score = leadData.score;
        if (leadData.notes !== undefined) payload.notes = leadData.notes;

        supabase
          .from('leads')
          .update(payload)
          .eq('id', leadId)
          .then(({ error }) => {
            if (error) console.error('[API] Supabase updateLead error:', error.message);
          });
      }

      return lead;
    }
    return null;
  }

  deleteLead(id: string): Lead[] {
    this.data.leads = this.data.leads.filter((l) => l.id !== id);
    this.persist();

    if (isSupabaseConfigured()) {
      supabase.from('leads').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('[API] Supabase deleteLead error:', error.message);
      });
    }

    return this.data.leads;
  }

  // ==========================================
  // Vehicles (Inventory)
  // ==========================================
  getVehicles(): Vehicle[] {
    return this.data.vehicles;
  }

  async fetchVehicles(): Promise<Vehicle[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchVehicles error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteVehicles: Vehicle[] = data.map((r: any) => ({
            id: r.id,
            tenantId: r.tenant_id || 't-apex-001',
            branchId: r.branch_id || 'b-dt-001',
            stockNumber: r.stock_number || 'STK-' + r.id.slice(-4),
            vin: r.vin || 'VIN-' + r.id.slice(-8),
            registrationNumber: r.registration_number || 'DL-01-AB-0000',
            make: r.make || 'Toyota',
            model: r.model || 'Fortuner',
            variant: r.variant || 'Base',
            year: Number(r.year) || 2024,
            color: r.color || 'White',
            mileageKm: Number(r.mileage_km) || 0,
            fuelType: r.fuel_type || 'Petrol',
            transmission: r.transmission || 'Automatic',
            ownershipMode: r.ownership_mode || 'owned',
            acquisitionCost: Number(r.acquisition_cost) || 0,
            totalCost: Number(r.total_cost) || 0,
            askingPrice: Number(r.asking_price) || 1000000,
            minimumPrice: Number(r.minimum_price) || 950000,
            status: r.status || 'available',
            imageUrl: '',
            images: [],
            photos: [],
            version: r.version || 1,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || new Date().toISOString(),
            branchName: 'Main Showroom',
          }));

          const remoteIds = new Set(remoteVehicles.map((v) => v.id));
          const unsyncedLocal = this.data.vehicles.filter((v) => !remoteIds.has(v.id));
          this.data.vehicles = [...unsyncedLocal, ...remoteVehicles];
          this.persist();
          return this.data.vehicles;
        }
      } catch (err) {
        console.error('[API] Failed to fetch vehicles from Supabase:', err);
      }
    }
    return this.data.vehicles;
  }

  addVehicle(vData: any): Vehicle {
    const imagesList: string[] = Array.isArray(vData.images) && vData.images.length > 0
      ? vData.images
      : vData.imageUrl
      ? [vData.imageUrl]
      : [];
    const primaryImg = imagesList[0] || vData.imageUrl || '';

    const newVeh: Vehicle = {
      id: vData.id || 'veh-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: vData.branchId || 'b-dt-001',
      stockNumber: vData.stockNumber || 'STK-2024-' + Math.floor(100 + Math.random() * 900),
      vin: vData.vin || 'MALC' + Math.floor(100000000 + Math.random() * 900000000),
      registrationNumber: vData.registrationNumber || 'MH01XX0000',
      make: vData.make,
      model: vData.model,
      variant: vData.variant || 'Base',
      year: Number(vData.year) || 2024,
      color: vData.color || 'White',
      mileageKm: Number(vData.mileageKm) || 0,
      fuelType: vData.fuelType || 'Petrol',
      transmission: vData.transmission || 'Automatic',
      ownershipMode: vData.ownershipMode || 'owned',
      acquisitionCost: Number(vData.acquisitionCost) || 0,
      totalCost: Number(vData.totalCost || vData.acquisitionCost) || 0,
      askingPrice: Number(vData.askingPrice) || 1000000,
      minimumPrice: Number(vData.minimumPrice) || 950000,
      status: vData.status || 'available',
      imageUrl: primaryImg,
      images: imagesList,
      photos: imagesList.map((url, idx) => ({
        id: `p-${Date.now()}-${idx}`,
        tenantId: 't-apex-001',
        vehicleId: vData.id || 'veh-' + Date.now(),
        storageKey: `photo-0${idx + 1}`,
        url,
        displayOrder: idx + 1,
        isPrimary: idx === 0,
        createdAt: new Date().toISOString(),
      })),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      branchName: 'Main Showroom',
    };

    this.data.vehicles.unshift(newVeh);
    this.persist();

    // Persist to Supabase backend
    if (isSupabaseConfigured()) {
      supabase
        .from('vehicles')
        .insert({
          id: newVeh.id,
          tenant_id: newVeh.tenantId,
          branch_id: newVeh.branchId,
          stock_number: newVeh.stockNumber,
          vin: newVeh.vin,
          registration_number: newVeh.registrationNumber,
          make: newVeh.make,
          model: newVeh.model,
          variant: newVeh.variant,
          year: newVeh.year,
          color: newVeh.color,
          mileage_km: newVeh.mileageKm,
          fuel_type: newVeh.fuelType,
          transmission: newVeh.transmission,
          ownership_mode: newVeh.ownershipMode,
          acquisition_cost: newVeh.acquisitionCost,
          total_cost: newVeh.totalCost,
          asking_price: newVeh.askingPrice,
          minimum_price: newVeh.minimumPrice,
          status: newVeh.status,
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('[API] Supabase addVehicle error:', error.message);
          } else {
            console.log('[API] Successfully saved vehicle to Supabase database:', newVeh.make, newVeh.model);
          }
        });
    }

    return newVeh;
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return null;

    this.data.vehicles[idx] = {
      ...this.data.vehicles[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();

    if (isSupabaseConfigured()) {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.askingPrice !== undefined) payload.asking_price = updates.askingPrice;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.mileageKm !== undefined) payload.mileage_km = updates.mileageKm;
      if (updates.color !== undefined) payload.color = updates.color;

      supabase
        .from('vehicles')
        .update(payload)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[API] Supabase updateVehicle error:', error.message);
        });
    }

    return this.data.vehicles[idx];
  }

  deleteVehicle(id: string): Vehicle[] {
    this.data.vehicles = this.data.vehicles.filter((v) => v.id !== id);
    this.persist();

    if (isSupabaseConfigured()) {
      supabase.from('vehicles').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('[API] Supabase deleteVehicle error:', error.message);
      });
    }

    return this.data.vehicles;
  }

  // ==========================================
  // Appointments
  // ==========================================
  getAppointments(): Appointment[] {
    return this.data.appointments;
  }

  addAppointment(aptData: any): Appointment {
    const cust = this.data.customers.find((c) => c.id === aptData.customerId);
    const veh = this.data.vehicles.find((v) => v.id === aptData.vehicleId);

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: aptData.branchId || 'b-dt-001',
      customerId: aptData.customerId || (this.data.customers[0]?.id || 'cust-101'),
      leadId: aptData.leadId,
      vehicleId: aptData.vehicleId,
      appointmentType: aptData.appointmentType || 'test_drive',
      scheduledAt: aptData.scheduledAt || new Date().toISOString(),
      durationMinutes: Number(aptData.durationMinutes) || 45,
      status: 'confirmed',
      notes: aptData.notes,
      createdAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Customer',
      vehicleName: veh ? `${veh.make} ${veh.model}` : 'Vehicle',
      assignedToName: aptData.assignedToName || '',
    };
    this.data.appointments.unshift(newApt);
    this.persist();

    if (isSupabaseConfigured()) {
      supabase
        .from('appointments')
        .insert({
          id: newApt.id,
          tenant_id: newApt.tenantId,
          branch_id: newApt.branchId,
          customer_id: newApt.customerId,
          lead_id: newApt.leadId || null,
          vehicle_id: newApt.vehicleId || null,
          appointment_type: newApt.appointmentType,
          scheduled_at: newApt.scheduledAt,
          duration_minutes: newApt.durationMinutes,
          status: newApt.status,
          notes: newApt.notes,
        })
        .then(({ error }) => {
          if (error) console.warn('[API] Supabase appointment sync info:', error.message);
          else console.log('[API] Successfully saved appointment to Supabase database');
        });
    }

    return newApt;
  }

  // ==========================================
  // Deals & Quotations
  // ==========================================
  getDeals(): Deal[] {
    return this.data.deals;
  }

  async fetchDeals(): Promise<Deal[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchDeals error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteDeals: Deal[] = data.map((r: any) => {
            const cust = this.data.customers.find((c) => c.id === r.customer_id);
            const veh = this.data.vehicles.find((v) => v.id === r.vehicle_id);
            return {
              id: r.id,
              tenantId: r.tenant_id || 't-apex-001',
              branchId: r.branch_id || 'b-dt-001',
              customerId: r.customer_id,
              vehicleId: r.vehicle_id,
              dealNumber: r.deal_number || 'DEAL-' + r.id.slice(-4),
              stage: r.stage || 'initiated',
              vehiclePrice: Number(r.vehicle_price) || 0,
              accessoriesTotal: Number(r.accessories_total) || 0,
              discountTotal: Number(r.discount_total) || 0,
              taxTotal: Number(r.tax_total) || 0,
              feesTotal: Number(r.fees_total) || 0,
              tradeInCredit: Number(r.trade_in_credit) || 0,
              grandTotal: Number(r.grand_total) || 0,
              amountPaid: Number(r.amount_paid) || 0,
              balanceDue: Number(r.balance_due) || 0,
              currency: r.currency || 'INR',
              financeType: r.finance_type || 'cash',
              lenderName: r.lender_name,
              loanAmount: r.loan_amount ? Number(r.loan_amount) : undefined,
              loanStatus: r.loan_status,
              cancellationReason: r.cancellation_reason,
              version: r.version || 1,
              createdAt: r.created_at || new Date().toISOString(),
              updatedAt: r.updated_at || new Date().toISOString(),
              customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Valued Client',
              vehicleName: veh ? `${veh.make} ${veh.model}` : 'Selected Vehicle',
            };
          });

          const remoteIds = new Set(remoteDeals.map((d) => d.id));
          const unsyncedLocal = this.data.deals.filter((d) => !remoteIds.has(d.id));
          this.data.deals = [...unsyncedLocal, ...remoteDeals];
          this.persist();
          return this.data.deals;
        }
      } catch (err) {
        console.error('[API] Failed to fetch deals from Supabase:', err);
      }
    }
    return this.data.deals;
  }

  addDeal(dealData: any): Deal {
    const cust = this.data.customers.find((c) => c.id === dealData.customerId);
    const veh = this.data.vehicles.find((v) => v.id === dealData.vehicleId);

    const newDeal: Deal = {
      id: dealData.id || 'deal-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: dealData.branchId || 'b-dt-001',
      customerId: dealData.customerId || (this.data.customers[0]?.id || 'cust-101'),
      vehicleId: dealData.vehicleId || (this.data.vehicles[0]?.id || 'v-001'),
      dealNumber: dealData.dealNumber || 'DEAL-2024-' + Math.floor(100 + Math.random() * 900),
      stage: dealData.stage || 'initiated',
      vehiclePrice: Number(dealData.vehiclePrice) || 1500000,
      accessoriesTotal: Number(dealData.accessoriesTotal) || 0,
      discountTotal: Number(dealData.discountTotal) || 0,
      taxTotal: Number(dealData.taxTotal) || 0,
      feesTotal: Number(dealData.feesTotal) || 0,
      tradeInCredit: Number(dealData.tradeInCredit) || 0,
      grandTotal: Number(dealData.grandTotal) || 1500000,
      amountPaid: Number(dealData.amountPaid) || 0,
      balanceDue: Number(dealData.balanceDue) || 1500000,
      currency: 'INR',
      financeType: dealData.financeType || 'cash',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Client',
      vehicleName: veh ? `${veh.make} ${veh.model}` : 'Vehicle',
    };

    this.data.deals.unshift(newDeal);
    this.persist();

    if (isSupabaseConfigured()) {
      supabase
        .from('deals')
        .insert({
          id: newDeal.id,
          tenant_id: newDeal.tenantId,
          branch_id: newDeal.branchId,
          customer_id: newDeal.customerId,
          vehicle_id: newDeal.vehicleId,
          deal_number: newDeal.dealNumber,
          stage: newDeal.stage,
          vehicle_price: newDeal.vehiclePrice,
          accessories_total: newDeal.accessoriesTotal,
          discount_total: newDeal.discountTotal,
          tax_total: newDeal.taxTotal,
          fees_total: newDeal.feesTotal,
          trade_in_credit: newDeal.tradeInCredit,
          grand_total: newDeal.grandTotal,
          amount_paid: newDeal.amountPaid,
          balance_due: newDeal.balanceDue,
          currency: newDeal.currency,
          finance_type: newDeal.financeType,
        })
        .then(({ data, error }) => {
          if (error) console.error('[API] Supabase addDeal error:', error.message);
          else console.log('[API] Successfully saved deal to Supabase database:', newDeal.dealNumber);
        });
    }

    return newDeal;
  }

  getQuotations(): Quotation[] {
    return this.data.quotations;
  }

  createQuotation(qData: any): Quotation {
    const cust = this.data.customers.find((c) => c.id === qData.customerId);
    const totals = PricingEngine.calculateQuotationTotals(qData.items || []);

    const newQ: Quotation = {
      id: 'quo-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: qData.branchId || 'b-dt-001',
      customerId: qData.customerId,
      quoteNumber: 'Q-2024-' + Math.floor(100 + Math.random() * 900),
      revision: 1,
      status: 'issued',
      items: qData.items || [],
      totals,
      validUntil: qData.validUntil || new Date(Date.now() + 86400000 * 14).toISOString(),
      notes: qData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Valued Client',
      branchName: 'Main Showroom',
    };

    this.data.quotations.unshift(newQ);
    this.persist();
    return newQ;
  }

  // ==========================================
  // Finance & Payments
  // ==========================================
  getPayments(): Payment[] {
    return this.data.payments;
  }

  recordPayment(pData: any): Payment {
    const cust = this.data.customers.find((c) => c.id === pData.customerId);
    const newPayment: Payment = {
      id: 'pmt-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: pData.branchId || 'b-dt-001',
      customerId: pData.customerId,
      bookingId: pData.bookingId,
      dealId: pData.dealId,
      paymentNumber: 'PMT-2024-' + Math.floor(100 + Math.random() * 900),
      method: pData.method || 'upi',
      status: 'settled',
      amount: Number(pData.amount),
      currency: 'INR',
      referenceNumber: pData.referenceNumber || 'TXN/' + Date.now(),
      notes: pData.notes || 'Direct payment receipt',
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Customer',
    };
    this.data.payments.unshift(newPayment);
    this.persist();
    return newPayment;
  }

  // ==========================================
  // Service & Marketing
  // ==========================================
  getJobCards(): JobCard[] {
    return this.data.jobCards;
  }

  getCampaigns(): Campaign[] {
    return this.data.campaigns;
  }
}

export const api = new DataService();
