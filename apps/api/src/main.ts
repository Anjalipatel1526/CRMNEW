import express, { Request, Response } from 'express';
import cors from 'cors';
import { query, queryOne, execute } from './database/db';
import { PricingEngine, validateLeadTransition, validateVehicleTransition } from '@crm/business-rules';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Car Dealership Enterprise API',
    version: '1.0.0',
  });
});

// ==========================================
// 1. Auth & Tenancy
// ==========================================
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await queryOne(
      'SELECT id, email, full_name, role, branch_id FROM app_users WHERE email = $1',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or credentials' });
    }

    // In production, compare with bcrypt. For demo persona instant switch, return user and mock token
    res.json({
      token: `mock_jwt_${user.id}_${Date.now()}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        branchId: user.branch_id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/branches', async (req: Request, res: Response) => {
  try {
    const branches = await query('SELECT * FROM branches ORDER BY name ASC');
    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Customers
// ==========================================
app.get('/api/v1/customers', async (req: Request, res: Response) => {
  try {
    const customers = await query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM leads WHERE customer_id = c.id) as total_leads,
        (SELECT COUNT(*) FROM deals WHERE customer_id = c.id) as total_deals
       FROM customers c 
       ORDER BY c.created_at DESC`
    );
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/customers', async (req: Request, res: Response) => {
  try {
    const { tenantId, branchId, firstName, lastName, email, phone, customerType, pan, aadhar } = req.body;
    const result = await query(
      `INSERT INTO customers (
        tenant_id, branch_id, first_name, last_name, email, phone, customer_type, pan, aadhar, kyc_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified')
      RETURNING *`,
      [tenantId || 'd1000000-0000-0000-0000-000000000001', branchId || 'b1000000-0000-0000-0000-000000000001', firstName, lastName, email, phone, customerType || 'individual', pan || null, aadhar || null]
    );
    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Leads (CRM)
// ==========================================
app.get('/api/v1/leads', async (req: Request, res: Response) => {
  try {
    const leads = await query(
      `SELECT l.*, 
        c.first_name || ' ' || c.last_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        u.full_name as assigned_to_name
       FROM leads l
       LEFT JOIN customers c ON l.customer_id = c.id
       LEFT JOIN app_users u ON l.assigned_to_id = u.id
       ORDER BY l.created_at DESC`
    );
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/leads', async (req: Request, res: Response) => {
  try {
    const {
      customerId, branchId, assignedToId, source, preferredMake, preferredModel,
      preferredFuelType, budgetMin, budgetMax, score, notes
    } = req.body;

    const result = await query(
      `INSERT INTO leads (
        tenant_id, branch_id, customer_id, assigned_to_id, source,
        preferred_make, preferred_model, preferred_fuel_type,
        budget_min, budget_max, score, status, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new', $12
      ) RETURNING *`,
      [
        'd1000000-0000-0000-0000-000000000001',
        branchId || 'b1000000-0000-0000-0000-000000000001',
        customerId,
        assignedToId || 'u1000000-0000-0000-0000-000000000002',
        source || 'Walk-in Showroom',
        preferredMake,
        preferredModel,
        preferredFuelType || 'Petrol',
        Number(budgetMin) || 0,
        Number(budgetMax) || 0,
        Number(score) || 75,
        notes || ''
      ]
    );

    res.status(201).json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/v1/leads/:id/stage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const currentLead = await queryOne('SELECT status FROM leads WHERE id = $1', [id]);
    if (!currentLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Validate state transition rule
    const isValidTransition = validateLeadTransition(currentLead.status, status);
    if (!isValidTransition) {
      return res.status(400).json({ error: `Invalid transition from ${currentLead.status} to ${status}` });
    }

    const updated = await query(
      'UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Vehicles & Inventory
// ==========================================
app.get('/api/v1/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicles = await query(
      `SELECT v.*, 
        b.name as branch_name,
        c.make, c.model, c.variant, c.fuel_type, c.transmission, c.body_type
       FROM vehicles v
       JOIN branches b ON v.branch_id = b.id
       JOIN vehicle_catalog c ON v.catalog_id = c.id
       ORDER BY v.created_at DESC`
    );
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await queryOne(
      `SELECT v.*, b.name as branch_name, c.make, c.model, c.variant, c.fuel_type, c.transmission
       FROM vehicles v
       JOIN branches b ON v.branch_id = b.id
       JOIN vehicle_catalog c ON v.catalog_id = c.id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. Quotations & Pricing Engine
// ==========================================
app.post('/api/v1/quotations/calculate', (req: Request, res: Response) => {
  try {
    const { items, discountRole } = req.body;
    const totals = PricingEngine.calculateQuotationTotals(items);
    const discountCheck = PricingEngine.validateDiscount(
      totals.discountTotal,
      totals.subtotal,
      discountRole || 'sales_executive'
    );

    res.json({
      totals,
      discountCheck,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/quotations', async (req: Request, res: Response) => {
  try {
    const quotations = await query(
      `SELECT q.*, 
        c.first_name || ' ' || c.last_name as customer_name,
        u.full_name as created_by_name
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN app_users u ON q.created_by_id = u.id
       ORDER BY q.created_at DESC`
    );
    res.json(quotations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. Deals & Delivery Gates
// ==========================================
app.get('/api/v1/deals', async (req: Request, res: Response) => {
  try {
    const deals = await query(
      `SELECT d.*, 
        c.first_name || ' ' || c.last_name as customer_name,
        v.vin, v.year || ' ' || cat.make || ' ' || cat.model as vehicle_name
       FROM deals d
       JOIN customers c ON d.customer_id = c.id
       JOIN vehicles v ON d.vehicle_id = v.id
       JOIN vehicle_catalog cat ON v.catalog_id = cat.id
       ORDER BY d.created_at DESC`
    );
    res.json(deals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/v1/deals/:id/stage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const updated = await query(
      'UPDATE deals SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stage, id]
    );
    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. Finance & Invoices
// ==========================================
app.get('/api/v1/finance/payments', async (req: Request, res: Response) => {
  try {
    const payments = await query(
      `SELECT p.*, c.first_name || ' ' || c.last_name as customer_name
       FROM payments p
       JOIN customers c ON p.customer_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/finance/invoices', async (req: Request, res: Response) => {
  try {
    const invoices = await query(
      `SELECT i.*, c.first_name || ' ' || c.last_name as customer_name
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC`
    );
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. Service & Workshop
// ==========================================
app.get('/api/v1/service/job-cards', async (req: Request, res: Response) => {
  try {
    const jobCards = await query(
      `SELECT j.*, 
        c.first_name || ' ' || c.last_name as customer_name,
        v.vin, v.registration_number
       FROM job_cards j
       JOIN customers c ON j.customer_id = c.id
       LEFT JOIN vehicles v ON j.vehicle_id = v.id
       ORDER BY j.created_at DESC`
    );
    res.json(jobCards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/service/parts', async (req: Request, res: Response) => {
  try {
    const parts = await query('SELECT * FROM parts ORDER BY part_number ASC');
    res.json(parts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`[API Server] Running and listening on http://localhost:${PORT}`);
});
