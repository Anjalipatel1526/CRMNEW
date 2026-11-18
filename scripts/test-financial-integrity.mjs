import { PricingEngine } from '../packages/business-rules/src/index.ts';

async function runFinancialIntegrityTests() {
  console.log('='.repeat(80));
  console.log('TESTING PHASE C: FINANCIAL CALCULATION INTEGRITY & CONVERSION FIDELITY');
  console.log('='.repeat(80));

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[✅ PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`[❌ FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // 1. Vehicle Only
  const itemsVehOnly = [
    { itemType: 'vehicle', description: 'Sedan Base', unitPrice: 1000000, quantity: 1, taxRatePercent: 18 }
  ];
  const qTotals1 = PricingEngine.calculateQuotationTotals(itemsVehOnly);
  const dTotals1 = PricingEngine.convertQuotationToDealTotals(qTotals1);
  assert('Vehicle only: Quotation total equals Converted Deal total', qTotals1.grandTotal === dTotals1.grandTotal, `₹${qTotals1.grandTotal}`);
  assert('Vehicle only: Grand total is exactly ₹1,180,000 (Base + 18% GST)', qTotals1.grandTotal === 1180000);

  // 2. Vehicle + Accessories
  const itemsVehAcc = [
    { itemType: 'vehicle', description: 'Sedan Base', unitPrice: 1000000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'accessory', description: 'Alloy Wheels', unitPrice: 50000, quantity: 1, taxRatePercent: 18 }
  ];
  const qTotals2 = PricingEngine.calculateQuotationTotals(itemsVehAcc);
  const dTotals2 = PricingEngine.convertQuotationToDealTotals(qTotals2);
  assert('Vehicle + Accessories: Quotation equals Deal total', qTotals2.grandTotal === dTotals2.grandTotal, `₹${qTotals2.grandTotal}`);
  assert('Vehicle + Accessories: Subtotal is ₹1,050,000 & Tax is ₹189,000', qTotals2.subtotal === 1050000 && qTotals2.taxTotal === 189000);

  // 3. Vehicle + Statutory Fees (Fee Double-Counting Test)
  const itemsVehFee = [
    { itemType: 'vehicle', description: 'Sedan Base', unitPrice: 1000000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'fee', description: 'RTO Registration', unitPrice: 45000, quantity: 1, taxRatePercent: 0 }
  ];
  const qTotals3 = PricingEngine.calculateQuotationTotals(itemsVehFee);
  const dTotals3 = PricingEngine.convertQuotationToDealTotals(qTotals3);
  assert('Vehicle + Fees: Fees added EXACTLY ONCE (No Double-Counting)', qTotals3.grandTotal === 1225000, `₹${qTotals3.grandTotal}`);
  assert('Vehicle + Fees: Quotation equals Deal total', qTotals3.grandTotal === dTotals3.grandTotal);
  assert('Vehicle + Fees: feesTotal is separated from subtotal', qTotals3.subtotal === 1000000 && qTotals3.feesTotal === 45000);

  // 4. Vehicle + Warranty (VULN-04 Regression Test)
  const itemsVehWar = [
    { itemType: 'vehicle', description: 'Sedan Base', unitPrice: 1000000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'warranty', description: '5-Year Extended Warranty', unitPrice: 35000, quantity: 1, taxRatePercent: 18 }
  ];
  const qTotals4 = PricingEngine.calculateQuotationTotals(itemsVehWar);
  const dTotals4 = PricingEngine.convertQuotationToDealTotals(qTotals4);
  assert('Vehicle + Warranty: Warranty line item PRESERVED in Deal conversion (VULN-04 fix)', qTotals4.grandTotal === dTotals4.grandTotal, `Quote: ₹${qTotals4.grandTotal}, Deal: ₹${dTotals4.grandTotal}`);
  assert('Vehicle + Warranty: Deal breakdown contains warrantyTotal', dTotals4.warrantyTotal === 35000);

  // 5. Vehicle + Insurance (VULN-04 Regression Test)
  const itemsVehIns = [
    { itemType: 'vehicle', description: 'Sedan Base', unitPrice: 1000000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'insurance', description: 'Zero-Depreciation Insurance', unitPrice: 42000, quantity: 1, taxRatePercent: 18 }
  ];
  const qTotals5 = PricingEngine.calculateQuotationTotals(itemsVehIns);
  const dTotals5 = PricingEngine.convertQuotationToDealTotals(qTotals5);
  assert('Vehicle + Insurance: Insurance line item PRESERVED in Deal conversion (VULN-04 fix)', qTotals5.grandTotal === dTotals5.grandTotal, `Quote: ₹${qTotals5.grandTotal}, Deal: ₹${dTotals5.grandTotal}`);
  assert('Vehicle + Insurance: Deal breakdown contains insuranceTotal', dTotals5.insuranceTotal === 42000);

  // 6. Vehicle + Service Package (VULN-04 Regression Test)
  const itemsVehSvc = [
    { itemType: 'vehicle', description: 'Sedan Base', unitPrice: 1000000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'service', description: '3-Year Prepaid Maintenance', unitPrice: 28000, quantity: 1, taxRatePercent: 18 }
  ];
  const qTotals6 = PricingEngine.calculateQuotationTotals(itemsVehSvc);
  const dTotals6 = PricingEngine.convertQuotationToDealTotals(qTotals6);
  assert('Vehicle + Service: Service line item PRESERVED in Deal conversion (VULN-04 fix)', qTotals6.grandTotal === dTotals6.grandTotal, `Quote: ₹${qTotals6.grandTotal}, Deal: ₹${dTotals6.grandTotal}`);
  assert('Vehicle + Service: Deal breakdown contains servicesTotal', dTotals6.servicesTotal === 28000);

  // 7. Complete Dealership Bundle (Vehicle + Accessory + Fee + Warranty + Insurance + Service + Discount)
  const itemsBundle = [
    { itemType: 'vehicle', description: 'SUV Luxury', unitPrice: 2000000, quantity: 1, taxRatePercent: 28 },
    { itemType: 'accessory', description: 'Roof Rails & Mats', unitPrice: 40000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'warranty', description: 'Extended Warranty', unitPrice: 50000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'insurance', description: 'Comprehensive Insurance', unitPrice: 65000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'service', description: 'Service Pack', unitPrice: 30000, quantity: 1, taxRatePercent: 18 },
    { itemType: 'fee', description: 'RTO Road Tax & Smart Card', unitPrice: 95000, quantity: 1, taxRatePercent: 0 },
  ];
  const qBundle = PricingEngine.calculateQuotationTotals(itemsBundle);
  const dBundle = PricingEngine.convertQuotationToDealTotals(qBundle);
  assert('Complex Bundle: Quotation grand total matches Deal grand total exactly', qBundle.grandTotal === dBundle.grandTotal, `Quote: ₹${qBundle.grandTotal}, Deal: ₹${dBundle.grandTotal}`);
  assert('Complex Bundle: All line item components sum up to subtotal + fees', (dBundle.vehiclePrice + dBundle.accessoriesTotal + dBundle.warrantyTotal + dBundle.insuranceTotal + dBundle.servicesTotal) === qBundle.subtotal);

  // 8. Trade-In Credit Application
  const qTradeIn = PricingEngine.calculateQuotationTotals(itemsVehOnly, { tradeInCredit: 250000 });
  const dTradeIn = PricingEngine.convertQuotationToDealTotals(qTradeIn);
  assert('Trade-in credit reduces grand total by exactly trade-in amount', qTradeIn.grandTotal === (1180000 - 250000), `₹${qTradeIn.grandTotal}`);
  assert('Trade-in credit: Quotation equals Deal total', qTradeIn.grandTotal === dTradeIn.grandTotal);

  // 9. Payment Reconciliation (Partial & Full Payments)
  const dPartial = PricingEngine.convertQuotationToDealTotals(qTotals1, { amountPaid: 500000 });
  assert('Partial Payment: balanceDue is correctly calculated (₹1,180,000 - ₹500,000 = ₹680,000)', dPartial.balanceDue === 680000);

  const dFull = PricingEngine.convertQuotationToDealTotals(qTotals1, { amountPaid: 1180000 });
  assert('Full Payment: balanceDue is exactly ₹0', dFull.balanceDue === 0);

  // 10. Discount Validation Edge Cases (DEF-018)
  const zeroDealDiscount = PricingEngine.validateDiscount(100, 0, 'sales_executive');
  assert('DEF-018: Discount on ₹0 deal is REJECTED (requiresApproval: true)', zeroDealDiscount.allowed === false && zeroDealDiscount.requiresApproval === true);

  const salesRepOverDiscount = PricingEngine.validateDiscount(30000, 1000000, 'sales_executive'); // 3% on 1M (limit is 2%)
  assert('Sales Executive: 3% discount requires approval (max 2%)', salesRepOverDiscount.allowed === false && salesRepOverDiscount.requiresApproval === true);

  const branchMgrAllowed = PricingEngine.validateDiscount(50000, 1000000, 'branch_manager'); // 5% on 1M (limit is 7.5%)
  assert('Branch Manager: 5% discount auto-approved (limit 7.5%)', branchMgrAllowed.allowed === true && branchMgrAllowed.requiresApproval === false);

  const financeMgrAllowed = PricingEngine.validateDiscount(95000, 1000000, 'finance_manager'); // 9.5% on 1M (limit is 10%)
  assert('Finance Manager: 9.5% discount auto-approved (limit 10%)', financeMgrAllowed.allowed === true && financeMgrAllowed.requiresApproval === false);

  console.log('='.repeat(80));
  console.log(`TOTAL FINANCIAL INTEGRITY TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('='.repeat(80));
}

runFinancialIntegrityTests().catch(console.error);
