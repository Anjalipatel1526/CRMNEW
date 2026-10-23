'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Lock, User, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { getCompanyProfile, DEFAULT_COMPANY_PROFILE, getUserCredentials, CompanyProfile, UserCredentials } from '@/lib/company-store';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, isLoggedIn, userContext, logout } = useAuth();
  const [userIdOrEmail, setUserIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardedBanner, setOnboardedBanner] = useState(false);
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [isMounted, setIsMounted] = useState(false);
  const [savedCreds, setSavedCreds] = useState<UserCredentials | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setCompany(getCompanyProfile());
    const creds = getUserCredentials();
    setSavedCreds(creds);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('created') === 'true' || params.get('onboarded') === 'true') {
        setOnboardedBanner(true);
      }
      if (creds?.userId) {
        setUserIdOrEmail(creds.userId);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inputUser = userIdOrEmail.trim();
    const inputPass = password;

    const getRedirectTarget = () => {
      try {
        const last = localStorage.getItem('crm_last_active_page');
        if (last && last !== '/' && last !== '/login' && last !== '/onboarding') return last;
      } catch (err) {}
      return '/dashboard';
    };

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
          router.push(getRedirectTarget());
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
        router.push(getRedirectTarget());
      }, 350);
      return;
    }

    // If invalid
    setTimeout(() => {
      setLoading(false);
      setError('Incorrect User ID or Password. Please verify your credentials.');
    }, 300);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FCFDFC',
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(30, 68, 59, 0.05) 0%, transparent 60%),
          linear-gradient(180deg, #FFFFFF 0%, #F8FAF9 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Global style override for browser autofill */}
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
          -webkit-text-fill-color: #17191A !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Background ambient subtle glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '680px',
            height: '420px',
            background: 'radial-gradient(ellipse at center, rgba(30, 68, 59, 0.05) 0%, rgba(16, 185, 129, 0.02) 45%, transparent 70%)',
          }}
        />
      </div>

      {/* Main Centered Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Brand Logo & Name Centered Above the Card (Inspired by "Friday" logo in Image 2) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.75rem',
          }}
        >
          <img
            src="/unai-logo.png"
            alt="UNAI Logo"
            style={{
              height: '38px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
            <div
              style={{
                fontSize: '1.18rem',
                fontWeight: 900,
                color: '#17191A',
                letterSpacing: '-0.025em',
              }}
            >
              UNAI CRM
            </div>
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#059669',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginTop: '1px',
              }}
            >
              Dealership Platform
            </div>
          </div>
        </div>

        {/* The Card Container */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '22px',
            padding: '2.5rem',
            boxShadow: '0 24px 50px -15px rgba(30, 68, 59, 0.09), 0 0 0 1px rgba(30, 68, 59, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxSizing: 'border-box',
          }}
        >
          {/* Onboarding Success Banner */}
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
                  Your workspace is ready. Sign in with your created User ID below.
                </div>
              </div>
            </div>
          )}

          {/* Active Session Info Card */}
          {isMounted && isLoggedIn && (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: '14px',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#16A34A',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Currently Signed In</span>
              </div>
              <div
                style={{
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  color: '#1E443B',
                  marginTop: '4px',
                }}
              >
                {userContext.user.fullName}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                {userContext.user.email}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: '#1E443B',
                  }}
                >
                  Continue to Workspace →
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.82rem', borderRadius: '8px' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Heading & Subtitle (Directly Styled After Image 2: "Welcome aboard") */}
          <div style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
            <h1
              style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                color: '#17191A',
                letterSpacing: '-0.025em',
                margin: '0 0 6px 0',
                lineHeight: 1.2,
              }}
            >
              Welcome
            </h1>
            <p
              style={{
                fontSize: '0.88rem',
                color: '#64748B',
                margin: 0,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              Enter your credentials to access your dealership workspace.
            </p>
          </div>

          {/* Error Message Alert */}
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

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Email / User ID Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#17191A',
                  marginBottom: '6px',
                }}
              >
                Email or User ID
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={userIdOrEmail}
                  onChange={(e) => setUserIdOrEmail(e.target.value)}
                  placeholder="Enter your email or user ID"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.9rem',
                    color: '#17191A',
                    outline: 'none',
                    transition: 'all 0.18s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E443B';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 68, 59, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#17191A',
                  }}
                >
                  Password
                </label>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#059669',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => alert('Default demo password is "admin123" or your onboarding password.')}
                >
                  Forgot password?
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 42px 12px 40px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.9rem',
                    color: '#17191A',
                    outline: 'none',
                    transition: 'all 0.18s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E443B';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 68, 59, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
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
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Helper text under password field as seen in Image 2 */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  marginTop: '6px',
                }}
              >
                Must be at least 4 characters.
              </div>
            </div>

            {/* Vibrant Gradient Submit Button (Inspiration: "Get started →") */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1E443B 0%, #295F53 100%)',
                color: '#FFFFFF',
                fontSize: '0.98rem',
                fontWeight: 800,
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 10px 22px -5px rgba(30, 68, 59, 0.38)',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                  e.currentTarget.style.boxShadow = '0 14px 28px -5px rgba(30, 68, 59, 0.48)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 22px -5px rgba(30, 68, 59, 0.38)';
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        </div>

        {/* Secondary Navigation Link to Onboarding */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <Link
            href="/onboarding"
            style={{
              fontSize: '0.84rem',
              color: '#64748B',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1E443B';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Need to configure a new dealership? <span style={{ color: '#1E443B', fontWeight: 700 }}>Begin Onboarding →</span>
          </Link>
        </div>

        {/* Back to Home Link */}
        <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.78rem',
              color: '#94A3B8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={13} />
            <span>Back to Welcome Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
