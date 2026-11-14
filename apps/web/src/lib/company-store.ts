'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import { getActiveTenantId, getScopedKey } from './tenant-context';

export interface CompanyProfile {
  id: string;
  legalName: string;
  tradeName: string;
  tagline?: string;
  dealershipType: 'authorized_franchise' | 'multibrand_preowned' | 'luxury_supercars' | 'electric_mobility' | 'commercial_fleet';
  
  // Contact
  email: string;
  phone: string;
  supportPhone?: string;
  website?: string;

  // Registered Location
  address: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // Tax & Business Registration
  gstin: string;
  pan: string;
  cin?: string;
  currency: string;

  // Banking Details for Invoices & Receipts
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId?: string;

  // Branding & Watermark
  logoUrl?: string; // Data URL or Image URL
  brandColor?: string; // Hex color for invoices and documents e.g. #F27A1A
  watermarkEnabled: boolean;
  watermarkOpacity: number; // e.g. 0.07

  // Authorized Digital Signature for Invoices
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
  signatureUrl?: string; // Data URL or Image URL

  // Status
  isOnboarded: boolean;
  updatedAt: string;
}

const BASE_STORAGE_KEY = 'crm_dealership_company_profile_v1';

function getStorageKey(): string {
  return getScopedKey(BASE_STORAGE_KEY);
}

/**
 * Automatically compress oversized Base64 data URLs (e.g. user uploaded 4MB photos) down to a lightweight WebP (~3KB)
 * to maintain instant load times and 100 Lighthouse performance.
 */
export function compressDataUrl(dataUrl: string, maxDim: number = 96, quality: number = 0.82): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 25000) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, w, h);
        let compressed = canvas.toDataURL('image/webp', quality);
        if (!compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  id: 'company_profile',
  legalName: '',
  tradeName: '',
  tagline: '',
  dealershipType: 'authorized_franchise',
  email: '',
  phone: '',
  supportPhone: '',
  website: '',
  address: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  gstin: '',
  pan: '',
  cin: '',
  currency: 'INR (₹)',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  upiId: '',
  logoUrl: '/unai-logo.png',
  brandColor: '#6253F8',
  watermarkEnabled: true,
  watermarkOpacity: 0.22,
  authorizedSignatoryName: '',
  authorizedSignatoryDesignation: '',
  signatureUrl: '',
  isOnboarded: false,
  updatedAt: new Date().toISOString(),
};

const CREDS_KEY = 'crm_user_credentials';

export interface UserCredentials {
  userId: string;
  password?: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export function saveUserCredentials(creds: { userId: string; password?: string; fullName: string; email: string }) {
  if (typeof window === 'undefined') return;
  try {
    const tenantId = getActiveTenantId();
    localStorage.setItem(getScopedKey(CREDS_KEY), JSON.stringify({ ...creds, createdAt: new Date().toISOString() }));
    
    // Sync to Supabase user_credentials table if configured
    if (isSupabaseConfigured() && creds.email) {
      supabase
        .from('user_credentials')
        .upsert({
          tenant_id: tenantId,
          user_id: creds.userId || creds.email,
          password_hash: creds.password,
          full_name: creds.fullName || creds.email,
          email: creds.email,
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.warn('[CompanyStore] Supabase credentials sync info:', error.message);
          else console.log('[CompanyStore] Synced user credentials to Supabase backend');
        });
    }
  } catch (err) {
    console.error('Failed to save user credentials:', err);
  }
}

export function getUserCredentials(): UserCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getScopedKey(CREDS_KEY));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function getCompanyProfile(): CompanyProfile {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_PROFILE;
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      return DEFAULT_COMPANY_PROFILE;
    }
    const parsed = JSON.parse(raw);
    if (!parsed) {
      return DEFAULT_COMPANY_PROFILE;
    }
    const profile = { ...DEFAULT_COMPANY_PROFILE, ...parsed };
    if (!profile.logoUrl) {
      profile.logoUrl = '/unai-logo.png';
    }
    if (profile.brandColor === '#F27A1A' || profile.brandColor === '#0284C7' || profile.brandColor === '#EA580C') {
      profile.brandColor = '#6253F8';
    }
    // Auto-compress oversized data URL logos (>25KB) to guarantee lightweight performance
    if (profile.logoUrl && profile.logoUrl.startsWith('data:image/') && profile.logoUrl.length > 25000) {
      const originalLogo = profile.logoUrl;
      compressDataUrl(originalLogo).then((compressed) => {
        if (compressed && compressed !== originalLogo && compressed.length < originalLogo.length) {
          profile.logoUrl = compressed;
          try {
            localStorage.setItem(key, JSON.stringify(profile));
            window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: profile }));
          } catch {}
        }
      });
    }
    return profile;
  } catch (err) {
    console.error('Failed to load company profile from storage:', err);
    return DEFAULT_COMPANY_PROFILE;
  }
}

