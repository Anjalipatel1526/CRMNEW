'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LucideIcon,
  Settings,
  Bell,
  LogOut,
  Building2,
  User,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCheck,
  Car,
  UserPlus,
  DollarSign,
  Package,
  Users,
  X,
  LayoutDashboard,
  Filter,
  Calendar,
  Layers,
  BadgePercent,
  CreditCard,
  FileText,
  BarChart3,
  UserCheck,
  Gauge,
  ArrowLeft,
  LayoutGrid,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { getModules, DealershipModule } from '@/lib/modules-registry';
import {
  getCompanyProfile,
  fetchCompanyProfile,
  DEFAULT_COMPANY_PROFILE,
  CompanyProfile,
  getUserCredentials,
} from '@/lib/company-store';
import { getUserSession, UserSession } from '@/lib/auth-context';
import { getEmployees } from '@/lib/employee-store';

export interface DealershipNotification {
  id: string;
  title: string;
  message: string;
  category: 'lead' | 'test_drive' | 'deal' | 'inventory' | 'customer';
  timestamp: string;
  isRead: boolean;
  linkHref?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

const DEFAULT_NOTIFICATIONS: DealershipNotification[] = [
  {
    id: 'notif-1',
    title: 'New Online Lead Assigned',
    message: 'Vikram Malhotra submitted a quote enquiry for Hyundai Creta SX (Petrol MT).',
    category: 'lead',
    timestamp: '10m ago',
    isRead: false,
    linkHref: '/crm/leads',
    priority: 'high',
  },
  {
    id: 'notif-2',
    title: 'Test Drive Scheduled Today',
    message: 'Neha Sharma confirmed test drive for Tata Harrier Fearless+ at 3:30 PM.',
    category: 'test_drive',
    timestamp: '35m ago',
    isRead: false,
    linkHref: '/test-drives',
    priority: 'normal',
  },
  {
    id: 'notif-3',
    title: 'Deal Discount Approval Needed',
    message: '₹45,000 executive discount requested on Mahindra XUV700 AX7 deal.',
    category: 'deal',
    timestamp: '1h ago',
    isRead: false,
    linkHref: '/sales/deals',
    priority: 'urgent',
  },
  {
    id: 'notif-4',
    title: 'Vehicle Stock Allocation',
    message: 'Maruti Suzuki Brezza ZXi+ assigned to Downtown Branch inventory.',
    category: 'inventory',
    timestamp: '3h ago',
    isRead: true,
    linkHref: '/vehicles',
    priority: 'normal',
  },
  {
    id: 'notif-5',
    title: 'Customer Follow-Up Due',
    message: 'Follow-up call with Amit Verma regarding loan document verification.',
    category: 'customer',
    timestamp: '5h ago',
    isRead: true,
    linkHref: '/crm/customers',
    priority: 'normal',
  },
];

const PRESET_PROFILE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const MODULE_THEMES: Record<
  string,
  {
    bg: string;
    border: string;
    color: string;
    gradient?: string;
    IconComponent: LucideIcon;
  }
> = {
  Overview: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    color: '#2563EB',
    gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    IconComponent: LayoutDashboard,
  },
  Pipeline: {
    bg: '#EEF2FF',
    border: '#C7D2FE',
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
    IconComponent: Filter,
  },
  Customers: {
    bg: '#F5F3FF',
    border: '#DDD6FE',
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    IconComponent: Users,
  },
  Appointments: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    color: '#D97706',
    gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    IconComponent: Calendar,
  },
  Inventory: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    color: '#16A34A',
    gradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    IconComponent: Car,
  },
  Procurement: {
    bg: '#FFF1F2',
    border: '#FECDD3',
    color: '#E11D48',
    gradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
    IconComponent: Layers,
  },
  Deals: {
    bg: '#FDF2F8',
    border: '#FBCFE8',
    color: '#DB2777',
    gradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
    IconComponent: BadgePercent,
  },
  Finance: {
    bg: '#F0F9FF',
    border: '#BAE6FD',
    color: '#0284C7',
    gradient: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
    IconComponent: CreditCard,
  },
  Documents: {
    bg: '#F8FAFC',
    border: '#E2E8F0',
    color: '#475569',
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    IconComponent: FileText,
  },
  Reports: {
    bg: '#FAF5FF',
    border: '#E9D5FF',
    color: '#9333EA',
    gradient: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
    IconComponent: BarChart3,
  },
  Employees: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    IconComponent: UserCheck,
  },
  'Test Drives': {
    bg: '#FFF7ED',
    border: '#FED7AA',
    color: '#EA580C',
    gradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
    IconComponent: Gauge,
  },
  Settings: {
    bg: '#F1F5F9',
    border: '#CBD5E1',
    color: '#334155',
    gradient: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
    IconComponent: Settings,
  },
};

