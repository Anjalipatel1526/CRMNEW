import { describe, it, expect } from 'vitest';
import { PricingEngine } from '@crm/business-rules';

describe('PricingEngine Unit Tests', () => {
  it('correctly calculates subtotal, discounts, taxes, and grand totals', () => {
    const items = [
      {
        itemType: 'vehicle',
        quantity: 1,
        unitPrice: 2000000,
        discountAmount: 50000,
        taxRatePercent: 18,
      },
      {
        itemType: 'accessory',
        quantity: 2,
        unitPrice: 15000,
        discountAmount: 0,
        taxRatePercent: 18,
      },
    ];

    const totals = PricingEngine.calculateQuotationTotals(items);

    expect(totals.subtotal).toBe(2030000);
    expect(totals.discountTotal).toBe(50000);
    expect(totals.taxTotal).toBeGreaterThan(0);
    expect(totals.grandTotal).toBeGreaterThan(totals.subtotal - totals.discountTotal);
  });

  it('enforces discount authorization thresholds per role', () => {
    // 1% discount on 20 Lakh = 20,000 -> allowed for sales executive (limit 2%)
    const check1 = PricingEngine.validateDiscount(20000, 2000000, 'sales_executive');
    expect(check1.allowed).toBe(true);
    expect(check1.requiresApproval).toBe(false);

    // 5% discount on 20 Lakh = 100,000 -> exceeds sales executive (2%), requires manager approval
    const check2 = PricingEngine.validateDiscount(100000, 2000000, 'sales_executive');
    expect(check2.allowed).toBe(false);
    expect(check2.requiresApproval).toBe(true);

    // 5% discount is auto-approved for branch manager (limit 7.5%)
    const check3 = PricingEngine.validateDiscount(100000, 2000000, 'branch_manager');
    expect(check3.allowed).toBe(true);
    expect(check3.requiresApproval).toBe(false);
  });
});
