import assert from 'assert';
import { api } from '../apps/web/src/lib/client/api-client.ts';
import { validateLeadTransition } from '../packages/business-rules/src/index.ts';

console.log('='.repeat(80));
console.log('TESTING PIPELINE INTEGRITY & APPOINTMENT WORKFLOW');
console.log('='.repeat(80));

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[✅ PASS] ${name}`);
  } catch (err) {
    console.error(`[❌ FAIL] ${name}`);
    console.error(err);
  }
}

// Test 1: validateLeadTransition enforces that 'new' cannot jump directly to 'appointment_set' without contact
test('Business Rule Engine: uncontacted "new" leads cannot transition directly to "appointment_set"', () => {
  assert.strictEqual(validateLeadTransition('new', 'appointment_set'), false);
  assert.strictEqual(validateLeadTransition('new', 'contacted'), true);
  assert.strictEqual(validateLeadTransition('contacted', 'appointment_set'), true);
});

// Test 2: Adding a customer creates a lead in "new" (New Enquiries)
test('Customer Creation: auto-generates lead strictly in "new" stage', () => {
  const newCust = api.addCustomer({
    firstName: 'Devi',
    lastName: 'Sharma',
    phone: '+91 98765 43210',
    email: 'devi.sharma@example.com',
    preferredVehicle: 'Mahindra Scorpio-N Z8L',
    budget: '₹22 - 25 Lakh',
  });

  const leads = api.getLeads();
  const customerLead = leads.find((l) => l.customerId === newCust.id);
  assert(customerLead, 'Lead must exist for new customer');
  assert.strictEqual(customerLead.status, 'new', 'Lead must start in "new" stage (New Enquiries)');
  assert.strictEqual(customerLead.preferredModel, 'Scorpio-N Z8L');
});

// Test 3: Background reconciliation must NOT advance an uncontacted lead in "new" stage
test('Background Reconciliation: untouched "new" lead remains in "new" (New Enquiries)', () => {
  const leads = api.getLeads();
  const deviLead = leads.find((l) => (l.customerName || '').includes('Devi Sharma'));
  assert(deviLead, 'Devi Sharma lead must exist');
  assert.strictEqual(deviLead.status, 'new', 'Initial status must be new');

  // Trigger pipeline reconciliation with unrelated or background appointments
  api.reconcilePipelineFromActivities([]);

  const refreshedLeads = api.getLeads();
  const refreshedDevi = refreshedLeads.find((l) => l.id === deviLead.id);
  assert.strictEqual(
    refreshedDevi.status,
    'new',
    'Lead must strictly remain in "new" (New Enquiries) until contacted'
  );
});

// Test 4: When appointment is saved, all details are captured and synced to the pipeline
test('Appointment Booking: stores all details (type, date, duration, vehicle, notes, host) and reflects in pipeline', () => {
  const customers = api.getCustomers();
  const cust = customers[0];

  const aptData = {
    customerId: cust.id,
    appointmentType: 'showroom_visit',
    scheduledAt: '2026-11-25T14:30:00.000Z',
    durationMinutes: 45,
    vehicleName: 'Mahindra XUV700 AX7L AWD',
    assignedTo: '00000000-0000-0000-0000-000000000001',
    assignedToName: 'Rajesh Patil (Senior Sales Consultant)',
    notes: 'Customer requested ADAS demo on express bypass road.',
  };

  const createdApt = api.addAppointment(aptData);
  assert(createdApt, 'Appointment must be created');
  assert.strictEqual(createdApt.appointmentType, 'showroom_visit');
  assert.strictEqual(createdApt.durationMinutes, 45);
  assert.strictEqual(createdApt.vehicleName, 'Mahindra XUV700 AX7L AWD');
  assert.strictEqual(createdApt.assignedToName, 'Rajesh Patil (Senior Sales Consultant)');
  assert.strictEqual(createdApt.notes, 'Customer requested ADAS demo on express bypass road.');

  // Check pipeline lead: uncontacted lead must remain in "new" (New Enquiries) with full appointment attached
  const leads = api.getLeads();
  const matchedLead = leads.find((l) => l.customerId === cust.id);
  assert(matchedLead, 'Lead must exist');
  assert.strictEqual(matchedLead.status, 'new', 'Uncontacted lead must remain in "new" (New Enquiries)');
  assert(matchedLead.appointment, 'Appointment details must be attached to the lead');
  assert.strictEqual(matchedLead.appointment.duration_minutes, 45);
  assert.strictEqual(matchedLead.appointment.vehicle_name, 'Mahindra XUV700 AX7L AWD');
  assert.strictEqual(matchedLead.appointment.assignee_name, 'Rajesh Patil (Senior Sales Consultant)');
  assert.strictEqual(matchedLead.appointment.notes, 'Customer requested ADAS demo on express bypass road.');

  // Once lead is contacted, scheduling an appointment advances them to 'appointment_set'
  api.updateLeadStatus(matchedLead.id, 'contacted');
  api.addAppointment({
    ...aptData,
    notes: 'Follow-up appointment after contact',
  });
  const updatedLead = api.getLeads().find((l) => l.customerId === cust.id);
  assert.strictEqual(updatedLead.status, 'appointment_set', 'Contacted lead advances to appointment_set');
});

console.log('='.repeat(80));
console.log(`TOTAL PIPELINE TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log('='.repeat(80));

if (passed !== total) {
  process.exit(1);
}

