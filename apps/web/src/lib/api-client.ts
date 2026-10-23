import {
  Customer,
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

interface DataStore {
  tenant: any;
  branches: any[];
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

// Pre-seeded local store to ensure the entire application works seamlessly
// out of the box with realistic automotive dealership data
const initialData: DataStore = {
  tenant: {
    id: 't-apex-001',
    name: 'Apex Motors Group',
    slug: 'apex-motors',
    status: 'active' as const,
    dealerModel: 'mixed' as const,
    primaryContactName: 'Vikramaditya Singhania',
    primaryEmail: 'admin@apexmotors.com',
    primaryPhone: '+91 98200 11223',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  branches: [
    {
      id: 'b-dt-001',
      tenantId: 't-apex-001',
      code: 'DT-01',
      name: 'Apex Downtown Flagship',
      address: { line1: '42 MG Road, CBD', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      phone: '+91 22 2200 4400',
      email: 'downtown@apexmotors.com',
      timezone: 'Asia/Kolkata',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'b-ws-002',
      tenantId: 't-apex-001',
      code: 'WS-02',
      name: 'Apex Westside Automall',
      address: { line1: 'Link Road, Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
      phone: '+91 22 2600 8800',
      email: 'westside@apexmotors.com',
      timezone: 'Asia/Kolkata',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  userContext: {
    user: {
      id: 'u-admin-001',
      email: 'admin@apexmotors.com',
      fullName: 'Vikram Singhania',
      phone: '+91 98200 11223',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    tenant: {
      id: 't-apex-001',
      name: 'Apex Motors Group',
      slug: 'apex-motors',
      status: 'active' as const,
      dealerModel: 'mixed' as const,
      primaryContactName: 'Vikramaditya Singhania',
      primaryEmail: 'admin@apexmotors.com',
      primaryPhone: '+91 98200 11223',
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
      branchIds: ['b-dt-001', 'b-ws-002'],
      branchScope: 'all' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    permissions: ['all'],
    branches: [
      {
        id: 'b-dt-001',
        tenantId: 't-apex-001',
        code: 'DT-01',
        name: 'Apex Downtown Flagship',
        address: { city: 'Mumbai' },
        timezone: 'Asia/Kolkata',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'b-ws-002',
        tenantId: 't-apex-001',
        code: 'WS-02',
        name: 'Apex Westside Automall',
        address: { city: 'Mumbai' },
        timezone: 'Asia/Kolkata',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
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

// Unified Data Store (Memory + LocalStorage in browser)
class DataService {
  private data = initialData;

  constructor() {
    if (typeof window !== 'undefined') {
      // Clear legacy mock data cache from previous sessions
      localStorage.removeItem('crm_store');
      const saved = localStorage.getItem('crm_store_clean_v1');
      if (saved) {
        try {
          this.data = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse local storage', e);
        }
      }
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_store_clean_v1', JSON.stringify(this.data));
    }
  }

  // Auth / Context
  getUserContext() {
    return this.data.userContext;
  }

  getBranches() {
    return this.data.branches;
  }

  // CRM
  getCustomers() {
    return this.data.customers;
  }

  addCustomer(customerData: Partial<Customer>): Customer {
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      tenantId: 't-apex-001',
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
    this.data.customers.unshift(newCust);
    this.persist();
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
    return this.data.customers[index];
  }

  getLeads() {
    return this.data.leads;
  }

  addLead(leadData: any): Lead {
    const cust = this.data.customers.find((c) => c.id === leadData.customerId);
    const branch = this.data.branches.find((b) => b.id === leadData.branchId);

    const newLead: Lead = {
      id: 'lead-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: leadData.branchId || 'b-dt-001',
      customerId: leadData.customerId,
      source: leadData.source || 'Website',
      status: leadData.status || 'new',
      assignedTo: leadData.assignedTo || 'u-sales-003',
      budgetMin: Number(leadData.budgetMin) || 1500000,
      budgetMax: Number(leadData.budgetMax) || 2000000,
      preferredMake: leadData.preferredMake || 'Hyundai',
      preferredModel: leadData.preferredModel || 'Creta',
      preferredFuelType: leadData.preferredFuelType || 'Petrol',
      score: 75,
      notes: leadData.notes || '',
      nextActionAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'Walk-in Customer',
      assigneeName: 'John Fernandes',
      branchName: branch ? branch.name : 'Apex Downtown Flagship',
    };

    this.data.leads.unshift(newLead);
    this.persist();
    return newLead;
  }

  updateLeadStatus(leadId: string, status: any): Lead | null {
    const lead = this.data.leads.find((l) => l.id === leadId);
    if (lead) {
      lead.status = status;
      lead.updatedAt = new Date().toISOString();
      this.persist();
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
      return lead;
    }
    return null;
  }

  // Vehicles
  getVehicles() {
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
      id: 'veh-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: vData.branchId || 'b-dt-001',
      stockNumber: 'STK-2024-' + Math.floor(100 + Math.random() * 900),
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
      totalCost: Number(vData.acquisitionCost) || 0,
      askingPrice: Number(vData.askingPrice) || 1000000,
      minimumPrice: Number(vData.minimumPrice) || 950000,
      status: vData.status || 'available',
      imageUrl: primaryImg,
      images: imagesList,
      photos: imagesList.map((url, idx) => ({
        id: `p-${Date.now()}-${idx}`,
        tenantId: 't-apex-001',
        vehicleId: 'veh-' + Date.now(),
        storageKey: `photo-0${idx + 1}`,
        url,
        displayOrder: idx + 1,
        isPrimary: idx === 0,
        createdAt: new Date().toISOString(),
      })),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      branchName: 'Apex Downtown Flagship',
    };
    this.data.vehicles.unshift(newVeh);
    this.persist();
    return newVeh;
  }

  // Appointments
  getAppointments() {
    return this.data.appointments;
  }

  addAppointment(aptData: any): Appointment {
    const cust = this.data.customers.find((c) => c.id === aptData.customerId);
    const veh = this.data.vehicles.find((v) => v.id === aptData.vehicleId);

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: aptData.branchId || 'b-dt-001',
      customerId: aptData.customerId,
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
      assignedToName: 'John Fernandes',
    };
    this.data.appointments.unshift(newApt);
    this.persist();
    return newApt;
  }

  // Deals & Quotations
  getDeals() {
    return this.data.deals;
  }

  getQuotations() {
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
      branchName: 'Apex Downtown Flagship',
    };

    this.data.quotations.unshift(newQ);
    this.persist();
    return newQ;
  }

  // Finance
  getPayments() {
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

  // Service
  getJobCards() {
    return this.data.jobCards;
  }

  // Marketing
  getCampaigns() {
    return this.data.campaigns;
  }
}

export const api = new DataService();
