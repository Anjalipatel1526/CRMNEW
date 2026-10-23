'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Settings, Bell, LogOut, Building2 } from 'lucide-react';
import { getModules, DealershipModule } from '@/lib/modules-registry';
import { getCompanyProfile, CompanyProfile } from '@/lib/company-store';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userContext, activeRole, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [modules, setModules] = useState<DealershipModule[]>([]);
  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    // Initial load
    setModules(getModules());
    setCompany(getCompanyProfile());

    const handleModulesChanged = () => {
      setModules(getModules());
    };

    const handleCompanyChanged = () => {
      setCompany(getCompanyProfile());
    };

    window.addEventListener('crm-modules-changed', handleModulesChanged);
    window.addEventListener('crm-company-profile-changed', handleCompanyChanged);
    return () => {
      window.removeEventListener('crm-modules-changed', handleModulesChanged);
      window.removeEventListener('crm-company-profile-changed', handleCompanyChanged);
    };
  }, []);

  // Only display plugged-in (active) modules in the top navigation bar
  const activeNavTabs = modules.filter((m) => m.isPluggedIn);

  // Active top tab resolution
  const activeTab = (() => {
    if (pathname === '/') return '/';
    let best = '';
    for (const tab of activeNavTabs) {
      if (tab.href !== '/' && pathname.startsWith(tab.href) && tab.href.length > best.length) {
        best = tab.href;
      }
    }
    return best || '/';
  })();

  const userInitials = (userContext?.user?.fullName || 'Vikram Singhania')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="app-shell" style={{ display: 'block', minHeight: '100vh', width: '100%' }}>
      {/* ====== Main Content Canvas ====== */}
      <div className="app-main">
        {/* Unified Top Navigation Bar (Single Sleek Row: Brand, Nav Tabs filling space, Bell, Settings, Profile Avatar) */}
        <header className="top-bar">
          {/* Left: Brand Title & Dynamic Logo */}
          <Link href="/" className="brand-link" title={company.tradeName || company.legalName || 'UNAI CRM'}>
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt="Logo"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(30,68,59,0.15)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div className="brand-badge">
                {(company.tradeName || company.legalName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="brand-title" style={{ maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {company.tradeName || company.legalName || 'UNAI CRM'}
            </span>
          </Link>

          {/* Center: Horizontal Capsule Nav Tabs (Spans across to fill space with balanced alignment) */}
          <nav className="nav-pills" aria-label="Dealership Navigation">
            {activeNavTabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`nav-pill ${activeTab === tab.href ? 'active' : ''}`}
                title={tab.description}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Right: Bell Icon, Settings, and Profile Avatar (Removed name from top nav as requested) */}
          <div className="top-bar__right">
            {/* Dealership Notifications Bell */}
            <button className="icon-circle-btn" title="Dealership Alerts">
              <Bell size={16} />
              <span className="bell-badge" />
            </button>

            {/* Company Onboarding Wizard Button */}
            <Link
              href="/onboarding"
              className={`pill-btn ${pathname === '/onboarding' ? 'active' : ''}`}
              title="Dealership Company Onboarding & Plugin Setup"
            >
              <Building2 size={15} style={{ color: pathname === '/onboarding' ? '#FFFFFF' : 'var(--pearl-green)' }} />
              <span className="pill-btn__label">Onboarding</span>
            </Link>

            {/* Settings Option Button */}
            <Link
              href="/settings"
              className={`pill-btn ${pathname === '/settings' ? 'active' : ''}`}
              title="Dealership Settings"
            >
              <Settings size={15} style={{ color: pathname === '/settings' ? '#FFFFFF' : 'var(--pearl-green)' }} />
              <span className="pill-btn__label">Settings</span>
            </Link>

            {/* Profile Avatar Button with Account Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="icon-circle-btn profile-avatar-btn"
                title="Profile & Account Menu"
                aria-expanded={profileDropdownOpen}
              >
                <div className="avatar-circle">
                  {userInitials}
                </div>
              </button>

              {/* Clean Profile Dropdown Menu (Branch and Persona sections removed as requested) */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '240px',
                    backgroundColor: 'var(--solid)',
                    border: '1px solid var(--line-2)',
                    borderRadius: 'var(--r-tile)',
                    boxShadow: 'var(--shadow-pop)',
                    zIndex: 75,
                    padding: '14px',
                  }}
                >
                  {/* User Profile Info */}
                  <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--line)', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text)' }}>
                      {userContext?.user?.fullName || 'Vikram Singhania'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '2px' }}>
                      {userContext?.user?.email || 'admin@apexmotors.com'}
                    </div>
                    <div style={{ display: 'inline-flex', marginTop: '8px' }} className="badge badge-green">
                      {(activeRole || 'tenant_admin').replace('_', ' ')}
                    </div>
                  </div>

                  {/* Settings & Logout Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Link
                      href="/onboarding"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text)',
                        textDecoration: 'none',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <Building2 size={14} style={{ color: 'var(--pearl-green)' }} />
                      <span>Company Onboarding</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text)',
                        textDecoration: 'none',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <Settings size={14} style={{ color: 'var(--pearl-green)' }} />
                      <span>Platform Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--tomato)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Dropdown Dismiss Overlay */}
        {profileDropdownOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 65,
            }}
            onClick={() => setProfileDropdownOpen(false)}
          />
        )}

        {/* Page Content with route key to trigger fade-in and content animations */}
        <main key={pathname} className="page-transition-wrap">
          {children}
        </main>
      </div>
    </div>
  );
}
