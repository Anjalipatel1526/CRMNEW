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
  avatar?: string; // Optional image URL or base64 data URL
  leaveBalance: {
    casual: { total: number; used: number };
    sick: { total: number; used: number };
    paid: { total: number; used: number };
  };
  leaveHistory: LeaveRecord[];
  accessControl: EmployeeAccessControl;
}

const STORAGE_KEY = 'crm_employees_v1';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'APEX-EMP-001',
    fullName: 'Vikram Singhania',
    email: 'admin@apexmotors.com',
    phone: '+91 98200 11223',
    designation: 'Managing Director & Tenant Admin',
    department: 'Management',
    branch: 'All Branches',
    joiningDate: '2021-04-01',
    salary: '₹2,50,000 / mo',
    status: 'active',
    password: 'ApexAdmin@2024#Master',
    leaveBalance: {
      casual: { total: 12, used: 2 },
      sick: { total: 7, used: 1 },
      paid: { total: 18, used: 4 },
    },
    leaveHistory: [
      {
        id: 'lv-101',
        leaveType: 'paid',
        startDate: '2024-02-10',
        endDate: '2024-02-14',
        days: 4,
        reason: 'Annual Family Vacation',
        appliedOn: '2024-01-25',
        status: 'approved',
        approvedBy: 'Board of Directors',
      },
      {
        id: 'lv-102',
        leaveType: 'casual',
        startDate: '2024-05-18',
        endDate: '2024-05-19',
        days: 2,
        reason: 'Personal legal documentation',
        appliedOn: '2024-05-12',
        status: 'approved',
        approvedBy: 'Self Approved (Admin)',
      },
    ],
    accessControl: {
      pipeline: true,
      customers: true,
      inventory: true,
      procurement: true,
      deals: true,
      finance: true,
      testDrives: true,
      documents: true,
      reports: true,
      settings: true,
    },
  },
  {
    id: 'emp-2',
    employeeCode: 'APEX-EMP-002',
    fullName: 'Kavita Chawla',
    email: 'manager.west@apexmotors.com',
    phone: '+91 98330 45678',
    designation: 'General Manager — Westside Automall',
    department: 'Operations',
    branch: 'Apex Westside Automall',
    joiningDate: '2022-06-15',
    salary: '₹1,40,000 / mo',
    status: 'active',
    password: 'Kavita@Apex2024$GM',
    leaveBalance: {
      casual: { total: 12, used: 4 },
      sick: { total: 7, used: 2 },
      paid: { total: 18, used: 6 },
    },
    leaveHistory: [
      {
        id: 'lv-201',
        leaveType: 'paid',
        startDate: '2024-03-04',
        endDate: '2024-03-09',
        days: 6,
        reason: 'Outstation Family Function',
        appliedOn: '2024-02-20',
        status: 'approved',
        approvedBy: 'Vikram Singhania',
      },
      {
        id: 'lv-202',
        leaveType: 'sick',
        startDate: '2024-07-02',
        endDate: '2024-07-03',
        days: 2,
        reason: 'Viral Fever & Medical Rest',
        appliedOn: '2024-07-02',
        status: 'approved',
        approvedBy: 'Vikram Singhania',
      },
    ],
    accessControl: {
      pipeline: true,
      customers: true,
      inventory: true,
      procurement: true,
      deals: true,
      finance: true,
      testDrives: true,
      documents: true,
      reports: true,
      settings: false,
    },
  },
  {
    id: 'emp-3',
    employeeCode: 'APEX-EMP-003',
    fullName: 'John Fernandes',
    email: 'sales.john@apexmotors.com',
    phone: '+91 98190 88776',
    designation: 'Senior Sales Executive & Test Pilot',
    department: 'Sales',
    branch: 'Apex Downtown Flagship',
    joiningDate: '2023-01-10',
    salary: '₹75,000 / mo',
    status: 'active',
    password: 'John@SalesApex99',
    leaveBalance: {
      casual: { total: 12, used: 3 },
      sick: { total: 7, used: 0 },
      paid: { total: 18, used: 3 },
    },
    leaveHistory: [
      {
        id: 'lv-301',
        leaveType: 'casual',
        startDate: '2024-04-12',
        endDate: '2024-04-14',
        days: 3,
        reason: 'Brother Wedding Ceremony',
        appliedOn: '2024-04-01',
        status: 'approved',
        approvedBy: 'Kavita Chawla',
      },
    ],
    accessControl: {
      pipeline: true,
      customers: true,
      inventory: true,
      procurement: false,
      deals: true,
      finance: false,
      testDrives: true,
      documents: true,
      reports: false,
      settings: false,
    },
  },
  {
    id: 'emp-4',
    employeeCode: 'APEX-EMP-004',
    fullName: 'Sarah Dsouza',
    email: 'service.sarah@apexmotors.com',
    phone: '+91 97690 12345',
    designation: 'Head of Quality Inspection & Detailing',
    department: 'Service',
    branch: 'Apex Downtown Flagship',
    joiningDate: '2023-03-20',
    salary: '₹68,000 / mo',
    status: 'active',
    password: 'Sarah@Inspection2024',
    leaveBalance: {
      casual: { total: 12, used: 2 },
      sick: { total: 7, used: 3 },
      paid: { total: 18, used: 0 },
    },
    leaveHistory: [
      {
        id: 'lv-401',
        leaveType: 'sick',
        startDate: '2024-06-11',
        endDate: '2024-06-13',
        days: 3,
        reason: 'Severe food poisoning',
        appliedOn: '2024-06-11',
        status: 'approved',
        approvedBy: 'Vikram Singhania',
      },
    ],
    accessControl: {
      pipeline: false,
      customers: false,
      inventory: true,
      procurement: true,
      deals: false,
      finance: false,
      testDrives: false,
      documents: true,
      reports: false,
      settings: false,
    },
  },
  {
    id: 'emp-5',
    employeeCode: 'APEX-EMP-005',
    fullName: 'Amitabh Sen',
    email: 'finance.amitabh@apexmotors.com',
    phone: '+91 98210 99443',
    designation: 'Finance Controller & Taxation Specialist',
    department: 'Finance',
    branch: 'Apex Downtown Flagship',
    joiningDate: '2022-11-01',
    salary: '₹95,000 / mo',
    status: 'active',
    password: 'Amitabh@FinGST#2024',
    leaveBalance: {
      casual: { total: 12, used: 1 },
      sick: { total: 7, used: 1 },
      paid: { total: 18, used: 5 },
    },
    leaveHistory: [
      {
        id: 'lv-501',
        leaveType: 'paid',
        startDate: '2024-01-15',
        endDate: '2024-01-19',
        days: 5,
        reason: 'Family trip to Goa',
        appliedOn: '2024-01-02',
        status: 'approved',
        approvedBy: 'Vikram Singhania',
      },
    ],
    accessControl: {
      pipeline: false,
      customers: true,
      inventory: false,
      procurement: false,
      deals: true,
      finance: true,
      testDrives: false,
      documents: true,
      reports: true,
      settings: false,
    },
  },
];

export function getEmployees(): Employee[] {
  if (typeof window === 'undefined') return INITIAL_EMPLOYEES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EMPLOYEES;
  } catch (err) {
    console.error('Failed to read employees from storage:', err);
    return INITIAL_EMPLOYEES;
  }
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
    avatar: employeeData.avatar || '',
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
  return newEmp;
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
  const current = getEmployees();
  const idx = current.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const updatedEmp = { ...current[idx], ...updates };
  current[idx] = updatedEmp;
  saveEmployees(current);
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
  return updated;
}