function getModuleVisual(tab: { label: string; icon?: string }) {
  if (MODULE_THEMES[tab.label]) return MODULE_THEMES[tab.label];
  const lower = (tab.label || '').toLowerCase();
  if (lower.includes('overview') || lower.includes('dash')) return MODULE_THEMES['Overview'];
  if (lower.includes('pipe') || lower.includes('lead') || lower.includes('enquir')) return MODULE_THEMES['Pipeline'];
  if (lower.includes('cust')) return MODULE_THEMES['Customers'];
  if (lower.includes('appoint')) return MODULE_THEMES['Appointments'];
  if (lower.includes('stock') || lower.includes('inven') || lower.includes('vehic')) return MODULE_THEMES['Inventory'];
  if (lower.includes('procur')) return MODULE_THEMES['Procurement'];
  if (lower.includes('deal')) return MODULE_THEMES['Deals'];
  if (lower.includes('finan')) return MODULE_THEMES['Finance'];
  if (lower.includes('doc')) return MODULE_THEMES['Documents'];
  if (lower.includes('rep') || lower.includes('analyt')) return MODULE_THEMES['Reports'];
  if (lower.includes('emp') || lower.includes('staff')) return MODULE_THEMES['Employees'];
  if (lower.includes('test') || lower.includes('drive')) return MODULE_THEMES['Test Drives'];
  if (lower.includes('sett')) return MODULE_THEMES['Settings'];
  return {
    bg: '#F1F5F9',
    border: '#E2E8F0',
    color: '#6253F8',
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
    IconComponent: LayoutDashboard,
  };
}

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userContext, activeRole, logout, updateUserProfile, session: authSession } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<DealershipNotification[]>(DEFAULT_NOTIFICATIONS);
  const [modules, setModules] = useState<DealershipModule[]>([]);
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionState, setSessionState] = useState<UserSession | null>(null);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setSessionState(getUserSession());
    // Initial load
    setModules(getModules());
    setCompany(getCompanyProfile());
    fetchCompanyProfile().then((p) => {
      if (p) setCompany(p);
    });

    try {
      const savedNotifs = localStorage.getItem('crm_dealership_notifications_v1');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      } else {
        localStorage.setItem('crm_dealership_notifications_v1', JSON.stringify(DEFAULT_NOTIFICATIONS));
      }
    } catch (e) {}

    const handleModulesChanged = () => {
      setModules(getModules());
    };

    const handleCompanyChanged = () => {
      setCompany(getCompanyProfile());
    };

    const handleSessionChanged = () => {
      setSessionState(getUserSession());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'crm_dealership_company_profile_v1') {
        setCompany(getCompanyProfile());
      }
      if (e.key === 'crm_active_user_session_v1') {
        setSessionState(getUserSession());
      }
    };

    window.addEventListener('crm-modules-changed', handleModulesChanged);
    window.addEventListener('crm-company-profile-changed', handleCompanyChanged);
    window.addEventListener('crm-session-changed', handleSessionChanged);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('crm-modules-changed', handleModulesChanged);
      window.removeEventListener('crm-company-profile-changed', handleCompanyChanged);
      window.removeEventListener('crm-session-changed', handleSessionChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Save current active page to localStorage so page refresh or login preserves it
  useEffect(() => {
    if (pathname && pathname !== '/' && pathname !== '/login' && pathname !== '/onboarding' && pathname !== '/emplogin') {
      try {
        localStorage.setItem('crm_last_active_page', pathname);
      } catch (e) {}
    }
  }, [pathname]);

  const activeSession = authSession || sessionState || (isMounted ? getUserSession() : null);
  const isStaffEmployee = Boolean(activeSession?.employeeId && !activeSession?.isAdmin);
  const isEmployeeAdmin = !isStaffEmployee;

  const employeeAccess = useMemo(() => {
    if (activeSession?.accessControl) return activeSession.accessControl;
    if (activeSession?.employeeId || activeSession?.employeeCode) {
      const allEmps = getEmployees();
      const found = allEmps.find(
        (e) =>
          e.id === activeSession.employeeId ||
          (activeSession.employeeCode && e.employeeCode.toLowerCase() === activeSession.employeeCode.toLowerCase())
      );
      if (found) return found.accessControl;
    }
    return undefined;
  }, [activeSession]);

  // Protect employee workflow: prevent staff from accessing admin-only pages
  useEffect(() => {
    if (!isMounted) return;
    if (isStaffEmployee) {
      if (
        pathname === '/employees' ||
        pathname === '/settings' ||
        pathname === '/dashboard' ||
        pathname === '/onboarding'
      ) {
        router.replace('/empportal');
      }
    }
  }, [pathname, isMounted, isStaffEmployee, router]);

  // Only display plugged-in (active) modules in the top navigation bar, respecting employee access control if not admin
  const activeNavTabs = useMemo(() => {
    // If logged in as staff employee (non-admin)
    if (isStaffEmployee) {
      const allowed: { id: string; label: string; href: string; icon: string; description?: string }[] = [
        {
          id: 'mod-empportal',
          label: 'Overview',
          href: '/empportal',
          icon: 'LayoutDashboard',
          description: 'Personal staff workflow & assigned tasks',
        },
      ];

      if (employeeAccess?.pipeline) {
        allowed.push({
          id: 'crm-pipeline',
          label: 'Pipeline',
          href: '/crm/leads',
          icon: 'Filter',
          description: 'Lead enquiries & pipeline stages',
        });
      }
      if (employeeAccess?.customers) {
        allowed.push({
          id: 'crm-customers',
          label: 'Customers',
          href: '/crm/customers',
          icon: 'Users',
          description: 'Customer profiles & contact directory',
        });
      }
      if (employeeAccess?.testDrives) {
        allowed.push({
          id: 'mod-test-drives',
          label: 'Test Drives',
          href: '/test-drives',
          icon: 'Gauge',
          description: 'Vehicle test drive bookings & logs',
        });
      }
      if (employeeAccess?.inventory) {
        allowed.push({
          id: 'mod-inventory',
          label: 'Inventory',
          href: '/vehicles',
          icon: 'Car',
          description: 'Showroom vehicle stock',
        });
      }
      if (employeeAccess?.procurement) {
        allowed.push({
          id: 'mod-procurement',
          label: 'Procurement',
          href: '/vehicles/procurement',
          icon: 'Layers',
          description: 'Vehicle intake & procurement',
        });
      }
      if (employeeAccess?.deals) {
        allowed.push({
          id: 'mod-deals',
          label: 'Deals',
          href: '/sales/deals',
          icon: 'BadgePercent',
          description: 'Commercial deal negotiations',
        });
      }
      if (employeeAccess?.finance) {
        allowed.push({
          id: 'mod-finance',
          label: 'Finance',
          href: '/finance',
          icon: 'CreditCard',
          description: 'Receipts & settlement vouchers',
        });
      }
      if (employeeAccess?.documents) {
        allowed.push({
          id: 'mod-documents',
          label: 'Documents',
          href: '/documents',
          icon: 'FileText',
          description: 'Delivery gate & KYC documents',
        });
      }
      if (employeeAccess?.reports) {
        allowed.push({
          id: 'mod-reports',
          label: 'Reports',
          href: '/reports',
          icon: 'BarChart3',
          description: 'Individual activity metrics',
        });
      }

      return allowed;
    }

    // Default for Administrators: show all plugged-in modules
    return modules.filter((m) => m.isPluggedIn);
  }, [modules, isStaffEmployee, activeSession, employeeAccess]);

  // Active top tab resolution
  const activeTab = (() => {
    if (pathname === '/empportal') return '/empportal';
    if (pathname === '/dashboard') return '/dashboard';
    let best = '';
    for (const tab of activeNavTabs) {
      if (
        tab.href !== '/' &&
        tab.href !== '/dashboard' &&
        tab.href !== '/empportal' &&
        pathname.startsWith(tab.href) &&
        tab.href.length > best.length
      ) {
        best = tab.href;
      }
    }
    return best || (pathname === '/empportal' ? '/empportal' : pathname === '/dashboard' ? '/dashboard' : '');
  })();

  // All tabs available on mobile quick access (excluding Overview since Quick Access is already displayed on Overview)
  const allMobileTabs = useMemo(() => {
    const tabs: any[] = activeNavTabs.filter(
      (t: any) =>
        t.href !== '/dashboard' &&
        t.href !== '/empportal' &&
        t.label?.toLowerCase() !== 'overview'
    );
    if (!isStaffEmployee && !tabs.some((t: any) => t.href === '/settings')) {
      tabs.push({
        id: 'mod-settings',
        label: 'Settings',
        href: '/settings',
        icon: 'Settings',
        description: 'System configurations and master controls',
      });
    }
    return tabs;
  }, [activeNavTabs, isStaffEmployee]);

  const currentMobileTab =
    allMobileTabs.find(
      (t: any) => t.href === activeTab || (t.href !== '/' && pathname.startsWith(t.href))
    ) ||
    activeNavTabs.find(
      (t: any) => t.href === activeTab || (t.href !== '/' && pathname.startsWith(t.href))
    );
  const currentTabLabel = currentMobileTab?.label || '';
  const isOverviewPage =
    pathname === '/dashboard' ||
    pathname === '/empportal' ||
    pathname === '/' ||
    pathname === '';

  const userDisplayName = isMounted
    ? (userContext?.user?.fullName || getUserSession()?.fullName || getUserCredentials()?.fullName || 'Anjali')
    : 'Anjali';

  const userEmail = isMounted
    ? (userContext?.user?.email || getUserSession()?.email || getUserCredentials()?.email || 'autobourn@dealership.com')
    : 'autobourn@dealership.com';

  const userAvatarUrl = isMounted
    ? (userContext?.user?.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('crm_user_avatar') : null) || '')
    : '';

  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

  const userRoleDisplay = (isMounted && activeRole ? activeRole : 'tenant_admin').replace('_', ' ');

  // Notifications helpers
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const markAllNotifsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      try {
        localStorage.setItem('crm_dealership_notifications_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const markNotifAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      try {
        localStorage.setItem('crm_dealership_notifications_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const deleteNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem('crm_dealership_notifications_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearAllNotifs = () => {
    setNotifications([]);
    try {
      localStorage.setItem('crm_dealership_notifications_v1', JSON.stringify([]));
    } catch (e) {}
  };

  const handleNotifClick = (item: DealershipNotification) => {
    markNotifAsRead(item.id);
    setNotificationsOpen(false);
    if (item.linkHref) {
      router.push(item.linkHref);
    }
  };

  const displayedNotifications =
    notifFilter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const renderNotifCategoryIcon = (category: DealershipNotification['category']) => {
    switch (category) {
      case 'lead':
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserPlus size={15} style={{ color: '#2563EB' }} />
          </div>
        );
      case 'test_drive':
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Car size={15} style={{ color: '#059669' }} />
          </div>
        );
      case 'deal':
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DollarSign size={15} style={{ color: '#D97706' }} />
          </div>
        );
      case 'inventory':
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F5F3FF',
              border: '1px solid #DDD6FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={15} style={{ color: '#7C3AED' }} />
          </div>
        );
      case 'customer':
      default:
        return (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={15} style={{ color: '#0284C7' }} />
          </div>
        );
    }
  };

  const openProfileModal = () => {
    const creds = getUserCredentials();
    const session = getUserSession();
    const currentName = userContext?.user?.fullName || session?.fullName || creds?.fullName || 'Anjali';
    const currentPhone = userContext?.user?.phone || session?.phone || '';
    const currentAvatar = userAvatarUrl || '';
    setProfileName(currentName);
    setProfilePhone(currentPhone);
    setProfileAvatarUrl(currentAvatar);
    setProfileSavedToast(false);
    setIsProfileModalOpen(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Photo size exceeds 4MB. Please choose a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setProfileAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName: profileName.trim() || userDisplayName,
      phone: profilePhone.trim(),
      avatarUrl: profileAvatarUrl,
    });
    setProfileSavedToast(true);
    setTimeout(() => {
      setProfileSavedToast(false);
      setIsProfileModalOpen(false);
    }, 850);
  };

  // Full-screen standalone layout for Welcome Landing (/), Onboarding, Login, and Employee Login (/emplogin)
  if (pathname === '/' || pathname === '/onboarding' || pathname === '/login' || pathname === '/emplogin') {
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
          <Link
            href={isStaffEmployee ? '/empportal' : '/dashboard'}
            className="brand-link"
            title={brandDisplayName}
          >
            {isMounted && company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={brandDisplayName}
                className="brand-logo-img"
              />
            ) : (
              <div className="brand-badge" suppressHydrationWarning>
                {brandDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="brand-title" suppressHydrationWarning style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {brandDisplayName}
            </span>
          </Link>

          {/* Center: Horizontal Capsule Nav Tabs (Spans across to fill space with balanced alignment) */}
          <nav className="nav-pills" aria-label="Dealership Navigation">
            {activeNavTabs.map((tab: any) => (
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

          {/* Right: Working Notifications Center and Profile Avatar (Settings pill button removed per request) */}
          <div className="top-bar__right">
            {/* Interactive Dealership Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileDropdownOpen(false);
                }}
                className="icon-circle-btn"
                title="Dealership Alerts & Notifications"
                aria-expanded={notificationsOpen}
                style={{
                  position: 'relative',
                  backgroundColor: notificationsOpen ? 'var(--float)' : undefined,
                  borderColor: notificationsOpen ? 'var(--line-2)' : undefined,
                }}
              >
                <Bell size={16} style={{ color: unreadNotifCount > 0 ? '#1E293B' : 'var(--muted)' }} />
                {unreadNotifCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 4px',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      borderRadius: '999px',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--solid)',
                      boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover Dropdown */}
              {notificationsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '380px',
                    maxWidth: 'calc(100vw - 24px)',
                    backgroundColor: 'var(--solid)',
                    border: '1px solid var(--line-2)',
                    borderRadius: 'var(--r-tile)',
                    boxShadow: 'var(--shadow-pop)',
                    zIndex: 75,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Notification Dropdown Header */}
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--line)',
                      backgroundColor: 'var(--dock-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                        Notifications
                      </span>
                      {unreadNotifCount > 0 ? (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                          }}
                        >
                          {unreadNotifCount} new
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                          }}
                        >
                          All caught up
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotifsAsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--pearl-green)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        <CheckCheck size={14} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Filter tabs */}
                  <div
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid var(--line)',
                      padding: '4px 10px',
                      backgroundColor: '#FAFAFA',
                      gap: '4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setNotifFilter('all')}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: notifFilter === 'all' ? '#FFFFFF' : 'transparent',
                        boxShadow: notifFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        fontWeight: notifFilter === 'all' ? 700 : 500,
                        color: notifFilter === 'all' ? 'var(--text)' : 'var(--muted)',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifFilter('unread')}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: notifFilter === 'unread' ? '#FFFFFF' : 'transparent',
                        boxShadow: notifFilter === 'unread' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        fontWeight: notifFilter === 'unread' ? 700 : 500,
                        color: notifFilter === 'unread' ? 'var(--text)' : 'var(--muted)',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      Unread ({unreadNotifCount})
                    </button>
                  </div>

                  {/* Notification Items List */}
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {displayedNotifications.length === 0 ? (
                      <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                        <CheckCircle2 size={32} style={{ color: '#10B981', margin: '0 auto 8px auto' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text)' }}>
                          {notifFilter === 'unread' ? 'No unread notifications' : 'No notifications'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '4px' }}>
                          {notifFilter === 'unread'
                            ? "You've read all your recent alerts."
                            : 'New dealership leads, deals, and activity will show up here.'}
                        </div>
                      </div>
                    ) : (
                      displayedNotifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotifClick(item)}
                          style={{
                            padding: '10px 12px',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                            borderBottom: '1px solid var(--line)',
                            backgroundColor: item.isRead ? 'transparent' : 'rgba(98, 83, 248, 0.04)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--float)')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = item.isRead ? 'transparent' : 'rgba(98, 83, 248, 0.04)')
                          }
                        >
                          {/* Category Icon */}
                          {renderNotifCategoryIcon(item.category)}

                          {/* Content Body */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                {!item.isRead && (
                                  <span
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      backgroundColor: '#3B82F6',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <span
                                  style={{
                                    fontWeight: item.isRead ? 600 : 700,
                                    fontSize: '0.82rem',
                                    color: 'var(--text)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.title}
                                </span>
                              </div>
                              {item.priority === 'urgent' && (
                                <span
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: '#FEE2E2',
                                    color: '#DC2626',
                                    textTransform: 'uppercase',
                                    flexShrink: 0,
                                  }}
                                >
                                  Urgent
                                </span>
                              )}
                              {item.priority === 'high' && (
                                <span
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: '#FFEDD5',
                                    color: '#EA580C',
                                    textTransform: 'uppercase',
                                    flexShrink: 0,
                                  }}
                                >
                                  High
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--muted)',
                                marginTop: '3px',
                                lineHeight: '1.35',
                              }}
                            >
                              {item.message}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '6px',
                              }}
                            >
                              <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                                {item.timestamp}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => deleteNotif(e, item.id)}
                                title="Dismiss notification"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#94A3B8',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  {notifications.length > 0 && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderTop: '1px solid var(--line)',
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <button
                        type="button"
                        onClick={clearAllNotifs}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748B',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                      >
                        Clear all
                      </button>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        Dealership Alert Center
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar Button with Account Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="icon-circle-btn profile-avatar-btn"
                title="Profile & Account Menu"
                aria-expanded={profileDropdownOpen}
                style={{ padding: 0, overflow: 'hidden' }}
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userDisplayName}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div className="avatar-circle">
                    {userInitials}
                  </div>
                )}
              </button>

              {/* Clean Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '248px',
                    backgroundColor: 'var(--solid)',
                    border: '1px solid var(--line-2)',
                    borderRadius: 'var(--r-tile)',
                    boxShadow: 'var(--shadow-pop)',
                    zIndex: 75,
                    padding: '14px',
                  }}
                >
                  {/* User Profile Info Header (Clickable to view profile) */}
                  <div
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      openProfileModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '4px 6px 12px 6px',
                      borderBottom: '1px solid var(--line)',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      transition: 'background 0.15s ease',
                    }}
                    title="Click to view full profile"
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={userDisplayName}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid var(--pearl-green)',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'var(--dock-gradient)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.86rem',
                          }}
                        >
                          {userInitials}
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {userDisplayName}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '1px',
                        }}
                      >
                        {userEmail}
                      </div>
                      <div style={{ display: 'inline-flex', marginTop: '4px' }} className="badge badge-green">
                        {userRoleDisplay}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Links & Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {/* View Profile Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        openProfileModal();
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
                        color: 'var(--text)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--float)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <User size={14} style={{ color: 'var(--pearl-green)' }} />
                      <span>View Profile</span>
                    </button>

                    {/* Company Onboarding: ONLY shown for Admins if NOT yet onboarded */}
                    {isMounted && !company.isOnboarded && !isStaffEmployee && (
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
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--float)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Building2 size={14} style={{ color: 'var(--pearl-green)' }} />
                        <span>Company Onboarding</span>
                      </Link>
                    )}

                    {/* Platform Settings Link: Only for Admins; Staff get My Staff Portal */}
                    {!isStaffEmployee ? (
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
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--float)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Settings size={14} style={{ color: 'var(--pearl-green)' }} />
                        <span>Platform Settings</span>
                      </Link>
                    ) : (
                      <Link
                        href="/empportal"
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
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--float)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <LayoutDashboard size={14} style={{ color: 'var(--pearl-green)' }} />
                        <span>My Staff Portal</span>
                      </Link>
                    )}

                    {/* Sign Out Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        const wasStaff = isStaffEmployee;
                        logout();
                        if (wasStaff && typeof window !== 'undefined') {
                          window.location.href = '/emplogin';
                        }
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
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(200, 67, 31, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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

        {/* Global Dropdown Dismiss Overlay for Profile & Notifications */}
        {(profileDropdownOpen || notificationsOpen) && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 65,
            }}
            onClick={() => {
              setProfileDropdownOpen(false);
              setNotificationsOpen(false);
            }}
          />
        )}

        {/* Mobile Quick Access Navigation Grid (Only shown on Overview / Dashboard on mobile <= 768px) */}
        {isOverviewPage && (
          <div className="mobile-quick-access-wrap">
            <div className="mobile-quick-access-card">
              <div className="mobile-quick-access-header">
                <div className="mobile-qa-header-left">
                  <div className="mobile-qa-header-icon">
                    <LayoutGrid size={15} />
                  </div>
                  <div className="mobile-qa-title-group">
                    <span className="mobile-qa-title">Quick Access</span>
                    <span className="mobile-qa-subtitle">All Dealership Hubs</span>
                  </div>
                </div>
                <div className="mobile-qa-header-right">
                  <span className="mobile-qa-badge">{allMobileTabs.length} Modules</span>
                </div>
              </div>

              <div className="mobile-quick-access-grid">
                {allMobileTabs.map((tab: any) => {
                  const isActive =
                    tab.href === activeTab || (tab.href !== '/' && pathname.startsWith(tab.href));
                  const visual = getModuleVisual(tab);
                  const Icon = visual.IconComponent;

                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className={`mobile-qa-item ${isActive ? 'is-active' : ''}`}
                      title={tab.description || tab.label}
                    >
                      <div
                        className="mobile-qa-icon-badge"
                        style={{
                          background: visual.gradient || visual.bg,
                          borderColor: visual.border,
                          color: visual.color,
                        }}
                      >
                        <Icon size={21} />
                      </div>
                      <span className="mobile-qa-label">{tab.label}</span>
                      {isActive && <span className="mobile-qa-active-dot" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Back to Overview Bar (Shown on subpages on mobile <= 768px) */}
        {!isOverviewPage && (
          <div className="mobile-subpage-back-wrap">
            <Link
              href={isStaffEmployee ? '/empportal' : '/dashboard'}
              className="mobile-back-action-bar"
              title="Return to Overview"
            >
              <div className="mobile-back-action-left">
                <div className="mobile-back-icon-circle">
                  <ArrowLeft size={15} />
                </div>
                <span className="mobile-back-title">Back to Overview</span>
              </div>
              {currentTabLabel && (
                <div className="mobile-back-current-pill">
                  <span className="mobile-back-dot" />
                  <span className="mobile-back-section-name">{currentTabLabel}</span>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Page Content with route key to trigger fade-in and content animations */}
        <main key={pathname} className="page-transition-wrap">
          {children}
        </main>
      </div>

      {/* ====== MY PROFILE & AVATAR MODAL ====== */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="My Profile"
        maxWidth="540px"
      >
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
            {/* Avatar Circle with Camera Overlay */}
            <div style={{ position: 'relative', width: '92px', height: '92px', marginBottom: '12px' }}>
              {profileAvatarUrl ? (
                <img
                  src={profileAvatarUrl}
                  alt={profileName || userDisplayName}
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

              {/* Camera Icon Overlay button to trigger file upload */}
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
                onChange={handleAvatarFileUpload}
              />
            </div>

            {/* Profile Picture Action Buttons */}
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

            {/* Quick Avatar Presets */}
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

          {/* Success Banner */}
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
              <span>Profile details and picture updated successfully!</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                Email Address
              </label>
              <input
                type="email"
                className="form-input"
                value={userEmail}
                disabled
                style={{ backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                Phone Number
              </label>
              <input
                type="tel"
                className="form-input"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Dealership & Role Metadata Info Badges */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Shield size={14} style={{ color: '#6253F8' }} />
              <span>Role: <strong style={{ color: '#0F172A' }}>{userRoleDisplay}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <Building size={14} style={{ color: '#6253F8' }} />
              <span>Dealership: <strong style={{ color: '#0F172A' }}>{brandDisplayName}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <MapPin size={14} style={{ color: '#6253F8' }} />
              <span>Branch: <strong style={{ color: '#0F172A' }}>Main Showroom</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
              <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
              <span>Status: <strong style={{ color: '#16A34A' }}>Active & Verified</strong></span>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsProfileModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: '999px',
                padding: '0.5rem 1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(98, 83, 248, 0.35)',
              }}
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
