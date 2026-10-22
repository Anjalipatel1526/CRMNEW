'use client';

export interface TestDrive {
  id: string;
  driveCode: string; // e.g. TD-2024-001
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleName: string; // e.g. Mahindra XUV700 AX7L AWD
  vehicleReg: string; // e.g. MH-02-EW-9011
  date: string;
  timeSlot: string;
  durationMinutes: number;
  assignedStaff: string;
  dlNumber: string;
  kycVerified: boolean;
  startOdo: number;
  endOdo?: number;
  route: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  feedback?: string;
  rating?: number;
  createdAt: string;
}

const STORAGE_KEY = 'crm_test_drives_v1';

export const INITIAL_TEST_DRIVES: TestDrive[] = [
  {
    id: 'td-1',
    driveCode: 'TD-2024-081',
    customerName: 'Rajesh Sharma',
    customerPhone: '+91 98201 12345',
    customerEmail: 'rajesh.sharma@example.com',
    vehicleName: 'Mahindra XUV700 AX7L AWD (Midnight Black)',
    vehicleReg: 'MH-02-EZ-4120',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '03:30 PM - 04:15 PM',
    durationMinutes: 45,
    assignedStaff: 'John Fernandes',
    dlNumber: 'MH02 20180045231',
    kycVerified: true,
    startOdo: 4820,
    endOdo: 4838,
    route: 'Western Express Highway Sprint (18 km)',
    status: 'completed',
    feedback: 'Loved the acceleration and ADAS lane assist. Customer is ready for down payment negotiation.',
    rating: 5,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'td-2',
    driveCode: 'TD-2024-082',
    customerName: 'Priya Nair',
    customerPhone: '+91 98450 67890',
    customerEmail: 'priya.nair@example.com',
    vehicleName: 'Hyundai Creta SX(O) Turbo DCT (Polar White)',
    vehicleReg: 'MH-03-DF-8812',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '05:00 PM - 05:45 PM',
    durationMinutes: 45,
    assignedStaff: 'Kavita Chawla',
    dlNumber: 'MH03 20190088192',
    kycVerified: true,
    startOdo: 8140,
    route: 'Andheri West Suburban Coastal Loop (12 km)',
    status: 'in_progress',
    feedback: 'Vehicle currently on test route with client and spouse.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'td-3',
    driveCode: 'TD-2024-083',
    customerName: 'Vikram Malhotra',
    customerPhone: '+91 99100 54321',
    customerEmail: 'vikram@nexalogistics.in',
    vehicleName: 'Toyota Fortuner 4x4 AT Legender',
    vehicleReg: 'MH-01-DA-1008',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '11:00 AM - 12:00 PM',
    durationMinutes: 60,
    assignedStaff: 'John Fernandes',
    dlNumber: 'MH01 20150033190',
    kycVerified: true,
    startOdo: 12450,
    route: 'Sea Link Expressway High Speed Run (25 km)',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'td-4',
    driveCode: 'TD-2024-084',
    customerName: 'Ananya Sengupta',
    customerPhone: '+91 97312 99887',
    customerEmail: 'ananya.s@example.com',
    vehicleName: 'Tata Nexon EV Max (Intense Teal)',
    vehicleReg: 'MH-47-BE-6601',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '02:30 PM - 03:15 PM',
    durationMinutes: 45,
    assignedStaff: 'Sarah Dsouza',
    dlNumber: 'MH47 20210011994',
    kycVerified: false,
    startOdo: 3100,
    route: 'City Eco Drive & Regenerative Braking Test (10 km)',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
];

export function getTestDrives(): TestDrive[] {
  if (typeof window === 'undefined') return INITIAL_TEST_DRIVES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TEST_DRIVES));
      return INITIAL_TEST_DRIVES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TEST_DRIVES;
  } catch (err) {
    console.error('Failed to read test drives from storage:', err);
    return INITIAL_TEST_DRIVES;
  }
}

export function saveTestDrives(drives: TestDrive[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drives));
    window.dispatchEvent(new Event('crm-testdrives-changed'));
  } catch (err) {
    console.error('Failed to save test drives to storage:', err);
  }
}

export function addTestDrive(driveData: Partial<TestDrive>): TestDrive {
  const current = getTestDrives();
  const count = current.length + 80;
  const code = `TD-2024-${String(count).padStart(3, '0')}`;

  const newDrive: TestDrive = {
    id: 'td-' + Date.now(),
    driveCode: driveData.driveCode || code,
    customerName: driveData.customerName || 'Walk-in Client',
    customerPhone: driveData.customerPhone || '+91 99000 00000',
    customerEmail: driveData.customerEmail,
    vehicleName: driveData.vehicleName || 'Certified Showroom Stock',
    vehicleReg: driveData.vehicleReg || 'MH-02-TEST-01',
    date: driveData.date || new Date().toISOString().split('T')[0],
    timeSlot: driveData.timeSlot || '04:00 PM - 04:45 PM',
    durationMinutes: driveData.durationMinutes || 45,
    assignedStaff: driveData.assignedStaff || 'Senior Sales Executive',
    dlNumber: driveData.dlNumber || 'KYC-PENDING',
    kycVerified: driveData.kycVerified ?? true,
    startOdo: driveData.startOdo || 5000,
    endOdo: driveData.endOdo,
    route: driveData.route || 'Western Express Highway Sprint (15 km)',
    status: driveData.status || 'scheduled',
    feedback: driveData.feedback,
    rating: driveData.rating,
    createdAt: new Date().toISOString(),
  };

  const updated = [newDrive, ...current];
  saveTestDrives(updated);
  return newDrive;
}

export function updateTestDrive(id: string, updates: Partial<TestDrive>): TestDrive | null {
  const current = getTestDrives();
  const idx = current.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  const updatedDrive = { ...current[idx], ...updates };
  current[idx] = updatedDrive;
  saveTestDrives(current);
  return updatedDrive;
}

export function deleteTestDrive(id: string): TestDrive[] {
  const current = getTestDrives();
  const updated = current.filter((d) => d.id !== id);
  saveTestDrives(updated);
  return updated;
}
