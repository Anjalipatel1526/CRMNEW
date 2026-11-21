import type {
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
} from '@crm/shared-types';
import { PricingEngine } from '@crm/business-rules';
import { supabase, isSupabaseConfigured } from './supabase.ts';
import { getActiveTenantId, getScopedKey } from './tenant-context.ts';

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
  invoices?: any[];
  jobCards: JobCard[];
  campaigns: Campaign[];
  employees?: any[];
}

export function isUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
  invoices: [],
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
    } catch {
      console.warn('[API] localStorage quota exceeded, stripping cached data-URL photos from local backup...');
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
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/crm');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.customers)) this.data.customers = json.customers;
          if (Array.isArray(json.vehicles)) this.data.vehicles = json.vehicles;
          if (Array.isArray(json.leads)) this.data.leads = json.leads;
          if (Array.isArray(json.deals)) this.data.deals = json.deals;
          if (Array.isArray(json.appointments)) this.data.appointments = json.appointments;
          if (Array.isArray(json.employees)) (this.data as any).employees = json.employees;
          if (Array.isArray(json.quotations)) this.data.quotations = json.quotations;
          if (Array.isArray(json.invoices)) (this.data as any).invoices = json.invoices;
          if (Array.isArray(json.payments)) this.data.payments = json.payments;
          this.ensureCustomerLeads();
          this.persist();
          return;
        }
      }

      await Promise.allSettled([
        this.fetchBranches(),
        this.fetchCustomers(),
        this.fetchLeads(),
        this.fetchVehicles(),
        this.fetchDeals(),
        this.fetchAppointments(),
        this.fetchQuotations(),
        this.fetchInvoices(),
        this.fetchPayments(),
      ]);
      this.ensureCustomerLeads();
      this.persist();
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
  // Customers & Employees
  // ==========================================
  getCustomers(): Customer[] {
    return this.data.customers;
  }

  getEmployees(): any[] {
    return (this.data as any).employees || [];
  }

  async fetchEmployees(): Promise<any[]> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/crm');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.employees)) {
            (this.data as any).employees = json.employees;
            return json.employees;
          }
        }
      } catch (err) {
        console.warn('[API] fetchEmployees note:', err);
      }
    }
    return (this.data as any).employees || [];
  }

  async fetchCustomers(): Promise<Customer[]> {
    const tenantId = getActiveTenantId();
    let remoteCustomers: any[] | null = null;

    // 1. Primary: fetch via authenticated server API route (/api/crm)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/crm');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.customers)) {
            remoteCustomers = json.customers;
          }
          if (Array.isArray(json.employees)) {
            (this.data as any).employees = json.employees;
          }
        }
      } catch (err) {
        console.warn('[API] /api/crm fetchCustomers note:', err);
      }
    }

    // 2. Fallback: direct Supabase client
    if (!remoteCustomers && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[API] Supabase fetchCustomers error:', error.message);
        } else if (data && Array.isArray(data)) {
          remoteCustomers = data;
        }
      } catch (err) {
        console.error('[API] Failed to fetch customers from Supabase:', err);
      }
    }

    if (remoteCustomers && Array.isArray(remoteCustomers)) {
      const mappedCustomers: Customer[] = remoteCustomers.map((r: any) => ({
        id: r.id,
        tenantId: r.tenant_id || tenantId,
        branchId: r.branch_id || `b_${tenantId}_main`,
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
      const remoteIds = new Set(mappedCustomers.map((c) => c.id));
      const unsyncedLocal = this.data.customers.filter((c) => !remoteIds.has(c.id));
      this.data.customers = [...unsyncedLocal, ...mappedCustomers];
      this.ensureCustomerLeads();
      this.persist();
      return this.data.customers;
    }
    return this.data.customers;
  }

  addCustomer(customerData: Partial<Customer>): Customer {
    const tenantId = getActiveTenantId();
    const customerId = (customerData.id && isUuid(customerData.id)) ? customerData.id : generateUuid();

    const newCust: Customer = {
      id: customerId,
      tenantId: customerData.tenantId || tenantId,
      branchId: customerData.branchId || `b_${tenantId}_main`,
      type: customerData.type || 'individual',
      firstName: customerData.firstName || 'New',
      lastName: customerData.lastName || 'Customer',
      email: customerData.email,
      phone: customerData.phone || '',
      panNumber: customerData.panNumber,
      companyName: customerData.companyName,
      address: customerData.address || { city: '' },
      consent: { whatsapp: true, sms: true, email: true },
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Keep any custom UI fields (preferredVehicle, budget, assignedTo, etc.)
    if ((customerData as any).preferredVehicle) {
      (newCust as any).preferredVehicle = (customerData as any).preferredVehicle;
    }
    if ((customerData as any).budget) {
      (newCust as any).budget = (customerData as any).budget;
    }
    if ((customerData as any).assignedTo) {
      (newCust as any).assignedTo = (customerData as any).assignedTo;
      (newCust as any).assignedToName = (customerData as any).assignedToName;
    }

    this.data.customers.unshift(newCust);

    const candidateAssignedTo = (customerData as any).assignedTo || null;
    const candidateAssignedToName = (customerData as any).assignedToName || '';

    const customerLead = this.buildLeadFromCustomer(newCust, {
      id: generateUuid(),
      source: 'Showroom Customer Registration',
      score: 85,
      preferredVehicle: (customerData as any).preferredVehicle,
      budget: (customerData as any).budget,
      fuelType: (customerData as any).fuelType,
      defaultNote: 'New customer registered in CRM.',
    });

    if (candidateAssignedTo) {
      customerLead.assignedTo = candidateAssignedTo;
      customerLead.assigneeName = candidateAssignedToName || 'Assigned Consultant';
    }

    if (!this.data.leads) this.data.leads = [];
    this.data.leads.unshift(customerLead);
    this.persist();

    // Persist Customer and auto-create enquiry Lead in Supabase backend API route
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'customer',
          data: {
            ...newCust,
            assigned_to: candidateAssignedTo,
            assignedTo: candidateAssignedTo,
            assignedToName: candidateAssignedToName,
            preferredVehicle: (customerData as any).preferredVehicle,
            preferredModel: (customerData as any).preferredVehicle,
            budget: (customerData as any).budget,
          },
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            // Re-fetch backend leads so the new enquiry appears immediately with authentic database IDs
            await this.fetchLeads();
            window.dispatchEvent(new Event('crm-data-changed'));
          }
        })
        .catch((e) => console.warn('[API] Customer backend sync info:', e?.message));
    }

    // Persist to Supabase backend directly if configured
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
        .then(({ error }) => {
          if (error) {
            console.error('[API] Supabase addCustomer error:', error.message);
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
  private buildLeadFromCustomer(
    customer: Customer,
    options: {
      id: string;
      source: string;
      score: number;
      preferredVehicle?: string;
      budget?: string;
      fuelType?: string;
      defaultNote: string;
    }
  ): Lead {
    const rawCar = (options.preferredVehicle || (customer as any).preferredVehicle || '').toString().trim();
    const rawBudget = (options.budget || (customer as any).budget || '').toString().trim();
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
    const prefModel = parts.slice(1).join(' ') || (rawCar || 'Vehicle Enquiry');
    const tenantId = getActiveTenantId();

    const lead: Lead = {
      id: options.id,
      tenantId: customer.tenantId || tenantId,
      branchId: customer.branchId || `b_${customer.tenantId || tenantId}_main`,
      customerId: customer.id,
      source: options.source,
      status: 'new',
      assignedTo: (customer as any).assignedTo || '',
      budgetMin: bMin,
      budgetMax: bMax,
      preferredMake: prefMake,
      preferredModel: prefModel,
      preferredFuelType: options.fuelType || (customer as any).fuelType || 'Petrol',
      score: options.score,
      notes: rawCar ? `Customer expressed preference for ${rawCar}.` : options.defaultNote,
      nextActionAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      version: 1,
      createdAt: customer.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customer,
      assigneeName: (customer as any).assignedToName || 'Unassigned Consultant',
      branchName: 'Main Showroom',
    };
    if (customer.phone) (lead as any).customerPhone = customer.phone;
    if (customer.email) (lead as any).customerEmail = customer.email;
    return lead;
  }

  ensureCustomerLeads(): Lead[] {
    if (!this.data.customers) return this.data.leads || [];
    if (!this.data.leads) this.data.leads = [];

    // 1. Identify which customers have already been contacted or advanced in the sales pipeline
    const contactedCustIds = new Set(
      this.data.leads
        .filter((l) => (l as any).isContacted || (l as any).contactedAt || ['contacted', 'qualified', 'negotiation', 'converted', 'lost'].includes(l.status) || l.notes?.includes('[Moved to'))
        .map((l) => l.customerId)
        .filter(Boolean)
    );
    const newLeadCustIds = new Set(
      this.data.leads
        .filter((l) => l.status === 'new')
        .map((l) => l.customerId)
        .filter(Boolean)
    );

    let changed = false;

    // 2. Ensure every customer appears in "New Enquiries" (status: 'new') until they are contacted
    for (const cust of this.data.customers) {
      const fullName = `${cust.firstName} ${cust.lastName}`.toLowerCase().trim();

      if (!contactedCustIds.has(cust.id) && !newLeadCustIds.has(cust.id)) {
        // Find if this customer has uncontacted leads that were auto-promoted to appointment_set or test_drive
        const uncontactedLeads = this.data.leads.filter(
          (l) => l.customerId === cust.id || (l.customerName || '').toLowerCase().trim() === fullName
        );

        if (uncontactedLeads.length > 0) {
          // Keep the primary uncontacted lead in "New Enquiries" (status: 'new') with appointment attached
          const primaryLead = uncontactedLeads[0];
          if (primaryLead.status !== 'new') {
            primaryLead.status = 'new';
            primaryLead.updatedAt = new Date().toISOString();
            changed = true;
          }
          newLeadCustIds.add(cust.id);

          // Deduplicate extra duplicate cards for this uncontacted customer
          if (uncontactedLeads.length > 1) {
            const duplicateIds = new Set(uncontactedLeads.slice(1).map((l) => l.id));
            this.data.leads = this.data.leads.filter((l) => !duplicateIds.has(l.id));
            changed = true;
          }
        } else {
          // No lead at all — create a new enquiry lead directly in "New Enquiries"
          const autoLead = this.buildLeadFromCustomer(cust, {
            id: generateUuid(),
            source: 'Customer Registration',
            score: 80,
            defaultNote: 'New customer enquiry in CRM pipeline.',
          });

          this.data.leads.unshift(autoLead);
          changed = true;
          newLeadCustIds.add(cust.id);

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
    }

    // 3. Prune/reset orphan leads that ended up in appointment_set or test_drive without any actual appointments or test drives
    for (const l of this.data.leads) {
      if ((l.status === 'appointment_set' || l.status === 'test_drive') && !l.notes?.includes('[Moved to')) {
        const isContacted = l.customerId && contactedCustIds.has(l.customerId);
        const hasAppointment = (l as any).appointment || (this.data.appointments || []).some((a) => a.leadId === l.id || (l.customerId && a.customerId === l.customerId && a.status !== 'cancelled'));
        if (!isContacted && !hasAppointment) {
          l.status = 'new';
          l.updatedAt = new Date().toISOString();
          changed = true;
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
          if (Array.isArray(json.customers) && json.customers.length > 0) {
            remoteCustomers = json.customers;
            const existingCustIds = new Set(this.data.customers.map((c) => c.id));
            for (const rc of json.customers) {
              if (!existingCustIds.has(rc.id)) {
                this.data.customers.push({
                  id: rc.id,
                  tenantId: rc.tenant_id || tenantId,
                  branchId: rc.branch_id || `b_${tenantId}_main`,
                  type: rc.type || 'individual',
                  firstName: rc.first_name || 'Customer',
                  lastName: rc.last_name || '',
                  email: rc.email || undefined,
                  phone: rc.phone || '',
                  address: rc.address || { city: rc.city || '' },
                  consent: rc.consent || { whatsapp: true, sms: true, email: true },
                  version: rc.version || 1,
                  createdAt: rc.created_at || new Date().toISOString(),
                  updatedAt: rc.updated_at || new Date().toISOString(),
                });
                existingCustIds.add(rc.id);
              }
            }
          }
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
          assignedTo: r.assigned_to || '',
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
          customerName: r.customer_name || custFullName || (r.preferred_model ? `Buyer for ${r.preferred_model}` : 'Walk-in Client'),
          customer: cust,
          assigneeName: r.assignee_name || r.assigneeName || (r.assigned_to ? 'Assigned Consultant' : 'Unassigned Consultant'),
          branchName: 'Main Showroom',
        };
        if (cust?.phone) (mappedLead as any).customerPhone = cust.phone;
        if (cust?.email) (mappedLead as any).customerEmail = cust.email;
        if (r.appointment || r.appointment_details) {
          (mappedLead as any).appointment = r.appointment || r.appointment_details;
        }
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
    const leadId = (leadData.id && isUuid(leadData.id)) ? leadData.id : generateUuid();

    const newLead: Lead = {
      id: leadId,
      tenantId: leadData.tenantId || tenantId,
      branchId: leadData.branchId || `b_${tenantId}_main`,
      customerId: leadData.customerId || (this.data.customers[0]?.id || generateUuid()),
      source: leadData.source || 'Website',
      status: leadData.status || 'new',
      assignedTo: leadData.assignedTo || leadData.assigned_to || '',
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
      assigneeName: leadData.assigneeName || leadData.assignedToName || (leadData.assignedTo ? 'Assigned Staff' : 'Unassigned Consultant'),
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
        body: JSON.stringify({
          entity: 'lead',
          data: {
            ...newLead,
            customer_name: newLead.customerName,
            customer_phone: (newLead as any).customerPhone,
            customer_email: (newLead as any).customerEmail,
            assigned_to: newLead.assignedTo || null,
          },
        }),
      })
        .then(() => {
          window.dispatchEvent(new Event('crm-data-changed'));
        })
        .catch((e) => console.warn('[API] Lead backend sync info:', e?.message));
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
      if (status === 'contacted' || ['qualified', 'appointment_set', 'test_drive', 'negotiation', 'converted'].includes(status)) {
        (lead as any).isContacted = true;
        if (!(lead as any).contactedAt && status === 'contacted') {
          (lead as any).contactedAt = new Date().toISOString();
        }
      }
      lead.updatedAt = new Date().toISOString();

      if (status === 'converted') {
        this.ensureDealForLead(lead);
      }

      this.persist();

      if (typeof window !== 'undefined') {
        fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: 'lead', data: lead }),
        })
          .then(() => {
            window.dispatchEvent(new Event('crm-data-changed'));
          })
          .catch((err) => console.warn('[API] updateLeadStatus sync note:', err));
      }

      return lead;
    }
    return null;
  }

  ensureDealForLead(lead: Lead): Deal | null {
    if (!lead || !lead.customerId) return null;
    const existing = (this.data.deals || []).find(
      (d) => d.customerId === lead.customerId || (d as any).opportunityId === lead.id
    );
    if (existing) return existing;

    const prefMake = (lead.preferredMake || '').toLowerCase().trim();
    const prefModel = (lead.preferredModel || '').toLowerCase().trim();
    const matchedVehicle = (this.data.vehicles || []).find(
      (v) =>
        v.status === 'available' &&
        ((prefMake && v.make.toLowerCase().includes(prefMake)) ||
         (prefModel && v.model.toLowerCase().includes(prefModel)))
    ) || (this.data.vehicles || []).find((v) => v.status === 'available');

    const price = matchedVehicle?.askingPrice || Number(lead.budgetMax) || 1850000;

    return this.addDeal({
      customerId: lead.customerId,
      vehicleId: matchedVehicle?.id,
      stage: 'ready',
      vehiclePrice: price,
      grandTotal: price,
      amountPaid: 50000,
      balanceDue: Math.max(0, price - 50000),
      currency: 'INR',
      financeType: 'cash',
      opportunityId: lead.id,
      notes: `Deal generated automatically upon converting lead for ${lead.customerName || 'customer'}.`,
    });
  }

  updateLead(leadId: string, leadData: Partial<Lead>): Lead | null {
    const lead = this.data.leads.find((l) => l.id === leadId);
    if (lead) {
      Object.assign(lead, leadData);
      lead.updatedAt = new Date().toISOString();

      if (leadData.status === 'converted' || lead.status === 'converted') {
        this.ensureDealForLead(lead);
      }

      this.persist();

      if (typeof window !== 'undefined') {
        fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: 'lead', data: lead }),
        })
          .then(() => {
            window.dispatchEvent(new Event('crm-data-changed'));
          })
          .catch((err) => console.warn('[API] updateLead sync note:', err));
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
            branchId: r.branch_id || `b_${tenantId}_main`,
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
      branchId: vData.branchId || `b_${tenantId}_main`,
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
            assignedToName: r.assignee_name || '',
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

    const appointmentId = (aptData.id && isUuid(aptData.id)) ? aptData.id : generateUuid();
    const aptEmployee = aptData.assignedTo
      ? this.data.employees?.find((e: any) => e.id === aptData.assignedTo)
      : undefined;
    const resolvedAssigneeName = aptData.assignedToName || (aptEmployee ? aptEmployee.full_name : '');

    const newApt: Appointment = {
      id: appointmentId,
      tenantId: aptData.tenantId || tenantId,
      branchId: aptData.branchId || `b_${tenantId}_main`,
      customerId: aptData.customerId || (this.data.customers[0]?.id || generateUuid()),
      leadId: aptData.leadId,
      vehicleId: veh ? veh.id : (aptData.vehicleId && isUuid(aptData.vehicleId) ? aptData.vehicleId : undefined),
      appointmentType: aptData.appointmentType || 'showroom_visit',
      scheduledAt: aptData.scheduledAt || new Date().toISOString(),
      durationMinutes: Number(aptData.durationMinutes) || 45,
      status: aptData.status || 'confirmed',
      notes: aptData.notes || '',
      createdAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}`.trim() : (aptData.customerName || 'Customer'),
      vehicleName: resolvedVehicleName,
      assignedToName: resolvedAssigneeName,
    };
    (newApt as any).assignedTo = aptData.assignedTo || aptData.assigned_to || undefined;
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
            assigned_to: (newApt as any).assignedTo,
            assignedTo: (newApt as any).assignedTo,
            assignedToName: resolvedAssigneeName,
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
            window.dispatchEvent(new Event('crm-data-changed'));
          }
        })
        .catch((err) => console.error('[API] Appointment save network error:', err));
    }

    // Automatically reflect scheduled appointment in Sales Pipeline
    // Per requirement: uncontacted leads MUST remain in 'new' (New Enquiries)
    const targetCustLead = this.data.leads.find((l) => (newApt.customerId && l.customerId === newApt.customerId) || (newApt.leadId && l.id === newApt.leadId));
    const isLeadContacted = targetCustLead && ['contacted', 'qualified', 'negotiation', 'converted'].includes(targetCustLead.status);

    this.syncLeadStageForActivity({
      leadId: newApt.leadId,
      customerId: newApt.customerId,
      customerName: newApt.customerName,
      customerPhone: cust?.phone,
      customerEmail: cust?.email,
      vehicleMake: veh?.make,
      vehicleModel: veh?.model,
      vehicleName: newApt.vehicleName,
      targetStage: isLeadContacted ? 'appointment_set' : 'new',
      forceStage: false,
      notes: `Appointment Set (${(newApt.appointmentType || 'visit').replace('_', ' ')}) for ${new Date(newApt.scheduledAt).toLocaleString('en-IN')}${newApt.notes ? ` — ${newApt.notes}` : ''}`,
      nextActionAt: newApt.scheduledAt,
      source: 'Appointment Desk',
      appointmentDetails: {
        id: newApt.id,
        appointment_type: newApt.appointmentType,
        scheduled_at: newApt.scheduledAt,
        duration_minutes: newApt.durationMinutes,
        status: newApt.status,
        vehicle_name: newApt.vehicleName,
        vehicle_id: newApt.vehicleId,
        notes: newApt.notes,
        assigned_to: (newApt as any).assignedTo,
        assignee_name: resolvedAssigneeName,
      },
    });

    return newApt;
  }

  updateAppointment(id: string, updates: Partial<Appointment> & { assignedTo?: string; assignedToName?: string }): Appointment | null {
    const apt = this.data.appointments.find((a) => a.id === id);
    if (!apt) return null;
    Object.assign(apt, updates);
    if (updates.assignedTo) (apt as any).assignedTo = updates.assignedTo;
    if (updates.assignedToName) apt.assignedToName = updates.assignedToName;
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
            assigned_to: (apt as any).assignedTo,
            assignedTo: (apt as any).assignedTo,
            assignedToName: apt.assignedToName,
            customerPhone: cust?.phone,
            customerEmail: cust?.email,
          },
        }),
      })
        .then(() => {
          window.dispatchEvent(new Event('crm-data-changed'));
        })
        .catch((err) => console.warn('[API] updateAppointment sync note:', err));
    }

    return apt;
  }

  /**
   * Synchronizes a scheduled Appointment or Test Drive into the Sales Pipeline Kanban.
   * Advances an existing customer lead to `targetStage` (or moves it explicitly when `forceStage` is true unless already converted),
   * or creates a new lead directly in `targetStage`.
   */
  syncLeadStageForActivity(opts: {
    leadId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleName?: string;
    targetStage: 'new' | 'appointment_set' | 'test_drive';
    forceStage?: boolean;
    notes?: string;
    nextActionAt?: string;
    source?: string;
    appointmentDetails?: any;
  }): Lead | null {
    const cleanPhone = (opts.customerPhone || '').replace(/[^0-9]/g, '');
    const cleanName = (opts.customerName || '').trim().toLowerCase();
    const cleanEmail = (opts.customerEmail || '').trim().toLowerCase();

    if (!opts.leadId && !opts.customerId && !cleanName && !cleanPhone) return null;

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

    // Match existing lead by leadId, customerId, linked customer phone/email, or customer name
    const existingLead = this.data.leads.find((l) => {
      if (opts.leadId && l.id === opts.leadId) return true;
      if (opts.customerId && l.customerId === opts.customerId) return true;
      const linkedCust = l.customerId
        ? this.data.customers.find((c) => c.id === l.customerId)
        : undefined;
      const lPhone = (linkedCust?.phone || (l as any).customerPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone && cleanPhone.length >= 7 && lPhone && lPhone.endsWith(cleanPhone.slice(-10))) return true;
      const lEmail = (linkedCust?.email || (l as any).customerEmail || '').toLowerCase().trim();
      if (cleanEmail && lEmail && lEmail === cleanEmail) return true;
      if (cleanName && cleanName !== 'customer' && cleanName !== 'walk-in client' && (l.customerName || '').trim().toLowerCase() === cleanName) return true;
      return false;
    });

    const targetRank = STAGE_RANK[opts.targetStage] ?? 4;

    if (existingLead) {
      // REQUIREMENT: As long as the lead is not contacted (status === 'new'),
      // it MUST remain in "New Enquiries" (status: 'new').
      // Background reconciliation (!opts.forceStage) must never auto-promote an uncontacted lead.
      if (existingLead.status === 'new' && !opts.forceStage) {
        if (opts.appointmentDetails) {
          (existingLead as any).appointment = opts.appointmentDetails;
        }
        return existingLead;
      }

      const currentRank = STAGE_RANK[existingLead.status] ?? 0;
      let changed = false;

      // Update stage: when forceStage is true (explicit booking), place directly in targetStage unless already converted;
      // otherwise (reconciliation) only advance forward if already past 'new'.
      if (
        (opts.forceStage && existingLead.status !== 'converted' && existingLead.status !== opts.targetStage) ||
        (!opts.forceStage && existingLead.status !== 'new' && currentRank < targetRank)
      ) {
        existingLead.status = opts.targetStage;
        changed = true;
      }

      if (opts.appointmentDetails) {
        (existingLead as any).appointment = opts.appointmentDetails;
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

    // No existing lead — create one in "New Enquiries" unless explicitly forced past initial stage
    const newLead = this.addLead({
      customerId: opts.customerId,
      customerName: opts.customerName || 'Walk-in Client',
      customerPhone: opts.customerPhone || '',
      customerEmail: opts.customerEmail || '',
      source: opts.source || (opts.targetStage === 'test_drive' ? 'Test Drive Desk' : 'Appointment Desk'),
      status: opts.forceStage ? opts.targetStage : 'new',
      preferredMake: prefMake || 'Showroom',
      preferredModel: prefModel || 'Enquiry',
      notes: opts.notes || '',
      nextActionAt: opts.nextActionAt,
    });
    if (opts.appointmentDetails) {
      (newLead as any).appointment = opts.appointmentDetails;
    }
    return newLead;
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
        leadId: apt.leadId,
        customerId: apt.customerId,
        customerName: apt.customerName || (cust ? `${cust.firstName} ${cust.lastName}`.trim() : undefined),
        customerPhone: cust?.phone,
        customerEmail: cust?.email,
        vehicleMake: veh?.make,
        vehicleModel: veh?.model,
        vehicleName: apt.vehicleName,
        targetStage: 'appointment_set',
        forceStage: false, // General background reconciliation must never auto-promote uncontacted 'new' leads!
        notes: apt.notes ? `Appointment: ${apt.notes}` : undefined,
        nextActionAt: apt.scheduledAt,
        source: 'Appointment Desk',
        appointmentDetails: {
          id: apt.id,
          appointment_type: apt.appointmentType,
          scheduled_at: apt.scheduledAt,
          duration_minutes: apt.durationMinutes,
          status: apt.status,
          vehicle_name: apt.vehicleName,
          vehicle_id: apt.vehicleId,
          notes: apt.notes,
          assigned_to: (apt as any).assignedTo,
          assignee_name: apt.assignedToName,
        },
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
        forceStage: false,
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
              branchId: r.branch_id || `b_${tenantId}_main`,
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
      branchId: dealData.branchId || `b_${tenantId}_main`,
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
      customerName: cust ? `${cust.firstName} ${cust.lastName}` : (dealData.customerName || 'Client'),
      vehicleName: veh ? `${veh.make} ${veh.model}` : (dealData.vehicleName || 'Vehicle'),
    };

    this.data.deals.unshift(newDeal);

    // Auto-reserve connected vehicle in inventory
    if (newDeal.vehicleId) {
      this.updateVehicle(newDeal.vehicleId, { status: 'reserved' });
    }

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

  updateDeal(id: string, updates: Partial<Deal>): Deal | null {
    const idx = this.data.deals.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    const oldDeal = this.data.deals[idx];
    const updatedDeal: Deal = {
      ...oldDeal,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.amountPaid !== undefined || updates.grandTotal !== undefined) {
      const gt = updatedDeal.grandTotal;
      const ap = updatedDeal.amountPaid;
      updatedDeal.balanceDue = Math.max(0, gt - ap);
    }

    this.data.deals[idx] = updatedDeal;

    // Synchronize vehicle status if stage changed
    if (updates.stage && updatedDeal.vehicleId) {
      if (updates.stage === 'delivered') {
        this.updateVehicle(updatedDeal.vehicleId, { status: 'delivered' });
      } else if (updates.stage === 'ready' || updates.stage === 'initiated') {
        this.updateVehicle(updatedDeal.vehicleId, { status: 'reserved' });
      } else if (updates.stage === 'cancelled') {
        this.updateVehicle(updatedDeal.vehicleId, { status: 'available' });
      }
    }

    this.persist();

    // Persist to backend /api/crm
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'deal', data: updatedDeal }),
      }).catch((e) => console.warn('[API] Deal update sync info:', e?.message));
    }

    if (isSupabaseConfigured()) {
      supabase
        .from('deals')
        .update({
          stage: updatedDeal.stage,
          amount_paid: updatedDeal.amountPaid,
          balance_due: updatedDeal.balanceDue,
          grand_total: updatedDeal.grandTotal,
          vehicle_price: updatedDeal.vehiclePrice,
          updated_at: updatedDeal.updatedAt,
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[API] Supabase updateDeal error:', error.message);
        });
    }

    return updatedDeal;
  }

  // ==========================================
  // Quotations
  // ==========================================
  getQuotations(): Quotation[] {
    return this.data.quotations || [];
  }

  async fetchQuotations(): Promise<Quotation[]> {
    if (typeof window === 'undefined') return this.data.quotations || [];
    try {
      const res = await fetch('/api/crm');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.quotations)) {
          const remoteQuotes = json.quotations.map((r: any) => {
            const cust = this.data.customers.find((c) => c.id === r.customer_id);
            return {
              id: r.id,
              tenantId: r.tenant_id,
              branchId: r.branch_id,
              customerId: r.customer_id,
              quoteNumber: r.quote_number,
              revision: r.revision || 1,
              status: r.status || 'issued',
              items: [],
              totals: {
                subtotal: Number(r.subtotal) || 0,
                discountTotal: Number(r.discount_total) || 0,
                taxTotal: Number(r.tax_total) || 0,
                feesTotal: Number(r.fees_total) || 0,
                grandTotal: Number(r.grand_total) || 0,
              },
              validUntil: r.valid_until,
              notes: r.notes || '',
              createdAt: r.created_at || new Date().toISOString(),
              updatedAt: r.updated_at || new Date().toISOString(),
              customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Valued Client',
              branchName: 'Main Showroom',
            };
          });

          const remoteIds = new Set(remoteQuotes.map((q: any) => q.id));
          const unsynced = (this.data.quotations || []).filter((q) => !remoteIds.has(q.id));
          this.data.quotations = [...unsynced, ...remoteQuotes];
          this.persist();
          return this.data.quotations;
        }
      }
    } catch (err) {
      console.warn('[API] Failed to fetch quotations:', err);
    }
    return this.data.quotations || [];
  }

  createQuotation(qData: any): Quotation {
    const cust = this.data.customers.find((c) => c.id === qData.customerId);
    const totals = PricingEngine.calculateQuotationTotals(qData.items || []);
    const tenantId = getActiveTenantId();

    const newQ: Quotation = {
      id: qData.id || 'quo-' + Date.now(),
      tenantId: qData.tenantId || tenantId,
      branchId: qData.branchId || `b_${tenantId}_main`,
      customerId: qData.customerId,
      quoteNumber: qData.quoteNumber || 'Q-2024-' + Math.floor(100 + Math.random() * 900),
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

    if (!this.data.quotations) this.data.quotations = [];
    this.data.quotations.unshift(newQ);
    this.persist();

    // Persist to backend /api/crm
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'quotation', data: newQ }),
      }).catch((e) => console.warn('[API] Quotation sync info:', e?.message));
    }

    return newQ;
  }

  convertQuotationToDeal(quotationId: string): Deal | null {
    const quote = (this.data.quotations || []).find((q) => q.id === quotationId);
    if (!quote) return null;

    const dealTotals = PricingEngine.convertQuotationToDealTotals(quote.totals);
    const vehicleItem = quote.items?.find((i) => i.itemType === 'vehicle');

    const createdDeal = this.addDeal({
      customerId: quote.customerId,
      vehicleId: (vehicleItem as any)?.vehicleId,
      stage: 'initiated',
      vehiclePrice: dealTotals.vehiclePrice,
      accessoriesTotal: dealTotals.accessoriesTotal,
      feesTotal: dealTotals.feesTotal,
      taxTotal: dealTotals.taxTotal,
      discountTotal: dealTotals.discountTotal,
      tradeInCredit: dealTotals.tradeInCredit,
      grandTotal: dealTotals.grandTotal,
      amountPaid: 0,
      balanceDue: dealTotals.grandTotal,
      notes: `Converted from Quotation #${quote.quoteNumber}`,
    });

    quote.status = 'accepted';
    quote.updatedAt = new Date().toISOString();
    this.persist();

    return createdDeal;
  }

  // ==========================================
  // Finance & Payments
  // ==========================================
  getInvoices(): any[] {
    return (this.data as any).invoices || [];
  }

  async fetchInvoices(): Promise<any[]> {
    if (typeof window === 'undefined') return this.getInvoices();
    try {
      const res = await fetch('/api/crm');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.invoices)) {
          const remoteInvoices = json.invoices.map((r: any) => {
            const cust = this.data.customers.find((c) => c.id === r.customer_id);
            return {
              id: r.id,
              invoiceNumber: r.invoice_number,
              customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Valued Customer',
              customerId: r.customer_id,
              vehicleDetails: 'Showroom Delivery & Services',
              amount: Number(r.grand_total) || 0,
              dueDate: r.due_date ? r.due_date.split('T')[0] : '',
              status: r.status || 'paid',
              date: r.issued_at ? r.issued_at.split('T')[0] : (r.created_at ? r.created_at.split('T')[0] : ''),
              dealId: r.deal_id,
              rawInvoice: r,
            };
          });

          const remoteIds = new Set(remoteInvoices.map((i: any) => i.id));
          const unsynced = this.getInvoices().filter((i) => !remoteIds.has(i.id));
          (this.data as any).invoices = [...unsynced, ...remoteInvoices];
          this.persist();
          return (this.data as any).invoices;
        }
      }
    } catch (err) {
      console.warn('[API] Failed to fetch invoices:', err);
    }
    return this.getInvoices();
  }

  addInvoice(inv: any): any {
    if (!(this.data as any).invoices) (this.data as any).invoices = [];
    (this.data as any).invoices.unshift(inv);
    this.persist();

    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'invoice', data: inv }),
      }).catch((e) => console.warn('[API] Invoice sync info:', e?.message));
    }
    return inv;
  }

  getPayments(): Payment[] {
    return this.data.payments || [];
  }

  async fetchPayments(): Promise<Payment[]> {
    if (typeof window === 'undefined') return this.data.payments || [];
    try {
      const res = await fetch('/api/crm');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.payments)) {
          const remotePayments: Payment[] = json.payments.map((r: any) => {
            const cust = this.data.customers.find((c) => c.id === r.customer_id);
            return {
              id: r.id,
              tenantId: r.tenant_id,
              branchId: r.branch_id,
              customerId: r.customer_id,
              bookingId: r.booking_id,
              dealId: r.deal_id,
              invoiceId: r.invoice_id,
              paymentNumber: r.payment_number,
              method: r.method || 'upi',
              status: r.status || 'settled',
              amount: Number(r.amount) || 0,
              currency: r.currency || 'INR',
              referenceNumber: r.reference_number || '',
              notes: r.notes || '',
              settledAt: r.settled_at || r.created_at,
              createdAt: r.created_at || new Date().toISOString(),
              customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Valued Customer',
            };
          });

          const remoteIds = new Set(remotePayments.map((p) => p.id));
          const unsynced = (this.data.payments || []).filter((p) => !remoteIds.has(p.id));
          this.data.payments = [...unsynced, ...remotePayments];
          this.persist();
          return this.data.payments;
        }
      }
    } catch (err) {
      console.warn('[API] Failed to fetch payments:', err);
    }
    return this.data.payments || [];
  }

  recordPayment(pData: any): Payment {
    const cust = this.data.customers.find((c) => c.id === pData.customerId);
    const tenantId = getActiveTenantId();
    const amount = Number(pData.amount) || 0;

    const newPayment: Payment = {
      id: pData.id || 'pmt-' + Date.now(),
      tenantId: pData.tenantId || tenantId,
      branchId: pData.branchId || `b_${tenantId}_main`,
      customerId: pData.customerId,
      bookingId: pData.bookingId,
      dealId: pData.dealId,
      paymentNumber: pData.paymentNumber || 'PMT-2024-' + Math.floor(100 + Math.random() * 900),
      method: pData.method || 'upi',
      status: 'settled',
      amount,
      currency: 'INR',
      referenceNumber: pData.referenceNumber || 'TXN/' + Date.now(),
      notes: pData.notes || 'Direct payment receipt',
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}` : (pData.customerName || 'Customer'),
    };

    if (!this.data.payments) this.data.payments = [];
    this.data.payments.unshift(newPayment);

    // If dealId is linked, update deal amountPaid and balanceDue in local data
    if (pData.dealId) {
      const dealIdx = this.data.deals.findIndex((d) => d.id === pData.dealId);
      if (dealIdx >= 0) {
        const d = this.data.deals[dealIdx];
        const newPaid = (d.amountPaid || 0) + amount;
        this.data.deals[dealIdx] = {
          ...d,
          amountPaid: newPaid,
          balanceDue: Math.max(0, d.grandTotal - newPaid),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    this.persist();

    // Persist to backend /api/crm
    if (typeof window !== 'undefined') {
      fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'payment', data: newPayment }),
      }).catch((e) => console.warn('[API] Payment sync info:', e?.message));
    }

    if (isSupabaseConfigured()) {
      supabase.from('payments').upsert({
        id: newPayment.id,
        tenant_id: newPayment.tenantId,
        branch_id: newPayment.branchId,
        customer_id: newPayment.customerId,
        deal_id: newPayment.dealId,
        payment_number: newPayment.paymentNumber,
        method: newPayment.method,
        status: newPayment.status,
        amount: newPayment.amount,
        currency: newPayment.currency,
        reference_number: newPayment.referenceNumber,
        notes: newPayment.notes,
        settled_at: newPayment.settledAt,
        created_at: newPayment.createdAt,
      }, { onConflict: 'id' }).then(() => {});
    }

    return newPayment;
  }

  // ==========================================
  // Service & Marketing
  // ==========================================
  getJobCards(): JobCard[] {
    return this.data.jobCards || [];
  }

  addJobCard(card: JobCard): JobCard {
    if (!this.data.jobCards) this.data.jobCards = [];
    this.data.jobCards.unshift(card);
    this.persist();
    return card;
  }

  getCampaigns(): Campaign[] {
    return this.data.campaigns || [];
  }

  addCampaign(camp: Campaign): Campaign {
    if (!this.data.campaigns) this.data.campaigns = [];
    this.data.campaigns.unshift(camp);
    this.persist();
    return camp;
  }
}

export const api = new DataService();
