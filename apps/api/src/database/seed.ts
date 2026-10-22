import bcrypt from 'bcryptjs';
import { execute, initDb, queryOne } from './db.js';

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Initializing database schema...');
  await initDb();

  console.log('[Seed] Checking if tenant already exists...');
  const existingTenant = await queryOne('SELECT id FROM tenants WHERE slug = $1', ['apex-motors']);
  if (existingTenant) {
    console.log('[Seed] Database is already seeded. Skipping.');
    return;
  }

  console.log('[Seed] Seeding Apex Motors Dealership data...');

  // 1. Tenant
  const tenantId = 't-apex-001';
  await execute(
    `INSERT INTO tenants (id, name, slug, status, dealer_model, primary_contact_name, primary_email, primary_phone, currency, timezone, settings)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      tenantId,
      'Apex Motors Group',
      'apex-motors',
      'active',
      'mixed',
      'Vikramaditya Singhania',
      'admin@apexmotors.com',
      '+91 98200 11223',
      'INR',
      'Asia/Kolkata',
      JSON.stringify({
        taxRates: { defaultGst: 18, luxuryCess: 22 },
        documentChecklist: ['pan', 'aadhaar', 'address_proof', 'form20', 'insurance'],
        featuresEnabled: ['ai_scoring', 'copilot', 'marketing', 'service_workshop'],
      }),
    ]
  );

  // 2. Branches
  const bDowntown = 'b-dt-001';
  const bWestside = 'b-ws-002';
  await execute(
    `INSERT INTO branches (id, tenant_id, code, name, address, phone, email, timezone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
    [bDowntown, tenantId, 'DT-01', 'Apex Downtown Flagship', JSON.stringify({ line1: '42 MG Road, CBD', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }), '+91 22 2200 4400', 'downtown@apexmotors.com', 'Asia/Kolkata']
  );
  await execute(
    `INSERT INTO branches (id, tenant_id, code, name, address, phone, email, timezone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
    [bWestside, tenantId, 'WS-02', 'Apex Westside Automall', JSON.stringify({ line1: 'Link Road, Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' }), '+91 22 2600 8800', 'westside@apexmotors.com', 'Asia/Kolkata']
  );

  // 3. App Users & Passwords (bcrypt cost 10 for seeds)
  const pwdAdmin = await bcrypt.hash('Admin@12345', 10);
  const pwdMgr = await bcrypt.hash('Manager@12345', 10);
  const pwdSales = await bcrypt.hash('Sales@12345', 10);
  const pwdServ = await bcrypt.hash('Service@12345', 10);

  const uAdmin = 'u-admin-001';
  const uMgr = 'u-mgr-002';
  const uSales = 'u-sales-003';
  const uServ = 'u-serv-004';

  await execute(
    `INSERT INTO app_users (id, email, password_hash, full_name, phone, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
    [uAdmin, 'admin@apexmotors.com', pwdAdmin, 'Vikram Singhania', '+91 98200 11223']
  );
  await execute(
    `INSERT INTO app_users (id, email, password_hash, full_name, phone, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
    [uMgr, 'manager.west@apexmotors.com', pwdMgr, 'Kavita Chawla', '+91 98300 22334']
  );
  await execute(
    `INSERT INTO app_users (id, email, password_hash, full_name, phone, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
    [uSales, 'sales.john@apexmotors.com', pwdSales, 'John Fernandes', '+91 98400 33445']
  );
  await execute(
    `INSERT INTO app_users (id, email, password_hash, full_name, phone, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
    [uServ, 'service.sarah@apexmotors.com', pwdServ, 'Sarah Dsouza', '+91 98500 44556']
  );

  // 4. Memberships & Roles
  await execute(
    `INSERT INTO memberships (id, tenant_id, user_id, role_key, branch_ids, branch_scope, is_active)
     VALUES ($1, $2, $3, 'tenant_admin', $4, 'all', true)`,
    ['m-01', tenantId, uAdmin, JSON.stringify([bDowntown, bWestside])]
  );
  await execute(
    `INSERT INTO memberships (id, tenant_id, user_id, role_key, branch_ids, branch_scope, is_active)
     VALUES ($1, $2, $3, 'branch_manager', $4, 'assigned', true)`,
    ['m-02', tenantId, uMgr, JSON.stringify([bWestside])]
  );
  await execute(
    `INSERT INTO memberships (id, tenant_id, user_id, role_key, branch_ids, branch_scope, is_active)
     VALUES ($1, $2, $3, 'sales_executive', $4, 'assigned', true)`,
    ['m-03', tenantId, uSales, JSON.stringify([bDowntown])]
  );
  await execute(
    `INSERT INTO memberships (id, tenant_id, user_id, role_key, branch_ids, branch_scope, is_active)
     VALUES ($1, $2, $3, 'service_advisor', $4, 'assigned', true)`,
    ['m-04', tenantId, uServ, JSON.stringify([bDowntown])]
  );

  // 5. Vehicle Catalog
  const catalog = [
    { id: 'cat-creta-01', make: 'Hyundai', model: 'Creta', variant: 'SX (O) 1.5 Turbo DCT', year: 2024, body: 'SUV', fuel: 'petrol', trans: 'automatic', cc: 1497, specs: { horsepower: 160, panoramicSunroof: true, adasLevel: 2 } },
    { id: 'cat-nexon-02', make: 'Tata', model: 'Nexon EV', variant: 'Empowered Plus LR', year: 2023, body: 'SUV', fuel: 'electric', trans: 'automatic', cc: 0, specs: { batteryKwh: 40.5, rangeKm: 465, fastCharging: true } },
    { id: 'cat-xuv-03', make: 'Mahindra', model: 'XUV700', variant: 'AX7 Luxury Pack AWD', year: 2024, body: 'SUV', fuel: 'diesel', trans: 'automatic', cc: 2198, specs: { horsepower: 185, seating: 7, sonyAudio: true } },
    { id: 'cat-bmw-04', make: 'BMW', model: '3 Series', variant: '330Li M Sport', year: 2023, body: 'Sedan', fuel: 'petrol', trans: 'automatic', cc: 1998, specs: { horsepower: 258, longWheelbase: true, curvedDisplay: true } },
    { id: 'cat-fort-05', make: 'Toyota', model: 'Fortuner', variant: '4x4 AT Diesel', year: 2022, body: 'SUV', fuel: 'diesel', trans: 'automatic', cc: 2755, specs: { horsepower: 204, drive: '4WD', robustLadderFrame: true } },
    { id: 'cat-city-06', make: 'Honda', model: 'City', variant: 'ZX CVT', year: 2024, body: 'Sedan', fuel: 'petrol', trans: 'automatic', cc: 1498, specs: { horsepower: 121, sunroof: true, laneWatch: true } },
  ];

  for (const c of catalog) {
    await execute(
      `INSERT INTO vehicle_catalog (id, tenant_id, make, model, variant, model_year, body_type, fuel_type, transmission, engine_capacity_cc, specs)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [c.id, tenantId, c.make, c.model, c.variant, c.year, c.body, c.fuel, c.trans, c.cc, JSON.stringify(c.specs)]
    );
  }

  // 6. Vehicles in Inventory
  const vehicles = [
    { id: 'veh-101', branchId: bDowntown, catalogId: 'cat-creta-01', stock: 'STK-2024-001', vin: 'MALC851CLPM101901', reg: 'MH01EA4091', make: 'Hyundai', model: 'Creta', variant: 'SX (O) 1.5 Turbo', year: 2024, color: 'Abyss Black', km: 4200, fuel: 'Petrol', trans: 'Automatic', mode: 'owned', acq: 1780000, total: 1800000, ask: 1950000, min: 1900000, status: 'available' },
    { id: 'veh-102', branchId: bDowntown, catalogId: 'cat-nexon-02', stock: 'STK-2024-002', vin: 'MAT623055PLN203492', reg: 'MH02FD1928', make: 'Tata', model: 'Nexon EV', variant: 'Empowered Plus LR', year: 2023, color: 'Daytona Grey', km: 12500, fuel: 'Electric', trans: 'Automatic', mode: 'owned', acq: 1520000, total: 1540000, ask: 1680000, min: 1630000, status: 'available' },
    { id: 'veh-103', branchId: bDowntown, catalogId: 'cat-xuv-03', stock: 'STK-2024-003', vin: 'MA1TK2WAHN7382901', reg: 'MH01EF8821', make: 'Mahindra', model: 'XUV700', variant: 'AX7 Luxury AWD', year: 2024, color: 'Midnight Blue', km: 8900, fuel: 'Diesel', trans: 'Automatic', mode: 'owned', acq: 2250000, total: 2280000, ask: 2490000, min: 2430000, status: 'reserved' },
    { id: 'veh-104', branchId: bWestside, catalogId: 'cat-bmw-04', stock: 'STK-2024-004', vin: 'WBA5R1103MFL78291', reg: 'MH02DZ4499', make: 'BMW', model: '3 Series', variant: '330Li M Sport', year: 2023, color: 'Mineral White', km: 15200, fuel: 'Petrol', trans: 'Automatic', mode: 'consignment', acq: 4950000, total: 5020000, ask: 5650000, min: 5450000, status: 'available' },
    { id: 'veh-105', branchId: bWestside, catalogId: 'cat-fort-05', stock: 'STK-2024-005', vin: 'MBJ11JA84NM492019', reg: 'MH03CP1002', make: 'Toyota', model: 'Fortuner', variant: '4x4 AT Diesel', year: 2022, color: 'Sparkling Black', km: 34000, fuel: 'Diesel', trans: 'Automatic', mode: 'owned', acq: 3350000, total: 3420000, ask: 3700000, min: 3600000, status: 'inspection' },
    { id: 'veh-106', branchId: bDowntown, catalogId: 'cat-city-06', stock: 'STK-2024-006', vin: 'MAKGM6654N3891021', reg: 'MH01BK7733', make: 'Honda', model: 'City', variant: 'ZX CVT', year: 2024, color: 'Radiant Red', km: 6100, fuel: 'Petrol', trans: 'Automatic', mode: 'owned', acq: 1390000, total: 1410000, ask: 1520000, min: 1480000, status: 'sold' },
  ];

  for (const v of vehicles) {
    await execute(
      `INSERT INTO vehicles (id, tenant_id, branch_id, catalog_id, stock_number, vin, registration_number, make, model, variant, year, color, mileage_km, fuel_type, transmission, ownership_mode, acquisition_cost, total_cost, asking_price, minimum_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [v.id, tenantId, v.branchId, v.catalogId, v.stock, v.vin, v.reg, v.make, v.model, v.variant, v.year, v.color, v.km, v.fuel, v.trans, v.mode, v.acq, v.total, v.ask, v.min, v.status]
    );
  }

  // 7. Customers
  const customers = [
    { id: 'cust-001', branchId: bDowntown, type: 'individual', first: 'Rajesh', last: 'Sharma', email: 'rajesh.sharma@example.com', phone: '+91 98201 12345', pan: 'ABCPS1234M', company: null, addr: { city: 'Mumbai', pincode: '400050' } },
    { id: 'cust-002', branchId: bDowntown, type: 'individual', first: 'Priya', last: 'Nair', email: 'priya.nair@example.com', phone: '+91 98450 67890', pan: 'BHYPN5678K', company: null, addr: { city: 'Mumbai', pincode: '400053' } },
    { id: 'cust-003', branchId: bWestside, type: 'business', first: 'Vikram', last: 'Malhotra', email: 'vikram@nexalogistics.in', phone: '+91 99100 54321', pan: 'AAACN9876Q', company: 'Nexa Logistics Pvt Ltd', addr: { city: 'Mumbai', pincode: '400093' } },
    { id: 'cust-004', branchId: bDowntown, type: 'individual', first: 'Ananya', last: 'Sengupta', email: 'ananya.s@example.com', phone: '+91 97312 99887', pan: 'CLPAS3456F', company: null, addr: { city: 'Mumbai', pincode: '400018' } },
    { id: 'cust-005', branchId: bWestside, type: 'individual', first: 'Rohan', last: 'Verma', email: 'rohan.v@example.com', phone: '+91 98765 43210', pan: 'DFGPV7890L', company: null, addr: { city: 'Mumbai', pincode: '400058' } },
  ];

  for (const c of customers) {
    await execute(
      `INSERT INTO customers (id, tenant_id, branch_id, type, first_name, last_name, email, phone, pan_number, company_name, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [c.id, tenantId, c.branchId, c.type, c.first, c.last, c.email, c.phone, c.pan, c.company, JSON.stringify(c.addr)]
    );
  }

  // 8. Leads
  const leads = [
    { id: 'lead-001', branchId: bDowntown, customerId: 'cust-001', source: 'Google Ads', status: 'negotiation', assignedTo: uSales, bMin: 2200000, bMax: 2600000, make: 'Mahindra', model: 'XUV700', score: 88.5, notes: 'Interested in midnight blue XUV700 AX7L. Final price discussion scheduled.' },
    { id: 'lead-002', branchId: bDowntown, customerId: 'cust-002', source: 'Walk-in', status: 'test_drive', assignedTo: uSales, bMin: 1500000, bMax: 1800000, make: 'Tata', model: 'Nexon EV', score: 92.0, notes: 'Completed test drive around Bandra-Worli Sea Link. Extremely positive about EV range.' },
    { id: 'lead-003', branchId: bDowntown, customerId: 'cust-004', source: 'Website Direct', status: 'qualified', assignedTo: uSales, bMin: 1800000, bMax: 2000000, make: 'Hyundai', model: 'Creta', score: 75.0, notes: 'Looking for top variant with sunroof. Inquiring about financing options.' },
    { id: 'lead-004', branchId: bWestside, customerId: 'cust-005', source: 'Cardekho / CarWale', status: 'appointment_set', assignedTo: uMgr, bMin: 1400000, bMax: 1600000, make: 'Honda', model: 'City', score: 80.0, notes: 'Showroom appointment booked for Saturday 11 AM.' },
    { id: 'lead-005', branchId: bWestside, customerId: 'cust-003', source: 'Referral', status: 'contacted', assignedTo: uMgr, bMin: 5000000, bMax: 6000000, make: 'BMW', model: '3 Series', score: 65.0, notes: 'Corporate client interested in luxury sedan lease program.' },
  ];

  for (const l of leads) {
    await execute(
      `INSERT INTO leads (id, tenant_id, branch_id, customer_id, source, status, assigned_to, budget_min, budget_max, preferred_make, preferred_model, score, notes, next_action_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() + INTERVAL '2 days')`,
      [l.id, tenantId, l.branchId, l.customerId, l.source, l.status, l.assignedTo, l.bMin, l.bMax, l.make, l.model, l.score, l.notes]
    );
  }

  // 9. Appointments & Activities
  await execute(
    `INSERT INTO appointments (id, tenant_id, branch_id, customer_id, lead_id, vehicle_id, assigned_to, appointment_type, scheduled_at, duration_minutes, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'test_drive', NOW() + INTERVAL '2 hours', 45, 'confirmed', 'Test drive on Western Express Highway')`,
    ['apt-001', tenantId, bDowntown, 'cust-002', 'lead-002', 'veh-102', uSales]
  );
  await execute(
    `INSERT INTO appointments (id, tenant_id, branch_id, customer_id, lead_id, vehicle_id, assigned_to, appointment_type, scheduled_at, duration_minutes, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'showroom_visit', NOW() + INTERVAL '1 day', 30, 'scheduled', 'Pricing and paperwork session')`,
    ['apt-002', tenantId, bDowntown, 'cust-001', 'lead-001', 'veh-103', uSales]
  );

  await execute(
    `INSERT INTO activities (id, tenant_id, entity_type, entity_id, type, subject, notes, occurred_at, created_by)
     VALUES ($1, $2, 'lead', $3, 'call', 'Initial discovery call', 'Customer confirmed requirement for 7-seater SUV with diesel automatic.', NOW() - INTERVAL '3 days', $4)`,
    ['act-01', tenantId, 'lead-001', uSales]
  );
  await execute(
    `INSERT INTO activities (id, tenant_id, entity_type, entity_id, type, subject, notes, occurred_at, created_by)
     VALUES ($1, $2, 'lead', $3, 'meeting', 'Showroom consultation', 'Showcased XUV700 AX7L in Midnight Blue. Offered Rs 24.90L deal.', NOW() - INTERVAL '1 day', $4)`,
    ['act-02', tenantId, 'lead-001', uSales]
  );

  // 10. Quotations, Deals, Bookings, Payments, Invoices
  await execute(
    `INSERT INTO quotations (id, tenant_id, branch_id, customer_id, quote_number, revision, status, subtotal, discount_total, tax_total, fees_total, grand_total, valid_until, created_by)
     VALUES ($1, $2, $3, $4, 'Q-2024-001', 1, 'accepted', 2490000, 40000, 441000, 35000, 2926000, NOW() + INTERVAL '15 days', $5)`,
    ['quo-001', tenantId, bDowntown, 'cust-001', uSales]
  );

  await execute(
    `INSERT INTO deals (id, tenant_id, branch_id, customer_id, vehicle_id, quotation_id, deal_number, stage, vehicle_price, discount_total, tax_total, fees_total, grand_total, amount_paid, balance_due, finance_type, lender_name, loan_amount, loan_status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'DL-2024-001', 'finance', 2490000, 40000, 441000, 35000, 2926000, 100000, 2826000, 'loan', 'HDFC Bank', 2000000, 'approved', $7)`,
    ['deal-001', tenantId, bDowntown, 'cust-001', 'veh-103', 'quo-001', uSales]
  );

  await execute(
    `INSERT INTO bookings (id, tenant_id, branch_id, customer_id, vehicle_id, quotation_id, booking_number, status, booking_amount_required, amount_paid)
     VALUES ($1, $2, $3, $4, $5, $6, 'BK-2024-001', 'confirmed', 100000, 100000)`,
    ['bk-001', tenantId, bDowntown, 'cust-001', 'veh-103', 'quo-001']
  );

  await execute(
    `INSERT INTO payments (id, tenant_id, branch_id, customer_id, booking_id, deal_id, payment_number, method, status, amount, reference_number, notes, recorded_by)
     VALUES ('pmt-001', $1, $2, $3, 'bk-001', 'deal-001', 'PMT-2024-001', 'upi', 'settled', 100000, 'UPI/2024/991823019', 'Booking token advance for Mahindra XUV700', $4)`,
    [tenantId, bDowntown, 'cust-001', uSales]
  );

  await execute(
    `INSERT INTO invoices (id, tenant_id, branch_id, customer_id, deal_id, invoice_number, status, subtotal, tax_total, grand_total, paid_amount, balance_due)
     VALUES ('inv-001', $1, $2, $3, 'deal-001', 'INV-2024-001', 'partially_paid', 2450000, 441000, 2926000, 100000, 2826000)`,
    [tenantId, bDowntown, 'cust-001']
  );

  // 11. Service appointments and job cards
  await execute(
    `INSERT INTO service_appointments (id, tenant_id, branch_id, customer_id, vehicle_id, service_type, preferred_date, status, customer_notes)
     VALUES ('srv-apt-01', $1, $2, $3, $4, 'scheduled_service', CURRENT_DATE + 1, 'confirmed', '10,000 km general periodic service and wheel alignment')`,
    [tenantId, bDowntown, 'cust-004', 'veh-101']
  );

  await execute(
    `INSERT INTO job_cards (id, tenant_id, branch_id, customer_id, vehicle_id, job_card_number, status, intake_odometer, intake_fuel_level, customer_complaints, labour_total, parts_total, tax_total, grand_total)
     VALUES ('jc-001', $1, $2, $3, $4, 'JC-2024-001', 'in_progress', 10250, '75%', 'Slight brake squeak at low speeds', 2500, 4200, 1206, 7906)`,
    [tenantId, bDowntown, 'cust-004', 'veh-101']
  );

  // 12. SaaS Plans
  await execute(
    `INSERT INTO plans (id, name, slug, price_monthly, price_annual, currency, max_users, max_branches, max_vehicles, storage_limit_mb, features)
     VALUES
     ('plan-starter', 'Starter Dealership', 'starter', 4999, 49990, 'INR', 5, 1, 50, 5000, '{"crm": true, "inventory": true, "ai": false}'),
     ('plan-pro', 'Professional Enterprise', 'professional', 12999, 129990, 'INR', 25, 5, 250, 25000, '{"crm": true, "inventory": true, "salesDesk": true, "finance": true, "service": true, "ai": true}'),
     ('plan-unlimited', 'Multi-Dealership Ultimate', 'unlimited', 24999, 249990, 'INR', 100, 20, 1000, 100000, '{"all": true}')
     ON CONFLICT (slug) DO NOTHING`
  );

  await execute(
    `INSERT INTO subscriptions (id, tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
     VALUES ('sub-001', $1, 'plan-pro', 'active', 'monthly', NOW(), NOW() + INTERVAL '30 days')
     ON CONFLICT (tenant_id) DO NOTHING`,
    [tenantId]
  );

  console.log('[Seed] Database successfully populated with realistic dealership data!');
}

// Run if called directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
