'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import {
  getCompanyProfile,
  saveCompanyProfile,
  resetCompanyProfile,
  saveUserCredentials,
  CompanyProfile,
  DEFAULT_COMPANY_PROFILE,
} from '@/lib/company-store';
import {
  getModules,
  saveModules,
  DealershipModule,
  DEFAULT_MODULES,
} from '@/lib/modules-registry';
import { api } from '@/lib/api-client';
import {
  INDIAN_STATES,
  POPULAR_CITIES,
  lookupPincode,
  fetchPincodeDetails,
  getStateAndPincodeForCity,
} from '@/lib/location-data';
import {
  Building2,
  CreditCard,
  PenTool,
  Layers,
  Shield,
  Upload,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  Image as ImageIcon,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Landmark,
  Compass,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  // Active Wizard Step: 1 to 5
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form Profile State
  const [formData, setFormData] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);

  // Modules Registry State
  const [modulesList, setModulesList] = useState<DealershipModule[]>(DEFAULT_MODULES);

  // Account Credentials State (Step 5)
  const [credentials, setCredentials] = useState({
    fullName: '',
    userId: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Success Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit') === 'true') {
        const existing = getCompanyProfile();
        setFormData(existing);
      } else {
        // Clear all mock/test data so fields start completely empty
        resetCompanyProfile();
        setFormData(DEFAULT_COMPANY_PROFILE);
      }
    }
    setModulesList(getModules());
  }, []);

  // Clear specific field error
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Auto-fill and dropdown handler for City selection
  const handleCitySelect = (cityName: string) => {
    const info = getStateAndPincodeForCity(cityName) || POPULAR_CITIES.find(
      (c) => c.city.toLowerCase() === cityName.toLowerCase().trim()
    );
    const matchedState = info?.state || formData.state;
    const matchedPincode =
      (!formData.pincode || formData.pincode.length !== 6) && info?.pincode
        ? info.pincode
        : formData.pincode;

    setFormData((prev) => ({
      ...prev,
      city: cityName,
      state: matchedState,
      pincode: matchedPincode,
    }));
    clearError('city');
    if (matchedState) clearError('state');
    if (matchedPincode && matchedPincode.length === 6) clearError('pincode');
  };

  // State selection handler
  const handleStateSelect = (stateName: string) => {
    setFormData((prev) => ({
      ...prev,
      state: stateName,
    }));
    clearError('state');
  };

  // Pincode input & auto-detection handler (instant local lookup + async postal API verification)
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: clean }));
    clearError('pincode');

    if (clean.length === 6) {
      // 1. Instant local offline lookup
      const instant = lookupPincode(clean);
      if (instant && (instant.city || instant.state)) {
        setFormData((prev) => ({
          ...prev,
          pincode: clean,
          city: instant.city || prev.city,
          state: instant.state || prev.state,
        }));
        if (instant.city) clearError('city');
        if (instant.state) clearError('state');
      }

      // 2. Background async query for pin-specific post office & district
      try {
        const live = await fetchPincodeDetails(clean);
        if (live && (live.city || live.state)) {
          setFormData((prev) => ({
            ...prev,
            pincode: clean,
            city: live.city || prev.city,
            state: live.state || prev.state,
          }));
          if (live.city) clearError('city');
          if (live.state) clearError('state');
        }
      } catch {
        // silent
      }
    }
  };

  // Image resize and optimization to guarantee fast localStorage performance
  const handleOptimizedImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    onSuccess: (dataUrl: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          onSuccess(canvas.toDataURL('image/png', 0.9));
        } else {
          onSuccess(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleOptimizedImage(file, 400, 400, (dataUrl) => {
        setFormData((prev) => ({ ...prev, logoUrl: dataUrl }));
        clearError('logoUrl');
      });
    }
  };

  // Signature photo file upload handler
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleOptimizedImage(file, 500, 200, (dataUrl) => {
        setFormData((prev) => ({ ...prev, signatureUrl: dataUrl }));
        clearError('signatureUrl');
      });
    }
  };

  // Module plugin toggle
  const handleToggleModule = (modId: string) => {
    setModulesList((prev) =>
      prev.map((mod) => (mod.id === modId ? { ...mod, isPluggedIn: !mod.isPluggedIn } : mod))
    );
  };

  const handlePluginAll = (active: boolean) => {
    setModulesList((prev) => prev.map((mod) => ({ ...mod, isPluggedIn: active })));
  };

  // ================= VALIDATION LOGIC =================

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.legalName.trim()) {
      newErrors.legalName = 'Dealership Legal Registered Name is mandatory';
    }
    if (!formData.tradeName.trim()) {
      newErrors.tradeName = 'Trade / Display Brand Name is mandatory';
    }

    // Gmail / Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Corporate Email / Gmail ID is mandatory';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Incorrect email address format (e.g. dealership@gmail.com)';
    }

    // Phone validation (10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const cleanPhone = phoneDigits.length === 12 && phoneDigits.startsWith('91') ? phoneDigits.slice(2) : phoneDigits;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Showroom Contact Phone is mandatory';
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = 'Incorrect phone number (must be a valid 10-digit mobile number)';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Showroom Physical Street Address is mandatory';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is mandatory';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is mandatory';
    }

    // Pincode validation (6 digits)
    const pincodeDigits = formData.pincode.replace(/\D/g, '');
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is mandatory';
    } else if (pincodeDigits.length !== 6) {
      newErrors.pincode = 'Incorrect pincode (must be exactly 6 numeric digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // GSTIN validation (15 chars)
    const gstinClean = formData.gstin.trim().toUpperCase();
    if (!gstinClean) {
      newErrors.gstin = 'GSTIN Number is mandatory';
    } else if (gstinClean.length !== 15) {
      newErrors.gstin = 'Incorrect GSTIN format (must be 15 alphanumeric characters)';
    }

    // PAN validation (10 chars)
    const panClean = formData.pan.trim().toUpperCase();
    if (!panClean) {
      newErrors.pan = 'PAN Number is mandatory';
    } else if (panClean.length !== 10) {
      newErrors.pan = 'Incorrect PAN format (must be 10 characters, e.g. ABCDE1234F)';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Settlement Bank Name is mandatory';
    }

    // Bank Account validation (at least 9 digits)
    const accDigits = formData.accountNumber.replace(/\D/g, '');
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Bank Account Number is mandatory';
    } else if (accDigits.length < 9) {
      newErrors.accountNumber = 'Incorrect bank account number (must be at least 9 digits)';
    }

    // IFSC validation (11 chars)
    const ifscClean = formData.ifscCode.trim().toUpperCase();
    if (!ifscClean) {
      newErrors.ifscCode = 'IFSC Code is mandatory';
    } else if (ifscClean.length !== 11) {
      newErrors.ifscCode = 'Incorrect IFSC Code (must be 11 characters, e.g. HDFC0001234)';
    }

    if (!formData.branchName.trim()) {
      newErrors.branchName = 'Bank Branch Name is mandatory';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 Validation (Signature)
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.authorizedSignatoryName.trim()) {
      newErrors.authorizedSignatoryName = 'Authorized Signatory Full Name is mandatory';
    }
    if (!formData.authorizedSignatoryDesignation.trim()) {
      newErrors.authorizedSignatoryDesignation = 'Signatory Designation / Role is mandatory';
    }
    if (!formData.signatureUrl) {
      newErrors.signatureUrl = 'Authorized Signature Photo is mandatory for invoice stamping';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 5 Validation (User ID & Password)
  const validateStep5 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!credentials.userId.trim()) {
      newErrors.userId = 'Admin User ID is mandatory';
    } else if (credentials.userId.trim().length < 3) {
      newErrors.userId = 'User ID must be at least 3 characters';
    }

    if (!credentials.password) {
      newErrors.password = 'Password is mandatory';
    } else if (credentials.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(credentials.password)) {
      newErrors.password = 'Password must contain at least one capital letter (A-Z)';
    } else if (!/[a-z]/.test(credentials.password)) {
      newErrors.password = 'Password must contain at least one small letter (a-z)';
    } else if (!/[0-9]/.test(credentials.password)) {
      newErrors.password = 'Password must contain at least one numeric digit (0-9)';
    }

    if (!credentials.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is mandatory';
    } else if (credentials.password !== credentials.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers with mandatory checks
  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setActiveStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setActiveStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextFromStep3 = () => {
    if (validateStep3()) {
      setActiveStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextFromStep4 = () => {
    if (!credentials.fullName && formData.authorizedSignatoryName) {
      setCredentials((prev) => ({
        ...prev,
        fullName: formData.authorizedSignatoryName,
        userId: prev.userId || (formData.email ? formData.email.split('@')[0] : 'admin'),
      }));
    }
    setActiveStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form submission in Step 5: Save everything and route to login
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep5()) return;

    // 1. Save company profile with isOnboarded: true and logoUrl
    const updatedCompany = saveCompanyProfile({
      ...formData,
      isOnboarded: true,
    });

    // 2. Save modules with plugin states
    saveModules(modulesList);

    // 3. Save User ID and Password credentials
    saveUserCredentials({
      userId: credentials.userId.trim(),
      password: credentials.password,
      fullName: credentials.fullName.trim() || formData.authorizedSignatoryName || formData.tradeName || 'Dealership Administrator',
      email: formData.email.trim(),
    });

    // 4. Update in-memory userContext tenant name
    try {
      const ctx = api.getUserContext();
      if (ctx?.tenant) {
        ctx.tenant.name = updatedCompany.tradeName || updatedCompany.legalName;
      }
    } catch (err) {}

    // 5. Open success modal then redirect to login page
    setIsSuccessModalOpen(true);
  };

  const activePluginsCount = modulesList.filter((m) => m.isPluggedIn).length;

  const STEPS = [
    { num: 1, label: 'Identity & Details', icon: Building2 },
    { num: 2, label: 'Tax & Banking', icon: CreditCard },
    { num: 3, label: 'Invoice Signature', icon: PenTool },
    { num: 4, label: 'Plugin Access Control', icon: Layers },
    { num: 5, label: 'Account Credentials', icon: Shield },
  ];

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '5rem', paddingTop: '0.75rem', width: '100%' }}>
      {/* Decorative Atmosphere Glows matching Pearl Green Theme */}
      <div
        style={{
          position: 'fixed',
          top: '-140px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '780px',
          height: '380px',
          background: 'radial-gradient(ellipse at center, rgba(35, 78, 67, 0.08) 0%, rgba(35, 78, 67, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Hero Header without the pill badge */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '28px', textAlign: 'center' }}>
        <h1 className="onboarding-title">
          <WordFadeIn text="Dealership Legal Entity & Branding Setup" />
        </h1>

        {/* Dynamic Progress Indicator */}
        <div
          style={{
            maxWidth: '300px',
            margin: '14px auto 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '5px',
              backgroundColor: 'rgba(30, 68, 59, 0.1)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(activeStep / 5) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2A5A4E 0%, #1E443B 100%)',
                borderRadius: '999px',
                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E443B' }}>
            Step {activeStep} of 5
          </span>
        </div>
      </div>

      {/* Floating Capsule Step Navigation Dock (Responsive) */}
      <div className="onboarding-nav-dock">
        {STEPS.map((step) => {
          const isActive = activeStep === step.num;
          const isDone = activeStep > step.num;

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => {
                if (step.num < activeStep) {
                  setActiveStep(step.num as any);
                }
              }}
              className={`onboarding-nav-pill ${isActive ? 'active' : ''}`}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #26554A 0%, #173830 100%)'
                  : isDone
                  ? 'rgba(30, 68, 59, 0.08)'
                  : 'transparent',
                color: isActive ? '#FFFFFF' : isDone ? '#1E443B' : '#5E6360',
                boxShadow: isActive ? '0 8px 20px -4px rgba(30, 68, 59, 0.36)' : 'none',
                cursor: step.num < activeStep ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: isActive
                    ? 'rgba(255, 255, 255, 0.24)'
                    : isDone
                    ? '#1E443B'
                    : 'rgba(30, 68, 59, 0.08)',
                  color: isDone ? '#FFFFFF' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : step.num}
              </div>
              <span
                className="step-label-text"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 800 : 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Global Validation Alert Banner */}
      {Object.keys(errors).length > 0 && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.03) 100%)',
            border: '1.5px solid rgba(220, 38, 38, 0.28)',
            borderRadius: '16px',
            padding: '12px 18px',
            marginBottom: '24px',
            color: '#B91C1C',
            fontSize: '0.84rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.05)',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={16} />
          </div>
          <div>
            <span>Please complete all mandatory dealership actions marked in red below to proceed.</span>
          </div>
        </div>
      )}

      {/* ================= STEP 1: IDENTITY, LOGO & DETAILS ================= */}
      {activeStep === 1 && (
        <div className="onboarding-card">
          {/* Step Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#1E443B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#234E43' }} />
                <span>Section 01 of 05</span>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#17191A', margin: 0, letterSpacing: '-0.02em' }}>
                Dealership Entity, Brand Logo & Contact
              </h2>
            </div>
          </div>

          {/* Dealership Logo Upload Atelier Card */}
          <div className="onboarding-logo-box" style={{ borderColor: errors.logoUrl ? '#DC2626' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px dashed rgba(30, 68, 59, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(30, 68, 59, 0.06)',
                  flexShrink: 0,
                }}
              >
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Dealership Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#8A918D' }}>
                    <ImageIcon size={26} style={{ margin: '0 auto', display: 'block', opacity: 0.6 }} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, display: 'block', marginTop: '3px', letterSpacing: '0.04em' }}>
                      LOGO
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#17191A', margin: 0 }}>
                    Dealership Brand Emblem / Logo
                  </h3>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(30, 68, 59, 0.08)',
                      color: '#1E443B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Asset
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#5E6360', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Appears on your top navigation dock, official GST invoices, and delivery dossiers.
                </p>
                <div style={{ fontSize: '0.72rem', color: '#8A918D', marginTop: '3px' }}>
                  PNG, JPG, or SVG format with transparent background recommended.
                </div>
              </div>
            </div>

            <div className="onboarding-logo-actions">
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(30, 68, 59, 0.28)',
                  boxSizing: 'border-box',
                }}
              >
                <Upload size={14} />
                <span>{formData.logoUrl ? 'Replace Logo' : 'Upload Company Logo'}</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              </label>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '' })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '999px',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Legal Name & Trade Name (Responsive 2 cols -> 1 col) */}
          <div className="onboarding-grid-2">
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                <Building2 size={14} style={{ color: '#234E43' }} />
                <span>Dealership Legal Registered Name</span>
                <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.legalName ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#17191A',
                }}
                value={formData.legalName}
                onChange={(e) => {
                  setFormData({ ...formData, legalName: e.target.value });
                  clearError('legalName');
                }}
                placeholder="e.g. Apex Motors Private Limited"
              />
              {errors.legalName ? (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.legalName}
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#5E6360', marginTop: '5px', display: 'block' }}>
                  Printed on legal GST tax invoices and vehicle ownership transfer documents.
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                <Compass size={14} style={{ color: '#234E43' }} />
                <span>Trade / Display Brand Name</span>
                <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.tradeName ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#17191A',
                }}
                value={formData.tradeName}
                onChange={(e) => {
                  setFormData({ ...formData, tradeName: e.target.value });
                  clearError('tradeName');
                }}
                placeholder="e.g. Apex Luxury Motors"
              />
              {errors.tradeName ? (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.tradeName}
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#5E6360', marginTop: '5px', display: 'block' }}>
                  Displayed in your top navigation header and showroom title.
                </span>
              )}
            </div>
          </div>

          {/* Email, Phone & Website */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                <Mail size={14} style={{ color: '#234E43' }} />
                <span>Corporate Email / Gmail ID</span>
                <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="email"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.email ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  clearError('email');
                }}
                placeholder="dealership@gmail.com"
              />
              {errors.email && (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.email}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                <Phone size={14} style={{ color: '#234E43' }} />
                <span>Contact Phone (10 Digits)</span>
                <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.phone ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  clearError('phone');
                }}
                placeholder="9820011223"
              />
              {errors.phone && (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.phone}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                <Globe size={14} style={{ color: '#234E43' }} />
                <span>Official Web Portal</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.apexmotors.com"
              />
            </div>
          </div>

          {/* Physical Address */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
              <MapPin size={14} style={{ color: '#234E43' }} />
              <span>Showroom Physical Street Address</span>
              <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#FAFBF9',
                border: errors.address ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                borderRadius: '14px',
                padding: '12px 16px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                clearError('address');
              }}
              placeholder="Plot 42, Western Express Highway, Andheri East"
            />
            {errors.address && (
              <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> {errors.address}
              </div>
            )}
          </div>

          {/* Location Grid (Responsive 3 cols -> 2 cols on mobile) */}
          <div className="onboarding-grid-location">
            {/* City Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                City <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                className="form-select"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.city ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#17191A',
                }}
                value={formData.city}
                onChange={(e) => handleCitySelect(e.target.value)}
              >
                <option value="">-- Select City --</option>
                {/* Dynamic option for currently saved / custom / auto-detected city */}
                {formData.city && !POPULAR_CITIES.some((c) => c.city.toLowerCase() === formData.city.toLowerCase()) && (
                  <option value={formData.city}>
                    📍 {formData.city} (Selected)
                  </option>
                )}
                {/* Top Metros */}
                <optgroup label="⭐ Top Metros & Commercial Hubs">
                  {POPULAR_CITIES.slice(0, 10).map((c) => (
                    <option key={`metro-${c.city}`} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </optgroup>
                {/* All states alphabetical */}
                {Array.from(new Set(POPULAR_CITIES.map((c) => c.state)))
                  .sort((a, b) => a.localeCompare(b))
                  .map((stateName) => (
                    <optgroup key={stateName} label={stateName}>
                      {POPULAR_CITIES.filter((c) => c.state === stateName).map((c) => (
                        <option key={`${stateName}-${c.city}`} value={c.city}>
                          {c.city}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>

              {errors.city && (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.city}
                </div>
              )}
            </div>

            {/* State Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                State <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                className="form-select"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.state ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#17191A',
                }}
                value={formData.state}
                onChange={(e) => handleStateSelect(e.target.value)}
              >
                <option value="">-- Select State / UT --</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.state}
                </div>
              )}
            </div>

            {/* Pincode Input with instant auto-fill */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                Pincode (6 Digits) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.pincode ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                value={formData.pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="400069"
                maxLength={6}
              />
              {errors.pincode && (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.pincode}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid rgba(30, 68, 59, 0.1)' }}>
            <button
              type="button"
              onClick={handleNextFromStep1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 30px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px -6px rgba(30, 68, 59, 0.38)',
              }}
            >
              <span>Continue to Tax & Banking</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: TAX & BANKING ================= */}
      {activeStep === 2 && (
        <div className="onboarding-card">
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#1E443B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#234E43' }} />
              <span>Section 02 of 05</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#17191A', margin: 0, letterSpacing: '-0.02em' }}>
              Statutory Tax & Settlement Bank Coordinates
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#5E6360', marginTop: '4px' }}>
              Mandatory tax and banking coordinates automatically stamped on customer proformas, advance booking receipts, and invoice footers.
            </p>
          </div>

          {/* GSTIN & PAN Card (Responsive 1.2fr 1fr 1fr -> 1 col) */}
          <div
            style={{
              padding: '22px',
              backgroundColor: '#FAFBF9',
              borderRadius: '20px',
              border: '1px solid rgba(30, 68, 59, 0.12)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={18} style={{ color: '#234E43' }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#17191A', margin: 0 }}>
                Government Tax Identification
              </h3>
            </div>

            <div className="onboarding-grid-tax">
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  GSTIN Registration Number <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    background: '#FFFFFF',
                    border: errors.gstin ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                  }}
                  value={formData.gstin}
                  onChange={(e) => {
                    setFormData({ ...formData, gstin: e.target.value.toUpperCase() });
                    clearError('gstin');
                  }}
                  placeholder="27AADCB2230M1ZP"
                  maxLength={15}
                />
                {errors.gstin ? (
                  <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.gstin}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#5E6360', marginTop: '5px', display: 'block' }}>
                    15-character alphanumeric GSTIN.
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  Permanent Account Number (PAN) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    background: '#FFFFFF',
                    border: errors.pan ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                  }}
                  value={formData.pan}
                  onChange={(e) => {
                    setFormData({ ...formData, pan: e.target.value.toUpperCase() });
                    clearError('pan');
                  }}
                  placeholder="AADCB2230M"
                  maxLength={10}
                />
                {errors.pan && (
                  <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.pan}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  Corporate Identity Number (CIN)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                  }}
                  value={formData.cin || ''}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                  placeholder="U50100MH2018PTC309112"
                />
              </div>
            </div>
          </div>

          {/* Banking Coordinates Card (Responsive grid) */}
          <div
            style={{
              padding: '22px',
              backgroundColor: '#FAFBF9',
              borderRadius: '20px',
              border: '1px solid rgba(30, 68, 59, 0.12)',
              marginBottom: '26px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Landmark size={18} style={{ color: '#234E43' }} />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#17191A', margin: 0 }}>
                Dealership Primary Bank Settlement Account
              </h3>
            </div>

            <div className="onboarding-grid-bank">
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  Bank Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    border: errors.bankName ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                  value={formData.bankName}
                  onChange={(e) => {
                    setFormData({ ...formData, bankName: e.target.value });
                    clearError('bankName');
                  }}
                  placeholder="e.g. HDFC Bank Ltd"
                />
                {errors.bankName && (
                  <div style={{ color: '#DC2626', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>
                    {errors.bankName}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  Account Number <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    background: '#FFFFFF',
                    border: errors.accountNumber ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                  }}
                  value={formData.accountNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, accountNumber: e.target.value });
                    clearError('accountNumber');
                  }}
                  placeholder="50200049281726"
                />
                {errors.accountNumber && (
                  <div style={{ color: '#DC2626', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>
                    {errors.accountNumber}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  IFSC Code <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    background: '#FFFFFF',
                    border: errors.ifscCode ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                  }}
                  value={formData.ifscCode}
                  onChange={(e) => {
                    setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() });
                    clearError('ifscCode');
                  }}
                  placeholder="HDFC0000060"
                  maxLength={11}
                />
                {errors.ifscCode && (
                  <div style={{ color: '#DC2626', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>
                    {errors.ifscCode}
                  </div>
                )}
              </div>
            </div>

            <div className="onboarding-grid-branch">
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  Branch Name & Location <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    border: errors.branchName ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                  value={formData.branchName}
                  onChange={(e) => {
                    setFormData({ ...formData, branchName: e.target.value });
                    clearError('branchName');
                  }}
                  placeholder="Andheri East Corporate Branch, Mumbai"
                />
                {errors.branchName && (
                  <div style={{ color: '#DC2626', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>
                    {errors.branchName}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  UPI Payment ID / VPA
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(30, 68, 59, 0.14)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                  value={formData.upiId || ''}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="dealership@hdfcbank"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(30, 68, 59, 0.1)' }}>
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '999px',
                background: 'rgba(30, 68, 59, 0.07)',
                color: '#1E443B',
                fontSize: '0.84rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep2}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 30px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px -6px rgba(30, 68, 59, 0.38)',
              }}
            >
              <span>Continue to Invoice Signature</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: INVOICE AUTHORIZED SIGNATURE PHOTO ================= */}
      {activeStep === 3 && (
        <div className="onboarding-card">
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#1E443B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#234E43' }} />
              <span>Section 03 of 05</span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#17191A', margin: 0, letterSpacing: '-0.02em' }}>
              Invoice Authorized Signatory & Digital Signature Photo
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#5E6360', marginTop: '4px' }}>
              Upload the official signature image of the authorized signatory. This image is digitally stamped across all generated tax invoices and gate clearance receipts.
            </p>
          </div>

          {/* Signatory Name & Designation (Responsive 1fr 1fr -> 1 col) */}
          <div className="onboarding-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                Authorized Signatory Full Name <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.authorizedSignatoryName ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                value={formData.authorizedSignatoryName}
                onChange={(e) => {
                  setFormData({ ...formData, authorizedSignatoryName: e.target.value });
                  clearError('authorizedSignatoryName');
                }}
                placeholder="e.g. Vikramaditya Singhania"
              />
              {errors.authorizedSignatoryName ? (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.authorizedSignatoryName}
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#5E6360', marginTop: '5px', display: 'block' }}>
                  Printed beneath the legal seal and signature box on GST invoices.
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                Signatory Designation / Role <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#FAFBF9',
                  border: errors.authorizedSignatoryDesignation ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                value={formData.authorizedSignatoryDesignation}
                onChange={(e) => {
                  setFormData({ ...formData, authorizedSignatoryDesignation: e.target.value });
                  clearError('authorizedSignatoryDesignation');
                }}
                placeholder="e.g. Managing Director & Principal Dealer"
              />
              {errors.authorizedSignatoryDesignation && (
                <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.authorizedSignatoryDesignation}
                </div>
              )}
            </div>
          </div>

          {/* Signature Photo Upload Card */}
          <div
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(35, 78, 67, 0.04) 0%, rgba(250, 251, 249, 1) 100%)',
              borderRadius: '20px',
              border: errors.signatureUrl ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
              marginBottom: '26px',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#17191A', margin: 0 }}>
                  Upload Signatory Photo / Transparent Signature
                </h3>
                <span style={{ color: '#DC2626', fontWeight: 800 }}>*</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#5E6360', margin: '4px 0 0' }}>
                Upload high-contrast photo or scanned signature (transparent PNG recommended) to embed on all billing records.
              </p>
            </div>

            {formData.signatureUrl ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  padding: '18px 20px',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(30, 68, 59, 0.18)',
                  boxShadow: '0 4px 16px rgba(30, 68, 59, 0.04)',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      height: '60px',
                      minWidth: '140px',
                      padding: '6px 14px',
                      backgroundColor: '#F8FAF9',
                      borderRadius: '10px',
                      border: '1px dashed rgba(30, 68, 59, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={formData.signatureUrl}
                      alt="Authorized Signature"
                      style={{ maxHeight: '48px', maxWidth: '160px', objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#24754E', fontSize: '0.86rem', fontWeight: 800 }}>
                      <CheckCircle2 size={16} />
                      <span>Signature Photo Uploaded</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#5E6360', marginTop: '2px' }}>
                      Signatory: {formData.authorizedSignatoryName || 'Principal Officer'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 16px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(30, 68, 59, 0.25)',
                    }}
                  >
                    <Upload size={13} />
                    <span>Change Photo</span>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, signatureUrl: '' })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 16px',
                      borderRadius: '999px',
                      border: '1px solid rgba(220, 38, 38, 0.2)',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '36px 20px',
                  borderRadius: '16px',
                  border: '2px dashed rgba(30, 68, 59, 0.25)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(35, 78, 67, 0.08)',
                    color: '#1E443B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PenTool size={22} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#17191A', display: 'block' }}>
                    Click to Upload Signature Photo
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#5E6360', marginTop: '2px', display: 'block' }}>
                    PNG or JPG image (High-contrast with transparent background recommended)
                  </span>
                </div>
                <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'none' }} />
              </label>
            )}

            {errors.signatureUrl && (
              <div style={{ color: '#DC2626', fontSize: '0.76rem', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} /> {errors.signatureUrl}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(30, 68, 59, 0.1)' }}>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '999px',
                background: 'rgba(30, 68, 59, 0.07)',
                color: '#1E443B',
                fontSize: '0.84rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep3}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 30px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px -6px rgba(30, 68, 59, 0.38)',
              }}
            >
              <span>Continue to Plugin Access Control</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: PLUGIN IN / PLUGIN OUT (ACCESS CONTROL) ================= */}
      {activeStep === 4 && (
        <div className="onboarding-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#1E443B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#234E43' }} />
                <span>Section 04 of 05</span>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#17191A', margin: 0, letterSpacing: '-0.02em' }}>
                Department Modules & Plugin Access Control
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#5E6360', marginTop: '4px' }}>
                Plugin In (Activate) or Plugin Out (Deactivate) specific dealership departments. Plugged-in modules automatically appear in your top navigation dock.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handlePluginAll(true)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(30, 68, 59, 0.2)',
                  background: 'rgba(30, 68, 59, 0.06)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#1E443B',
                  cursor: 'pointer',
                }}
              >
                Plugin In All ({modulesList.length})
              </button>
              <button
                type="button"
                onClick={() => handlePluginAll(false)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: '#F8FAF9',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#5E6360',
                  cursor: 'pointer',
                }}
              >
                Plugin Out All
              </button>
            </div>
          </div>

          {/* Plugin Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: 'rgba(35, 78, 67, 0.05)',
              borderRadius: '16px',
              marginBottom: '22px',
              border: '1px solid rgba(35, 78, 67, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', fontWeight: 800, color: '#1E443B' }}>
              <Layers size={18} />
              <span>Active Department Plugins: <strong>{activePluginsCount}</strong> of {modulesList.length} Connected</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#5E6360' }}>
              Real-time sync to navigation dock
            </span>
          </div>

          {/* Modules Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {modulesList.map((mod) => {
              const isPlugged = mod.isPluggedIn;

              return (
                <div
                  key={mod.id}
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    backgroundColor: isPlugged ? '#FFFFFF' : '#FAFBF9',
                    border: '1.5px solid',
                    borderColor: isPlugged ? 'rgba(35, 78, 67, 0.35)' : 'rgba(30, 68, 59, 0.1)',
                    boxShadow: isPlugged ? '0 8px 24px -8px rgba(35, 78, 67, 0.14)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: isPlugged ? 'rgba(35, 78, 67, 0.1)' : '#F1F5F9',
                          color: isPlugged ? '#1E443B' : '#5E6360',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {mod.category}
                      </span>

                      {/* Pill toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleModule(mod.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          border: 'none',
                          background: isPlugged
                            ? 'linear-gradient(135deg, #26554A 0%, #173830 100%)'
                            : 'rgba(30, 68, 59, 0.1)',
                          color: isPlugged ? '#FFFFFF' : '#5E6360',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isPlugged ? '0 2px 8px rgba(30, 68, 59, 0.2)' : 'none',
                        }}
                      >
                        {isPlugged ? (
                          <>
                            <Check size={12} strokeWidth={3} />
                            <span>Plugged In</span>
                          </>
                        ) : (
                          <span>Plugged Out</span>
                        )}
                      </button>
                    </div>

                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#17191A', marginBottom: '6px' }}>
                      {mod.label}
                    </div>

                    <p style={{ fontSize: '0.76rem', color: '#5E6360', margin: 0, lineHeight: 1.45 }}>
                      {mod.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(30, 68, 59, 0.08)', fontSize: '0.72rem', color: '#8A918D' }}>
                    <span>Route: {mod.href}</span>
                    <span style={{ fontWeight: 700, color: isPlugged ? '#24754E' : '#8A918D' }}>
                      {isPlugged ? '● Visible in Top Nav' : '○ Hidden from Top Nav'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(30, 68, 59, 0.1)' }}>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '999px',
                background: 'rgba(30, 68, 59, 0.07)',
                color: '#1E443B',
                fontSize: '0.84rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextFromStep4}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 30px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px -6px rgba(30, 68, 59, 0.38)',
              }}
            >
              <span>Continue to Create Account</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 5: CREATE USER ID & PASSWORD (LAST STAGE) ================= */}
      {activeStep === 5 && (
        <form onSubmit={handleFinalSubmit}>
          <div className="onboarding-card">
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(35, 78, 67, 0.1)',
                  color: '#1E443B',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  marginBottom: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                <Shield size={13} />
                <span>FINAL STAGE</span>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#17191A', margin: 0, letterSpacing: '-0.02em' }}>
                Step 5: Create Administrator Account Credentials
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#5E6360', marginTop: '4px' }}>
                Set up your primary administrative User ID and password. Once created, you will be automatically routed to the sign-in screen to access your customized dealership dashboard.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FAFBF9',
                borderRadius: '20px',
                border: '1px solid rgba(30, 68, 59, 0.12)',
                padding: '24px',
                marginBottom: '26px',
              }}
            >
              {/* Administrator Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  Administrator Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#8A918D',
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      paddingLeft: '40px',
                      background: '#FFFFFF',
                      border: '1.5px solid rgba(30, 68, 59, 0.14)',
                      borderRadius: '14px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                    value={credentials.fullName}
                    onChange={(e) => setCredentials({ ...credentials, fullName: e.target.value })}
                    placeholder={formData.authorizedSignatoryName || 'Dealership Administrator'}
                  />
                </div>
              </div>

              {/* User ID */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                  Create Administrator User ID / Username <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#8A918D',
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      paddingLeft: '40px',
                      background: '#FFFFFF',
                      border: errors.userId ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                      borderRadius: '14px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#1E443B',
                    }}
                    value={credentials.userId}
                    onChange={(e) => {
                      setCredentials({ ...credentials, userId: e.target.value });
                      clearError('userId');
                    }}
                    placeholder="e.g. admin or vikram.singh"
                  />
                </div>
                {errors.userId ? (
                  <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.userId}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#5E6360', marginTop: '5px', display: 'block' }}>
                    You will sign in with this User ID on the login screen.
                  </span>
                )}
              </div>

              {/* Password & Confirm Password (Responsive 1fr 1fr -> 1 col) */}
              <div className="onboarding-grid-creds">
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                    Create Password <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#8A918D',
                      }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        paddingLeft: '40px',
                        paddingRight: '40px',
                        background: '#FFFFFF',
                        border: errors.password ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                        borderRadius: '14px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                      value={credentials.password}
                      onChange={(e) => {
                        setCredentials({ ...credentials, password: e.target.value });
                        clearError('password');
                      }}
                      placeholder="Min. 8 characters (1 uppercase, 1 lowercase, 1 number)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#8A918D',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.password}
                    </div>
                  )}

                  {/* Live Password Strength & Requirements Checklist */}
                  <div style={{ marginTop: '10px' }}>
                    {credentials.password ? (
                      (() => {
                        const hasUpper = /[A-Z]/.test(credentials.password);
                        const hasLower = /[a-z]/.test(credentials.password);
                        const hasNumber = /[0-9]/.test(credentials.password);
                        const hasMinLength = credentials.password.length >= 8;
                        const isStrong = hasUpper && hasLower && hasNumber && hasMinLength;

                        return (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5E6360' }}>
                                Password Strength:
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: isStrong ? '#15803D' : (hasUpper || hasLower) && (hasNumber || hasMinLength) ? '#D97706' : '#DC2626',
                                }}
                              >
                                {isStrong ? 'Strong Password ✓' : (hasUpper || hasLower) && (hasNumber || hasMinLength) ? 'Medium (Needs capital/numeric)' : 'Weak Password'}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(30, 68, 59, 0.08)', marginBottom: '8px' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '100%',
                                  backgroundColor: credentials.password.length > 0 ? (isStrong ? '#15803D' : '#D97706') : 'transparent',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                              <div
                                style={{
                                  flex: 1,
                                  height: '100%',
                                  backgroundColor: (hasUpper || hasNumber) && hasLower ? (isStrong ? '#15803D' : '#D97706') : 'transparent',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                              <div
                                style={{
                                  flex: 1,
                                  height: '100%',
                                  backgroundColor: isStrong ? '#15803D' : 'transparent',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            </div>

                            {/* Checklist tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  backgroundColor: hasUpper ? 'rgba(21, 128, 61, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                                  color: hasUpper ? '#15803D' : '#DC2626',
                                  border: hasUpper ? '1px solid rgba(21, 128, 61, 0.25)' : '1px solid rgba(220, 38, 38, 0.2)',
                                }}
                              >
                                {hasUpper ? <Check size={10} strokeWidth={3} /> : '✕'} 1 Capital (A-Z)
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  backgroundColor: hasLower ? 'rgba(21, 128, 61, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                                  color: hasLower ? '#15803D' : '#DC2626',
                                  border: hasLower ? '1px solid rgba(21, 128, 61, 0.25)' : '1px solid rgba(220, 38, 38, 0.2)',
                                }}
                              >
                                {hasLower ? <Check size={10} strokeWidth={3} /> : '✕'} 1 Small (a-z)
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  backgroundColor: hasNumber ? 'rgba(21, 128, 61, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                                  color: hasNumber ? '#15803D' : '#DC2626',
                                  border: hasNumber ? '1px solid rgba(21, 128, 61, 0.25)' : '1px solid rgba(220, 38, 38, 0.2)',
                                }}
                              >
                                {hasNumber ? <Check size={10} strokeWidth={3} /> : '✕'} 1 Numeric (0-9)
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  backgroundColor: hasMinLength ? 'rgba(21, 128, 61, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                                  color: hasMinLength ? '#15803D' : '#DC2626',
                                  border: hasMinLength ? '1px solid rgba(21, 128, 61, 0.25)' : '1px solid rgba(220, 38, 38, 0.2)',
                                }}
                              >
                                {hasMinLength ? <Check size={10} strokeWidth={3} /> : '✕'} 8+ Chars
                              </span>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#5E6360', display: 'block' }}>
                        Must include at least 1 capital letter, 1 small letter, 1 numeric digit, and 8+ characters.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17191A', marginBottom: '8px' }}>
                    Confirm Password <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#8A918D',
                      }}
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        paddingLeft: '40px',
                        paddingRight: '40px',
                        background: '#FFFFFF',
                        border: errors.confirmPassword ? '1.5px solid #DC2626' : '1.5px solid rgba(30, 68, 59, 0.14)',
                        borderRadius: '14px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                      value={credentials.confirmPassword}
                      onChange={(e) => {
                        setCredentials({ ...credentials, confirmPassword: e.target.value });
                        clearError('confirmPassword');
                      }}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#8A918D',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword ? (
                    <div style={{ color: '#DC2626', fontSize: '0.74rem', fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {errors.confirmPassword}
                    </div>
                  ) : credentials.password && credentials.confirmPassword && credentials.password === credentials.confirmPassword ? (
                    <div style={{ color: '#24754E', fontSize: '0.74rem', fontWeight: 700, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} strokeWidth={3} /> Passwords match
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Submission Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(30, 68, 59, 0.1)', flexWrap: 'wrap', gap: '14px' }}>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  borderRadius: '999px',
                  background: 'rgba(30, 68, 59, 0.07)',
                  color: '#1E443B',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                style={{
                  padding: '14px 36px',
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 24px -6px rgba(30, 68, 59, 0.42)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Complete Onboarding & Create Account</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Celebration & Redirection to Login Modal */}
      {isSuccessModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(23, 56, 48, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              maxWidth: '520px',
              width: '100%',
              padding: '36px 30px',
              textAlign: 'center',
              boxShadow: '0 30px 60px -15px rgba(23, 56, 48, 0.35)',
              position: 'relative',
              animation: 'fadeInUp 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                fontSize: '1.8rem',
                boxShadow: '0 8px 24px -4px rgba(30, 68, 59, 0.35)',
              }}
            >
              ✓
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                borderRadius: '999px',
                background: 'rgba(35, 78, 67, 0.1)',
                color: '#1E443B',
                fontSize: '0.76rem',
                fontWeight: 800,
                marginBottom: '10px',
                letterSpacing: '0.04em',
              }}
            >
              🎉 DEALERSHIP WORKSPACE INITIALIZED
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#17191A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Welcome, {formData.tradeName || formData.legalName}!
            </h2>

            <p style={{ fontSize: '0.84rem', color: '#5E6360', lineHeight: 1.55, marginBottom: '22px' }}>
              Your brand logo, statutory GSTIN details, digital signature, and administrator User ID (<strong>{credentials.userId}</strong>) have been configured. Sign in to access your customized dashboard.
            </p>

            <div
              style={{
                backgroundColor: '#FAFBF9',
                borderRadius: '16px',
                padding: '16px 20px',
                border: '1px solid rgba(30, 68, 59, 0.12)',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#5E6360' }}>Dealership Brand:</span>
                <strong style={{ color: '#17191A' }}>{formData.tradeName || formData.legalName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#5E6360' }}>Brand Logo:</span>
                <strong style={{ color: formData.logoUrl ? '#24754E' : '#5E6360' }}>
                  {formData.logoUrl ? '✓ Active on Dashboard' : 'Initial Badge'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#5E6360' }}>Invoice Signature:</span>
                <strong style={{ color: '#24754E' }}>✓ Attached ({formData.authorizedSignatoryName})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#5E6360' }}>Administrator User ID:</span>
                <strong style={{ color: '#1E443B' }}>{credentials.userId}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSuccessModalOpen(false);
                router.push('/login?created=true');
              }}
              style={{
                width: '100%',
                padding: '13px 24px',
                fontWeight: 800,
                fontSize: '0.92rem',
                background: 'linear-gradient(135deg, #26554A 0%, #173830 100%)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '999px',
                boxShadow: '0 8px 24px -6px rgba(30, 68, 59, 0.38)',
                cursor: 'pointer',
              }}
            >
              <span>Sign In to Workspace with New Credentials</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
