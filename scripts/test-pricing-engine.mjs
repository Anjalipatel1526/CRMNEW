/**
 * Comprehensive Automated Financial Integrity Test Suite
 * Tests all mandatory calculation scenarios, edge cases, precision, and integration.
 */

import { PricingEngine } from '../packages/business-rules/src/index.ts';

function runFinancialTests() {
  console.log('='.repeat(80));
  console.log('AUTHORITATIVE FINANCIAL CALCULATION ENGINE TEST SUITE');
  console.log('='.repeat(80));

  let results = [];
  let passedCount = 0;

  function assert(name, condition, expected, actual) {
    const passed = Boolean(condition);
    if (passed) passedCount++;
    results.push({ name, expected, actual, passed });
  }

  // 1. Base price only
  {
    const items = [{ itemType: 'vehicle', quantity: 1, unitPrice: 1500000, discountAmount: 0, taxRatePercent: 18 }];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 1: Base price only',
      totals.subtotal === 1500000 && totals.feesTotal === 0 && totals.taxTotal === 270000 && totals.grandTotal === 1770000,
      'Subtotal: 15,00,000, Tax: 2,70,000, Grand: 17,70,000',
      `Subtotal: ${totals.subtotal}, Tax: ${totals.taxTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 2. Base price + one fee (Fee included EXACTLY ONCE, never double-counted)
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 2000000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 150000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    const feeNotDoubleCounted = totals.grandTotal === 2510000 && totals.subtotal === 2000000;
    assert(
      'Test 2: Base price + one fee (No Double-Counting)',
      feeNotDoubleCounted,
      'Subtotal: 20,00,000, Fees: 1,50,000, Grand: 25,10,000 (NOT 26,60,000)',
      `Subtotal: ${totals.subtotal}, Fees: ${totals.feesTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 3. Base price + multiple fees
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 50000, discountAmount: 0, taxRatePercent: 0 },
      { itemType: 'fee', quantity: 1, unitPrice: 25000, discountAmount: 0, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 3: Base price + multiple fees',
      totals.feesTotal === 75000 && totals.grandTotal === 1259500,
      'FeesTotal: 75,000, GrandTotal: 12,59,500',
      `FeesTotal: ${totals.feesTotal}, GrandTotal: ${totals.grandTotal}`
    );
  }

  // 4. Base price + accessories
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1200000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'accessory', quantity: 2, unitPrice: 25000, discountAmount: 0, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 4: Base price + accessories',
      totals.subtotal === 1250000 && totals.accessoriesTotal === 50000 && totals.grandTotal === 1475000,
      'Subtotal: 12,50,000, Accessories: 50,000, Grand: 14,75,000',
      `Subtotal: ${totals.subtotal}, Accessories: ${totals.accessoriesTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 5. Fixed discount
  {
    const items = [{ itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 50000, taxRatePercent: 18 }];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 5: Fixed discount',
      totals.discountTotal === 50000 && totals.taxTotal === 171000 && totals.grandTotal === 1121000,
      'Discount: 50,000, Tax: 1,71,000, Grand: 11,21,000',
      `Discount: ${totals.discountTotal}, Tax: ${totals.taxTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 6. Percentage discount
  {
    const price = 800000;
    const discount = (price * 5) / 100; // 40,000
    const items = [{ itemType: 'vehicle', quantity: 1, unitPrice: price, discountAmount: discount, taxRatePercent: 18 }];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 6: Percentage discount (5%)',
      totals.discountTotal === 40000 && totals.grandTotal === 896800,
      'Discount: 40,000, Grand: 8,96,800',
      `Discount: ${totals.discountTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 7. Discount + fees (No Double Counting)
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 2000000, discountAmount: 100000, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 80000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 7: Discount + fees (No Double Counting)',
      totals.subtotal === 2000000 && totals.feesTotal === 80000 && totals.grandTotal === 2322000,
      'Subtotal: 20,00,000, Fees: 80,000, Grand: 23,22,000',
      `Subtotal: ${totals.subtotal}, Fees: ${totals.feesTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 8. Tax-exclusive quotation
  {
    const items = [{ itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 0, taxRatePercent: 28 }];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 8: Tax-exclusive quotation (28% GST)',
      totals.taxTotal === 280000 && totals.grandTotal === 1280000,
      'Tax: 2,80,000, Grand: 12,80,000',
      `Tax: ${totals.taxTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 9. Non-taxable statutory fee
  {
    const items = [{ itemType: 'fee', quantity: 1, unitPrice: 50000, discountAmount: 0, taxRatePercent: 0 }];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 9: Non-taxable statutory fee (0% Tax)',
      totals.taxTotal === 0 && totals.feesTotal === 50000 && totals.grandTotal === 50000,
      'Tax: 0, Fees: 50,000, Grand: 50,000',
      `Tax: ${totals.taxTotal}, Fees: ${totals.feesTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 10. Zero-value fee
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 0, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 10: Zero-value fee handling',
      totals.feesTotal === 0 && totals.grandTotal === 1180000,
      'Fees: 0, Grand: 11,80,000',
      `Fees: ${totals.feesTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 11. Large monetary value (Luxury multi-crore transaction)
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 35000000, discountAmount: 500000, taxRatePercent: 28 },
      { itemType: 'fee', quantity: 1, unitPrice: 4200000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 11: Multi-crore high precision calculation',
      totals.subtotal === 35000000 && totals.feesTotal === 4200000 && totals.grandTotal === 48360000,
      'Subtotal: 3.5 Cr, Fees: 42 L, Grand: 4.836 Cr',
      `Subtotal: ${totals.subtotal}, Fees: ${totals.feesTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 12. Decimal monetary values (Paise rounding accuracy)
  {
    const items = [
      { itemType: 'accessory', quantity: 3, unitPrice: 1234.56, discountAmount: 10.50, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 12: Decimal paise rounding without floating point drift',
      totals.subtotal === 3703.68 && totals.taxTotal === 664.77 && totals.grandTotal === 4357.95,
      'Subtotal: 3703.68, Tax: 664.77, Grand: 4357.95',
      `Subtotal: ${totals.subtotal}, Tax: ${totals.taxTotal}, Grand: ${totals.grandTotal}`
    );
  }

  // 13. Input validation rejects invalid values
  {
    const invalidItems = [
      { itemType: 'vehicle', quantity: 1, unitPrice: -50000, discountAmount: 0 },
      { itemType: 'accessory', quantity: 1, unitPrice: 1000, discountAmount: 2000 },
      { itemType: 'fee', quantity: -1, unitPrice: 500 },
    ];
    const validation = PricingEngine.validateQuotationItems(invalidItems);
    assert(
      'Test 13: Strict validation rejects negative price and excessive discount',
      validation.valid === false && validation.errors.length >= 3,
      'Valid: false with structured validation errors',
      `Valid: ${validation.valid}, Errors detected: ${validation.errors.length} (${validation.errors.join('; ')})`
    );
  }

  // 14. Convert quotation to deal totals
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1500000, discountAmount: 25000, taxRatePercent: 18 },
      { itemType: 'accessory', quantity: 1, unitPrice: 40000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 120000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const quoteTotals = PricingEngine.calculateQuotationTotals(items);
    const dealTotals = PricingEngine.convertQuotationToDealTotals(quoteTotals, {
      tradeInCredit: 200000,
      amountPaid: 50000,
    });
    assert(
      'Test 14: Quotation to Deal conversion consistency',
      dealTotals.grandTotal === 1707700 && dealTotals.balanceDue === 1657700 && dealTotals.feesTotal === 120000,
      'Grand: 17,07,700, BalanceDue: 16,57,700, Fees: 1,20,000',
      `Grand: ${dealTotals.grandTotal}, BalanceDue: ${dealTotals.balanceDue}, Fees: ${dealTotals.feesTotal}`
    );
  }

  // 15. Discount authorization thresholds
  {
    const check1 = PricingEngine.validateDiscount(20000, 2000000, 'sales_executive'); // 1% <= 2%
    const check2 = PricingEngine.validateDiscount(100000, 2000000, 'sales_executive'); // 5% > 2%
    const check3 = PricingEngine.validateDiscount(100000, 2000000, 'branch_manager');  // 5% <= 7.5%
    assert(
      'Test 15: Discount role authorization thresholds',
      check1.allowed === true && check2.allowed === false && check3.allowed === true,
      'Check1: allowed, Check2: denied (requires approval), Check3: allowed',
      `Check1: ${check1.allowed}, Check2: ${check2.allowed}, Check3: ${check3.allowed}`
    );
  }

  // 16. NaN and Infinity resilience
  {
    const items = [
      { itemType: 'vehicle', quantity: NaN, unitPrice: NaN, discountAmount: Infinity, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    assert(
      'Test 16: Safe handling of NaN and Infinity without crashing',
      !isNaN(totals.grandTotal) && isFinite(totals.grandTotal) && totals.grandTotal === 0,
      'Safe fallback to 0 (non-NaN, non-Infinity)',
      `Grand: ${totals.grandTotal}`
    );
  }

  // 17. Trade-in credit application
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1000000, discountAmount: 0, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 50000, discountAmount: 0, taxRatePercent: 0 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items, { tradeInCredit: 300000 });
    // Total: 10,00,000 + 50,000 + 1,80,000 - 3,00,000 = 9,30,000
    assert(
      'Test 17: Trade-in credit applied accurately',
      totals.grandTotal === 930000 && totals.tradeInCredit === 300000,
      'Grand: 9,30,000, TradeIn: 3,00,000',
      `Grand: ${totals.grandTotal}, TradeIn: ${totals.tradeInCredit}`
    );
  }

  // 18. Line item calculator accuracy
  {
    const line = PricingEngine.calculateLineItem({
      itemType: 'accessory',
      quantity: 4,
      unitPrice: 5000,
      discountAmount: 2000,
      taxRatePercent: 18,
    });
    // gross: 20,000, net: 18,000, tax: 3,240, total: 21,240
    assert(
      'Test 18: Individual line item calculation',
      line.lineGross === 20000 && line.lineNet === 18000 && line.taxAmount === 3240 && line.lineTotal === 21240,
      'Gross: 20,000, Net: 18,000, Tax: 3,240, Total: 21,240',
      `Gross: ${line.lineGross}, Net: ${line.lineNet}, Tax: ${line.taxAmount}, Total: ${line.lineTotal}`
    );
  }

  // 19. Line total sum equals grand total exactly
  {
    const items = [
      { itemType: 'vehicle', quantity: 1, unitPrice: 1850000, discountAmount: 35000, taxRatePercent: 18 },
      { itemType: 'accessory', quantity: 3, unitPrice: 12500, discountAmount: 2500, taxRatePercent: 18 },
      { itemType: 'fee', quantity: 1, unitPrice: 115000, discountAmount: 0, taxRatePercent: 0 },
      { itemType: 'fee', quantity: 1, unitPrice: 15000, discountAmount: 0, taxRatePercent: 18 },
    ];
    const totals = PricingEngine.calculateQuotationTotals(items);
    const lineTotalSum = items.reduce((sum, it) => sum + PricingEngine.calculateLineItem(it).lineTotal, 0);
    assert(
      'Test 19: Sum of line items exactly equals Grand Total (Zero discrepancy)',
      Math.abs(lineTotalSum - totals.grandTotal) < 0.01,
      `Line total sum (${lineTotalSum}) === Grand total (${totals.grandTotal})`,
      `Diff: ${Math.abs(lineTotalSum - totals.grandTotal)}`
    );
  }

  // 20. Whole rupee rounding option
  {
    const items = [
      { itemType: 'accessory', quantity: 1, unitPrice: 100.49, discountAmount: 0, taxRatePercent: 18 },
    ];
    // 100.49 * 1.18 = 118.5782 -> 118.58 raw -> 119 rounded
    const totals = PricingEngine.calculateQuotationTotals(items, { roundToWholeRupee: true });
    assert(
      'Test 20: Round-to-whole-rupee accounting adjustment',
      totals.grandTotal === 119 && Math.abs(totals.roundOff) < 1,
      'Grand: 119, RoundOff: ~0.42',
      `Grand: ${totals.grandTotal}, RoundOff: ${totals.roundOff}`
    );
  }

  // Print Summary
  console.log('\nTEST EXECUTION RESULTS:');
  console.log('-'.repeat(80));
  for (const r of results) {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${symbol}] ${r.name}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}\n`);
  }
  console.log('-'.repeat(80));
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  console.log('='.repeat(80));

  if (passedCount === results.length) {
    console.log('ALL FINANCIAL INTEGRITY & CALCULATION TESTS PASSED (100% SUCCESS).');
    process.exit(0);
  } else {
    console.error('SOME FINANCIAL TESTS FAILED.');
    process.exit(1);
  }
}

runFinancialTests();