export async function fetchCompanyProfile(): Promise<CompanyProfile> {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_PROFILE;

  if (isSupabaseConfigured()) {
    try {
      const tenantId = getActiveTenantId();
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[CompanyStore] Supabase fetch error:', error.message);
      } else if (data) {
        const mapped: CompanyProfile = {
          id: data.id || `company_${tenantId}`,
          legalName: data.legal_name || '',
          tradeName: data.trade_name || '',
          tagline: data.tagline || '',
          dealershipType: (data.dealership_type as any) || 'authorized_franchise',
          email: data.email || '',
          phone: data.phone || '',
          supportPhone: data.support_phone || '',
          website: data.website || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          country: data.country || 'India',
          gstin: data.gstin || '',
          pan: data.pan || '',
          cin: data.cin || '',
          currency: data.currency || 'INR (₹)',
          bankName: data.bank_name || '',
          accountNumber: data.account_number || '',
          ifscCode: data.ifsc_code || '',
          branchName: data.branch_name || '',
          upiId: data.upi_id || '',
          logoUrl: data.logo_url || '/unai-logo.png',
          brandColor: data.brand_color || '#6253F8',
          watermarkEnabled: data.watermark_enabled ?? true,
          watermarkOpacity: Number(data.watermark_opacity) || 0.22,
          authorizedSignatoryName: data.authorized_signatory_name || '',
          authorizedSignatoryDesignation: data.authorized_signatory_designation || '',
          signatureUrl: data.signature_url || '',
          isOnboarded: data.is_onboarded ?? true,
          updatedAt: data.updated_at || new Date().toISOString(),
        };

        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(mapped));
        window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: mapped }));

        if (mapped.logoUrl && mapped.logoUrl.startsWith('data:image/') && mapped.logoUrl.length > 25000) {
          const originalLogo = mapped.logoUrl;
          compressDataUrl(originalLogo).then((compressed) => {
            if (compressed && compressed !== originalLogo && compressed.length < originalLogo.length) {
              mapped.logoUrl = compressed;
              try {
                localStorage.setItem(key, JSON.stringify(mapped));
                window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: mapped }));
              } catch {}
            }
          });
        }

        return mapped;
      }
    } catch (err) {
      console.error('[CompanyStore] Failed to load company profile from Supabase:', err);
    }
  }

  return getCompanyProfile();
}

export function saveCompanyProfile(profile: Partial<CompanyProfile>): CompanyProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_COMPANY_PROFILE, ...profile };
  try {
    const current = getCompanyProfile();
    const tenantId = getActiveTenantId();
    const profileId = updatedId(profile.id || current.id, tenantId);

    const updated: CompanyProfile = {
      ...current,
      ...profile,
      id: profileId,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };

    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: updated }));

    // Persist to Supabase company_profiles table
    if (isSupabaseConfigured()) {
      const payload = {
        id: updated.id,
        tenant_id: tenantId,
        legal_name: updated.legalName || '',
        trade_name: updated.tradeName || '',
        tagline: updated.tagline || '',
        dealership_type: updated.dealershipType || 'authorized_franchise',
        email: updated.email || '',
        phone: updated.phone || '',
        support_phone: updated.supportPhone || '',
        website: updated.website || '',
        address: updated.address || '',
        city: updated.city || '',
        state: updated.state || '',
        pincode: updated.pincode || '',
        country: updated.country || 'India',
        gstin: updated.gstin || '',
        pan: updated.pan || '',
        cin: updated.cin || '',
        currency: updated.currency || 'INR (₹)',
        bank_name: updated.bankName || '',
        account_number: updated.accountNumber || '',
        ifsc_code: updated.ifscCode || '',
        branch_name: updated.branchName || '',
        upi_id: updated.upiId || '',
        logo_url: updated.logoUrl || '',
        brand_color: updated.brandColor || '#6253F8',
        watermark_enabled: updated.watermarkEnabled ?? true,
        watermark_opacity: updated.watermarkOpacity || 0.22,
        authorized_signatory_name: updated.authorizedSignatoryName || '',
        authorized_signatory_designation: updated.authorizedSignatoryDesignation || '',
        signature_url: updated.signatureUrl || '',
        is_onboarded: updated.isOnboarded ?? true,
        updated_at: new Date().toISOString(),
      };

      supabase
        .from('company_profiles')
        .upsert(payload, { onConflict: 'id' })
        .then(({ data, error }) => {
          if (error) {
            console.error('[CompanyStore] Supabase saveCompanyProfile error:', error.message);
          } else {
            console.log('[CompanyStore] Successfully synced company profile to Supabase backend table.');
          }
        });
    }

    return updated;
  } catch (err) {
    console.error('Failed to save company profile to storage:', err);
    return { ...DEFAULT_COMPANY_PROFILE, ...profile };
  }
}

function updatedId(existingId: string | undefined, tenantId: string): string {
  if (existingId && existingId !== 'company-default-01' && existingId !== 'company_profile') {
    return existingId;
  }
  return `company_${tenantId}`;
}

export function resetCompanyProfile(): CompanyProfile {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_PROFILE;
  try {
    const key = getStorageKey();
    localStorage.removeItem(key);
    localStorage.removeItem(getScopedKey(CREDS_KEY));
    window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: DEFAULT_COMPANY_PROFILE }));
    
    if (isSupabaseConfigured()) {
      const tenantId = getActiveTenantId();
      supabase.from('company_profiles').delete().eq('tenant_id', tenantId).then(() => {
        console.log('[CompanyStore] Reset company profile in Supabase for tenant:', tenantId);
      });
    }

    return DEFAULT_COMPANY_PROFILE;
  } catch (err) {
    console.error('Failed to reset company profile:', err);
    return DEFAULT_COMPANY_PROFILE;
  }
}
