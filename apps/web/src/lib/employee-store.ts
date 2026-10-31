'use client';

export interface LeaveRecord {
  id: string;
  leaveType: 'casual' | 'sick' | 'paid' | 'emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  appliedOn: string;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
}

export interface EmployeeAccessControl {
  pipeline: boolean;
  customers: boolean;
  inventory: boolean;
  procurement: boolean;
  deals: boolean;
  finance: boolean;
  testDrives: boolean;
  documents: boolean;
  reports: boolean;
  settings: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g. APEX-EMP-001
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: 'Sales' | 'Finance' | 'Operations' | 'Service' | 'Management' | 'Admin';
  branch: string;
  joiningDate: string;
  salary: string;
  status: 'active' | 'on_leave' | 'inactive';
  password: string; // Dealership CRM access password
  avatarUrl?: string; // Dealership staff photo / avatar
  leaveBalance: {
    casual: { total: number; used: number };
    sick: { total: number; used: number };
    paid: { total: number; used: number };
  };
  leaveHistory: LeaveRecord[];
  accessControl: EmployeeAccessControl;
}

import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'crm_employees_v2';

export const INITIAL_EMPLOYEES: Employee[] = [];

export function getEmployees(): Employee[] {
  if (typeof window === 'undefined') return INITIAL_EMPLOYEES;
  try {
    // Purge legacy mock employees from previous sessions
    localStorage.removeItem('crm_employees_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to read employees from storage:', err);
    return [];
  }
}

export async function fetchEmployees(): Promise<Employee[]> {
  if (typeof window === 'undefined') return INITIAL_EMPLOYEES;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[EmployeeStore] Supabase fetch error:', error.message);
      } else if (data && Array.isArray(data)) {
        const localList = getEmployees();
        const localMap = new Map<string, Employee>();
        localList.forEach((e) => localMap.set(e.id, e));

        const remoteList: Employee[] = data.map((row: any) => {
          const existing = localMap.get(row.id);
          return {
            id: row.id,
            employeeCode: existing?.employeeCode || `APEX-EMP-${row.id.slice(-3).toUpperCase()}`,
            fullName: row.full_name || 'Staff Member',
            email: row.email || '',
            phone: row.phone || '+91 98000 00000',
            designation: row.role || 'Sales Executive',
            department: (row.department as any) || 'Sales',
            branch: existing?.branch || 'Apex Downtown Flagship',
            joiningDate: row.joined_at || new Date().toISOString().split('T')[0],
            salary: existing?.salary || '₹60,000 / mo',
            status: row.is_active ? 'active' : 'inactive',
            password: existing?.password || `Apex@${Math.floor(1000 + Math.random() * 9000)}!Secure`,
            avatarUrl: existing?.avatarUrl || '',
            leaveBalance: existing?.leaveBalance || {
              casual: { total: 12, used: 0 },
              sick: { total: 7, used: 0 },
              paid: { total: 18, used: 0 },
            },
            leaveHistory: existing?.leaveHistory || [],
            accessControl: existing?.accessControl || {
              pipeline: true,
              customers: true,
              inventory: true,
              procurement: false,
              deals: true,
              finance: false,
              testDrives: true,
              documents: false,
              reports: false,
              settings: false,
            },
          };
        });

        // Add any locally-created items not yet in remote
        const remoteIds = new Set(remoteList.map((e) => e.id));
        const unsyncedLocal = localList.filter((e) => !remoteIds.has(e.id));
        const merged = [...unsyncedLocal, ...remoteList];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('crm-employees-changed'));
        return merged;
      }
    } catch (err) {
      console.error('[EmployeeStore] Failed to fetch employees from Supabase:', err);
    }
  }

  return getEmployees();
}

export function saveEmployees(employees: Employee[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    window.dispatchEvent(new Event('crm-employees-changed'));
  } catch (err) {
    console.error('Failed to save employees to storage:', err);
  }
}

