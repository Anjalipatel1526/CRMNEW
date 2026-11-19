'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/client/supabase';
import { useAuth } from '@/lib/client/auth-context';
import { clearLocalCompanyProfile } from '@/lib/client/stores/company-store';
import { syncServerSession } from '@/lib/client/session-sync';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginUser } = useAuth();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const completeAuthentication = async (session: any) => {
      const user = session.user;
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Administrator';

      const serverSessionData = session?.access_token
        ? await syncServerSession(session.access_token)
        : null;

      try {
        loginUser(user.email || user.id, fullName, (serverSessionData?.role as any) || 'tenant_admin', {
          avatarUrl: user.user_metadata?.avatar_url,
          tenantId: serverSessionData?.tenantId,
          isAdmin: (serverSessionData?.role || 'tenant_admin') === 'tenant_admin',
        });
      } catch (e) {
        console.warn('[AuthCallback] Session sync info:', e);
      }

      if (serverSessionData?.ok) {
        router.replace(serverSessionData.isOnboarded ? '/dashboard' : '/onboarding');
        return;
      }

      // Fallback check if session sync failed due to transient network error
      try {
        const userEmail = (user.email || '').toLowerCase().trim();
        if (userEmail) {
          const res = await fetch(`/api/company-profile?email=${encodeURIComponent(userEmail)}`, {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.isOnboarded === true) {
              router.replace('/dashboard');
              return;
            }
          }
        }
      } catch (checkErr) {
        console.warn('[AuthCallback] Profile check note:', checkErr);
      }

      clearLocalCompanyProfile();
      router.replace('/onboarding');
    };

    const handleCallback = async () => {
      try {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam || errorDescription) {
          const msg = errorDescription || errorParam || 'Google authentication was cancelled or could not be completed.';
          if (isMounted) setErrorMessage(msg);
          return;
        }

        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (isMounted) {
              setErrorMessage(exchangeError.message || 'Failed to exchange authorization code for session.');
            }
            return;
          }
        }

        if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          const rawHash = window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : window.location.hash;
          const hashParams = new URLSearchParams(rawHash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (!setSessionError && setSessionData.session && isMounted) {
              completeAuthentication(setSessionData.session);
              return;
            }
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (isMounted) {
            setErrorMessage(sessionError.message || 'Error retrieving authentication session.');
          }
          return;
        }

        if (session && session.user) {
          if (isMounted) completeAuthentication(session);
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession && newSession.user && isMounted) {
            completeAuthentication(newSession);
          }
        });
        authSubscription = subscription;

        timeoutId = setTimeout(() => {
          if (isMounted) {
            setErrorMessage((prev) => prev || 'Unable to verify Google authentication session. Please try again.');
          }
        }, 6000);
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err?.message || 'An unexpected error occurred while processing authentication.');
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      authSubscription?.unsubscribe();
    };
  }, [router, searchParams, loginUser]);

  // If authentication failed or was cancelled, display clean error with recovery actions
  if (errorMessage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#FFFFFF',
          backgroundImage: `
            radial-gradient(circle at 50% 20%, rgba(239, 68, 68, 0.05) 0%, transparent 60%),
            linear-gradient(180deg, #FFFFFF 0%, #FAF8FF 100%)
          `,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '22px',
            padding: '2.5rem',
            boxShadow: '0 24px 50px -15px rgba(225, 29, 72, 0.12), 0 0 0 1px rgba(225, 29, 72, 0.08)',
            border: '1px solid rgba(254, 205, 211, 0.8)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#FFF1F2',
              color: '#E11D48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <AlertCircle size={26} />
          </div>

          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#17191A',
              margin: '0 0 0.5rem 0',
            }}
          >
            Authentication Notice
          </h2>

          <p
            style={{
              fontSize: '0.9rem',
              color: '#5E6360',
              lineHeight: 1.5,
              margin: '0 0 1.75rem 0',
            }}
          >
            {errorMessage}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/auth/google"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7957F6 0%, #6253F8 50%, #4054F5 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 8px 20px -4px rgba(98, 83, 248, 0.4)',
              }}
            >
              <RefreshCw size={16} />
              <span>Try Again with Google</span>
            </Link>

            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '11px 18px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                fontWeight: 600,
                fontSize: '0.86rem',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while verifying authentication
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FFFFFF',
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(98, 83, 248, 0.06) 0%, transparent 60%),
          linear-gradient(180deg, #FFFFFF 0%, #FAF8FF 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '22px',
          padding: '2.5rem 2rem',
          boxShadow: '0 24px 50px -15px rgba(98, 83, 248, 0.12), 0 0 0 1px rgba(98, 83, 248, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          textAlign: 'center',
        }}
      >
        <Loader2
          size={44}
          style={{
            animation: 'spin 0.8s linear infinite',
            color: '#6253F8',
            margin: '0 auto 1.25rem auto',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>

        <h2
          style={{
            fontSize: '1.28rem',
            fontWeight: 800,
            color: '#17191A',
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem 0',
          }}
        >
          Verifying Authentication...
        </h2>

        <p
          style={{
            fontSize: '0.88rem',
            color: '#64748B',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Confirming your Google account session and preparing your dealership onboarding workspace.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
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
              width: '38px',
              height: '38px',
              border: '3px solid rgba(98, 83, 248, 0.15)',
              borderTopColor: '#6253F8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

