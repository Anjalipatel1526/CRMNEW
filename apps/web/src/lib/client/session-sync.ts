'use client';

import { supabase } from '@/lib/client/supabase';
import { clearLocalCompanyProfile } from '@/lib/client/stores/company-store';

export interface ServerSessionSyncResult {
  ok: boolean;
  unauthorized?: boolean;
  isOnboarded: boolean;
  tenantId?: string;
  role?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

/**
 * Single client-side bridge for syncing a verified Supabase access token into server HttpOnly
 * session cookies (`POST /api/auth/session`) and resolving authoritative onboarding status.
 */
export async function syncServerSession(accessToken: string): Promise<ServerSessionSyncResult> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    if (res.status === 401) {
      await supabase.auth.signOut().catch(() => {});
      clearLocalCompanyProfile();
      return { ok: false, unauthorized: true, isOnboarded: false };
    }

    if (!res.ok) {
      return { ok: false, isOnboarded: false };
    }

    const json = await res.json();
    const isOnboarded = json?.isOnboarded === true;
    if (!isOnboarded) {
      clearLocalCompanyProfile();
    }

    return {
      ok: true,
      isOnboarded,
      tenantId: json?.tenantId,
      role: json?.role,
      user: json?.user,
    };
  } catch (err) {
    console.warn('[SessionSync] Failed to sync server session:', err);
    return { ok: false, isOnboarded: false };
  }
}