export function addEmployee(employeeData: Partial<Employee>): Employee {
  const current = getEmployees();
  const count = current.length + 1;
  const code = `APEX-EMP-${String(count).padStart(3, '0')}`;

  const newEmp: Employee = {
    id: 'emp-' + Date.now(),
    employeeCode: employeeData.employeeCode || code,
    fullName: employeeData.fullName || 'New Employee',
    email: employeeData.email || `employee.${Date.now()}@apexmotors.com`,
    phone: employeeData.phone || '+91 98000 00000',
    designation: employeeData.designation || 'Sales Executive',
    department: employeeData.department || 'Sales',
    branch: employeeData.branch || 'Apex Downtown Flagship',
    joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
    salary: employeeData.salary || '₹60,000 / mo',
    status: employeeData.status || 'active',
    password: employeeData.password || `Apex@${Math.floor(1000 + Math.random() * 9000)}!Secure`,
    avatarUrl: employeeData.avatarUrl || '',
    leaveBalance: {
      casual: { total: 12, used: 0 },
      sick: { total: 7, used: 0 },
      paid: { total: 18, used: 0 },
    },
    leaveHistory: [],
    accessControl: employeeData.accessControl || {
      pipeline: true,
      customers: true,
      inventory: true,
      procurement: false,
      deals: true,
      finance: false,
      testDrives: true,
      documents: false,
      reports: false,
      settings: false,
    },
  };

  const updated = [newEmp, ...current];
  saveEmployees(updated);

  // Sync to Supabase employees table
  if (isSupabaseConfigured()) {
    supabase
      .from('employees')
      .insert({
        id: newEmp.id,
        tenant_id: 't-apex-001',
        branch_id: 'b-dt-001',
        full_name: newEmp.fullName,
        email: newEmp.email,
        phone: newEmp.phone,
        role: newEmp.designation,
        department: newEmp.department,
        is_active: newEmp.status === 'active',
        joined_at: newEmp.joiningDate,
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('[EmployeeStore] Supabase addEmployee error:', error.message);
        } else {
          console.log('[EmployeeStore] Successfully saved employee to Supabase backend table:', newEmp.fullName);
        }
      });
  }

  return newEmp;
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
  const current = getEmployees();
  const idx = current.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const updatedEmp = { ...current[idx], ...updates };
  current[idx] = updatedEmp;
  saveEmployees(current);

  // Sync update to Supabase
  if (isSupabaseConfigured()) {
    const payload: Record<string, any> = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.designation !== undefined) payload.role = updates.designation;
    if (updates.department !== undefined) payload.department = updates.department;
    if (updates.status !== undefined) payload.is_active = updates.status === 'active';
    if (updates.joiningDate !== undefined) payload.joined_at = updates.joiningDate;

    if (Object.keys(payload).length > 0) {
      supabase
        .from('employees')
        .update(payload)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[EmployeeStore] Supabase updateEmployee error:', error.message);
          else console.log('[EmployeeStore] Successfully updated employee in Supabase backend');
        });
    }
  }

  return updatedEmp;
}

export function updateEmployeePassword(id: string, newPassword: string): boolean {
  const current = getEmployees();
  const emp = current.find((e) => e.id === id);
  if (!emp) return false;
  emp.password = newPassword;
  saveEmployees(current);
  return true;
}

export function updateEmployeeAccessControl(id: string, access: EmployeeAccessControl): boolean {
  const current = getEmployees();
  const emp = current.find((e) => e.id === id);
  if (!emp) return false;
  emp.accessControl = access;
  saveEmployees(current);
  return true;
}

export function addLeaveRecord(employeeId: string, leave: Omit<LeaveRecord, 'id' | 'appliedOn'>): boolean {
  const current = getEmployees();
  const emp = current.find((e) => e.id === employeeId);
  if (!emp) return false;

  const newRecord: LeaveRecord = {
    ...leave,
    id: 'lv-' + Date.now(),
    appliedOn: new Date().toISOString().split('T')[0],
  };

  // Update used balance if approved
  if (leave.status === 'approved') {
    if (leave.leaveType === 'casual') emp.leaveBalance.casual.used += leave.days;
    if (leave.leaveType === 'sick') emp.leaveBalance.sick.used += leave.days;
    if (leave.leaveType === 'paid') emp.leaveBalance.paid.used += leave.days;
  }

  emp.leaveHistory.unshift(newRecord);
  saveEmployees(current);
  return true;
}

export function deleteEmployee(id: string): Employee[] {
  const current = getEmployees();
  const updated = current.filter((e) => e.id !== id);
  saveEmployees(updated);

  if (isSupabaseConfigured()) {
    supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('[EmployeeStore] Supabase deleteEmployee error:', error.message);
        else console.log('[EmployeeStore] Deleted employee from Supabase:', id);
      });
  }

  return updated;
}
