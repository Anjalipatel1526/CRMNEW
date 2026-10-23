'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@crm/shared-types';
import { Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { getCompanyProfile, getUserCredentials, CompanyProfile, UserCredentials } from '@/lib/company-store';

export default function LoginPage() {
  const router = useRouter();
  const { switchRole, loginUser } = useAuth();
  const [userIdOrEmail, setUserIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardedBanner, setOnboardedBanner] = useState(false);
  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile());
  const [savedCreds, setSavedCreds] = useState<UserCredentials | null>(null);

  useEffect(() => {
    setCompany(getCompanyProfile());
    const creds = getUserCredentials();
    setSavedCreds(creds);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('created') === 'true' || params.get('onboarded') === 'true') {
        setOnboardedBanner(true);
        if (creds?.userId) {
          setUserIdOrEmail(creds.userId);
        }
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inputUser = userIdOrEmail.trim();
    const inputPass = password;

    // Check against saved onboarding credentials
    if (savedCreds) {
      const isUserMatch =
        inputUser.toLowerCase() === savedCreds.userId.toLowerCase() ||
        (savedCreds.email && inputUser.toLowerCase() === savedCreds.email.toLowerCase());
      
      const isPassMatch = !savedCreds.password || inputPass === savedCreds.password;

      if (isUserMatch && isPassMatch) {
        setTimeout(() => {
          loginUser(savedCreds.userId, savedCreds.fullName, 'tenant_admin');
          setLoading(false);
          router.push('/');
        }, 350);
        return;
      }
    }

    // Default demo credentials or fallback
    if (
      (inputUser.toLowerCase() === 'admin' || inputUser.toLowerCase() === 'admin@apexmotors.com' || inputUser.length > 0) &&
      (inputPass === 'admin123' || inputPass.length >= 4)
    ) {
      setTimeout(() => {
        loginUser(inputUser, company.authorizedSignatoryName || company.tradeName || 'Administrator', 'tenant_admin');
        setLoading(false);
        router.push('/');
      }, 350);
      return;
    }

    // If invalid
    setTimeout(() => {
      setLoading(false);
      setError('Incorrect User ID or Password. Please verify your credentials.');
    }, 300);
  };

  const handleQuickLogin = (role: UserRole, userEmail: string, userName: string) => {
    switchRole(role);
    loginUser(userEmail, userName, role);
    router.push('/');
  };

  const brandDisplayName = company.tradeName || company.legalName || 'UNAI CRM';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAF9',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.07)',
          border: '1.5px solid #E2E8F0',
        }}
      >
        {/* Onboarding Success Alert Banner */}
        {onboardedBanner && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#E6F4EF',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              color: '#1E443B',
              fontSize: '0.82rem',
              lineHeight: 1.45,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#16A34A' }} />
            <div>
              <strong>Onboarding Completed!</strong>
              <div style={{ fontSize: '0.76rem', color: '#1E443B', marginTop: '2px' }}>
                Your workspace is configured. Sign in with your created User ID and Password below.
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Dealership Logo & Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {company.logoUrl ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                marginBottom: '1rem',
                overflow: 'hidden',
                padding: '6px',
              }}
            >
              <img
                src={company.logoUrl}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#1E443B',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1.6rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(30,68,59,0.25)',
                marginBottom: '1rem',
              }}
            >
              {brandDisplayName.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            {brandDisplayName}
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
            Enterprise Automotive Dealership Workspace
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              color: '#DC2626',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              User ID / Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                value={userIdOrEmail}
                onChange={(e) => setUserIdOrEmail(e.target.value)}
                placeholder="Enter your User ID or email"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              backgroundColor: '#1E443B',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '12px',
            }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast-Switch Personas */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Demo Fast Sign-In:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={() => handleQuickLogin('tenant_admin', 'admin', company.authorizedSignatoryName || 'Dealership Admin')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.74rem' }}
            >
              👑 Dealership Admin
            </button>
            <button
              onClick={() => handleQuickLogin('branch_manager', 'manager.west', 'Branch Manager')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.74rem' }}
            >
              🏢 Branch Manager
            </button>
            <button
              onClick={() => handleQuickLogin('sales_executive', 'sales.john', 'Sales Executive')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.74rem' }}
            >
              💼 Sales Executive
            </button>
            <button
              onClick={() => handleQuickLogin('service_advisor', 'service.sarah', 'Service Advisor')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.74rem' }}
            >
              🔧 Service Advisor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
