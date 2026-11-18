import type {
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

export interface QuotationLineItemInput {
  itemType: 'vehicle' | 'accessory' | 'service' | 'fee' | 'insurance' | 'warranty' | string;
  quantity?: number;
  unitPrice?: number;
  discountAmount?: number;
  taxRatePercent?: number;
  description?: string;
  vehicleId?: string;
}

export interface QuotationCalculationOptions {
  tradeInCredit?: number;
  roundToWholeRupee?: boolean;
}

export interface FinancialValidationResult {
  valid: boolean;
  errors: string[];
}

export class PricingEngine {
  /**
   * Safe conversion of floating currency to integer minor units (paise).
   * 1 INR = 100 paise. Prevents floating point accumulation errors.
   */
  private static toPaise(amount: number | undefined | null): number {
    if (amount === undefined || amount === null || isNaN(amount) || !isFinite(amount)) {
      return 0;
    }
    return Math.round(amount * 100);
  }

  /**
   * Safe conversion from integer paise back to standard rupees (2 decimal places).
   */
  private static fromPaise(paise: number): number {
    return Number((paise / 100).toFixed(2));
  }

  /**
   * Validates quotation line items strictly before calculation.
   */
  static validateQuotationItems(items: Array<QuotationLineItemInput>): FinancialValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(items)) {
      return { valid: false, errors: ['Items must be a valid array'] };
    }

    items.forEach((item, idx) => {
      const prefix = `Item ${idx + 1} (${item.description || item.itemType || 'unnamed'})`;

      if (item.unitPrice === undefined || isNaN(item.unitPrice) || !isFinite(item.unitPrice)) {
        errors.push(`${prefix}: unitPrice is missing or invalid`);
      } else if (item.unitPrice < 0) {
        errors.push(`${prefix}: unitPrice cannot be negative`);
      }

      const qty = item.quantity ?? 1;
      if (isNaN(qty) || !isFinite(qty)) {
        errors.push(`${prefix}: quantity is invalid`);
      } else if (qty <= 0) {
        errors.push(`${prefix}: quantity must be greater than zero`);
      }

      if (item.discountAmount !== undefined) {
        if (isNaN(item.discountAmount) || !isFinite(item.discountAmount)) {
          errors.push(`${prefix}: discountAmount is invalid`);
        } else if (item.discountAmount < 0) {
          errors.push(`${prefix}: discountAmount cannot be negative`);
        } else {
          const gross = (item.unitPrice || 0) * qty;
          if (item.discountAmount > gross) {
            errors.push(`${prefix}: discountAmount (₹${item.discountAmount}) cannot exceed gross item value (₹${gross})`);
          }
        }
      }

      if (item.taxRatePercent !== undefined) {
        if (isNaN(item.taxRatePercent) || !isFinite(item.taxRatePercent)) {
          errors.push(`${prefix}: taxRatePercent is invalid`);
        } else if (item.taxRatePercent < 0 || item.taxRatePercent > 100) {
          errors.push(`${prefix}: taxRatePercent must be between 0% and 100%`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * AUTHORITATIVE FINANCIAL CALCULATION ENGINE
   *
   * Formally defines:
   * 1. basePrice: Total of vehicle line items.
   * 2. accessoriesTotal: Total of optional accessory line items.
   * 3. subtotal: Base goods/services subtotal (non-fee items: vehicle, accessory, service, warranty, insurance).
   * 4. feesTotal: Total statutory & administrative fees (itemType === 'fee').
   * 5. grossTotal: Total pre-discount, pre-tax value (subtotal + feesTotal).
   * 6. discountTotal: Sum of line-item discounts.
   * 7. taxTotal: Tax calculated on net discounted taxable values.
   * 8. grandTotal: (subtotal + feesTotal - discountTotal + taxTotal - tradeInCredit).
   *
   * CRITICAL GUARANTEE: Fees enter the calculation EXACTLY ONCE.
   * Fees are never bundled into subtotal and then added again.
   */
  static calculateQuotationTotals(
    items: Array<QuotationLineItemInput>,
    options?: QuotationCalculationOptions
  ): QuotationTotals {
    if (!Array.isArray(items)) {
      items = [];
    }

    let subtotalPaise = 0;       // Base non-fee items
    let basePricePaise = 0;      // Vehicle items
    let accessoriesPaise = 0;    // Accessory items
    let warrantyPaise = 0;       // Warranty items
    let insurancePaise = 0;      // Insurance items
    let servicesPaise = 0;       // Service items
    let feesTotalPaise = 0;      // Statutory & administrative fees
    let discountTotalPaise = 0;  // Discounts
    let taxTotalPaise = 0;       // Calculated taxes
    let taxableAmountPaise = 0;  // Net amounts subject to tax

    for (const item of items) {
      const qty = item.quantity && item.quantity > 0 && isFinite(item.quantity) ? item.quantity : 1;
      const unitPricePaise = PricingEngine.toPaise(item.unitPrice);
      const lineGrossPaise = unitPricePaise * qty;

      // Ensure discount does not exceed item gross
      const maxDiscountPaise = lineGrossPaise;
      const rawDiscountPaise = PricingEngine.toPaise(item.discountAmount);
      const discountPaise = Math.min(maxDiscountPaise, Math.max(0, rawDiscountPaise));

      const lineNetPaise = Math.max(0, lineGrossPaise - discountPaise);

      // Default tax: fees default to 0% (statutory RTO/registration), goods default to 18% GST
      const taxRate = item.taxRatePercent !== undefined && isFinite(item.taxRatePercent)
        ? Math.max(0, Math.min(100, item.taxRatePercent))
        : (item.itemType === 'fee' ? 0 : 18);

      const lineTaxPaise = Math.round((lineNetPaise * taxRate) / 100);

      discountTotalPaise += discountPaise;
      taxTotalPaise += lineTaxPaise;

      if (taxRate > 0) {
        taxableAmountPaise += lineNetPaise;
      }

      // Explicit categorization — Fees are tracked in feesTotalPaise, NOT in subtotalPaise
      if (item.itemType === 'fee') {
        feesTotalPaise += lineGrossPaise;
      } else {
        subtotalPaise += lineGrossPaise;
        if (item.itemType === 'vehicle') {
          basePricePaise += lineGrossPaise;
        } else if (item.itemType === 'accessory') {
          accessoriesPaise += lineGrossPaise;
        } else if (item.itemType === 'warranty') {
          warrantyPaise += lineGrossPaise;
        } else if (item.itemType === 'insurance') {
          insurancePaise += lineGrossPaise;
        } else if (item.itemType === 'service') {
          servicesPaise += lineGrossPaise;
        }
      }
    }

    const tradeInCreditPaise = PricingEngine.toPaise(options?.tradeInCredit);

    // Grand total: Subtotal (non-fee) + Fees (once) - Discounts + Taxes - Trade-in Credit
    let grandTotalPaise = subtotalPaise + feesTotalPaise - discountTotalPaise + taxTotalPaise - tradeInCreditPaise;
    grandTotalPaise = Math.max(0, grandTotalPaise);

    let roundOff = 0;
    if (options?.roundToWholeRupee) {
      const roundedRupees = Math.round(grandTotalPaise / 100);
      const roundedPaise = roundedRupees * 100;
      roundOff = PricingEngine.fromPaise(roundedPaise - grandTotalPaise);
      grandTotalPaise = roundedPaise;
    }

    const grossTotalPaise = subtotalPaise + feesTotalPaise;

    return {
      subtotal: PricingEngine.fromPaise(subtotalPaise),
      discountTotal: PricingEngine.fromPaise(discountTotalPaise),
      taxTotal: PricingEngine.fromPaise(taxTotalPaise),
      feesTotal: PricingEngine.fromPaise(feesTotalPaise),
      grandTotal: PricingEngine.fromPaise(grandTotalPaise),
      // Enriched breakdown
      basePrice: PricingEngine.fromPaise(basePricePaise),
      accessoriesTotal: PricingEngine.fromPaise(accessoriesPaise),
      warrantyTotal: PricingEngine.fromPaise(warrantyPaise),
      insuranceTotal: PricingEngine.fromPaise(insurancePaise),
      servicesTotal: PricingEngine.fromPaise(servicesPaise),
      grossTotal: PricingEngine.fromPaise(grossTotalPaise),
      taxableAmount: PricingEngine.fromPaise(taxableAmountPaise),
      tradeInCredit: PricingEngine.fromPaise(tradeInCreditPaise),
      roundOff,
    };
  }

  /**
   * Helper to compute an individual line item's net, tax, and total amounts.
   */
  static calculateLineItem(item: QuotationLineItemInput): {
    lineGross: number;
    lineNet: number;
    taxAmount: number;
    lineTotal: number;
  } {
    const qty = item.quantity && item.quantity > 0 && isFinite(item.quantity) ? item.quantity : 1;
    const unitPricePaise = PricingEngine.toPaise(item.unitPrice);
    const lineGrossPaise = unitPricePaise * qty;

    const discountPaise = Math.min(lineGrossPaise, Math.max(0, PricingEngine.toPaise(item.discountAmount)));
    const lineNetPaise = Math.max(0, lineGrossPaise - discountPaise);

    const taxRate = item.taxRatePercent !== undefined && isFinite(item.taxRatePercent)
      ? Math.max(0, Math.min(100, item.taxRatePercent))
      : (item.itemType === 'fee' ? 0 : 18);

    const taxPaise = Math.round((lineNetPaise * taxRate) / 100);
    const lineTotalPaise = lineNetPaise + taxPaise;

    return {
      lineGross: PricingEngine.fromPaise(lineGrossPaise),
      lineNet: PricingEngine.fromPaise(lineNetPaise),
      taxAmount: PricingEngine.fromPaise(taxPaise),
      lineTotal: PricingEngine.fromPaise(lineTotalPaise),
    };
  }

  /**
   * Converts quotation totals into deal financial fields with 100% mathematical consistency.
   * Guarantees that vehicle, accessories, warranty, insurance, service, and fees are all
   * accounted for with zero financial discrepancy.
   */
  static convertQuotationToDealTotals(
    quotationTotals: QuotationTotals,
    options?: { tradeInCredit?: number; amountPaid?: number }
  ): {
    vehiclePrice: number;
    accessoriesTotal: number;
    warrantyTotal: number;
    insuranceTotal: number;
    servicesTotal: number;
    feesTotal: number;
    discountTotal: number;
    taxTotal: number;
    tradeInCredit: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
  } {
    const vehiclePrice = quotationTotals.basePrice ?? quotationTotals.subtotal;
    const accessoriesTotal = quotationTotals.accessoriesTotal ?? 0;
    const warrantyTotal = quotationTotals.warrantyTotal ?? 0;
    const insuranceTotal = quotationTotals.insuranceTotal ?? 0;
    const servicesTotal = quotationTotals.servicesTotal ?? 0;
    const feesTotal = quotationTotals.feesTotal;
    const discountTotal = quotationTotals.discountTotal;
    const taxTotal = quotationTotals.taxTotal;
    const tradeInCredit = options?.tradeInCredit !== undefined
      ? options.tradeInCredit
      : (quotationTotals.tradeInCredit ?? 0);

    // Authoritative grandTotal calculation:
    // If tradeInCredit changed in options, adjust accordingly; otherwise preserve quotationTotals.grandTotal
    let grandTotalPaise: number;
    if (
      options?.tradeInCredit !== undefined &&
      options.tradeInCredit !== (quotationTotals.tradeInCredit ?? 0)
    ) {
      const subtotalPaise = PricingEngine.toPaise(quotationTotals.subtotal);
      const feesTotalPaise = PricingEngine.toPaise(feesTotal);
      const discountTotalPaise = PricingEngine.toPaise(discountTotal);
      const taxTotalPaise = PricingEngine.toPaise(taxTotal);
      const tradeInPaise = PricingEngine.toPaise(tradeInCredit);
      grandTotalPaise = Math.max(0, subtotalPaise + feesTotalPaise - discountTotalPaise + taxTotalPaise - tradeInPaise);
    } else {
      grandTotalPaise = PricingEngine.toPaise(quotationTotals.grandTotal);
    }

    const grandTotal = PricingEngine.fromPaise(grandTotalPaise);
    const amountPaid = Math.max(0, options?.amountPaid ?? 0);
    const balanceDue = Math.max(
      0,
      PricingEngine.fromPaise(grandTotalPaise - PricingEngine.toPaise(amountPaid))
    );

    return {
      vehiclePrice,
      accessoriesTotal,
      warrantyTotal,
      insuranceTotal,
      servicesTotal,
      feesTotal,
      discountTotal,
      taxTotal,
      tradeInCredit,
      grandTotal,
      amountPaid,
      balanceDue,
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
    // Zero or negative deal value: any positive discount requires approval
    if (dealValue <= 0) {
      if (discountAmount > 0) {
        return { allowed: false, requiresApproval: true, maxAllowedPercent: 0 };
      }
      return { allowed: true, requiresApproval: false, maxAllowedPercent: 0 };
    }

    const discountPercent = (discountAmount / dealValue) * 100;

    // Rule matrix by role
    const thresholds: Record<string, number> = {
      sales_executive: 2.0,   // up to 2% auto-allowed
      service_advisor: 3.0,   // up to 3% auto-allowed
      inventory_manager: 5.0, // up to 5% auto-allowed
      branch_manager: 7.5,    // up to 7.5% auto-allowed
      finance_manager: 10.0,  // up to 10% auto-allowed
      tenant_admin: 100.0,    // full authority
      platform_admin: 100.0,
      technician: 0.0,
      receptionist: 0.0,
    };

    const maxAllowed = thresholds[role] ?? 0;

    if (discountPercent <= maxAllowed) {
      return { allowed: true, requiresApproval: false, maxAllowedPercent: maxAllowed };
    }

    return { allowed: false, requiresApproval: true, maxAllowedPercent: maxAllowed };
  }
}
