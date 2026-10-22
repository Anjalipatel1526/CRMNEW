import { z } from 'zod';

// ============================================================
// AUTH & USER SCHEMAS
// ============================================================
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  dealershipName: z.string().min(2, 'Dealership name is required'),
  dealerModel: z.enum(['new', 'used', 'mixed', 'broker']).default('mixed'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const SwitchTenantSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
});
export type SwitchTenantInput = z.infer<typeof SwitchTenantSchema>;

export const InviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  roleKey: z.enum([
    'tenant_admin',
    'branch_manager',
    'sales_executive',
    'finance_manager',
    'inventory_manager',
    'service_advisor',
    'technician',
    'receptionist',
  ]),
  branchIds: z.array(z.string().uuid()).default([]),
  branchScope: z.enum(['all', 'assigned']).default('assigned'),
});
export type InviteUserInput = z.infer<typeof InviteUserSchema>;

// ============================================================
// TENANT & BRANCH SCHEMAS
// ============================================================
export const CreateTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric with hyphens'),
  dealerModel: z.enum(['new', 'used', 'mixed', 'broker']).default('mixed'),
  primaryContactName: z.string().min(2),
  primaryEmail: z.string().email(),
  primaryPhone: z.string().min(10),
  currency: z.string().length(3).default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
});
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

export const UpdateTenantSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  primaryPhone: z.string().optional(),
  primaryEmail: z.string().email().optional(),
  settings: z.record(z.any()).optional(),
});
export type UpdateTenantSettingsInput = z.infer<typeof UpdateTenantSettingsSchema>;

export const CreateBranchSchema = z.object({
  code: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(2),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
  }).default({}),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;

