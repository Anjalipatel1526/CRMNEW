import { describe, it, expect } from 'vitest';
import {
  validateLeadTransition,
  validateVehicleTransition,
  validateBookingTransition,
  validateDealTransition,
} from '@crm/business-rules';

describe('Domain State Machines Unit Tests', () => {
  it('validates lead state progression', () => {
    expect(validateLeadTransition('new', 'contacted')).toBe(true);
    expect(validateLeadTransition('contacted', 'qualified')).toBe(true);
    expect(validateLeadTransition('qualified', 'test_drive')).toBe(true);
    expect(validateLeadTransition('test_drive', 'negotiation')).toBe(true);
    expect(validateLeadTransition('negotiation', 'converted')).toBe(true);

    // Invalid backwards or jump transitions
    expect(validateLeadTransition('converted', 'new')).toBe(false);
    expect(validateLeadTransition('new', 'converted')).toBe(false);
  });

  it('validates vehicle inventory lifecycle transitions', () => {
    expect(validateVehicleTransition('available', 'reserved')).toBe(true);
    expect(validateVehicleTransition('reserved', 'sold')).toBe(true);
    expect(validateVehicleTransition('sold', 'delivered')).toBe(true);

    // Cannot jump from draft directly to delivered
    expect(validateVehicleTransition('draft', 'delivered')).toBe(false);
  });

  it('validates deal 5-gate pipeline transitions', () => {
    expect(validateDealTransition('initiated', 'documents')).toBe(true);
    expect(validateDealTransition('documents', 'finance')).toBe(true);
    expect(validateDealTransition('finance', 'pdi')).toBe(true);
    expect(validateDealTransition('pdi', 'ready')).toBe(true);
    expect(validateDealTransition('ready', 'delivered')).toBe(true);

    // Delivered is terminal
    expect(validateDealTransition('delivered', 'initiated')).toBe(false);
  });
});
