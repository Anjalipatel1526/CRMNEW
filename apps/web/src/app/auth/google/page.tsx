'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/client/supabase';
import { syncServerSession } from '@/lib/client/session-sync';
import { ArrowLeft, AlertCircle, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

function GoogleAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingInitialSession, setIsCheckingInitialSession] = useState(true);

  // 1. Check if user is already authenticated - if so, immediately redirect to onboarding
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session?.user && session?.access_token) {
            const syncResult = await syncServerSession(session.access_token);
            if (!isMounted) return;
            if (syncResult.unauthorized) {
              setIsCheckingInitialSession(false);
              return;
            }
            if (syncResult.ok) {
              router.replace(syncResult.isOnboarded ? '/dashboard' : '/onboarding');
              return;
            }

            // Fallback check using company-profile if session sync had a transient error
            const userEmail = (session.user.email || '').toLowerCase().trim();
            if (userEmail) {
              try {
                const checkRes = await fetch(`/api/company-profile?email=${encodeURIComponent(userEmail)}`, {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (checkRes.ok) {
                  const checkJson = await checkRes.json();
                  router.replace(checkJson?.isOnboarded === true ? '/dashboard' : '/onboarding');
                  return;
                }
              } catch (checkErr) {
                console.warn('[GoogleAuth] Onboarding check note:', checkErr);
              }
            }
          }
          setIsCheckingInitialSession(false);
        }
      } catch {
        if (isMounted) setIsCheckingInitialSession(false);
      }
    };

    checkExistingSession();

    // Also pick up any error passed via query params (e.g. from callback failure or cancellation)
    const errorParam = searchParams.get('error_description') || searchParams.get('error');
    if (errorParam) {
      if (errorParam.includes('bad_oauth_state') || errorParam.includes('expired')) {
        setError('Your Google sign-in session expired or was interrupted. Please click Continue with Google below to sign in.');
      } else {
        setError(decodeURIComponent(errorParam));
      }
    }

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  // 2. Initiate Supabase Google OAuth
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const callbackUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'https://crmnew-navy.vercel.app/auth/callback';

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message || 'Failed to initialize Google authentication. Please try again.');
        setIsLoading(false);
        return;
      }

      // If a redirect URL was returned and browser hasn't automatically redirected, navigate to it
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during Google sign-in. Please try again.');
      setIsLoading(false);
    }
  };

  if (isCheckingInitialSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          gap: '14px',
        }}
      >
        <Loader2
          size={36}
          style={{
            animation: 'spin 0.8s linear infinite',
            color: '#6253F8',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
          Checking session...
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FFFFFF',
        backgroundImage: `
          radial-gradient(circle at 50% 12%, rgba(98, 83, 248, 0.06) 0%, rgba(255, 255, 255, 0) 60%),
          radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.03) 0%, transparent 45%),
          radial-gradient(circle at 85% 85%, rgba(98, 83, 248, 0.03) 0%, transparent 45%),
          linear-gradient(180deg, #FFFFFF 0%, #FAFCFB 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient subtle circle blur */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '540px',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(121, 87, 246, 0.08) 0%, rgba(64, 84, 245, 0.03) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

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
        {/* Dealership Logo & Brand Header */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.75rem',
          }}
        >
          <picture>
            <source srcSet="/unai-logo.webp" type="image/webp" />
            <img
              src="/unai-logo.png"
              alt="UNAI Logo"
              width={110}
              height={38}
              decoding="async"
              style={{
                height: '38px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </picture>
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
                color: '#6253F8',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginTop: '1px',
              }}
            >
              Dealership Platform
            </div>
          </div>
        </div>

        {/* The Authentication Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '22px',
            padding: '2.5rem 2.25rem',
            boxShadow: '0 24px 50px -15px rgba(98, 83, 248, 0.12), 0 0 0 1px rgba(98, 83, 248, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxSizing: 'border-box',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(98, 83, 248, 0.08)',
              color: '#6253F8',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '14px',
            }}
          >
            <Sparkles size={12} />
            <span>Dealership Onboarding</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: '1.72rem',
              fontWeight: 900,
              color: '#17191A',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              margin: '0 0 0.5rem 0',
            }}
          >
            Welcome! Let&apos;s Get Started
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '0.92rem',
              color: '#5E6360',
              margin: '0 0 1.75rem 0',
              lineHeight: 1.5,
            }}
          >
            Continue with your Google account to begin your onboarding process.
          </p>

          {/* Authentication Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: '12px',
                color: '#E11D48',
                fontSize: '0.84rem',
                lineHeight: 1.45,
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#E11D48' }} />
              <div>
                <strong>Authentication Notice:</strong>
                <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>{error}</div>
              </div>
            </div>
          )}

          {/* Professional "Continue with Google" Button */}
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              color: '#17191A',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              fontSize: '0.98rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: isLoading ? 0.8 : 1,
              position: 'relative',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={19}
                  style={{
                    animation: 'spin 0.8s linear infinite',
                    color: '#6253F8',
                    flexShrink: 0,
                  }}
                />
                <style jsx>{`
                  @keyframes spin {
                    to {
                      transform: rotate(360deg);
                    }
                  }
                `}</style>
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                {/* Official Google Icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  style={{ flexShrink: 0, display: 'block' }}
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Security & Verification Footer */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#64748B',
                fontSize: '0.78rem',
                fontWeight: 500,
              }}
            >
              <ShieldCheck size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
              <span>Secured with Supabase Authentication</span>
            </div>
          </div>
        </div>

        {/* Back to Home Option */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748B',
              fontSize: '0.86rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#6253F8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GoogleAuthPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(98, 83, 248, 0.15)',
              borderTopColor: '#6253F8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      }
    >
      <GoogleAuthContent />
    </Suspense>
  );
}

