'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Settings, Bell, LogOut, Building2 } from 'lucide-react';
import { getModules, DealershipModule } from '@/lib/modules-registry';
import { getCompanyProfile, DEFAULT_COMPANY_PROFILE, CompanyProfile } from '@/lib/company-store';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userContext, activeRole, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [modules, setModules] = useState<DealershipModule[]>([]);
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Initial load
    setModules(getModules());
    setCompany(getCompanyProfile());

    const handleModulesChanged = () => {
      setModules(getModules());
    };

    const handleCompanyChanged = () => {
      setCompany(getCompanyProfile());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'crm_dealership_company_profile_v1') {
        setCompany(getCompanyProfile());
      }
    };

    window.addEventListener('crm-modules-changed', handleModulesChanged);
    window.addEventListener('crm-company-profile-changed', handleCompanyChanged);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('crm-modules-changed', handleModulesChanged);
      window.removeEventListener('crm-company-profile-changed', handleCompanyChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Save current active page to localStorage so page refresh or login preserves it
  useEffect(() => {
    if (pathname && pathname !== '/' && pathname !== '/login' && pathname !== '/onboarding') {
      try {
        localStorage.setItem('crm_last_active_page', pathname);
      } catch (e) {}
    }
  }, [pathname]);

  // Only display plugged-in (active) modules in the top navigation bar
  const activeNavTabs = modules.filter((m) => m.isPluggedIn);

  // Active top tab resolution
  const activeTab = (() => {
    if (pathname === '/dashboard') return '/dashboard';
    let best = '';
    for (const tab of activeNavTabs) {
      if (tab.href !== '/' && tab.href !== '/dashboard' && pathname.startsWith(tab.href) && tab.href.length > best.length) {
        best = tab.href;
      }
    }
    return best || (pathname === '/dashboard' ? '/dashboard' : '');
  })();

  const userDisplayName = isMounted && userContext?.user?.fullName
    ? userContext.user.fullName
    : 'Vikram Singhania';

  const userEmail = isMounted && userContext?.user?.email
    ? userContext.user.email
    : 'admin@apexmotors.com';

  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const userRoleDisplay = (isMounted && activeRole ? activeRole : 'tenant_admin').replace('_', ' ');

  // Full-screen standalone layout for Welcome Landing (/), Onboarding, and Login
  if (pathname === '/' || pathname === '/onboarding' || pathname === '/login') {
    return (
      <div className="app-shell" style={{ display: 'block', minHeight: '100vh', width: '100%' }}>
        {pathname === '/onboarding' ? (
          <div className="app-main" style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px 16px 48px' }}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    );
  }

  const brandDisplayName = isMounted ? (company.tradeName || company.legalName || 'UNAI CRM') : 'UNAI CRM';

  return (
    <div className="app-shell" style={{ display: 'block', minHeight: '100vh', width: '100%' }}>
      {/* ====== Main Content Canvas ====== */}
      <div className="app-main">
        {/* Unified Top Navigation Bar (Single Sleek Row: Brand, Nav Tabs filling space, Bell, Settings, Profile Avatar) */}
        <header className="top-bar">
          {/* Left: Brand Title & Dynamic Logo */}
          <Link href="/dashboard" className="brand-link" title={brandDisplayName}>
            {isMounted && company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={brandDisplayName}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(30,68,59,0.15)',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}
              />
            ) : (
              <div className="brand-badge">
                {brandDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="brand-title" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {brandDisplayName}
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
                      {userDisplayName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '2px' }}>
                      {userEmail}
                    </div>
                    <div style={{ display: 'inline-flex', marginTop: '8px' }} className="badge badge-green">
                      {userRoleDisplay}
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
