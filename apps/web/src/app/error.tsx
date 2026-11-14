'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Error Caught:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '80vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: '#FFF1F2',
          border: '1px solid #FECDD3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          color: '#E11D48',
        }}
      >
        <AlertCircle size={28} />
      </div>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#17191A',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        Something went wrong
      </h2>

      <p
        style={{
          fontSize: '0.92rem',
          color: '#5E6360',
          maxWidth: '440px',
          lineHeight: 1.5,
          marginBottom: '1.75rem',
        }}
      >
        An unexpected error occurred while loading this view. You can retry or return to the main dashboard.
      </p>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '999px',
            backgroundColor: '#6253F8',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} />
          <span>Try Again</span>
        </button>

        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '999px',
            backgroundColor: '#F8FAFC',
            color: '#17191A',
            border: '1px solid #E2E8F0',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          <Home size={16} />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

