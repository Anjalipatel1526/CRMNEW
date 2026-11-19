'use client';

import { getScopedKey } from '@/lib/client/tenant-context';

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

function getModulesStorageKey(): string {
  return getScopedKey(STORAGE_KEY);
}

export function getModules(): DealershipModule[] {
  if (typeof window === 'undefined') return DEFAULT_MODULES;
  try {
    const key = getModulesStorageKey();
    let raw = localStorage.getItem(key);
    if (!raw) {
      // Fallback to global unscoped storage key before defaulting
      raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        localStorage.setItem(key, raw);
      }
    }

    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_MODULES));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MODULES));
      return DEFAULT_MODULES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Clean and sanitize modules: remove nulls, empty labels, and duplicate hrefs (eradicating extra blank layers)
      const seenHrefs = new Set<string>();
      const sanitized: DealershipModule[] = [];

      for (const m of parsed) {
        if (!m || typeof m !== 'object') continue;
        const label = String(m.label || '').trim();
        let href = String(m.href || '').trim();
        if (m.id === 'mod-overview' && (href === '/' || !href)) {
          href = '/dashboard';
        }
        if (!label || !href) continue;
        if (seenHrefs.has(href)) continue;
        seenHrefs.add(href);
        sanitized.push({
          ...m,
          label,
          href,
          isPluggedIn: Boolean(m.isPluggedIn ?? m.is_plugged_in ?? true),
        });
      }

      // Ensure all standard default modules are represented without duplicates
      for (const def of DEFAULT_MODULES) {
        if (!seenHrefs.has(def.href)) {
          sanitized.push(def);
          seenHrefs.add(def.href);
        }
      }

      localStorage.setItem(key, JSON.stringify(sanitized));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return sanitized;
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
    const key = getModulesStorageKey();
    localStorage.setItem(key, JSON.stringify(modules));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    window.dispatchEvent(new Event('crm-modules-changed'));

    // Asynchronously persist module state (including plug-in/out toggles) to Supabase backend
    if (typeof fetch === 'function') {
      fetch('/api/dealership-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      }).catch((err) => {
        console.warn('[ModulesRegistry] Remote sync note:', err);
      });
    }
  } catch (err) {
    console.error('Failed to save modules to storage:', err);
  }
}

export async function fetchModules(): Promise<DealershipModule[]> {
  if (typeof window === 'undefined') return DEFAULT_MODULES;
  try {
    const res = await fetch('/api/dealership-modules');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.modules) && json.modules.length > 0) {
        return hydrateModulesFromApi(json.modules);
      }
    }
  } catch (err) {
    console.warn('[ModulesRegistry] fetchModules network note:', err);
  }
  return getModules();
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

export function hydrateModulesFromApi(apiModules: any[]): DealershipModule[] {
  if (!Array.isArray(apiModules) || apiModules.length === 0) return getModules();
  const seenHrefs = new Set<string>();
  const base = DEFAULT_MODULES.map((def) => {
    seenHrefs.add(def.href);
    const matched = apiModules.find(
      (m) =>
        (m.href && m.href === def.href) ||
        (m.label && m.label.toLowerCase() === def.label.toLowerCase()) ||
        (typeof m.id === 'string' && m.id.endsWith(`_${def.id}`))
    );
    if (!matched) return def;
    return {
      ...def,
      isPluggedIn: Boolean(matched.is_plugged_in ?? matched.isPluggedIn ?? def.isPluggedIn),
    };
  });

  // Also include any valid custom modules saved in Supabase (with strict non-empty label & href deduplication)
  for (const m of apiModules) {
    if (!m || typeof m !== 'object') continue;
    const label = String(m.label || '').trim();
    const href = String(m.href || '').trim();
    if (!label || !href || seenHrefs.has(href)) continue;

    seenHrefs.add(href);
    base.push({
      id: m.id || `mod-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      href,
      icon: m.icon || 'LayoutDashboard',
      category: 'Custom',
      description: m.description || '',
      isCore: false,
      isPluggedIn: Boolean(m.is_plugged_in ?? m.isPluggedIn ?? true),
    });
  }

  saveModules(base);
  return base;
}
