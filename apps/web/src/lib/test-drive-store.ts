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

import { supabase, isSupabaseConfigured } from './supabase';

export function saveTestDrives(drives: TestDrive[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drives));
    window.dispatchEvent(new Event('crm-testdrives-changed'));
  } catch (err) {
    console.error('Failed to save test drives to storage:', err);
  }
}

export async function fetchTestDrives(): Promise<TestDrive[]> {
  if (typeof window === 'undefined') return INITIAL_TEST_DRIVES;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('test_drives')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[TestDriveStore] Supabase fetch error:', error.message);
      } else if (data && Array.isArray(data)) {
        const localList = getTestDrives();
        const localMap = new Map<string, TestDrive>();
        localList.forEach((td) => localMap.set(td.id, td));

        const remoteList: TestDrive[] = data.map((row: any) => {
          const existing = localMap.get(row.id);
          return {
            id: row.id,
            driveCode: existing?.driveCode || `TD-2024-${row.id.slice(-3).toUpperCase()}`,
            customerName: existing?.customerName || 'Client Test Drive',
            customerPhone: existing?.customerPhone || '+91 99000 00000',
            customerEmail: existing?.customerEmail,
            vehicleName: existing?.vehicleName || 'Certified Showroom Stock',
            vehicleReg: existing?.vehicleReg || 'MH-02-TEST-01',
            date: existing?.date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            timeSlot: existing?.timeSlot || '04:00 PM - 04:45 PM',
            durationMinutes: existing?.durationMinutes || 45,
            assignedStaff: existing?.assignedStaff || 'Senior Sales Executive',
            dlNumber: existing?.dlNumber || 'KYC-VERIFIED',
            kycVerified: existing?.kycVerified ?? true,
            startOdo: row.start_odometer || 5000,
            endOdo: row.end_odometer,
            route: row.route || 'Western Express Highway Sprint (15 km)',
            status: existing?.status || 'scheduled',
            feedback: row.feedback,
            rating: row.rating || 5,
            createdAt: row.created_at || new Date().toISOString(),
          };
        });

        const remoteIds = new Set(remoteList.map((td) => td.id));
        const unsyncedLocal = localList.filter((td) => !remoteIds.has(td.id));
        const merged = [...unsyncedLocal, ...remoteList];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('crm-testdrives-changed'));
        return merged;
      }
    } catch (err) {
      console.error('[TestDriveStore] Failed to fetch test drives from Supabase:', err);
    }
  }

  return getTestDrives();
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

  // Sync to Supabase test_drives table
  if (isSupabaseConfigured()) {
    supabase
      .from('test_drives')
      .insert({
        id: newDrive.id,
        tenant_id: 't-apex-001',
        vehicle_id: 'v-001',
        customer_id: 'cust-101',
        route: newDrive.route,
        start_odometer: newDrive.startOdo,
        feedback: newDrive.feedback || '',
        rating: newDrive.rating || 5,
      })
      .then(({ error }) => {
        if (error) console.warn('[TestDriveStore] Supabase test drive sync note:', error.message);
        else console.log('[TestDriveStore] Successfully saved test drive to Supabase backend');
      });
  }

  return newDrive;
}

export function updateTestDrive(id: string, updates: Partial<TestDrive>): TestDrive | null {
  const current = getTestDrives();
  const idx = current.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  const updatedDrive = { ...current[idx], ...updates };
  current[idx] = updatedDrive;
  saveTestDrives(current);

  if (isSupabaseConfigured()) {
    supabase
      .from('test_drives')
      .update({
        route: updates.route,
        feedback: updates.feedback,
        rating: updates.rating,
        end_odometer: updates.endOdo,
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('[TestDriveStore] Supabase update test drive:', error.message);
      });
  }

  return updatedDrive;
}

export function deleteTestDrive(id: string): TestDrive[] {
  const current = getTestDrives();
  const updated = current.filter((d) => d.id !== id);
  saveTestDrives(updated);

  if (isSupabaseConfigured()) {
    supabase
      .from('test_drives')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('[TestDriveStore] Supabase delete test drive:', error.message);
      });
  }

  return updated;
}
