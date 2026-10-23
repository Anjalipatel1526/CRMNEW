'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Zap, Car, ShieldCheck, ArrowRight } from 'lucide-react';

export default function WelcomeLandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FFFFFF',
        backgroundImage: `
          radial-gradient(circle at 50% 12%, rgba(30, 68, 59, 0.06) 0%, rgba(255, 255, 255, 0) 60%),
          radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.03) 0%, transparent 45%),
          radial-gradient(circle at 85% 85%, rgba(30, 68, 59, 0.03) 0%, transparent 45%),
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
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '580px',
          height: '320px',
          background: 'radial-gradient(ellipse at center, rgba(30,68,59,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '980px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Official UNAI Logo (Marked above Welcome by user) */}
        <div style={{ marginBottom: '2.25rem', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/unai-logo.png"
            alt="UNAI Logo"
            style={{
              height: '52px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(30, 68, 59, 0.08))',
            }}
          />
        </div>

        {/* Hero Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.8rem, 6vw, 4.4rem)',
            fontWeight: 900,
            color: '#17191A',
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            margin: '0 0 1.25rem 0',
          }}
        >
          Welcome <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #1E443B 0%, #059669 45%, #10B981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            to Dealership CRM
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.18rem)',
            color: '#475569',
            maxWidth: '580px',
            lineHeight: 1.6,
            margin: '0 0 2.25rem 0',
            fontWeight: 500,
          }}
        >
          Complete your dealership onboarding process to configure your showroom and multi-branch operations.
        </p>

        {/* 4 Feature / Trust Badges Pill Row (Dealership CRM Theme) */}
        {/* Responsive: 2 up and 2 down on mobile, single row on desktop */}
        <style jsx global>{`
          .landing-pills-container {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 3rem;
            max-width: 940px;
            width: 100%;
          }
          .landing-pill-item {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 8px 16px;
            border-radius: 999px;
            background-color: #F8FAF9;
            border: 1.2px solid rgba(30, 68, 59, 0.12);
            font-size: 0.82rem;
            font-weight: 600;
            color: #1E443B;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
            white-space: nowrap;
          }
          @media (max-width: 640px) {
            .landing-pills-container {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
              width: 100% !important;
              max-width: 440px !important;
              margin-bottom: 2.25rem !important;
              padding: 0 4px !important;
              box-sizing: border-box !important;
            }
            .landing-pill-item {
              display: flex !important;
              align-items: center !important;
              justifyContent: center !important;
              padding: 9px 8px !important;
              font-size: 0.70rem !important;
              gap: 5px !important;
              white-space: normal !important;
              text-align: center !important;
              line-height: 1.2 !important;
              min-height: 46px !important;
              box-sizing: border-box !important;
            }
          }
        `}</style>

        <div className="landing-pills-container">
          <div className="landing-pill-item">
            <Building2 size={15} style={{ color: '#1E443B', flexShrink: 0 }} />
            <span>Dealership & Franchise Setup</span>
          </div>

          <div className="landing-pill-item">
            <Zap size={15} style={{ color: '#D97706', flexShrink: 0 }} />
            <span>Quick 5-Minute Onboarding</span>
          </div>

          <div className="landing-pill-item">
            <Car size={15} style={{ color: '#059669', flexShrink: 0 }} />
            <span>Live Stockyard & Inventory</span>
          </div>

          <div className="landing-pill-item">
            <ShieldCheck size={15} style={{ color: '#059669', flexShrink: 0 }} />
            <span>GST & Compliance Verified</span>
          </div>
        </div>

        {/* CTA Container: Button + Time Estimate */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '2rem',
          }}
        >
          <Link
            href="/onboarding"
            id="begin-onboarding-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 36px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #1E443B 0%, #295F53 100%)',
              color: '#FFFFFF',
              fontSize: '1.02rem',
              fontWeight: 800,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              boxShadow: '0 12px 28px -6px rgba(30, 68, 59, 0.42)',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 16px 32px -6px rgba(30, 68, 59, 0.52)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(30, 68, 59, 0.42)';
            }}
          >
            <span>Begin Onboarding</span>
            <ArrowRight size={18} />
          </Link>

          <span
            style={{
              fontSize: '0.88rem',
              color: '#64748B',
              fontWeight: 500,
            }}
          >
            Takes approximately 8–10 minutes
          </span>
        </div>

        {/* Secondary Clean Link to Login */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginTop: '0.5rem',
          }}
        >
          <Link
            href="/login"
            style={{
              fontSize: '0.86rem',
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
            Already registered? <span style={{ color: '#1E443B', fontWeight: 700 }}>Sign in to your workspace →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
