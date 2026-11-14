'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '75vh',
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
          backgroundColor: '#EEF2FF',
          border: '1px solid #C7D2FE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          color: '#6253F8',
        }}
      >
        <Compass size={28} />
      </div>

      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: '#17191A',
          marginBottom: '0.5rem',
          letterSpacing: '-0.03em',
        }}
      >
        404 — Page Not Found
      </h1>

      <p
        style={{
          fontSize: '0.92rem',
          color: '#5E6360',
          maxWidth: '440px',
          lineHeight: 1.5,
          marginBottom: '1.75rem',
        }}
      >
        The page you are looking for doesn’t exist or has been moved. Check the URL or return to your dealership dashboard.
      </p>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '999px',
            backgroundColor: '#6253F8',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          <Home size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

