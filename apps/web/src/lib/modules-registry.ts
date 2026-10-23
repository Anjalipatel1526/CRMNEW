'use client';

export interface DealershipModule {
  id: string;
  label: string;
  href: string;
  icon: string;
  category: 'Core CRM' | 'Sales' | 'Operations' | 'Workforce' | 'Customer Experience' | 'Custom';
  description: string;
  isCore: boolean;
  isPluggedIn: boolean; // true = Active (Plugin In), false = Deactivated (Plugin Out)
  allowedRoles?: string[];
  createdAt?: string;
}

const STORAGE_KEY = 'crm_dealership_modules_v1';

export const DEFAULT_MODULES: DealershipModule[] = [
  {
    id: 'mod-overview',
    label: 'Overview',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    category: 'Core CRM',
    description: 'Executive dashboard, revenue velocity, quick pipeline KPI metrics and high-priority dealership alerts.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-pipeline',
    label: 'Pipeline',
    href: '/crm/leads',
    icon: 'Filter',
    category: 'Sales',
    description: 'Omnichannel lead capture, enquiry stages, test-drive scheduling and sales executive allocations.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-customers',
    label: 'Customers',
    href: '/crm/customers',
    icon: 'Users',
    category: 'Core CRM',
    description: '360° individual & fleet client profiles, Aadhaar/PAN KYC status, communication consent & history.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-appointments',
    label: 'Appointments',
    href: '/crm/appointments',
    icon: 'Calendar',
    category: 'Sales',
    description: 'Showroom test-drives, VIP vehicle viewings, scheduled deliveries and consultation slots.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-inventory',
    label: 'Inventory',
    href: '/vehicles',
    icon: 'Car',
    category: 'Operations',
    description: 'Live physical lot stock, 140-point inspection status, pricing tiers and pre-owned vehicle grading.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-procurement',
    label: 'Procurement',
    href: '/vehicles/procurement',
    icon: 'Layers',
    category: 'Operations',
    description: 'Exchange evaluation engine, direct owner acquisition, refurbishment costing and vehicle intake.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-deals',
    label: 'Deals',
    href: '/sales/deals',
    icon: 'BadgePercent',
    category: 'Sales',
    description: 'Commercial deal negotiation, down payment tracking, on-road quotation locking and RTO coordination.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-finance',
    label: 'Finance',
    href: '/finance',
    icon: 'CreditCard',
    category: 'Operations',
    description: 'Settlement tracking, money receipts, watermarked GST tax invoices, and multi-mode payment verification.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-documents',
    label: 'Documents',
    href: '/documents',
    icon: 'FileText',
    category: 'Core CRM',
    description: 'Digital agreement vault, Form 29/30 RTO transfer paperwork, NOCs, and official delivery receipts.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-reports',
    label: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
    category: 'Core CRM',
    description: 'Conversion funnel analytics, gross margin breakdown per vehicle, sales velocity and branch audit logs.',
    isCore: true,
    isPluggedIn: true,
  },
  {
    id: 'mod-employees',
    label: 'Employees',
    href: '/employees',
    icon: 'UserCheck',
    category: 'Workforce',
    description: 'Staff directory, Employee ID & CRM password credentials, leave record tracking, and modular section access control.',
    isCore: false,
    isPluggedIn: true,
  },
  {
    id: 'mod-test-drives',
    label: 'Test Drives',
    href: '/test-drives',
    icon: 'Gauge',
    category: 'Customer Experience',
    description: 'Dedicated test drive logging, vehicle allocation, KYC/DL verification, odometer tracking, route & feedback.',
    isCore: false,
    isPluggedIn: true,
  },
];

export function getModules(): DealershipModule[] {
  if (typeof window === 'undefined') return DEFAULT_MODULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MODULES));
      return DEFAULT_MODULES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure mod-overview href points to /dashboard
      let updated = false;
      for (const m of parsed) {
        if (m.id === 'mod-overview' && m.href === '/') {
          m.href = '/dashboard';
          updated = true;
        }
      }

      // Ensure any newly added default modules (like employees or test-drives) are merged
      const existingIds = new Set(parsed.map((m: any) => m.id));
      for (const def of DEFAULT_MODULES) {
        if (!existingIds.has(def.id)) {
          parsed.push(def);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_MODULES;
  } catch (err) {
    console.error('Failed to read modules from storage:', err);
    return DEFAULT_MODULES;
  }
}

export function saveModules(modules: DealershipModule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    window.dispatchEvent(new Event('crm-modules-changed'));
  } catch (err) {
    console.error('Failed to save modules to storage:', err);
  }
}

export function toggleModulePlugin(id: string, isPluggedIn: boolean): DealershipModule[] {
  const current = getModules();
  const updated = current.map((m) => (m.id === id ? { ...m, isPluggedIn } : m));
  saveModules(updated);
  return updated;
}

export function addCustomModule(moduleData: Omit<DealershipModule, 'id'>): DealershipModule {
  const current = getModules();
  const slug = moduleData.label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-');
  
  const newModule: DealershipModule = {
    ...moduleData,
    id: 'mod-' + slug + '-' + Date.now(),
    href: moduleData.href || `/${slug}`,
    category: moduleData.category || 'Custom',
    isCore: false,
    isPluggedIn: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [...current, newModule];
  saveModules(updated);
  return newModule;
}

export function deleteCustomModule(id: string): DealershipModule[] {
  const current = getModules();
  const updated = current.filter((m) => m.id !== id || m.isCore);
  saveModules(updated);
  return updated;
}

export function resetModulesToDefault(): DealershipModule[] {
  saveModules(DEFAULT_MODULES);
  return DEFAULT_MODULES;
}
