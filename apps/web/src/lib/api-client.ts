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
  customers: [
    {
      id: 'cust-001',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      type: 'individual' as const,
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'rajesh.sharma@example.com',
      phone: '+91 98201 12345',
      panNumber: 'ABCPS1234M',
      address: { city: 'Mumbai', pincode: '400050' },
      consent: { whatsapp: true, sms: true, email: true },
      version: 1,
      createdAt: '2026-10-15T10:00:00Z',
      updatedAt: '2026-10-15T10:00:00Z',
    },
    {
      id: 'cust-002',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      type: 'individual' as const,
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair@example.com',
      phone: '+91 98450 67890',
      panNumber: 'BHYPN5678K',
      address: { city: 'Mumbai', pincode: '400053' },
      consent: { whatsapp: true, sms: true, email: true },
      version: 1,
      createdAt: '2026-10-16T11:30:00Z',
      updatedAt: '2026-10-16T11:30:00Z',
    },
    {
      id: 'cust-003',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      type: 'business' as const,
      firstName: 'Vikram',
      lastName: 'Malhotra',
      companyName: 'Nexa Logistics Pvt Ltd',
      email: 'vikram@nexalogistics.in',
      phone: '+91 99100 54321',
      panNumber: 'AAACN9876Q',
      gstin: '27AAACN9876Q1Z9',
      address: { city: 'Mumbai', pincode: '400093' },
      consent: { whatsapp: true, sms: true, email: true },
      version: 1,
      createdAt: '2026-10-17T14:15:00Z',
      updatedAt: '2026-10-17T14:15:00Z',
    },
    {
      id: 'cust-004',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      type: 'individual' as const,
      firstName: 'Ananya',
      lastName: 'Sengupta',
      email: 'ananya.s@example.com',
      phone: '+91 97312 99887',
      address: { city: 'Mumbai', pincode: '400018' },
      consent: { whatsapp: true, sms: true, email: true },
      version: 1,
      createdAt: '2026-10-18T09:45:00Z',
      updatedAt: '2026-10-18T09:45:00Z',
    },
    {
      id: 'cust-005',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      type: 'individual' as const,
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'rohan.v@example.com',
      phone: '+91 98765 43210',
      address: { city: 'Mumbai', pincode: '400058' },
      consent: { whatsapp: true, sms: true, email: true },
      version: 1,
      createdAt: '2026-10-19T16:20:00Z',
      updatedAt: '2026-10-19T16:20:00Z',
    },
  ],
  leads: [
    {
      id: 'lead-001',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-001',
      source: 'Google Search Ads',
      status: 'negotiation' as const,
      assignedTo: 'u-sales-003',
      budgetMin: 2200000,
      budgetMax: 2600000,
      preferredMake: 'Mahindra',
      preferredModel: 'XUV700',
      preferredFuelType: 'Diesel',
      score: 88,
      notes: 'Interested in XUV700 AX7L Midnight Blue. Deal finalized pending loan sanction.',
      nextActionAt: '2026-10-22T14:00:00Z',
      version: 1,
      createdAt: '2026-10-15T10:15:00Z',
      updatedAt: '2026-10-20T12:00:00Z',
      customerName: 'Rajesh Sharma',
      assigneeName: 'John Fernandes',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'lead-002',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-002',
      source: 'Walk-in Showroom',
      status: 'test_drive' as const,
      assignedTo: 'u-sales-003',
      budgetMin: 1500000,
      budgetMax: 1800000,
      preferredMake: 'Tata',
      preferredModel: 'Nexon EV',
      preferredFuelType: 'Electric',
      score: 92,
      notes: 'Customer loved EV quietness and instant torque during test drive.',
      nextActionAt: '2026-10-22T17:00:00Z',
      version: 1,
      createdAt: '2026-10-16T11:45:00Z',
      updatedAt: '2026-10-20T15:00:00Z',
      customerName: 'Priya Nair',
      assigneeName: 'John Fernandes',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'lead-003',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-004',
      source: 'Website Direct',
      status: 'qualified' as const,
      assignedTo: 'u-sales-003',
      budgetMin: 1800000,
      budgetMax: 2000000,
      preferredMake: 'Hyundai',
      preferredModel: 'Creta',
      preferredFuelType: 'Petrol',
      score: 75,
      notes: 'Inquiring about panoramic sunroof variant and exchange of old i20.',
      nextActionAt: '2026-10-23T11:00:00Z',
      version: 1,
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-19T14:00:00Z',
      customerName: 'Ananya Sengupta',
      assigneeName: 'John Fernandes',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'lead-004',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      customerId: 'cust-005',
      source: 'Cardekho / CarWale',
      status: 'appointment_set' as const,
      assignedTo: 'u-mgr-002',
      budgetMin: 1400000,
      budgetMax: 1600000,
      preferredMake: 'Honda',
      preferredModel: 'City',
      preferredFuelType: 'Petrol',
      score: 80,
      notes: 'Booked Saturday showroom appointment for family test drive.',
      nextActionAt: '2026-10-24T11:30:00Z',
      version: 1,
      createdAt: '2026-10-19T16:30:00Z',
      updatedAt: '2026-10-20T10:00:00Z',
      customerName: 'Rohan Verma',
      assigneeName: 'Kavita Chawla',
      branchName: 'Apex Westside Automall',
    },
    {
      id: 'lead-005',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      customerId: 'cust-003',
      source: 'Referral',
      status: 'contacted' as const,
      assignedTo: 'u-mgr-002',
      budgetMin: 5000000,
      budgetMax: 6000000,
      preferredMake: 'BMW',
      preferredModel: '3 Series',
      preferredFuelType: 'Petrol',
      score: 65,
      notes: 'Executive corporate fleet lease inquiry for senior directors.',
      nextActionAt: '2026-10-25T15:00:00Z',
      version: 1,
      createdAt: '2026-10-17T14:30:00Z',
      updatedAt: '2026-10-18T16:00:00Z',
      customerName: 'Vikram Malhotra',
      assigneeName: 'Kavita Chawla',
      branchName: 'Apex Westside Automall',
    },
  ],
  vehicles: [
    {
      id: 'veh-101',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      stockNumber: 'STK-2024-001',
      vin: 'MALC851CLPM101901',
      registrationNumber: 'MH01EA4091',
      make: 'Hyundai',
      model: 'Creta',
      variant: 'SX (O) 1.5 Turbo DCT',
      year: 2024,
      color: 'Abyss Black',
      mileageKm: 4200,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      ownershipMode: 'owned' as const,
      acquisitionCost: 1780000,
      totalCost: 1800000,
      askingPrice: 1950000,
      minimumPrice: 1900000,
      status: 'available' as const,
      version: 1,
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'veh-102',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      stockNumber: 'STK-2024-002',
      vin: 'MAT623055PLN203492',
      registrationNumber: 'MH02FD1928',
      make: 'Tata',
      model: 'Nexon EV',
      variant: 'Empowered Plus LR',
      year: 2023,
      color: 'Daytona Grey',
      mileageKm: 12500,
      fuelType: 'Electric',
      transmission: 'Automatic',
      ownershipMode: 'owned' as const,
      acquisitionCost: 1520000,
      totalCost: 1540000,
      askingPrice: 1680000,
      minimumPrice: 1630000,
      status: 'available' as const,
      version: 1,
      createdAt: '2026-10-11T12:00:00Z',
      updatedAt: '2026-10-11T12:00:00Z',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'veh-103',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      stockNumber: 'STK-2024-003',
      vin: 'MA1TK2WAHN7382901',
      registrationNumber: 'MH01EF8821',
      make: 'Mahindra',
      model: 'XUV700',
      variant: 'AX7 Luxury AWD',
      year: 2024,
      color: 'Midnight Blue',
      mileageKm: 8900,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      ownershipMode: 'owned' as const,
      acquisitionCost: 2250000,
      totalCost: 2280000,
      askingPrice: 2490000,
      minimumPrice: 2430000,
      status: 'reserved' as const,
      version: 1,
      createdAt: '2026-10-12T14:00:00Z',
      updatedAt: '2026-10-19T10:00:00Z',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'veh-104',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      stockNumber: 'STK-2024-004',
      vin: 'WBA5R1103MFL78291',
      registrationNumber: 'MH02DZ4499',
      make: 'BMW',
      model: '3 Series',
      variant: '330Li M Sport',
      year: 2023,
      color: 'Mineral White',
      mileageKm: 15200,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      ownershipMode: 'consignment' as const,
      acquisitionCost: 4950000,
      totalCost: 5020000,
      askingPrice: 5650000,
      minimumPrice: 5450000,
      status: 'available' as const,
      version: 1,
      createdAt: '2026-10-13T16:00:00Z',
      updatedAt: '2026-10-13T16:00:00Z',
      branchName: 'Apex Westside Automall',
    },
    {
      id: 'veh-105',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      stockNumber: 'STK-2024-005',
      vin: 'MBJ11JA84NM492019',
      registrationNumber: 'MH03CP1002',
      make: 'Toyota',
      model: 'Fortuner',
      variant: '4x4 AT Diesel',
      year: 2022,
      color: 'Sparkling Black',
      mileageKm: 34000,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      ownershipMode: 'owned' as const,
      acquisitionCost: 3350000,
      totalCost: 3420000,
      askingPrice: 3700000,
      minimumPrice: 3600000,
      status: 'inspection' as const,
      version: 1,
      createdAt: '2026-10-14T11:00:00Z',
      updatedAt: '2026-10-14T11:00:00Z',
      branchName: 'Apex Westside Automall',
    },
    {
      id: 'veh-106',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      stockNumber: 'STK-2024-006',
      vin: 'MAKGM6654N3891021',
      registrationNumber: 'MH01BK7733',
      make: 'Honda',
      model: 'City',
      variant: 'ZX CVT',
      year: 2024,
      color: 'Radiant Red',
      mileageKm: 6100,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      ownershipMode: 'owned' as const,
      acquisitionCost: 1390000,
      totalCost: 1410000,
      askingPrice: 1520000,
      minimumPrice: 1480000,
      status: 'sold' as const,
      version: 1,
      createdAt: '2026-10-08T09:00:00Z',
      updatedAt: '2026-10-18T14:00:00Z',
      branchName: 'Apex Downtown Flagship',
    },
  ],
  deals: [
    {
      id: 'deal-001',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-001',
      vehicleId: 'veh-103',
      dealNumber: 'DL-2024-001',
      stage: 'finance' as const,
      vehiclePrice: 2490000,
      accessoriesTotal: 25000,
      discountTotal: 40000,
      taxTotal: 441000,
      feesTotal: 35000,
      tradeInCredit: 0,
      grandTotal: 2951000,
      amountPaid: 100000,
      balanceDue: 2851000,
      currency: 'INR',
      financeType: 'loan' as const,
      lenderName: 'HDFC Bank',
      loanAmount: 2200000,
      loanStatus: 'Sanctioned',
      version: 1,
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-20T12:00:00Z',
      customerName: 'Rajesh Sharma',
      vehicleName: 'Mahindra XUV700 AX7 Luxury AWD',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'deal-002',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-002',
      vehicleId: 'veh-102',
      dealNumber: 'DL-2024-002',
      stage: 'ready' as const,
      vehiclePrice: 1680000,
      accessoriesTotal: 15000,
      discountTotal: 20000,
      taxTotal: 0,
      feesTotal: 5000,
      tradeInCredit: 0,
      grandTotal: 1680000,
      amountPaid: 50000,
      balanceDue: 1630000,
      currency: 'INR',
      financeType: 'loan' as const,
      lenderName: 'SBI Auto Loans',
      loanAmount: 1400000,
      loanStatus: 'Pre-Approved',
      version: 1,
      createdAt: '2026-10-19T11:00:00Z',
      updatedAt: '2026-10-21T14:00:00Z',
      customerName: 'Priya Nair',
      vehicleName: 'Tata Nexon EV Empowered Plus',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'deal-003',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      customerId: 'cust-003',
      vehicleId: 'veh-104',
      dealNumber: 'DL-2024-003',
      stage: 'documents' as const,
      vehiclePrice: 5650000,
      accessoriesTotal: 50000,
      discountTotal: 100000,
      taxTotal: 0,
      feesTotal: 50000,
      tradeInCredit: 0,
      grandTotal: 5650000,
      amountPaid: 500000,
      balanceDue: 5150000,
      currency: 'INR',
      financeType: 'lease' as const,
      lenderName: 'BMW Financial Services',
      loanAmount: 4500000,
      loanStatus: 'Under Review',
      version: 1,
      createdAt: '2026-10-18T15:00:00Z',
      updatedAt: '2026-10-20T16:00:00Z',
      customerName: 'Vikram Malhotra',
      vehicleName: 'BMW 3 Series 330Li M Sport',
      branchName: 'Apex Westside Automall',
    },
    {
      id: 'deal-004',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-004',
      vehicleId: 'veh-101',
      dealNumber: 'DL-2024-004',
      stage: 'finance' as const,
      vehiclePrice: 1950000,
      accessoriesTotal: 20000,
      discountTotal: 30000,
      taxTotal: 0,
      feesTotal: 10000,
      tradeInCredit: 0,
      grandTotal: 1950000,
      amountPaid: 25000,
      balanceDue: 1925000,
      currency: 'INR',
      financeType: 'loan' as const,
      lenderName: 'ICICI Bank',
      loanAmount: 1600000,
      loanStatus: 'Submitted',
      version: 1,
      createdAt: '2026-10-19T09:00:00Z',
      updatedAt: '2026-10-21T10:00:00Z',
      customerName: 'Ananya Sengupta',
      vehicleName: 'Hyundai Creta SX (O) 1.5 Turbo',
      branchName: 'Apex Downtown Flagship',
    },
    {
      id: 'deal-005',
      tenantId: 't-apex-001',
      branchId: 'b-ws-002',
      customerId: 'cust-005',
      dealNumber: 'DL-2024-005',
      stage: 'initiated' as const,
      vehiclePrice: 1520000,
      accessoriesTotal: 15000,
      discountTotal: 25000,
      taxTotal: 0,
      feesTotal: 10000,
      tradeInCredit: 0,
      grandTotal: 1520000,
      amountPaid: 21000,
      balanceDue: 1499000,
      currency: 'INR',
      financeType: 'cash' as const,
      version: 1,
      createdAt: '2026-10-20T11:00:00Z',
      updatedAt: '2026-10-21T15:00:00Z',
      customerName: 'Rohan Verma',
      vehicleName: 'Honda City ZX CVT',
      branchName: 'Apex Westside Automall',
    },
  ],
  quotations: [
    {
      id: 'quo-001',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-001',
      quoteNumber: 'Q-2024-001',
      revision: 1,
      status: 'accepted' as const,
      items: [
        {
          id: 'item-01',
          quotationId: 'quo-001',
          itemType: 'vehicle' as const,
          description: 'Mahindra XUV700 AX7 Luxury Pack AWD (Midnight Blue)',
          quantity: 1,
          unitPrice: 2490000,
          discountAmount: 40000,
          taxRatePercent: 18,
          taxAmount: 441000,
          lineTotal: 2891000,
        },
        {
          id: 'item-02',
          quotationId: 'quo-001',
          itemType: 'fee' as const,
          description: 'RTO Registration & Handling Charges',
          quantity: 1,
          unitPrice: 35000,
          discountAmount: 0,
          taxRatePercent: 0,
          taxAmount: 0,
          lineTotal: 35000,
        },
      ],
      totals: {
        subtotal: 2525000,
        discountTotal: 40000,
        taxTotal: 441000,
        feesTotal: 35000,
        grandTotal: 2926000,
      },
      validUntil: '2026-11-05T00:00:00Z',
      notes: 'Includes 3 years warranty and first 3 scheduled services complimentary.',
      createdAt: '2026-10-18T09:30:00Z',
      updatedAt: '2026-10-18T11:00:00Z',
      customerName: 'Rajesh Sharma',
      branchName: 'Apex Downtown Flagship',
    },
  ],
  appointments: [
    {
      id: 'apt-001',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-002',
      leadId: 'lead-002',
      vehicleId: 'veh-102',
      appointmentType: 'test_drive' as const,
      scheduledAt: '2026-10-21T16:30:00Z',
      durationMinutes: 45,
      status: 'confirmed' as const,
      notes: 'Test drive route across Worli Seaface & Coastal Road.',
      createdAt: '2026-10-20T10:00:00Z',
      customerName: 'Priya Nair',
      vehicleName: 'Tata Nexon EV Empowered Plus',
      assignedToName: 'John Fernandes',
    },
    {
      id: 'apt-002',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-001',
      leadId: 'lead-001',
      vehicleId: 'veh-103',
      appointmentType: 'showroom_visit' as const,
      scheduledAt: '2026-10-22T11:00:00Z',
      durationMinutes: 30,
      status: 'scheduled' as const,
      notes: 'Loan disbursement check and registration doc signing.',
      createdAt: '2026-10-20T14:00:00Z',
      customerName: 'Rajesh Sharma',
      vehicleName: 'Mahindra XUV700 AX7L',
      assignedToName: 'John Fernandes',
    },
  ],
  payments: [
    {
      id: 'pmt-001',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-001',
      bookingId: 'bk-001',
      dealId: 'deal-001',
      paymentNumber: 'PMT-2024-001',
      method: 'upi' as const,
      status: 'settled' as const,
      amount: 100000,
      currency: 'INR',
      referenceNumber: 'UPI/2024/991823019',
      notes: 'Booking token deposit received for Mahindra XUV700.',
      settledAt: '2026-10-18T10:15:00Z',
      createdAt: '2026-10-18T10:15:00Z',
      customerName: 'Rajesh Sharma',
    },
  ],
  jobCards: [
    {
      id: 'jc-001',
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      customerId: 'cust-004',
      vehicleId: 'veh-101',
      jobCardNumber: 'JC-2024-001',
      status: 'in_progress' as const,
      intakeOdometer: 10250,
      intakeFuelLevel: '75%',
      customerComplaints: 'Periodic 10k service + minor front brake squeak inspection.',
      labourTotal: 2500,
      partsTotal: 4200,
      taxTotal: 1206,
      grandTotal: 7906,
      createdAt: '2026-10-21T09:30:00Z',
      customerName: 'Ananya Sengupta',
      vehicleName: 'Hyundai Creta SX (O)',
    },
  ],
  campaigns: [
    {
      id: 'cmp-001',
      tenantId: 't-apex-001',
      name: 'Diwali Festive Upgrade Gala',
      campaignType: 'whatsapp' as const,
      status: 'active' as const,
      targetAudience: { segment: 'SUV Inquirers', count: 420 },
      contentTemplate: { title: 'Special Rs 50,000 exchange bonus on top SUV models' },
      budget: 25000,
      sentCount: 420,
      deliveredCount: 412,
      responseCount: 68,
      createdAt: '2026-10-10T00:00:00Z',
    },
  ],
};

// Unified Data Store (Memory + LocalStorage in browser)
class DataService {
  private data = initialData;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_store');
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
      localStorage.setItem('crm_store', JSON.stringify(this.data));
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
