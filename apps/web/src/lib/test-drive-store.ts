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

const STORAGE_KEY = 'crm_test_drives_v2';

export const INITIAL_TEST_DRIVES: TestDrive[] = [];

export function getTestDrives(): TestDrive[] {
  if (typeof window === 'undefined') return INITIAL_TEST_DRIVES;
  try {
    // Purge legacy mock test drives from previous sessions
    localStorage.removeItem('crm_test_drives_v1');
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
    console.error('Failed to read test drives from storage:', err);
    return [];
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
