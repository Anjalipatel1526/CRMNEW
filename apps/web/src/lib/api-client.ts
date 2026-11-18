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
import { getActiveTenantId, getScopedKey } from './tenant-context';

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
    id: 't_default',
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
      id: 't_default',
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
      tenantId: 't_default',
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
      this.loadFromStorage();
      // Listen for session switch or login/logout
      window.addEventListener('crm-session-changed', () => {
        this.loadFromStorage();
        this.syncAllFromSupabase().catch(() => {});
      });

      // Automatically trigger sync from Supabase database
      setTimeout(() => {
        this.syncAllFromSupabase().catch((err) =>
          console.warn('[API] Background Supabase sync note:', err)
        );
      }, 100);
    }
  }

  loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('crm_store');
      localStorage.removeItem('crm_store_clean_v1');
      const scopedKey = getScopedKey('crm_store_clean_v2');
      const saved = localStorage.getItem(scopedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
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
      } else {
        const tenantId = getActiveTenantId();
        this.data = {
          ...initialData,
          tenant: { ...initialData.tenant, id: tenantId },
          userContext: {
            ...initialData.userContext,
            tenant: { ...initialData.userContext.tenant, id: tenantId },
            membership: { ...initialData.userContext.membership, tenantId },
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
          branches: [],
        };
      }
    } catch (e) {
      console.error('Failed to parse local storage', e);
    }
  }

  resetData(): void {
    const tenantId = getActiveTenantId();
    this.data = {
      ...initialData,
      tenant: { ...initialData.tenant, id: tenantId },
      userContext: {
        ...initialData.userContext,
        tenant: { ...initialData.userContext.tenant, id: tenantId },
        membership: { ...initialData.userContext.membership, tenantId },
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
      branches: [],
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getScopedKey('crm_store_clean_v2'));
        window.dispatchEvent(new CustomEvent('crm-data-changed'));
      } catch {}
    }
  }

  private sanitizeForStorage(data: DataStore): DataStore {
    try {
      return {
        ...data,
        customers: (data.customers || []).map((c) => ({
          ...c,
          panNumber: c.panNumber ? '••••••••' + c.panNumber.slice(-4) : undefined,
          aadhaarNumber: c.aadhaarNumber ? '••••••••' + c.aadhaarNumber.slice(-4) : undefined,
        })),
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

    const scopedKey = getScopedKey('crm_store_clean_v2');
    try {
      const sanitized = this.sanitizeForStorage(this.data);
      localStorage.setItem(scopedKey, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('[API] localStorage quota exceeded, applying asset optimization...', err);
      try {
        const sanitized = this.sanitizeForStorage(this.data);
        localStorage.setItem(scopedKey, JSON.stringify(sanitized));
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
          localStorage.setItem(scopedKey, JSON.stringify(minimal));
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
      this.ensureCustomerLeads();
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
        const tenantId = getActiveTenantId();
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('[API] Supabase fetchBranches error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteBranches: Branch[] = data.map((r: any) => ({
            id: r.id,
            tenantId: r.tenant_id || tenantId,
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
        const tenantId = getActiveTenantId();
        const payload = {
          id: branch.id,
          tenant_id: branch.tenantId || tenantId,
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
        const tenantId = getActiveTenantId();
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchCustomers error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteCustomers: Customer[] = data.map((r: any) => ({
            id: r.id,
            tenantId: r.tenant_id || tenantId,
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
    const tenantId = getActiveTenantId();
    const newCust: Customer = {
      id: customerData.id || 'cust-' + Date.now(),
      tenantId: customerData.tenantId || tenantId,
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

    // Automatically create a corresponding lead in the pipeline under "new" (New Enquiries)
    const rawCar = (customerData as any).preferredVehicle ? String((customerData as any).preferredVehicle).trim() : '';
    const rawBudget = (customerData as any).budget ? String((customerData as any).budget).trim() : '';
    let bMin = 1500000;
    let bMax = 2500000;
    if (rawBudget) {
      const nums = rawBudget.match(/[\d.]+/g);
      if (nums && nums.length >= 2) {
        bMin = Math.round(parseFloat(nums[0]) * (parseFloat(nums[0]) < 100 ? 100000 : 1));
        bMax = Math.round(parseFloat(nums[1]) * (parseFloat(nums[1]) < 100 ? 100000 : 1));
      } else if (nums && nums.length === 1) {
        bMin = Math.round(parseFloat(nums[0]) * (parseFloat(nums[0]) < 100 ? 100000 : 1));
        bMax = Math.round(bMin * 1.25);
      }
    }
    const parts = rawCar ? rawCar.split(' ') : [];
    const prefMake = parts[0] || 'Enquiry';
    const prefModel = parts.slice(1).join(' ') || (rawCar ? rawCar : 'Vehicle Enquiry');

    const customerLead: Lead = {
      id: 'lead-' + Date.now(),
      tenantId: newCust.tenantId || tenantId,
      branchId: newCust.branchId || 'b-dt-001',
      customerId: newCust.id,
      source: 'Direct Registration',
      status: 'new', // Shows in New Enquiries
      assignedTo: 'u-sales-003',
      budgetMin: bMin,
      budgetMax: bMax,
      preferredMake: prefMake,
      preferredModel: prefModel,
      preferredFuelType: (customerData as any).fuelType || 'Petrol',
      score: 85,
      notes: rawCar ? `Customer expressed preference for ${rawCar}.` : 'New customer registered in CRM.',
      nextActionAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: `${newCust.firstName} ${newCust.lastName}`.trim(),
      customer: newCust,
      assigneeName: 'Rajesh Patil',
      branchName: 'Main Showroom',
    };
    if (newCust.phone) (customerLead as any).customerPhone = newCust.phone;
    if (newCust.email) (customerLead as any).customerEmail = newCust.email;

    if (!this.data.leads) this.data.leads = [];
    this.data.leads.unshift(customerLead);
    this.persist();

    // Persist Customer to Supabase backend API route
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'customer', data: newCust }),
      }).catch((e) => console.warn('[API] Customer backend sync info:', e?.message));
    }

    // Persist to Supabase backend directly
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

      supabase
        .from('leads')
        .insert({
          id: customerLead.id,
          tenant_id: customerLead.tenantId,
          branch_id: customerLead.branchId,
          customer_id: customerLead.customerId,
          source: customerLead.source,
          status: customerLead.status,
          budget_min: customerLead.budgetMin,
          budget_max: customerLead.budgetMax,
          preferred_make: customerLead.preferredMake,
          preferred_model: customerLead.preferredModel,
          preferred_fuel_type: customerLead.preferredFuelType,
          score: customerLead.score,
          notes: customerLead.notes,
        })
        .then(({ error }) => {
          if (error) console.error('[API] Auto lead insert error:', error.message);
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
    if (this.data.leads) {
      this.data.leads = this.data.leads.filter((l) => l.customerId !== id);
    }
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

      supabase
        .from('leads')
        .delete()
        .eq('customer_id', id)
        .then(() => {});
    }

    return this.data.customers;
  }

  // Auto-backfill & ensure every registered customer has an active enquiry lead in "new" (New Enquiries)
  ensureCustomerLeads(): Lead[] {
    if (!this.data.customers) return this.data.leads || [];
    if (!this.data.leads) this.data.leads = [];

    const existingCustLeadIds = new Set(this.data.leads.map((l) => l.customerId).filter(Boolean));
    const existingCustNames = new Set(this.data.leads.map((l) => (l.customerName || '').toLowerCase().trim()));

    let changed = false;
    for (const cust of this.data.customers) {
      const fullName = `${cust.firstName} ${cust.lastName}`.toLowerCase().trim();
      if (!existingCustLeadIds.has(cust.id) && !existingCustNames.has(fullName)) {
        const rawCar = (cust as any).preferredVehicle ? String((cust as any).preferredVehicle).trim() : '';
        const rawBudget = (cust as any).budget ? String((cust as any).budget).trim() : '';
        let bMin = 1500000;
        let bMax = 2500000;
        if (rawBudget) {
          const nums = rawBudget.match(/[\d.]+/g);
          if (nums && nums.length >= 2) {
            bMin = Math.round(parseFloat(nums[0]) * (parseFloat(nums[0]) < 100 ? 100000 : 1));
            bMax = Math.round(parseFloat(nums[1]) * (parseFloat(nums[1]) < 100 ? 100000 : 1));
          } else if (nums && nums.length === 1) {
            bMin = Math.round(parseFloat(nums[0]) * (parseFloat(nums[0]) < 100 ? 100000 : 1));
            bMax = Math.round(bMin * 1.25);
          }
        }
        const parts = rawCar ? rawCar.split(' ') : [];
        const prefMake = parts[0] || 'Enquiry';
        const prefModel = parts.slice(1).join(' ') || (rawCar ? rawCar : 'Vehicle Enquiry');

        const tenantId = getActiveTenantId();
        const autoLead: Lead = {
          id: 'lead-cust-' + cust.id,
          tenantId: cust.tenantId || tenantId,
          branchId: cust.branchId || 'b-dt-001',
          customerId: cust.id,
          source: 'Customer Registration',
          status: 'new', // Shows in New Enquiries
          assignedTo: 'u-sales-003',
          budgetMin: bMin,
          budgetMax: bMax,
          preferredMake: prefMake,
          preferredModel: prefModel,
          preferredFuelType: (cust as any).fuelType || 'Petrol',
          score: 80,
          notes: rawCar ? `Customer expressed preference for ${rawCar}.` : 'New customer enquiry in CRM pipeline.',
          nextActionAt: new Date(Date.now() + 86400000 * 2).toISOString(),
          version: 1,
          createdAt: cust.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerName: `${cust.firstName} ${cust.lastName}`.trim(),
          customer: cust,
          assigneeName: 'Rajesh Patil',
          branchName: 'Main Showroom',
        };
        if (cust.phone) (autoLead as any).customerPhone = cust.phone;
        if (cust.email) (autoLead as any).customerEmail = cust.email;

        this.data.leads.unshift(autoLead);
        changed = true;
        existingCustLeadIds.add(cust.id);
        existingCustNames.add(fullName);

        if (isSupabaseConfigured()) {
          supabase.from('leads').upsert({
            id: autoLead.id,
            tenant_id: autoLead.tenantId,
            branch_id: autoLead.branchId,
            customer_id: autoLead.customerId,
            source: autoLead.source,
            status: autoLead.status,
            budget_min: autoLead.budgetMin,
            budget_max: autoLead.budgetMax,
            preferred_make: autoLead.preferredMake,
            preferred_model: autoLead.preferredModel,
            preferred_fuel_type: autoLead.preferredFuelType,
            score: autoLead.score,
            notes: autoLead.notes,
          }).then(() => {});
        }
      }
    }
    if (changed) {
      this.persist();
    }
    return this.data.leads;
  }

  // ==========================================
  // Leads
  // ==========================================
  getLeads(): Lead[] {
    this.ensureCustomerLeads();
    return this.data.leads;
  }

  async fetchLeads(): Promise<Lead[]> {
    const tenantId = getActiveTenantId();
    let data: any[] | null = null;
    let remoteCustomers: any[] = [];

    // 1. Primary: fetch via authenticated server API (/api/crm) which enforces tenant scope via verified cookie
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/crm');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.leads)) data = json.leads;
          if (Array.isArray(json.customers)) remoteCustomers = json.customers;
        }
      } catch (err) {
        console.warn('[API] /api/crm fetchLeads note:', err);
      }
    }

    // 2. Fallback: direct Supabase client
    if (!data && isSupabaseConfigured()) {
      try {
        const res = await supabase
          .from('leads')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        if (!res.error && Array.isArray(res.data)) {
          data = res.data;
        }
      } catch (err) {
        console.error('[API] Failed to fetch leads from Supabase:', err);
      }
    }

    if (data && Array.isArray(data)) {
      const remoteLeads: Lead[] = data.map((r: any) => {
        const cust =
          this.data.customers.find((c) => c.id === r.customer_id) ||
          remoteCustomers.find((c) => c.id === r.customer_id);
        const custFirst = cust?.firstName || cust?.first_name || '';
        const custLast = cust?.lastName || cust?.last_name || '';
        const custFullName = `${custFirst} ${custLast}`.trim();

        const mappedLead: Lead = {
          id: r.id,
          tenantId: r.tenant_id || tenantId,
          branchId: r.branch_id || `b_${tenantId}_main`,
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
          customerName: custFullName || (r.preferred_model ? `Buyer for ${r.preferred_model}` : 'Walk-in Client'),
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
      this.ensureCustomerLeads();
      this.persist();
      return this.data.leads;
    }

    this.ensureCustomerLeads();
    return this.data.leads;
  }

  addLead(leadData: any): Lead {
    const cust = this.data.customers.find((c) => c.id === leadData.customerId);
    const branch = this.data.branches.find((b) => b.id === leadData.branchId);
    const tenantId = getActiveTenantId();

    const newLead: Lead = {
      id: leadData.id || 'lead-' + Date.now(),
      tenantId: leadData.tenantId || tenantId,
      branchId: leadData.branchId || 'b-dt-001',
      customerId: leadData.customerId || (this.data.customers[0]?.id || ''),
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

    // Persist Lead to Supabase backend API route
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'lead', data: newLead }),
      }).catch((e) => console.warn('[API] Lead backend sync info:', e?.message));
    }

    // Persist to Supabase backend directly
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

      if (typeof window !== 'undefined') {
        fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: 'lead', data: lead }),
        }).catch((err) => console.warn('[API] updateLeadStatus sync note:', err));
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

      if (typeof window !== 'undefined') {
        fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: 'lead', data: lead }),
        }).catch((err) => console.warn('[API] updateLead sync note:', err));
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
        const tenantId = getActiveTenantId();
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchVehicles error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteVehicles: Vehicle[] = data.map((r: any) => ({
            id: r.id,
            tenantId: r.tenant_id || tenantId,
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
    const tenantId = getActiveTenantId();

    const newVeh: Vehicle = {
      id: vData.id || 'veh-' + Date.now(),
      tenantId: vData.tenantId || tenantId,
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
        tenantId,
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

    // Persist Vehicle to Supabase backend API route
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'vehicle', data: newVeh }),
      }).catch((e) => console.warn('[API] Vehicle backend sync info:', e?.message));
    }

    // Persist to Supabase backend directly
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

  async fetchAppointments(): Promise<Appointment[]> {
    if (typeof window === 'undefined') return this.data.appointments;

    try {
      const res = await fetch('/api/crm');
      if (res.ok) {
        const json = await res.json();
        const remoteCustomers: any[] = Array.isArray(json.customers) ? json.customers : [];
        const remoteVehicles: any[] = Array.isArray(json.vehicles) ? json.vehicles : [];
        const remoteApts: any[] = Array.isArray(json.appointments) ? json.appointments : [];

        const tenantId = getActiveTenantId();
        const mapped: Appointment[] = remoteApts.map((r: any) => {
          const cust =
            this.data.customers.find((c) => c.id === r.customer_id) ||
            remoteCustomers.find((c) => c.id === r.customer_id);
          const veh =
            this.data.vehicles.find((v) => v.id === r.vehicle_id) ||
            remoteVehicles.find((v) => v.id === r.vehicle_id);

          const customerName = cust
            ? `${cust.firstName || cust.first_name || ''} ${cust.lastName || cust.last_name || ''}`.trim()
            : 'Customer';

          const vehicleName = veh
            ? `${veh.make || ''} ${veh.model || ''}`.trim()
            : (r.outcome || r.vehicle_id || 'Vehicle');

          return {
            id: r.id,
            tenantId: r.tenant_id || tenantId,
            branchId: r.branch_id || `b_${tenantId}_main`,
            customerId: r.customer_id,
            leadId: r.lead_id || undefined,
            vehicleId: r.vehicle_id || undefined,
            appointmentType: (r.appointment_type || 'showroom_visit') as any,
            scheduledAt: r.scheduled_at || r.created_at || new Date().toISOString(),
            durationMinutes: Number(r.duration_minutes) || 45,
            status: (r.status || 'confirmed') as any,
            notes: r.notes || '',
            createdAt: r.created_at || new Date().toISOString(),
            customerName,
            vehicleName,
            assignedToName: '',
          };
        });

        // Sort newest scheduled/created first
        mapped.sort(
          (a, b) =>
            new Date(b.createdAt || b.scheduledAt).getTime() -
            new Date(a.createdAt || a.scheduledAt).getTime()
        );

        this.data.appointments = mapped;
        this.persist();
        return this.data.appointments;
      }
    } catch (err) {
      console.warn('[API] /api/crm fetchAppointments note:', err);
    }

    return this.data.appointments;
  }

  addAppointment(aptData: any): Appointment {
    const cust = this.data.customers.find((c) => c.id === aptData.customerId);
    const veh = aptData.vehicleId
      ? this.data.vehicles.find((v) => v.id === aptData.vehicleId)
      : undefined;
    const tenantId = getActiveTenantId();
    const resolvedVehicleName = veh
      ? `${veh.make} ${veh.model}`.trim()
      : (aptData.vehicleName || 'Vehicle');

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      tenantId: aptData.tenantId || tenantId,
      branchId: aptData.branchId || `b_${tenantId}_main`,
      customerId: aptData.customerId || (this.data.customers[0]?.id || ''),
      leadId: aptData.leadId,
      vehicleId: veh ? veh.id : (aptData.vehicleName || undefined),
      appointmentType: aptData.appointmentType || 'showroom_visit',
      scheduledAt: aptData.scheduledAt || new Date().toISOString(),
      durationMinutes: Number(aptData.durationMinutes) || 45,
      status: 'confirmed',
      notes: aptData.notes || '',
      createdAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}`.trim() : 'Customer',
      vehicleName: resolvedVehicleName,
      assignedToName: aptData.assignedToName || '',
    };
    this.data.appointments.unshift(newApt);
    this.persist();

    // Persist Appointment to Supabase via authenticated server API route (/api/crm)
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'appointment',
          data: {
            ...newApt,
            customerPhone: cust?.phone,
            customerEmail: cust?.email,
          },
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.error('[API] Failed saving appointment to Supabase:', errBody);
          } else {
            console.log('[API] Successfully saved appointment to Supabase database');
          }
        })
        .catch((err) => console.error('[API] Appointment save network error:', err));
    }

    // Automatically reflect scheduled appointment in Sales Pipeline -> Appointment Set stage
    this.syncLeadStageForActivity({
      customerId: newApt.customerId,
      customerName: newApt.customerName,
      customerPhone: cust?.phone,
      customerEmail: cust?.email,
      vehicleMake: veh?.make,
      vehicleModel: veh?.model,
      vehicleName: newApt.vehicleName,
      targetStage: 'appointment_set',
      forceStage: true,
      notes: `Appointment Set (${(newApt.appointmentType || 'visit').replace('_', ' ')}) for ${new Date(newApt.scheduledAt).toLocaleString('en-IN')}${newApt.notes ? ` — ${newApt.notes}` : ''}`,
      nextActionAt: newApt.scheduledAt,
      source: 'Appointment Desk',
    });

    return newApt;
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const apt = this.data.appointments.find((a) => a.id === id);
    if (!apt) return null;
    Object.assign(apt, updates);
    this.persist();

    if (typeof window !== 'undefined') {
      const cust = this.data.customers.find((c) => c.id === apt.customerId);
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'appointment',
          data: {
            ...apt,
            customerPhone: cust?.phone,
            customerEmail: cust?.email,
          },
        }),
      }).catch((err) => console.warn('[API] updateAppointment sync note:', err));
    }

    return apt;
  }

  /**
   * Synchronizes a scheduled Appointment or Test Drive into the Sales Pipeline Kanban.
   * Advances an existing customer lead to `targetStage` (or moves it explicitly when `forceStage` is true unless already converted),
   * or creates a new lead directly in `targetStage`.
   */
  syncLeadStageForActivity(opts: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleName?: string;
    targetStage: 'appointment_set' | 'test_drive';
    forceStage?: boolean;
    notes?: string;
    nextActionAt?: string;
    source?: string;
  }): Lead | null {
    const cleanPhone = (opts.customerPhone || '').replace(/[^0-9]/g, '');
    const cleanName = (opts.customerName || '').trim().toLowerCase();
    const cleanEmail = (opts.customerEmail || '').trim().toLowerCase();

    if (!opts.customerId && !cleanName && !cleanPhone) return null;

    const STAGE_RANK: Record<string, number> = {
      new: 0,
      assigned: 1,
      nurture: 1,
      lost: 1,
      contacted: 2,
      qualified: 3,
      appointment_set: 4,
      test_drive: 5,
      negotiation: 6,
      converted: 7,
    };

    // Derive make / model if only combined vehicleName is supplied
    let prefMake = opts.vehicleMake || '';
    let prefModel = opts.vehicleModel || '';
    if (!prefMake && !prefModel && opts.vehicleName && opts.vehicleName !== 'Vehicle') {
      const parts = opts.vehicleName.trim().split(/\s+/);
      prefMake = parts[0] || '';
      prefModel = parts.slice(1).join(' ');
    }

    // Match existing lead by customerId, linked customer phone/email, or name
    const existingLead = this.data.leads.find((l) => {
      if (opts.customerId && l.customerId === opts.customerId) return true;
      const linkedCust = l.customerId
        ? this.data.customers.find((c) => c.id === l.customerId)
        : undefined;
      const lPhone = (linkedCust?.phone || (l as any).customerPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone && cleanPhone.length >= 7 && lPhone && lPhone.endsWith(cleanPhone.slice(-10))) return true;
      const lEmail = (linkedCust?.email || (l as any).customerEmail || '').toLowerCase().trim();
      if (cleanEmail && lEmail && lEmail === cleanEmail) return true;
      if (cleanName && cleanName !== 'customer' && (l.customerName || '').trim().toLowerCase() === cleanName) return true;
      return false;
    });

    const targetRank = STAGE_RANK[opts.targetStage] ?? 4;

    if (existingLead) {
      const currentRank = STAGE_RANK[existingLead.status] ?? 0;
      let changed = false;

      // Update stage: when forceStage is true (explicit booking), place directly in targetStage unless already converted;
      // otherwise (reconciliation) only advance forward.
      if (
        (opts.forceStage && existingLead.status !== 'converted' && existingLead.status !== opts.targetStage) ||
        (!opts.forceStage && currentRank < targetRank)
      ) {
        existingLead.status = opts.targetStage;
        changed = true;
      }

      if (prefMake && !existingLead.preferredMake) {
        existingLead.preferredMake = prefMake;
        changed = true;
      }
      if (prefModel && !existingLead.preferredModel) {
        existingLead.preferredModel = prefModel;
        changed = true;
      }
      if (opts.nextActionAt && existingLead.nextActionAt !== opts.nextActionAt) {
        existingLead.nextActionAt = opts.nextActionAt;
        changed = true;
      }
      if (opts.notes && !(existingLead.notes || '').includes(opts.notes)) {
        existingLead.notes = existingLead.notes ? `${existingLead.notes}\n${opts.notes}` : opts.notes;
        changed = true;
      }

      if (changed) {
        existingLead.updatedAt = new Date().toISOString();
        this.persist();
        if (typeof window !== 'undefined') {
          fetch('/api/crm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'lead', data: existingLead }),
          }).catch(() => {});
        }
      }
      return existingLead;
    }

    // No existing lead — create one directly in targetStage
    return this.addLead({
      customerId: opts.customerId,
      customerName: opts.customerName || 'Walk-in Client',
      customerPhone: opts.customerPhone || '',
      customerEmail: opts.customerEmail || '',
      source: opts.source || (opts.targetStage === 'test_drive' ? 'Test Drive Desk' : 'Appointment Desk'),
      status: opts.targetStage,
      preferredMake: prefMake || 'Showroom',
      preferredModel: prefModel || 'Enquiry',
      notes: opts.notes || '',
      nextActionAt: opts.nextActionAt,
    });
  }

  /**
   * Reconciles all active appointments and test drives into the Sales Pipeline
   * so records created from /crm/appointments or /test-drives always appear in
   * their corresponding Pipeline columns (`appointment_set` and `test_drive`).
   */
  reconcilePipelineFromActivities(testDrives: any[] = []): void {
    // 1. Reconcile active Appointments -> appointment_set
    for (const apt of this.data.appointments) {
      if (apt.status === 'cancelled') continue;
      const cust = this.data.customers.find((c) => c.id === apt.customerId);
      const veh = this.data.vehicles.find((v) => v.id === apt.vehicleId);
      this.syncLeadStageForActivity({
        customerId: apt.customerId,
        customerName: apt.customerName || (cust ? `${cust.firstName} ${cust.lastName}`.trim() : undefined),
        customerPhone: cust?.phone,
        customerEmail: cust?.email,
        vehicleMake: veh?.make,
        vehicleModel: veh?.model,
        vehicleName: apt.vehicleName,
        targetStage: 'appointment_set',
        notes: apt.notes ? `Appointment: ${apt.notes}` : undefined,
        nextActionAt: apt.scheduledAt,
        source: 'Appointment Desk',
      });
    }

    // 2. Reconcile active Test Drives -> test_drive
    for (const td of testDrives) {
      if (!td || td.status === 'cancelled') continue;
      this.syncLeadStageForActivity({
        customerName: td.customerName,
        customerPhone: td.customerPhone,
        customerEmail: td.customerEmail,
        vehicleName: td.vehicleName,
        targetStage: 'test_drive',
        notes: td.driveCode ? `Test Drive (${td.driveCode}) — ${td.vehicleName || 'Showroom Stock'}` : undefined,
        nextActionAt: td.date,
        source: 'Test Drive Desk',
      });
    }
  }

  updateAppointmentStatus(id: string, status: string): Appointment | null {
    return this.updateAppointment(id, { status: status as any });
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
        const tenantId = getActiveTenantId();
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchDeals error:', error.message);
        } else if (data && Array.isArray(data)) {
          const remoteDeals: Deal[] = data.map((r: any) => {
            const cust = this.data.customers.find((c) => c.id === r.customer_id);
            const veh = this.data.vehicles.find((v) => v.id === r.vehicle_id);
            return {
              id: r.id,
              tenantId: r.tenant_id || tenantId,
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
    const tenantId = getActiveTenantId();

    const newDeal: Deal = {
      id: dealData.id || 'deal-' + Date.now(),
      tenantId: dealData.tenantId || tenantId,
      branchId: dealData.branchId || 'b-dt-001',
      customerId: dealData.customerId || (this.data.customers[0]?.id || ''),
      vehicleId: dealData.vehicleId || (this.data.vehicles[0]?.id || ''),
      dealNumber: dealData.dealNumber || 'DEAL-2024-' + Math.floor(100 + Math.random() * 900),
      stage: dealData.stage || 'initiated',
      vehiclePrice: Number(dealData.vehiclePrice) || 1500000,
      accessoriesTotal: Number(dealData.accessoriesTotal) || 0,
      discountTotal: Number(dealData.discountTotal) || 0,
      taxTotal: Number(dealData.taxTotal) || 0,
      feesTotal: Number(dealData.feesTotal) || 0,
      tradeInCredit: Number(dealData.tradeInCredit) || 0,
      grandTotal: Math.max(
        0,
        Math.round(
          ((Number(dealData.vehiclePrice) || 1500000) +
            (Number(dealData.accessoriesTotal) || 0) +
            (Number(dealData.feesTotal) || 0) +
            (Number(dealData.taxTotal) || 0) -
            (Number(dealData.discountTotal) || 0) -
            (Number(dealData.tradeInCredit) || 0)) *
            100
        ) / 100
      ),
      amountPaid: Number(dealData.amountPaid) || 0,
      balanceDue: Math.max(
        0,
        Math.round(
          (((Number(dealData.vehiclePrice) || 1500000) +
            (Number(dealData.accessoriesTotal) || 0) +
            (Number(dealData.feesTotal) || 0) +
            (Number(dealData.taxTotal) || 0) -
            (Number(dealData.discountTotal) || 0) -
            (Number(dealData.tradeInCredit) || 0)) -
            (Number(dealData.amountPaid) || 0)) *
            100
        ) / 100
      ),
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

    // Persist Deal to Supabase backend API route
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'deal', data: newDeal }),
      }).catch((e) => console.warn('[API] Deal backend sync info:', e?.message));
    }

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
    const tenantId = getActiveTenantId();

    const newQ: Quotation = {
      id: 'quo-' + Date.now(),
      tenantId: qData.tenantId || tenantId,
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
    const tenantId = getActiveTenantId();
    const newPayment: Payment = {
      id: 'pmt-' + Date.now(),
      tenantId: pData.tenantId || tenantId,
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
