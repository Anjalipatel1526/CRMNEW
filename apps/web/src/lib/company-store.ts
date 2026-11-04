'use client';

import { supabase, isSupabaseConfigured } from './supabase';

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

const STORAGE_KEY = 'crm_dealership_company_profile_v1';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  id: 'company-default-01',
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
  authorizedSignatoryName: 'Anjali',
  authorizedSignatoryDesignation: 'COO',
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
    localStorage.setItem(CREDS_KEY, JSON.stringify({ ...creds, createdAt: new Date().toISOString() }));
    
    // Sync to Supabase user_credentials table if configured
    if (isSupabaseConfigured() && creds.email) {
      supabase
        .from('user_credentials')
        .upsert({
          tenant_id: 't-apex-001',
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
    const raw = localStorage.getItem(CREDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function getCompanyProfile(): CompanyProfile {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    if (!profile.authorizedSignatoryName || profile.authorizedSignatoryName === 'Witzharrey') {
      profile.authorizedSignatoryName = 'Anjali';
    }
    if (!profile.authorizedSignatoryDesignation || profile.authorizedSignatoryDesignation === 'Manager') {
      profile.authorizedSignatoryDesignation = 'COO';
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
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[CompanyStore] Supabase fetch error:', error.message);
      } else if (data) {
        const mapped: CompanyProfile = {
          id: data.id || 'company-default-01',
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
          authorizedSignatoryName: data.authorized_signatory_name || 'Anjali',
          authorizedSignatoryDesignation: data.authorized_signatory_designation || 'COO',
          signatureUrl: data.signature_url || '',
          isOnboarded: data.is_onboarded ?? true,
          updatedAt: data.updated_at || new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: mapped }));
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
    const updated: CompanyProfile = {
      ...current,
      ...profile,
      isOnboarded: true,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: updated }));

    // Persist to Supabase company_profiles table
    if (isSupabaseConfigured()) {
      const payload = {
        id: updated.id || 'company-default-01',
        tenant_id: 't-apex-001',
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
        authorized_signatory_name: updated.authorizedSignatoryName || 'Anjali',
        authorizedSignatoryDesignation: updated.authorizedSignatoryDesignation || 'COO',
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

export function resetCompanyProfile(): CompanyProfile {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_PROFILE;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CREDS_KEY);
    window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: DEFAULT_COMPANY_PROFILE }));
    
    if (isSupabaseConfigured()) {
      supabase.from('company_profiles').delete().eq('id', 'company-default-01').then(() => {
        console.log('[CompanyStore] Reset company profile in Supabase');
      });
    }

    return DEFAULT_COMPANY_PROFILE;
  } catch (err) {
    console.error('Failed to reset company profile:', err);
    return DEFAULT_COMPANY_PROFILE;
  }
}