// ============================================================
// CRM SCHEMAS
// ============================================================
export const CreateCustomerSchema = z.object({
  branchId: z.string().uuid().optional(),
  type: z.enum(['individual', 'business']).default('individual'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().default(''),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  companyName: z.string().optional(),
  gstin: z.string().optional(),
  address: z.record(z.any()).default({}),
  consent: z.object({
    whatsapp: z.boolean().default(true),
    sms: z.boolean().default(true),
    email: z.boolean().default(true),
  }).default({}),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const CreateLeadSchema = z.object({
  branchId: z.string().uuid('Branch is required'),
  customerId: z.string().uuid().optional(),
  // Can provide inline customer if customer doesn't exist yet
  customerData: CreateCustomerSchema.optional(),
  source: z.string().min(1, 'Lead source is required'),
  status: z.enum([
    'new',
    'assigned',
    'contacted',
    'qualified',
    'appointment_set',
    'test_drive',
    'negotiation',
    'converted',
    'lost',
    'nurture',
  ]).default('new'),
  assignedTo: z.string().uuid().optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  preferredMake: z.string().optional(),
  preferredModel: z.string().optional(),
  preferredFuelType: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  nextActionAt: z.string().optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const AssignLeadSchema = z.object({
  assigneeId: z.string().uuid('Valid assignee is required'),
});

export const QualifyLeadSchema = z.object({
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
});

export const MarkLostSchema = z.object({
  lostReason: z.string().min(2, 'Lost reason is mandatory'),
  notes: z.string().optional(),
});

export const CreateActivitySchema = z.object({
  entityType: z.enum(['customer', 'lead', 'vehicle', 'deal']),
  entityId: z.string().uuid(),
  type: z.enum([
    'call',
    'email',
    'whatsapp',
    'meeting',
    'note',
    'test_drive',
    'follow_up',
    'task',
    'status_change',
    'system_event',
  ]),
  subject: z.string().min(2),
  notes: z.string().optional(),
  occurredAt: z.string().optional(),
  dueDate: z.string().optional(),
  metadata: z.record(z.any()).default({}),
});
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;

export const ScheduleAppointmentSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  appointmentType: z.enum(['showroom_visit', 'test_drive', 'document_pickup', 'delivery', 'service', 'other']),
  scheduledAt: z.string(),
  durationMinutes: z.number().int().positive().default(30),
  notes: z.string().optional(),
});
export type ScheduleAppointmentInput = z.infer<typeof ScheduleAppointmentSchema>;

export const RecordTestDriveSchema = z.object({
  appointmentId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  customerId: z.string().uuid(),
  startOdometer: z.number().int().nonnegative().optional(),
  endOdometer: z.number().int().nonnegative().optional(),
  route: z.string().optional(),
  feedback: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});
export type RecordTestDriveInput = z.infer<typeof RecordTestDriveSchema>;

// ============================================================
// VEHICLE SCHEMAS
// ============================================================
export const CreateVehicleSchema = z.object({
  branchId: z.string().uuid('Branch is required'),
  catalogId: z.string().uuid().optional(),
  vin: z.string().min(5, 'VIN/Chassis number is required'),
  registrationNumber: z.string().optional(),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().default('Base'),
  year: z.number().int().min(1980).max(2035),
  color: z.string().min(1, 'Color is required'),
  mileageKm: z.number().int().nonnegative().default(0),
  fuelType: z.string().default('Petrol'),
  transmission: z.string().default('Manual'),
  ownershipMode: z.enum(['owned', 'consignment', 'broker']).default('owned'),
  acquisitionCost: z.number().nonnegative().default(0),
  askingPrice: z.number().nonnegative(),
  minimumPrice: z.number().nonnegative().default(0),
  status: z.enum([
    'draft',
    'in_transit',
    'inspection',
    'reconditioning',
    'available',
    'reserved',
    'sold',
    'delivered',
    'returned',
    'archived',
  ]).default('available'),
});
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;

export const AddVehicleCostSchema = z.object({
  category: z.enum(['acquisition', 'reconditioning', 'transport', 'registration', 'other']),
  description: z.string().min(2),
  amount: z.number().positive('Cost amount must be greater than zero'),
});
export type AddVehicleCostInput = z.infer<typeof AddVehicleCostSchema>;

// ============================================================
// SALES DESK SCHEMAS
// ============================================================
export const CreateOpportunitySchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  title: z.string().min(2),
  stage: z.enum([
    'qualification',
    'needs_analysis',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ]).default('qualification'),
  expectedValue: z.number().nonnegative().default(0),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;

export const CreateQuotationSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  opportunityId: z.string().uuid().optional(),
  items: z.array(z.object({
    itemType: z.enum(['vehicle', 'accessory', 'service', 'fee', 'insurance', 'warranty']),
    vehicleId: z.string().uuid().optional(),
    description: z.string().min(1),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().nonnegative(),
    discountAmount: z.number().nonnegative().default(0),
    taxRatePercent: z.number().nonnegative().default(18),
  })).min(1, 'At least one line item is required'),
  validUntil: z.string(),
  notes: z.string().optional(),
});
export type CreateQuotationInput = z.infer<typeof CreateQuotationSchema>;

export const CreateDealSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  quotationId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  vehiclePrice: z.number().nonnegative().default(0),
  accessoriesTotal: z.number().nonnegative().default(0),
  discountTotal: z.number().nonnegative().default(0),
  taxTotal: z.number().nonnegative().default(0),
  feesTotal: z.number().nonnegative().default(0),
  tradeInCredit: z.number().nonnegative().default(0),
  financeType: z.enum(['cash', 'loan', 'lease']).default('cash'),
  lenderName: z.string().optional(),
  loanAmount: z.number().nonnegative().optional(),
});
export type CreateDealInput = z.infer<typeof CreateDealSchema>;

// ============================================================
// FINANCE SCHEMAS
// ============================================================
export const CreateBookingSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  quotationId: z.string().uuid().optional(),
  bookingAmountRequired: z.number().positive('Booking deposit required must be greater than 0'),
  idempotencyKey: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const RecordPaymentSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  method: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque']),
  amount: z.number().positive('Payment amount must be greater than zero'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

export const CreateInvoiceSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  dealId: z.string().uuid().optional(),
  subtotal: z.number().nonnegative(),
  taxTotal: z.number().nonnegative().default(0),
  grandTotal: z.number().positive(),
  dueDate: z.string().optional(),
});
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

export const RecordExpenseSchema = z.object({
  branchId: z.string().uuid(),
  category: z.enum(['vehicle_cost', 'operations', 'marketing', 'salary', 'utility', 'rent', 'insurance', 'other']),
  description: z.string().min(2),
  amount: z.number().positive(),
  vehicleId: z.string().uuid().optional(),
  incurredAt: z.string(),
});
export type RecordExpenseInput = z.infer<typeof RecordExpenseSchema>;
