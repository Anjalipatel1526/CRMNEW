'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  X,
  Edit3,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  fetchCompanyProfile,
  hydrateCompanyProfileFromApi,
  CompanyProfile,
} from '@/lib/client/stores/company-store';
import { supabase } from '@/lib/client/supabase';

const PRESET_PROFILE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  onCompanyUpdated: (updated: CompanyProfile) => void;
  userDisplayName: string;
  userInitials: string;
  initialFullName: string;
  initialPhone: string;
  initialAvatarUrl: string;
  isStaffEmployee: boolean;
  onUpdateUserProfile: (updates: { fullName: string; phone: string; avatarUrl: string }) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  company,
  onCompanyUpdated,
  userDisplayName,
  userInitials,
  initialFullName,
  initialPhone,
  initialAvatarUrl,
  isStaffEmployee,
  onUpdateUserProfile,
}: ProfileModalProps) {
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(initialAvatarUrl);
  const [formFullName, setFormFullName] = useState(initialFullName || userDisplayName);
  const [formPhone, setFormPhone] = useState(initialPhone);
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoadingCompanyProfile, setIsLoadingCompanyProfile] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyDraft, setCompanyDraft] = useState<CompanyProfile>(company);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setProfileAvatarUrl(initialAvatarUrl);
    setFormFullName(initialFullName || userDisplayName);
    setFormPhone(initialPhone);
    setProfileSavedToast(false);
    setProfileError(null);
    setIsEditingCompany(false);
    setCompanyDraft(company);
    setIsLoadingCompanyProfile(true);

    fetchCompanyProfile()
      .then((fresh) => {
        if (!active || !fresh) return;
        onCompanyUpdated(fresh);
        setCompanyDraft(fresh);
      })
      .finally(() => {
        if (active) setIsLoadingCompanyProfile(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const readImageFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    setProfileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setProfileError('Image size exceeds 4MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) onLoaded(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    onUpdateUserProfile({
      fullName: formFullName.trim() || userDisplayName,
      phone: formPhone.trim() || (isEditingCompany ? companyDraft.phone : initialPhone).trim(),
      avatarUrl: profileAvatarUrl,
    });

    if (isEditingCompany && !isStaffEmployee) {
      const legalName = companyDraft.legalName.trim();
      const tradeName = companyDraft.tradeName.trim();
      if (!legalName && !tradeName) {
        setProfileError('Please enter at least a Legal Registered Name or Trade / Display Name.');
        return;
      }

      setIsSavingCompany(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const res = await fetch('/api/company-profile', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            profile: {
              ...companyDraft,
              legalName,
              tradeName,
              isOnboarded: true,
            },
          }),
        });

        const resJson = await res.json().catch(() => ({}));
        if (!res.ok || resJson.error) {
          setProfileError(resJson.error || 'Failed to save company details to Supabase.');
          setIsSavingCompany(false);
          return;
        }

        if (resJson.profile) {
          const hydrated = hydrateCompanyProfileFromApi(resJson.profile);
          onCompanyUpdated(hydrated);
          setCompanyDraft(hydrated);
        }
        setIsEditingCompany(false);
      } catch (err: any) {
        setProfileError(err?.message || 'Network error while saving company profile.');
        setIsSavingCompany(false);
        return;
      } finally {
        setIsSavingCompany(false);
      }
    }

    setProfileSavedToast(true);
    window.setTimeout(() => {
      setProfileSavedToast(false);
      onClose();
    }, 900);
  };

  const activeLogo = isEditingCompany ? companyDraft.logoUrl : company.logoUrl;
  const activeTrade = isEditingCompany ? companyDraft.tradeName : company.tradeName;
  const activeLegal = isEditingCompany ? companyDraft.legalName : company.legalName;
  const activeTagline = isEditingCompany ? companyDraft.tagline : company.tagline;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile & Company Details" maxWidth="720px">
      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Top Banner Card with Profile Avatar and Change Option */}
        <div
          style={{
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(121, 87, 246, 0.12) 0%, rgba(64, 84, 245, 0.06) 100%)',
            border: '1px solid rgba(98, 83, 248, 0.15)',
            padding: '22px 18px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', width: '92px', height: '92px', marginBottom: '12px' }}>
            {profileAvatarUrl ? (
              <img
                src={profileAvatarUrl}
                alt={initialFullName || userDisplayName}
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #6253F8',
                  boxShadow: '0 4px 16px rgba(98, 83, 248, 0.25)',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  background: 'var(--dock-gradient)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '2rem',
                  boxShadow: '0 4px 16px rgba(98, 83, 248, 0.25)',
                }}
              >
                {userInitials}
              </div>
            )}

            <label
              htmlFor="profile-avatar-file-input"
              title="Change profile picture"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#6253F8',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Camera size={15} />
            </label>
            <input
              id="profile-avatar-file-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => readImageFile(e, setProfileAvatarUrl)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <label
              htmlFor="profile-avatar-file-input"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(98, 83, 248, 0.3)',
                color: '#6253F8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              <Upload size={13} />
              <span>Upload Photo</span>
            </label>

            {profileAvatarUrl && (
              <button
                type="button"
                onClick={() => setProfileAvatarUrl('')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#DC2626',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>Quick Presets:</span>
            {PRESET_PROFILE_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setProfileAvatarUrl(url)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  padding: 0,
                  border: profileAvatarUrl === url ? '2px solid #6253F8' : '1px solid #CBD5E1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: profileAvatarUrl === url ? '0 0 0 2px rgba(98, 83, 248, 0.35)' : 'none',
                  transform: profileAvatarUrl === url ? 'scale(1.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                title={`Select avatar preset ${idx + 1}`}
              >
                <img src={url} alt={`Preset ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>

        {profileError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <span>{profileError}</span>
          </div>
        )}

        {profileSavedToast && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#DCFCE7',
              border: '1px solid #86EFAC',
              color: '#15803D',
              fontSize: '0.84rem',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={16} />
            <span>Profile and company details updated successfully!</span>
          </div>
        )}

        {/* User Identity & Profile Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
              Full Name
            </label>
            <input
              type="text"
              className="form-input"
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              placeholder="e.g. John Doe"
              style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Email Address
              </label>
              <input
                type="email"
                className="form-input"
                value={company.email || ''}
                readOnly
                title="Authentication email is managed via Supabase Auth"
                style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', fontSize: '0.88rem', backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                className="form-input"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Dealership & Role Metadata Info Badges matching screenshot */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <span>🛡️</span>
              <span>Role: <strong style={{ color: '#0F172A' }}>{isStaffEmployee ? 'staff' : 'tenant admin'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <span>🏢</span>
              <span>Dealership: <strong style={{ color: '#0F172A' }}>{company.tradeName || company.legalName || 'Dealership'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <span>📍</span>
              <span>Branch: <strong style={{ color: '#0F172A' }}>{company.branchName || 'Main Showroom'}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <span>✅</span>
              <span>Status: <strong style={{ color: '#16A34A' }}>{company.isOnboarded ? 'Onboarded & Verified' : 'Pending Setup'}</strong></span>
            </div>
          </div>
        </div>

        {/* Complete Company & Dealership Details from Supabase */}
        <div
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(98, 83, 248, 0.16)',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(98, 83, 248, 0.08) 0%, rgba(64, 84, 245, 0.04) 100%)',
              borderBottom: '1px solid rgba(98, 83, 248, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} style={{ color: '#6253F8' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                Company Profile Details
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: isLoadingCompanyProfile ? '#FEF3C7' : '#DCFCE7',
                  color: isLoadingCompanyProfile ? '#B45309' : '#15803D',
                }}
              >
                {isLoadingCompanyProfile ? 'Syncing...' : 'Synced from Supabase'}
              </span>
            </div>
            {!isStaffEmployee && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditingCompany ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyDraft(company);
                      setIsEditingCompany(false);
                      setProfileError(null);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '999px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#475569',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={13} />
                    <span>Cancel Edit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyDraft(company);
                      setIsEditingCompany(true);
                      setProfileError(null);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '999px',
                      backgroundColor: '#6253F8',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(98, 83, 248, 0.28)',
                    }}
                  >
                    <Edit3 size={13} />
                    <span>Edit Details</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Dealership Identity & Brand */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6253F8', marginBottom: '8px' }}>
                1. Dealership Identity &amp; Brand
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '10px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  {activeLogo ? (
                    <img
                      src={activeLogo}
                      alt={activeTrade || 'Company Logo'}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        objectFit: 'contain',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        padding: '4px',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        background: 'var(--dock-gradient)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      {(activeTrade || activeLegal || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                      {activeTrade || activeLegal || '—'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      {activeLegal || '—'}
                      {activeTagline ? ` · ${activeTagline}` : ''}
                    </div>
                  </div>
                </div>
                {isEditingCompany && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label
                      htmlFor="profile-company-logo-input"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '999px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(98, 83, 248, 0.3)',
                        color: '#6253F8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={12} />
                      <span>{companyDraft.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    </label>
                    <input
                      id="profile-company-logo-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => readImageFile(e, (url) => setCompanyDraft((prev) => ({ ...prev, logoUrl: url })))}
                    />
                    {companyDraft.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setCompanyDraft((prev) => ({ ...prev, logoUrl: '' }))}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '999px',
                          backgroundColor: '#FEE2E2',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#DC2626',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditingCompany ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Legal Registered Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={companyDraft.legalName}
                      onChange={(e) => setCompanyDraft((prev) => ({ ...prev, legalName: e.target.value }))}
                      placeholder="Legal registered name"
                      style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Trade / Display Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={companyDraft.tradeName}
                      onChange={(e) => setCompanyDraft((prev) => ({ ...prev, tradeName: e.target.value }))}
                      placeholder="Trade or brand name"
                      style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Dealership Type</label>
                    <select
                      className="form-input"
                      value={companyDraft.dealershipType}
                      onChange={(e) => setCompanyDraft((prev) => ({ ...prev, dealershipType: e.target.value as CompanyProfile['dealershipType'] }))}
                      style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                    >
                      <option value="authorized_franchise">Authorized Franchise</option>
                      <option value="multibrand_preowned">Multi-Brand / Pre-Owned</option>
                      <option value="luxury_supercars">Luxury &amp; Supercars</option>
                      <option value="electric_mobility">Electric Mobility (EV)</option>
                      <option value="commercial_fleet">Commercial &amp; Fleet</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Tagline</label>
                    <input
                      type="text"
                      className="form-input"
                      value={companyDraft.tagline || ''}
                      onChange={(e) => setCompanyDraft((prev) => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Dealership tagline"
                      style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <ReadOnlyField label="Legal Registered Name" value={company.legalName} />
                  <ReadOnlyField label="Trade / Display Name" value={company.tradeName} />
                  <ReadOnlyField label="Dealership Type" value={(company.dealershipType || '').replace(/_/g, ' ')} capitalize />
                  <ReadOnlyField label="Tagline" value={company.tagline} />
                </div>
              )}
            </div>

            {/* 2. Contact & Showroom Address */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6253F8', marginBottom: '8px' }}>
                2. Contact &amp; Showroom Address
              </div>
              {isEditingCompany ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Company Email</label>
                    <input type="email" className="form-input" value={companyDraft.email} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, email: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Primary Phone</label>
                    <input type="tel" className="form-input" value={companyDraft.phone} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, phone: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Support Phone</label>
                    <input type="tel" className="form-input" value={companyDraft.supportPhone || ''} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, supportPhone: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Website</label>
                    <input type="text" className="form-input" value={companyDraft.website || ''} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, website: e.target.value }))} placeholder="https://..." style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Street Address</label>
                    <input type="text" className="form-input" value={companyDraft.address} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, address: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>City</label>
                    <input type="text" className="form-input" value={companyDraft.city} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, city: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>State</label>
                    <input type="text" className="form-input" value={companyDraft.state} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, state: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Pincode</label>
                    <input type="text" className="form-input" value={companyDraft.pincode} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, pincode: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Country</label>
                    <input type="text" className="form-input" value={companyDraft.country} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, country: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <ReadOnlyField label="Company Email" value={company.email} breakAll />
                  <ReadOnlyField label="Primary Phone" value={company.phone} />
                  <ReadOnlyField label="Support Phone" value={company.supportPhone} />
                  <ReadOnlyField label="Website" value={company.website} breakAll />
                  <ReadOnlyField
                    label="Registered Address"
                    value={[company.address, company.city, company.state, company.pincode, company.country].filter(Boolean).join(', ')}
                    fullWidth
                  />
                </div>
              )}
            </div>

            {/* 3. Statutory & Tax Compliance */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6253F8', marginBottom: '8px' }}>
                3. Statutory &amp; Tax Compliance
              </div>
              {isEditingCompany ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>GSTIN</label>
                    <input type="text" className="form-input" value={companyDraft.gstin} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))} style={{ padding: '8px 10px', fontSize: '0.82rem', fontFamily: 'monospace' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>PAN</label>
                    <input type="text" className="form-input" value={companyDraft.pan} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, pan: e.target.value.toUpperCase() }))} style={{ padding: '8px 10px', fontSize: '0.82rem', fontFamily: 'monospace' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>CIN</label>
                    <input type="text" className="form-input" value={companyDraft.cin || ''} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, cin: e.target.value.toUpperCase() }))} style={{ padding: '8px 10px', fontSize: '0.82rem', fontFamily: 'monospace' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Currency</label>
                    <input type="text" className="form-input" value={companyDraft.currency} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, currency: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  <ReadOnlyField label="GSTIN" value={company.gstin} mono />
                  <ReadOnlyField label="PAN" value={company.pan} mono />
                  <ReadOnlyField label="CIN" value={company.cin} mono />
                  <ReadOnlyField label="Currency" value={company.currency} />
                </div>
              )}
            </div>

            {/* 4. Banking & Settlement Details */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6253F8', marginBottom: '8px' }}>
                4. Banking &amp; Settlement Details
              </div>
              {isEditingCompany ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Bank Name</label>
                    <input type="text" className="form-input" value={companyDraft.bankName} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, bankName: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Account Number</label>
                    <input type="text" className="form-input" value={companyDraft.accountNumber} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, accountNumber: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem', fontFamily: 'monospace' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>IFSC Code</label>
                    <input type="text" className="form-input" value={companyDraft.ifscCode} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))} style={{ padding: '8px 10px', fontSize: '0.82rem', fontFamily: 'monospace' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Branch Name</label>
                    <input type="text" className="form-input" value={companyDraft.branchName} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, branchName: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>UPI ID</label>
                    <input type="text" className="form-input" value={companyDraft.upiId || ''} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, upiId: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <ReadOnlyField label="Bank Name" value={company.bankName} />
                  <ReadOnlyField label="Account Number" value={company.accountNumber} mono />
                  <ReadOnlyField label="IFSC Code" value={company.ifscCode} mono />
                  <ReadOnlyField label="Branch Name" value={company.branchName} />
                  <ReadOnlyField label="UPI ID" value={company.upiId} />
                </div>
              )}
            </div>

            {/* 5. Invoice Signatory & Branding */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6253F8', marginBottom: '8px' }}>
                5. Authorized Signatory &amp; Invoice Branding
              </div>
              {isEditingCompany ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Signatory Name</label>
                    <input type="text" className="form-input" value={companyDraft.authorizedSignatoryName} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, authorizedSignatoryName: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Designation</label>
                    <input type="text" className="form-input" value={companyDraft.authorizedSignatoryDesignation} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, authorizedSignatoryDesignation: e.target.value }))} style={{ padding: '8px 10px', fontSize: '0.82rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer', marginTop: '14px' }}>
                      <input type="checkbox" checked={companyDraft.watermarkEnabled} onChange={(e) => setCompanyDraft((prev) => ({ ...prev, watermarkEnabled: e.target.checked }))} />
                      <span>Enable Invoice Watermark</span>
                    </label>
                  </div>
                  <div style={{ gridColumn: '1 / -1', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Digital Signature</div>
                      {companyDraft.signatureUrl ? (
                        <img src={companyDraft.signatureUrl} alt="Authorized Signature" style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 8px' }} />
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>No signature uploaded</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label
                        htmlFor="profile-company-signature-input"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '999px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(98, 83, 248, 0.3)',
                          color: '#6253F8',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Upload size={12} />
                        <span>{companyDraft.signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
                      </label>
                      <input
                        id="profile-company-signature-input"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => readImageFile(e, (url) => setCompanyDraft((prev) => ({ ...prev, signatureUrl: url })))}
                      />
                      {companyDraft.signatureUrl && (
                        <button
                          type="button"
                          onClick={() => setCompanyDraft((prev) => ({ ...prev, signatureUrl: '' }))}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '999px',
                            backgroundColor: '#FEE2E2',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#DC2626',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <ReadOnlyField label="Signatory Name" value={company.authorizedSignatoryName} />
                  <ReadOnlyField label="Designation" value={company.authorizedSignatoryDesignation} />
                  <ReadOnlyField
                    label="Invoice Watermark"
                    value={company.watermarkEnabled ? `Enabled (${Math.round((company.watermarkOpacity || 0.08) * 100)}%)` : 'Disabled'}
                  />
                  {company.signatureUrl && (
                    <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>Digital Signature</div>
                      <img
                        src={company.signatureUrl}
                        alt="Authorized Signature"
                        style={{
                          maxHeight: '56px',
                          maxWidth: '220px',
                          objectFit: 'contain',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '4px 8px',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isSavingCompany}
            onClick={() => {
              setIsEditingCompany(false);
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSavingCompany}
            style={{
              borderRadius: '999px',
              padding: '0.5rem 1.5rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(98, 83, 248, 0.35)',
              opacity: isSavingCompany ? 0.7 : 1,
            }}
          >
            {isSavingCompany ? 'Saving to Supabase...' : isEditingCompany ? 'Save Changes' : 'Save Profile'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReadOnlyField({
  label,
  value,
  mono,
  breakAll,
  capitalize,
  fullWidth,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  breakAll?: boolean;
  capitalize?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: '8px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #F1F5F9',
        ...(fullWidth ? { gridColumn: '1 / -1' } : {}),
      }}
    >
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>{label}</div>
      <div
        style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#0F172A',
          marginTop: '2px',
          wordBreak: breakAll ? 'break-all' : 'break-word',
          ...(mono ? { fontFamily: 'monospace' } : {}),
          ...(capitalize ? { textTransform: 'capitalize' } : {}),
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

