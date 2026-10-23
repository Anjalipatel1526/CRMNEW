'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import {
  getCompanyProfile,
  saveCompanyProfile,
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
  Building2,
  CheckCircle,
  CheckCircle2,
  Sparkles,
  Upload,
  Camera,
  Eraser,
  PenTool,
  Layers,
  Shield,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  BadgePercent,
  Car,
  Users,
  Calendar,
  BarChart3,
  UserCheck,
  Gauge,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  SlidersHorizontal,
  RefreshCw,
  Eye,
} from 'lucide-react';

const DEALERSHIP_LOGO_PRESETS = [
  {
    name: 'Shield Emblem',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=160&q=80',
    initial: 'A',
    color: '#1E443B',
  },
  {
    name: 'Monogram Silver',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=160&q=80',
    initial: 'M',
    color: '#0F172A',
  },
  {
    name: 'Crown Royal',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=160&q=80',
    initial: 'Z',
    color: '#854D0E',
  },
  {
    name: 'Velocity Crest',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=160&q=80',
    initial: 'V',
    color: '#2563EB',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<CompanyProfile>(getCompanyProfile());
  const [modulesList, setModulesList] = useState<DealershipModule[]>(getModules());
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');

  // Canvas Drawing for Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setFormData(getCompanyProfile());
    setModulesList(getModules());
  }, []);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setFormData((prev) => ({ ...prev, signatureUrl: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setFormData((prev) => ({ ...prev, signatureUrl: '' }));
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData((prev) => ({ ...prev, logoUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature file upload handler
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData((prev) => ({ ...prev, signatureUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Module Plugin (Plugin In / Plugin Out)
  const handleToggleModule = (modId: string) => {
    setModulesList((prev) =>
      prev.map((mod) => (mod.id === modId ? { ...mod, isPluggedIn: !mod.isPluggedIn } : mod))
    );
  };

  const handlePluginAll = (active: boolean) => {
    setModulesList((prev) =>
      prev.map((mod) => ({ ...mod, isPluggedIn: active }))
    );
  };

  // Form submission: Saves profile and automatically switches company brand name across app
  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Save company profile with persistent storage
    const updated = saveCompanyProfile(formData);

    // 2. Save modules with plugin states
    saveModules(modulesList);

    // 3. Update in-memory userContext tenant name
    try {
      const ctx = api.getUserContext();
      if (ctx && ctx.tenant) {
        ctx.tenant.name = updated.tradeName || updated.legalName;
      }
    } catch (err) {
      // ignore
    }

    // 4. Open success confirmation
    setIsSuccessModalOpen(true);
  };

  const activePluginsCount = modulesList.filter((m) => m.isPluggedIn).length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '999px',
            backgroundColor: 'rgba(30,68,59,0.08)',
            color: '#1E443B',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '10px',
          }}
        >
          <Sparkles size={14} />
          <span>COMPANY ONBOARDING & MODULAR SETUP</span>
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
          <WordFadeIn text="Dealership Legal Entity & Branding Setup" />
        </h1>
        <p style={{ fontSize: '0.94rem', color: '#64748B', maxWidth: '640px', margin: '8px auto 0' }}>
          Configure your legal dealership information, upload your logo for authentic invoice watermarks, attach digital signatory credentials, and select your active feature plugins.
        </p>
      </div>

      {/* 4-Step Progress Navigation Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          padding: '8px',
          borderRadius: '16px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          marginBottom: '28px',
        }}
      >
        {[
          { num: 1, label: 'Identity & Details', icon: Building2 },
          { num: 2, label: 'Tax & Banking', icon: CreditCard },
          { num: 3, label: 'Watermark & Signature', icon: PenTool },
          { num: 4, label: 'Plugin Access Control', icon: Layers },
        ].map((step) => {
          const StepIcon = step.icon;
          const isActive = activeStep === step.num;
          const isDone = activeStep > step.num;

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(step.num as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isActive ? '#1E443B' : isDone ? '#E6F4EF' : 'transparent',
                color: isActive ? '#FFFFFF' : isDone ? '#1E443B' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : isDone ? '#1E443B' : '#E2E8F0',
                  color: isDone ? '#FFFFFF' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                }}
              >
                {isDone ? <Check size={13} /> : step.num}
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>{step.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleCompleteOnboarding}>
        {/* ================= STEP 1: IDENTITY & DETAILS ================= */}
        {activeStep === 1 && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Step 1: Dealership Entity & Brand Information
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                Enter the official registered company title and showroom trade brand. This name will automatically appear in your top navigation and invoice headers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Dealership Legal Registered Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="e.g. Apex Motors Private Limited"
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Appears on official GST Tax Invoices and delivery challans.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Trade / Display Brand Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="e.g. Apex Luxury Motors"
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  This name will immediately switch into the top navigation bar title.
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Dealership Tagline / Motto
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Precision Engineering & Pure Driving Pleasure"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Dealership Business Model
                </label>
                <select
                  className="form-select"
                  value={formData.dealershipType}
                  onChange={(e) => setFormData({ ...formData, dealershipType: e.target.value as any })}
                >
                  <option value="authorized_franchise">Authorized OEM Franchise Showroom</option>
                  <option value="multibrand_preowned">Multi-Brand Certified Pre-Owned Automall</option>
                  <option value="luxury_supercars">Luxury, Exotic & Supercar Atelier</option>
                  <option value="electric_mobility">Electric Vehicle (EV) Experience Center</option>
                  <option value="commercial_fleet">Commercial Fleet & Commercial Vehicles</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Corporate Email Address <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="corporate@apexmotors.com"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Showroom Contact Phone <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 22 6123 4567"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Official Website / Portal
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.apexmotors.com"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="btn btn-primary"
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Continue to Tax & Location</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: TAX, LOCATION & BANKING ================= */}
        {activeStep === 2 && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Step 2: Location, Tax Registration & Bank Settlement
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                These registered details and banking coordinates will be printed on all proforma quotations and customer receipts.
              </p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                Showroom / Yard Physical Street Address <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Plot 42, Western Express Highway, Andheri East"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  City <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Mumbai"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  State <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Pincode <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="400069"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Country
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="India"
                  required
                />
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '22px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
                Tax & Statutory Codes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    GSTIN (GST Number) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AABCA1234F1ZP"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Company PAN <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="AABCA1234F"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Corporate CIN (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.cin || ''}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                    placeholder="U50100MH2020PTC123456"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
                Dealership Bank Coordinates (For Invoice Wire Settlements)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="HDFC Bank Ltd"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Current Account Number
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="50200012345678"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="HDFC0000042"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    UPI Payment ID / VPA
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.upiId || ''}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="dealership@hdfcbank"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn btn-primary"
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Continue to Watermark & Signature</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: WATERMARK & SIGNATURE ================= */}
        {activeStep === 3 && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Step 3: Company Logo Watermark & Invoice Authorized Signature
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                Upload your company insignia for the top bar and invoice watermark, and provide the digital signature for invoice authorization.
              </p>
            </div>

            {/* Logo Upload & Watermark Settings */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '24px',
                padding: '20px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                marginBottom: '24px',
              }}
            >
              {/* Logo Upload Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  Company Logo (Used for App Branding & Invoice Watermark)
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '14px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px dashed #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      flexShrink: 0,
                    }}
                  >
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E443B' }}>
                        {(formData.tradeName || 'A').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#1E443B',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={14} />
                      <span>Upload Logo File</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </label>

                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        style={{
                          marginLeft: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#DC2626',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}

                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px' }}>
                      Supports PNG, JPG, or SVG (Transparent background recommended).
                    </div>
                  </div>
                </div>

                {/* Preset Options */}
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Or choose a luxury preset insignia:</span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {DEALERSHIP_LOGO_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: p.url })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#334155',
                        }}
                      >
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            backgroundColor: p.color,
                            color: '#FFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.62rem',
                          }}
                        >
                          {p.initial}
                        </span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Watermark Opacity Controls */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                      <input
                        type="checkbox"
                        checked={formData.watermarkEnabled}
                        onChange={(e) => setFormData({ ...formData, watermarkEnabled: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#1E443B' }}
                      />
                      <span>Enable Diagonal Invoice Watermark</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E443B' }}>
                      {Math.round((formData.watermarkOpacity || 0.08) * 100)}% Opacity
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.04"
                    max="0.22"
                    step="0.01"
                    value={formData.watermarkOpacity || 0.08}
                    onChange={(e) => setFormData({ ...formData, watermarkOpacity: parseFloat(e.target.value) })}
                    disabled={!formData.watermarkEnabled}
                    style={{ width: '100%', accentColor: '#1E443B' }}
                  />
                </div>
              </div>

              {/* Live Invoice Watermark Visualizer Preview */}
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #CBD5E1',
                  height: '240px',
                  overflow: 'hidden',
                  padding: '14px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Watermark Layer */}
                {formData.watermarkEnabled && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-30deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      zIndex: 0,
                      opacity: formData.watermarkOpacity || 0.08,
                    }}
                  >
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Watermark Preview"
                        style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain', filter: 'grayscale(100%)' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E443B', letterSpacing: '0.1em' }}>
                        {formData.tradeName || 'DEALERSHIP'}
                      </span>
                    )}
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.2em', color: '#1E443B', marginTop: '2px' }}>
                      ★ TAX INVOICE ★
                    </span>
                  </div>
                )}

                {/* Dummy Invoice Mock Content to show realism */}
                <div style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E443B' }}>
                    {formData.tradeName || 'YOUR DEALERSHIP'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>
                    {formData.address || 'Showroom Address'}, {formData.city || 'City'}
                  </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1, padding: '10px 0', fontSize: '0.64rem', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>Vehicle: 2024 Premium Luxury Sedan</span>
                    <strong>₹24,50,000</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>GST (18% & 28%)</span>
                    <strong>₹4,41,000</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '3px' }}>
                    <strong>Total Amount:</strong>
                    <strong style={{ color: '#16A34A' }}>₹28,91,000</strong>
                  </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', fontSize: '0.58rem', color: '#64748B' }}>
                  [Live Watermark Preview]
                </div>
              </div>
            </div>

            {/* Authorized Invoice Signatory & Signature */}
            <div
              style={{
                padding: '20px',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Authorized Digital Signature for Invoices
                  </h3>
                  <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0' }}>
                    Draw with your mouse/touch pad or upload a transparent signature image for automatic invoice stamping.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: signatureMode === 'draw' ? '#1E443B' : '#CBD5E1',
                      backgroundColor: signatureMode === 'draw' ? '#1E443B' : '#FFFFFF',
                      color: signatureMode === 'draw' ? '#FFFFFF' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Draw Signature Pad
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignatureMode('upload')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: signatureMode === 'upload' ? '#1E443B' : '#CBD5E1',
                      backgroundColor: signatureMode === 'upload' ? '#1E443B' : '#FFFFFF',
                      color: signatureMode === 'upload' ? '#FFFFFF' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Upload Signature Image
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                {/* Signatory Names */}
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Authorized Signatory Full Name <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.authorizedSignatoryName}
                      onChange={(e) => setFormData({ ...formData, authorizedSignatoryName: e.target.value })}
                      placeholder="e.g. Vikramaditya Singhania"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Signatory Designation / Role <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.authorizedSignatoryDesignation}
                      onChange={(e) => setFormData({ ...formData, authorizedSignatoryDesignation: e.target.value })}
                      placeholder="e.g. Managing Director & Principal Dealer"
                      required
                    />
                  </div>
                </div>

                {/* Signature Pad or Upload Box */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    {signatureMode === 'draw' ? 'Signature Canvas (Sign inside box)' : 'Upload Transparent Signature PNG'}
                  </label>

                  {signatureMode === 'draw' ? (
                    <div>
                      <div
                        style={{
                          border: '1.5px dashed #0F172A',
                          borderRadius: '12px',
                          backgroundColor: '#FFFFFF',
                          overflow: 'hidden',
                          touchAction: 'none',
                          cursor: 'crosshair',
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={380}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          style={{ width: '100%', height: '120px', display: 'block' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          Hold & drag mouse or finger to sign
                        </span>
                        <button
                          type="button"
                          onClick={clearSignature}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'transparent',
                            border: 'none',
                            color: '#DC2626',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Eraser size={13} />
                          <span>Clear Pad</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '24px 16px',
                          borderRadius: '12px',
                          border: '1.5px dashed #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        <PenTool size={22} style={{ color: '#1E443B' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>Click to Upload Signature File</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>PNG or JPG with transparent backdrop</span>
                        <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}

                  {/* Preview Stamp */}
                  {formData.signatureUrl && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <img src={formData.signatureUrl} alt="Signature Preview" style={{ height: '32px', objectFit: 'contain' }} />
                      <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>✓ Signature Captured & Ready</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="btn btn-primary"
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Continue to Plugin Access Control</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PLUGIN IN / PLUGIN OUT (ACCESS CONTROL) ================= */}
        {activeStep === 4 && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Step 4: Module Plugins & Feature Access Control
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                  Plugin In (Activate) or Plugin Out (Deactivate) specific dealership departments. Active modules immediately show up in your navigation dock.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handlePluginAll(true)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
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
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  Plugin Out All
                </button>
              </div>
            </div>

            {/* Plugin Status Summary Ribbon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                backgroundColor: 'rgba(30,68,59,0.06)',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid rgba(30,68,59,0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#1E443B' }}>
                <Layers size={18} />
                <span>Active Plugins: <strong>{activePluginsCount}</strong> of {modulesList.length} Connected</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Access control changes apply in real-time without reloading
              </span>
            </div>

            {/* Modules Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {modulesList.map((mod) => {
                const isPlugged = mod.isPluggedIn;

                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1.5px solid',
                      borderColor: isPlugged ? '#1E443B' : '#E2E8F0',
                      backgroundColor: isPlugged ? '#FAFCFA' : '#FFFFFF',
                      boxShadow: isPlugged ? '0 2px 10px rgba(30,68,59,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: isPlugged ? 1 : 0.75,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: isPlugged ? '#E6F4EF' : '#F1F5F9',
                              color: isPlugged ? '#1E443B' : '#64748B',
                            }}
                          >
                            {mod.category}
                          </span>
                        </div>

                        {/* Interactive Plugin In/Out Toggle Switch */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            backgroundColor: isPlugged ? '#1E443B' : '#F1F5F9',
                            color: isPlugged ? '#FFFFFF' : '#64748B',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {isPlugged ? (
                            <>
                              <Check size={12} />
                              <span>PLUGGED IN</span>
                            </>
                          ) : (
                            <>
                              <X size={12} />
                              <span>PLUGGED OUT</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: isPlugged ? '#0F172A' : '#64748B', marginBottom: '4px' }}>
                        {mod.label}
                      </div>

                      <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                        {mod.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '0.72rem', color: '#94A3B8' }}>
                      <span>Route: {mod.href}</span>
                      <span style={{ fontWeight: 600, color: isPlugged ? '#16A34A' : '#94A3B8' }}>
                        {isPlugged ? '● Visible in Top Nav' : '○ Hidden from Top Nav'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submission / Switch Confirmation Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '14px' }}>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Branding</span>
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '12px 32px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#1E443B',
                  boxShadow: '0 4px 15px rgba(30,68,59,0.3)',
                }}
              >
                <Sparkles size={18} />
                <span>Save & Switch to "{formData.tradeName || formData.legalName || 'New Company'}"</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Celebration & Automatic Switch Modal */}
      {isSuccessModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
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
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              animation: 'fadeInUp 0.3s ease',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#E6F4EF',
                color: '#1E443B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                fontSize: '2rem',
              }}
            >
              ✓
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: '#F1F5F9',
                color: '#1E443B',
                fontSize: '0.75rem',
                fontWeight: 800,
                marginBottom: '10px',
              }}
            >
              🎉 ONBOARDING COMPLETED
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
              Switched to {formData.tradeName || formData.legalName}!
            </h2>

            <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, marginBottom: '22px' }}>
              Your dealership company details, logo watermark, invoice signature, and <strong>{activePluginsCount} active plugins</strong> have been configured and saved. The entire CRM system and invoices now reflect your brand identity.
            </p>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid #E2E8F0',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Brand Display Name:</span>
                <strong style={{ color: '#0F172A' }}>{formData.tradeName || formData.legalName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>GSTIN & Location:</span>
                <strong style={{ color: '#0F172A' }}>{formData.gstin} • {formData.city}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Invoice Watermark:</span>
                <strong style={{ color: '#16A34A' }}>{formData.watermarkEnabled ? 'Active (Diagonal Logo)' : 'Disabled'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Invoice Signatory:</span>
                <strong style={{ color: '#0F172A' }}>{formData.authorizedSignatoryName}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  router.push('/');
                }}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontWeight: 800 }}
              >
                Go to Dashboard Overview
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  router.push('/finance');
                }}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontWeight: 700 }}
              >
                Preview Invoices & Watermark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
