import {
  LeadStatus,
  VehicleStatus,
  BookingStatus,
  PaymentStatus,
  DealStage,
  QuotationItem,
  QuotationTotals,
} from '@crm/shared-types';

// ============================================================
// 1. LEAD STATE MACHINE
// ============================================================
export const LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['assigned', 'contacted', 'lost'],
  assigned: ['contacted', 'lost'],
  contacted: ['qualified', 'appointment_set', 'lost', 'nurture'],
  qualified: ['appointment_set', 'test_drive', 'negotiation', 'lost', 'nurture'],
  appointment_set: ['test_drive', 'qualified', 'lost', 'nurture'],
  test_drive: ['negotiation', 'qualified', 'lost', 'nurture'],
  negotiation: ['converted', 'lost', 'nurture'],
  converted: [], // terminal
  lost: ['nurture'],
  nurture: ['contacted', 'qualified', 'lost'],
};

export function validateLeadTransition(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getRequiredFieldsForLeadStatus(status: LeadStatus): string[] {
  const requirements: Record<string, string[]> = {
    lost: ['lostReason'],
    qualified: ['budgetMin', 'budgetMax'],
    appointment_set: ['nextActionAt'],
  };
  return requirements[status] ?? [];
}

// ============================================================
// 2. VEHICLE STATE MACHINE
// ============================================================
export const VEHICLE_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  draft: ['in_transit', 'inspection', 'available'],
  in_transit: ['inspection', 'available', 'draft'],
  inspection: ['reconditioning', 'available', 'archived'],
  reconditioning: ['inspection', 'available'],
  available: ['reserved', 'archived'],
  reserved: ['available', 'sold'],
  sold: ['delivered', 'available'], // available only via cancellation
  delivered: ['returned'],
  returned: ['inspection', 'available', 'archived'],
  archived: ['draft'], // re-list
};

export function validateVehicleTransition(from: VehicleStatus, to: VehicleStatus): boolean {
  return VEHICLE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// 3. BOOKING STATE MACHINE
// ============================================================
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['cancel_requested', 'completed'],
  cancel_requested: ['cancelled', 'confirmed'], // rejection returns to confirmed
  cancelled: [], // terminal
  completed: [], // terminal — delivery done
};

export function validateBookingTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// 4. PAYMENT STATE MACHINE
// ============================================================
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['authorized', 'settled', 'failed'],
  authorized: ['settled', 'failed', 'reversed'],
  settled: ['partially_refunded', 'refunded'],
  failed: ['pending'], // retry
  partially_refunded: ['refunded'],
  refunded: [], // terminal
  reversed: [], // terminal
};

export function validatePaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// 5. DEAL STATE MACHINE
// ============================================================
export const DEAL_TRANSITIONS: Record<DealStage, DealStage[]> = {
  initiated: ['documents', 'cancelled'],
  documents: ['finance', 'cancelled'],
  finance: ['pdi', 'cancelled'],
  pdi: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function validateDealTransition(from: DealStage, to: DealStage): boolean {
  return DEAL_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// 6. PRICING CALCULATION ENGINE
// ============================================================
export class PricingEngine {
  /**
   * Recalculates quotation totals strictly on server side.
   * Client-submitted totals are ignored to prevent manipulation.
   */
  static calculateQuotationTotals(
    items: Array<{
      itemType: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
      taxRatePercent?: number;
    }>
  ): QuotationTotals {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let feesTotal = 0;

    for (const item of items) {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const discount = item.discountAmount || 0;
      const taxRate = (item.taxRatePercent ?? 18) / 100;

      const itemNet = Math.max(0, price * qty - discount);
      const itemTax = itemNet * taxRate;

      subtotal += price * qty;
      discountTotal += discount;
      taxTotal += itemTax;

      if (item.itemType === 'fee') {
        feesTotal += price * qty;
      }
    }

    const grandTotal = Math.round((subtotal - discountTotal + taxTotal + feesTotal) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      feesTotal: Math.round(feesTotal * 100) / 100,
      grandTotal,
    };
  }

  /**
   * Validates if a requested discount requires manager approval
   */
  static validateDiscount(
    discountAmount: number,
    dealValue: number,
    role: string
  ): { allowed: boolean; requiresApproval: boolean; maxAllowedPercent: number } {
    const discountPercent = dealValue > 0 ? (discountAmount / dealValue) * 100 : 0;

    // Rule matrix by role
    const thresholds: Record<string, number> = {
      sales_executive: 2.0,   // up to 2% auto-allowed
      branch_manager: 7.5,    // up to 7.5% auto-allowed
      tenant_admin: 100.0,    // full authority
      platform_admin: 100.0,
    };

    const maxAllowed = thresholds[role] ?? 0;

    if (discountPercent <= maxAllowed) {
      return { allowed: true, requiresApproval: false, maxAllowedPercent: maxAllowed };
    }

    return { allowed: false, requiresApproval: true, maxAllowedPercent: maxAllowed };
  }
}
