export type UUID = string;
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    statusCode?: number;
}
export type UserRole = 'platform_admin' | 'tenant_admin' | 'branch_manager' | 'sales_executive' | 'finance_manager' | 'inventory_manager' | 'service_advisor' | 'technician' | 'receptionist';
export interface AppUser {
    id: UUID;
    email: string;
    phone?: string;
    fullName: string;
    avatarUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Tenant {
    id: UUID;
    name: string;
    slug: string;
    status: 'provisioning' | 'active' | 'suspended' | 'cancelled';
    dealerModel: 'new' | 'used' | 'mixed' | 'broker';
    primaryContactName: string;
    primaryEmail: string;
    primaryPhone: string;
    currency: string;
    timezone: string;
    settings: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface Branch {
    id: UUID;
    tenantId: UUID;
    code: string;
    name: string;
    address: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
    };
    phone?: string;
    email?: string;
    timezone: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Membership {
    id: UUID;
    tenantId: UUID;
    userId: UUID;
    roleKey: UserRole;
    branchIds: UUID[];
    branchScope: 'all' | 'assigned';
    isActive: boolean;
    createdAt: string;
}
export interface JwtPayload {
    sub: UUID;
    tid: UUID;
    roles: string[];
    bids: UUID[];
    bscope: 'assigned' | 'all';
    iat?: number;
    exp?: number;
    jti?: string;
}
export interface UserContext {
    user: AppUser;
    tenant: Tenant;
    membership: Membership;
    permissions: string[];
    branches: Branch[];
}
export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    userContext: UserContext;
}
export type CustomerType = 'individual' | 'business';
export interface Customer {
    id: UUID;
    tenantId: UUID;
    branchId?: UUID;
    type: CustomerType;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    panNumber?: string;
    aadhaarNumber?: string;
    companyName?: string;
    gstin?: string;
    address: Record<string, any>;
    consent: {
        whatsapp?: boolean;
        sms?: boolean;
        email?: boolean;
    };
    version: number;
    createdAt: string;
    updatedAt: string;
}
export type LeadStatus = 'new' | 'assigned' | 'contacted' | 'qualified' | 'appointment_set' | 'test_drive' | 'negotiation' | 'converted' | 'lost' | 'nurture';
export interface Lead {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    source: string;
    status: LeadStatus;
    assignedTo?: UUID;
    budgetMin?: number;
    budgetMax?: number;
    preferredMake?: string;
    preferredModel?: string;
    preferredFuelType?: string;
    timeline?: string;
    lostReason?: string;
    score?: number;
    nextActionAt?: string;
    notes?: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
    assigneeName?: string;
    branchName?: string;
}
export type ActivityType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'test_drive' | 'follow_up' | 'task' | 'status_change' | 'system_event';
export interface Activity {
    id: UUID;
    tenantId: UUID;
    entityType: 'customer' | 'lead' | 'vehicle' | 'deal';
    entityId: UUID;
    type: ActivityType;
    subject: string;
    notes?: string;
    occurredAt: string;
    createdBy: UUID;
    metadata?: Record<string, any>;
    isCompleted?: boolean;
    dueDate?: string;
    createdByName?: string;
}
export interface Appointment {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    leadId?: UUID;
    vehicleId?: UUID;
    assignedTo?: UUID;
    appointmentType: 'showroom_visit' | 'test_drive' | 'document_pickup' | 'delivery' | 'service' | 'other';
    scheduledAt: string;
    durationMinutes: number;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    outcome?: string;
    notes?: string;
    createdAt: string;
    customerName?: string;
    vehicleName?: string;
    assignedToName?: string;
}
export interface TestDrive {
    id: UUID;
    tenantId: UUID;
    appointmentId: UUID;
    vehicleId: UUID;
    customerId: UUID;
    startOdometer?: number;
    endOdometer?: number;
    startTime?: string;
    endTime?: string;
    route?: string;
    feedback?: string;
    rating?: number;
    createdAt: string;
}
export type VehicleStatus = 'draft' | 'in_transit' | 'inspection' | 'reconditioning' | 'available' | 'reserved' | 'sold' | 'delivered' | 'returned' | 'archived';
export interface VehicleCatalog {
    id: UUID;
    tenantId: UUID;
    make: string;
    model: string;
    variant: string;
    modelYear: number;
    bodyType: string;
    fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
    transmission: 'manual' | 'automatic';
    engineCapacityCc?: number;
    specs: Record<string, any>;
}
export interface VehiclePhoto {
    id: UUID;
    tenantId: UUID;
    vehicleId: UUID;
    storageKey: string;
    url?: string;
    caption?: string;
    displayOrder: number;
    isPrimary: boolean;
    createdAt: string;
}
export interface Vehicle {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    catalogId?: UUID;
    stockNumber: string;
    vin: string;
    registrationNumber?: string;
    make: string;
    model: string;
    variant: string;
    year: number;
    color: string;
    mileageKm: number;
    fuelType: string;
    transmission: string;
    ownershipMode: 'owned' | 'consignment' | 'broker';
    acquisitionCost: number;
    totalCost: number;
    askingPrice: number;
    minimumPrice: number;
    status: VehicleStatus;
    currentBookingId?: UUID;
    version: number;
    photos?: VehiclePhoto[];
    createdAt: string;
    updatedAt: string;
    branchName?: string;
    imageUrl?: string;
}
export interface VehicleCost {
    id: UUID;
    tenantId: UUID;
    vehicleId: UUID;
    category: 'acquisition' | 'reconditioning' | 'transport' | 'registration' | 'other';
    description: string;
    amount: number;
    createdAt: string;
}
export interface PurchaseOrder {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    supplierId?: UUID;
    orderNumber: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
    vehicleDescription: Record<string, any>;
    expectedCost: number;
    currency: string;
    approvedBy?: UUID;
    approvedAt?: string;
    createdBy?: UUID;
    createdAt: string;
}
export interface Supplier {
    id: UUID;
    tenantId: UUID;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: Record<string, any>;
    supplierType: 'dealer' | 'auction' | 'individual' | 'manufacturer' | 'other';
    isActive: boolean;
    createdAt: string;
}
export interface TradeInAppraisal {
    id: UUID;
    tenantId: UUID;
    customerId: UUID;
    vehicleDescription: Record<string, any>;
    odometerKm?: number;
    conditionGrade?: string;
    estimatedValueLow?: number;
    estimatedValueMid?: number;
    estimatedValueHigh?: number;
    offeredPrice?: number;
    status: 'draft' | 'appraised' | 'accepted' | 'rejected' | 'acquired';
    dealId?: UUID;
    appraisedBy?: UUID;
    createdAt: string;
}
export type OpportunityStage = 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export interface Opportunity {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    leadId?: UUID;
    assignedTo?: UUID;
    title: string;
    stage: OpportunityStage;
    expectedValue: number;
    expectedCloseDate?: string;
    vehiclePreference?: Record<string, any>;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    customerName?: string;
    assignedToName?: string;
}
export interface QuotationItem {
    id: UUID;
    quotationId: UUID;
    itemType: 'vehicle' | 'accessory' | 'service' | 'fee' | 'insurance' | 'warranty';
    vehicleId?: UUID;
    description: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxRatePercent: number;
    taxAmount: number;
    lineTotal: number;
}
export interface QuotationTotals {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    feesTotal: number;
    grandTotal: number;
}
export interface Quotation {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    opportunityId?: UUID;
    quoteNumber: string;
    revision: number;
    status: 'draft' | 'issued' | 'superseded' | 'accepted' | 'rejected' | 'expired';
    items: QuotationItem[];
    totals: QuotationTotals;
    validUntil: string;
    notes?: string;
    createdById?: UUID;
    createdAt: string;
    updatedAt: string;
    customerName?: string;
    branchName?: string;
}
export interface DiscountApproval {
    id: UUID;
    tenantId: UUID;
    quotationId?: UUID;
    dealId?: UUID;
    requestedAmount: number;
    dealValue: number;
    discountPercent?: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedBy?: UUID;
    decidedBy?: UUID;
    decidedAt?: string;
    decisionReason?: string;
    createdAt: string;
}
export type DealStage = 'initiated' | 'documents' | 'finance' | 'pdi' | 'ready' | 'delivered' | 'cancelled';
export interface Deal {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    vehicleId?: UUID;
    opportunityId?: UUID;
    quotationId?: UUID;
    bookingId?: UUID;
    dealNumber: string;
    stage: DealStage;
    vehiclePrice: number;
    accessoriesTotal: number;
    discountTotal: number;
    taxTotal: number;
    feesTotal: number;
    tradeInCredit: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    currency: string;
    financeType?: 'cash' | 'loan' | 'lease';
    lenderName?: string;
    loanAmount?: number;
    loanStatus?: string;
    cancellationReason?: string;
    version: number;
    createdBy?: UUID;
    createdAt: string;
    updatedAt: string;
    customerName?: string;
    vehicleName?: string;
    branchName?: string;
}
export type BookingStatus = 'draft' | 'pending_payment' | 'confirmed' | 'cancel_requested' | 'cancelled' | 'completed';
export interface Booking {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    vehicleId: UUID;
    quotationId?: UUID;
    bookingNumber: string;
    status: BookingStatus;
    bookingAmountRequired: number;
    amountPaid: number;
    idempotencyKey?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    customerName?: string;
    vehicleName?: string;
}
export type PaymentStatus = 'pending' | 'authorized' | 'settled' | 'failed' | 'partially_refunded' | 'refunded' | 'reversed';
export interface Payment {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    bookingId?: UUID;
    dealId?: UUID;
    invoiceId?: UUID;
    paymentNumber: string;
    method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
    status: PaymentStatus;
    amount: number;
    currency: string;
    referenceNumber?: string;
    notes?: string;
    recordedBy?: UUID;
    settledAt?: string;
    createdAt: string;
    customerName?: string;
}
export interface PaymentAllocation {
    id: UUID;
    tenantId: UUID;
    paymentId: UUID;
    targetType: 'booking' | 'invoice' | 'deal';
    targetId: UUID;
    allocatedAmount: number;
    createdAt: string;
}
export interface Invoice {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    dealId?: UUID;
    invoiceNumber: string;
    status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'cancelled';
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    paidAmount: number;
    balanceDue: number;
    currency: string;
    issuedAt?: string;
    dueDate?: string;
    createdAt: string;
    customerName?: string;
}
export interface Refund {
    id: UUID;
    tenantId: UUID;
    paymentId: UUID;
    bookingId?: UUID;
    amount: number;
    reason: string;
    status: 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed';
    approvedBy?: UUID;
    approvedAt?: string;
    executedAt?: string;
    providerReference?: string;
    createdBy?: UUID;
    createdAt: string;
}
export interface Expense {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    category: 'vehicle_cost' | 'operations' | 'marketing' | 'salary' | 'utility' | 'rent' | 'insurance' | 'other';
    description: string;
    amount: number;
    currency: string;
    vehicleId?: UUID;
    receiptDocumentId?: UUID;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    approvedBy?: UUID;
    incurredAt: string;
    createdBy?: UUID;
    createdAt: string;
}
export interface DealershipDocument {
    id: UUID;
    tenantId: UUID;
    entityType: 'customer' | 'vehicle' | 'deal' | 'booking' | 'delivery' | 'expense';
    entityId: UUID;
    documentType: string;
    fileName: string;
    fileSizeBytes?: number;
    mimeType?: string;
    storageKey: string;
    status: 'uploaded' | 'under_review' | 'verified' | 'rejected' | 'expired';
    expiryDate?: string;
    verifiedBy?: UUID;
    verifiedAt?: string;
    rejectionReason?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}
export interface DeliveryGateStatus {
    paymentGatePassed: boolean;
    documentGatePassed: boolean;
    pdiGatePassed: boolean;
    financeGatePassed: boolean;
    allPassed: boolean;
}
export interface Delivery {
    id: UUID;
    tenantId: UUID;
    dealId: UUID;
    vehicleId: UUID;
    customerId: UUID;
    status: 'pending_clearance' | 'pdi_in_progress' | 'pdi_passed' | 'pdi_failed' | 'ready_for_handover' | 'delivered' | 'cancelled';
    paymentGatePassed: boolean;
    documentGatePassed: boolean;
    pdiGatePassed: boolean;
    financeGatePassed: boolean;
    handoverDate?: string;
    acknowledgementMethod?: string;
    acknowledgementReference?: string;
    deliveredBy?: UUID;
    createdAt: string;
    customerName?: string;
    vehicleName?: string;
}
export interface PdiRecord {
    id: UUID;
    tenantId: UUID;
    deliveryId: UUID;
    vehicleId: UUID;
    checklist: Array<{
        item: string;
        passed: boolean;
        notes?: string;
    }>;
    overallResult: 'pass' | 'fail' | 'conditional';
    repairItems?: Array<{
        description: string;
        resolved: boolean;
    }>;
    inspectorUserId?: UUID;
    completedAt?: string;
    createdAt: string;
}
export interface ServiceAppointment {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    customerId: UUID;
    vehicleId: UUID;
    serviceType: 'scheduled_service' | 'repair' | 'warranty' | 'recall' | 'inspection' | 'other';
    preferredDate: string;
    preferredTimeSlot?: string;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    customerNotes?: string;
    createdAt: string;
    customerName?: string;
    vehicleName?: string;
}
export interface JobCard {
    id: UUID;
    tenantId: UUID;
    branchId: UUID;
    serviceAppointmentId?: UUID;
    customerId: UUID;
    vehicleId: UUID;
    jobCardNumber: string;
    status: 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'invoiced' | 'cancelled';
    intakeOdometer?: number;
    intakeFuelLevel?: string;
    customerComplaints?: string;
    technicianUserId?: UUID;
    estimatedCompletion?: string;
    labourTotal: number;
    partsTotal: number;
    taxTotal: number;
    grandTotal: number;
    completedAt?: string;
    createdAt: string;
    customerName?: string;
    vehicleName?: string;
}
export interface LabourItem {
    id: UUID;
    tenantId: UUID;
    jobCardId: UUID;
    description: string;
    hours: number;
    ratePerHour: number;
    total: number;
    status: 'pending' | 'in_progress' | 'completed';
}
export interface Part {
    id: UUID;
    tenantId: UUID;
    partNumber: string;
    name: string;
    category?: string;
    unitCost: number;
    sellingPrice: number;
    stockQuantity: number;
    reorderLevel: number;
    createdAt: string;
}
export interface Complaint {
    id: UUID;
    tenantId: UUID;
    customerId: UUID;
    vehicleId?: UUID;
    dealId?: UUID;
    category: 'quality' | 'service' | 'documentation' | 'billing' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
    subject: string;
    description: string;
    status: 'open' | 'investigating' | 'resolved' | 'closed' | 'escalated';
    assignedTo?: UUID;
    resolution?: string;
    createdAt: string;
    customerName?: string;
}
export interface Campaign {
    id: UUID;
    tenantId: UUID;
    name: string;
    campaignType: 'email' | 'sms' | 'whatsapp' | 'social' | 'mixed';
    status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
    targetAudience: Record<string, any>;
    contentTemplate: Record<string, any>;
    scheduledAt?: string;
    budget?: number;
    sentCount: number;
    deliveredCount: number;
    responseCount: number;
    createdBy?: UUID;
    createdAt: string;
}
export interface Referral {
    id: UUID;
    tenantId: UUID;
    referrerCustomerId: UUID;
    referredCustomerId?: UUID;
    referredLeadId?: UUID;
    referralCode: string;
    status: 'created' | 'contacted' | 'converted' | 'rewarded' | 'expired';
    rewardAmount?: number;
    rewardPaid: boolean;
    createdAt: string;
    referrerName?: string;
}
export interface LeadScore {
    leadId: UUID;
    score: number;
    confidence: number;
    factors: string[];
}
export interface ValuationEstimate {
    estimatedLow: number;
    estimatedMid: number;
    estimatedHigh: number;
    confidence: number;
    comparablesCount: number;
    summary: string;
}
export interface CopilotAdvice {
    summary: string;
    recommendedAction: string;
    draftMessage: string;
    suggestedVehicles: Array<{
        id: UUID;
        make: string;
        model: string;
        price: number;
    }>;
}
export interface StockRecommendation {
    vehicleId: UUID;
    stockNumber: string;
    make: string;
    model: string;
    daysInStock: number;
    currentAskingPrice: number;
    suggestedAction: 'discount' | 'feature_campaign' | 'transfer' | 'wholesale';
    suggestedPrice?: number;
    reason: string;
}
export interface Plan {
    id: UUID;
    name: string;
    slug: string;
    priceMonthly: number;
    priceAnnual: number;
    currency: string;
    maxUsers: number;
    maxBranches: number;
    maxVehicles: number;
    storageLimitMb: number;
    features: Record<string, boolean>;
    isActive: boolean;
    createdAt: string;
}
export interface Subscription {
    id: UUID;
    tenantId: UUID;
    planId: UUID;
    status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
    billingCycle: 'monthly' | 'annual';
    trialEndsAt?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelledAt?: string;
    createdAt: string;
    plan?: Plan;
}
export interface AuditEvent {
    id: UUID;
    tenantId: UUID;
    actorUserId?: UUID;
    actorEmail?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    beforeData?: Record<string, any>;
    afterData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    createdAt: string;
}
//# sourceMappingURL=index.d.ts.map