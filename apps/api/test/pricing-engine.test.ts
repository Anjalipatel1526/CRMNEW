import { describe, it, expect } from 'vitest';
import { PricingEngine } from '@crm/business-rules';

describe('PricingEngine Unit & Financial Integrity Tests', () => {
  // 1. Base price only
  it('1. correctly calculates base price only', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1500000, discountAmount: 0, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.subtotal).toBe(1500000);
    expect(totals.feesTotal).toBe(0);
    expect(totals.discountTotal).toBe(0);
    expect(totals.taxTotal).toBe(270000); // 18% of 15,00,000
    expect(totals.grandTotal).toBe(1770000); // 15,00,000 + 2,70,000
  });

  // 2. Base price + one fee (CRITICAL: Verifies fee is included EXACTLY ONCE, never double-counted)
  it('2. includes additional fee EXACTLY ONCE without double-counting', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 2000000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 150000, discountAmount: 0, taxRatePercent: 0 }, // Statutory RTO fee
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);

    // subtotal must be base vehicle price (20,00,000), NOT 21,50,000
    expect(totals.subtotal).toBe(2000000);
    // feesTotal must be 1,50,000
    expect(totals.feesTotal).toBe(150000);
    // tax on vehicle: 18% of 20,00,000 = 3,60,000
    expect(totals.taxTotal).toBe(360000);

    // Grand total MUST be 20,00,000 + 1,50,000 + 3,60,000 = 25,10,000
    // If double-counted, it would have been 26,60,000!
    expect(totals.grandTotal).toBe(2510000);
    expect(totals.grandTotal).not.toBe(2660000);
  });

  // 3. Base price + multiple fees
  it('3. includes multiple fees correctly exactly once', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 50000, discountAmount: 0, taxRatePercent: 0 }, // RTO
      { itemType: 'fee', quantity: 1, unitPrice: 25000, discountAmount: 0, taxRatePercent: 18 }, // Logistics (taxable)
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);

    expect(totals.subtotal).toBe(1000000);
    expect(totals.feesTotal).toBe(75000);
    // Tax: 18% on vehicle (180,000) + 18% on logistics (4,500) = 184,500
    expect(totals.taxTotal).toBe(184500);
    // Grand: 1,000,000 + 75,000 + 184,500 = 1,259,500
    expect(totals.grandTotal).toBe(1259500);
  });

  // 4. Base price + accessories
  it('4. calculates base price + accessories correctly', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1200000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'accessory', quantity: 2, unitPrice: 25000, discountAmount: 0, taxRatePercent: 18 }, // 50,000
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.subtotal).toBe(1250000);
    expect(totals.accessoriesTotal).toBe(50000);
    expect(totals.feesTotal).toBe(0);
    expect(totals.taxTotal).toBe(225000); // 18% of 12,50,000
    expect(totals.grandTotal).toBe(1475000);
  });

  // 5. Fixed discount
  it('5. correctly applies fixed discount', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 50000, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.subtotal).toBe(1000000);
    expect(totals.discountTotal).toBe(50000);
    expect(totals.taxTotal).toBe(171000); // 18% of 9,50,000
    expect(totals.grandTotal).toBe(1121000); // 9,50,000 + 1,71,000
  });

  // 6. Percentage discount
  it('6. calculates percentage discount accurately', () => {
    const price = 800000;
    const discountPercent = 5;
    const discountAmount = (price * discountPercent) / 100; // 40,000
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: price, discountAmount, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.discountTotal).toBe(40000);
    expect(totals.taxTotal).toBe(136800); // 18% of 7,60,000
    expect(totals.grandTotal).toBe(896800);
  });

  // 7. Discount + fees (NO double-counting)
  it('7. combines discounts and fees without double-counting', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 2000000, discountAmount: 100000, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 80000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.subtotal).toBe(2000000);
    expect(totals.discountTotal).toBe(100000);
    expect(totals.feesTotal).toBe(80000);
    expect(totals.taxTotal).toBe(342000); // 18% of 19,00,000
    // Grand: 20,00,000 - 100,000 + 80,000 + 342,000 = 23,22,000
    expect(totals.grandTotal).toBe(2322000);
  });

  // 8. Tax-exclusive quotation
  it('8. calculates tax-exclusive pricing accurately', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 0, taxRatePercent: 28 }, // 28% GST on commercial vehicle
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.taxTotal).toBe(280000);
    expect(totals.grandTotal).toBe(1280000);
  });

  // 9. Non-taxable fee (0% tax)
  it('9. does not apply tax to non-taxable statutory fees', () => {
    const items = [
      { itemType: 'fee', quantity: 1, unitPrice: 50000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.subtotal).toBe(0);
    expect(totals.feesTotal).toBe(50000);
    expect(totals.taxTotal).toBe(0);
    expect(totals.grandTotal).toBe(50000);
  });

  // 10. Zero-value fee
  it('10. handles zero-value fees without distorting totals', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 0, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.feesTotal).toBe(0);
    expect(totals.grandTotal).toBe(1180000);
  });

  // 11. Large monetary values
  it('11. preserves precision with multi-crore luxury vehicle transactions', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 35000000, discountAmount: 500000, taxRatePercent: 28 }, // 3.5 Crore
      { itemType: 'fee', quantity: 1, unitPrice: 4200000, discountAmount: 0, taxRatePercent: 0 }, // 42 Lakh RTO
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    expect(totals.subtotal).toBe(35000000);
    expect(totals.discountTotal).toBe(500000);
    expect(totals.feesTotal).toBe(4200000);
    expect(totals.taxTotal).toBe(9660000); // 28% of 3,45,00,000
    expect(totals.grandTotal).toBe(48360000); // 3,45,00,000 + 42,00,000 + 96,60,000
  });

  // 12. Decimal monetary values (paise rounding)
  it('12. prevents floating point drift on decimal paise calculations', () => {
    const items = [
      { itemType: 'accessory', quantity: 3, unitPrice: 1234.56, discountAmount: 10.50, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    // gross: 3 * 1234.56 = 3703.68
    // net: 3703.68 - 10.50 = 3693.18
    // tax: 3693.18 * 0.18 = 664.7724 -> rounded to 664.77
    // grand: 3693.18 + 664.77 = 4357.95
    expect(totals.subtotal).toBe(3703.68);
    expect(totals.discountTotal).toBe(10.5);
    expect(totals.taxTotal).toBe(664.77);
    expect(totals.grandTotal).toBe(4357.95);
  });

  // 13. Input validation rejects invalid values
  it('13. validates input and detects negative prices and excessive discounts', () => {
    const invalidItems = [
      { itemType: 'vehicle', quantity: 1, unitPrice: -50000, discountAmount: 0 },
      { itemType: 'accessory', quantity: 1, unitPrice: 1000, discountAmount: 2000 }, // discount > price
      { itemType: 'fee', quantity: -1, unitPrice: 500 },
    ];
    const validation = PricingEngine.validateQuotationItems(invalidItems as any);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThanOrEqual(3);
  });

  // 14. Convert quotation to deal
  it('14. converts quotation totals to deal totals with 100% mathematical consistency', () => {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1500000, discountAmount: 25000, taxRatePercent: 18 },
      { itemType: 'accessory', quantity: 1, unitPrice: 40000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 120000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const quoteTotals = PricingEngine.calculateQuotationTotals(items);
    const dealTotals = PricingEngine.convertQuotationToDealTotals(quoteTotals, {
      tradeInCredit: 200000, // 2 Lakh trade-in
      amountPaid: 50000,     // 50k booking token
    });

    expect(dealTotals.vehiclePrice).toBe(1500000);
    expect(dealTotals.accessoriesTotal).toBe(40000);
    expect(dealTotals.feesTotal).toBe(120000);
    expect(dealTotals.tradeInCredit).toBe(200000);
    expect(dealTotals.amountPaid).toBe(50000);

    // grandTotal = 15,00,000 + 40,000 + 1,20,000 - 25,000 + 2,72,700 - 2,00,000 = 17,07,700
    expect(dealTotals.grandTotal).toBe(1707700);
    // balanceDue = 17,07,700 - 50,000 = 16,57,700
    expect(dealTotals.balanceDue).toBe(1657700);
  });

  // 15. Discount authorization thresholds
  it('15. enforces discount authorization thresholds per role', () => {
    const check1 = PricingEngine.validateDiscount(20000, 2000000, 'sales_executive');
    expect(check1.allowed).toBe(true);

    const check2 = PricingEngine.validateDiscount(100000, 2000000, 'sales_executive');
    expect(check2.allowed).toBe(false);
    expect(check2.requiresApproval).toBe(true);

    const check3 = PricingEngine.validateDiscount(100000, 2000000, 'branch_manager');
    expect(check3.allowed).toBe(true);
  });
});
