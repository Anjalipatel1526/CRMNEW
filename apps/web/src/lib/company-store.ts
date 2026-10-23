'use client';

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
  legalName: 'Apex Motors Private Limited',
  tradeName: 'Apex Motors',
  tagline: 'Precision Engineering & Luxury Automotive Experience',
  dealershipType: 'authorized_franchise',
  email: 'corporate@apexmotors.com',
  phone: '+91 22 6123 4567',
  supportPhone: '+91 1800 200 4567',
  website: 'https://www.apexmotors.com',
  address: 'Plot 42, Western Express Highway, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400069',
  country: 'India',
  gstin: '27AABCA1234F1ZP',
  pan: 'AABCA1234F',
  cin: 'U50100MH2020PTC123456',
  currency: 'INR (₹)',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0000042',
  branchName: 'Andheri East Commercial Branch',
  upiId: 'apexmotors@hdfcbank',
  logoUrl: '',
  watermarkEnabled: true,
  watermarkOpacity: 0.08,
  authorizedSignatoryName: 'Vikramaditya Singhania',
  authorizedSignatoryDesignation: 'Managing Director & Authorized Signatory',
  signatureUrl: '',
  isOnboarded: false,
  updatedAt: new Date().toISOString(),
};

export function getCompanyProfile(): CompanyProfile {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_COMPANY_PROFILE;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_COMPANY_PROFILE, ...parsed };
  } catch (err) {
    console.error('Failed to load company profile from storage:', err);
    return DEFAULT_COMPANY_PROFILE;
  }
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
    window.dispatchEvent(new CustomEvent('crm-company-profile-changed', { detail: DEFAULT_COMPANY_PROFILE }));
    return DEFAULT_COMPANY_PROFILE;
  } catch (err) {
    console.error('Failed to reset company profile:', err);
    return DEFAULT_COMPANY_PROFILE;
  }
}
