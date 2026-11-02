'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserContext, Branch, UserRole } from '@crm/shared-types';
import { api } from './api-client';

const SESSION_KEY = 'crm_active_user_session_v1';

import type { EmployeeAccessControl } from './employee-store';

export interface UserSession {
  isLoggedIn: boolean;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  loggedAt: string;
  employeeId?: string;
  employeeCode?: string;
  isAdmin?: boolean;
  accessControl?: EmployeeAccessControl;
}

export function saveUserSession(session: UserSession) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('crm-session-changed', { detail: session }));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearUserSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('crm-session-changed', { detail: null }));
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

interface AuthContextType {
  userContext: UserContext;
  currentBranch: Branch;
  setBranch: (branchId: string) => void;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  loginUser: (
    emailOrId: string,
    fullName?: string,
    role?: UserRole,
    meta?: {
      employeeId?: string;
      employeeCode?: string;
      isAdmin?: boolean;
      avatarUrl?: string;
      phone?: string;
      accessControl?: EmployeeAccessControl;
    }
  ) => void;
  updateUserProfile: (updates: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }) => void;
  logout: () => void;
  isLoggedIn: boolean;
  isMounted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialContext = api.getUserContext();
  const branches = api.getBranches();

  const [userContext, setUserContext] = useState<UserContext>(initialContext);
  const [currentBranch, setCurrentBranch] = useState<Branch>(branches[0]);
  const [activeRole, setActiveRole] = useState<UserRole>(initialContext.membership.roleKey);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const applySession = () => {
      const saved = getUserSession();
      const localAvatar = typeof window !== 'undefined' ? localStorage.getItem('crm_user_avatar') : null;
      if (saved && saved.isLoggedIn) {
        setIsLoggedIn(true);
        setActiveRole(saved.role);
        setUserContext((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            id: saved.userId,
            email: saved.email,
            fullName: saved.fullName,
            phone: saved.phone || prev.user.phone,
            avatarUrl: saved.avatarUrl || localAvatar || prev.user.avatarUrl,
          },
          membership: {
            ...prev.membership,
            roleKey: saved.role,
          },
        }));
      } else {
        setIsLoggedIn(false);
        if (localAvatar) {
          setUserContext((prev) => ({
            ...prev,
            user: {
              ...prev.user,
              avatarUrl: localAvatar,
            },
          }));
        }
      }
    };

    applySession();

    const handleSessionChanged = () => {
      applySession();
    };

    const handleProfileChanged = () => {
      applySession();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === 'crm_user_avatar') {
        applySession();
      }
    };

    window.addEventListener('crm-session-changed', handleSessionChanged);
    window.addEventListener('crm-user-profile-changed', handleProfileChanged);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('crm-session-changed', handleSessionChanged);
      window.removeEventListener('crm-user-profile-changed', handleProfileChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setBranch = (branchId: string) => {
    const found = branches.find((b) => b.id === branchId);
    if (found) {
      setCurrentBranch(found);
    }
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    setUserContext((prev) => ({
      ...prev,
      membership: {
        ...prev.membership,
        roleKey: role,
      },
    }));
    const current = getUserSession();
    if (current) {
      saveUserSession({ ...current, role });
    }
  };

  const loginUser = (
    emailOrId: string,
    fullName?: string,
    role: UserRole = 'tenant_admin',
    meta?: {
      employeeId?: string;
      employeeCode?: string;
      isAdmin?: boolean;
      avatarUrl?: string;
      phone?: string;
      accessControl?: EmployeeAccessControl;
    }
  ) => {
    const resolvedName = fullName || emailOrId.split('@')[0] || 'Administrator';
    const resolvedEmail = emailOrId.includes('@') ? emailOrId : `${emailOrId.toLowerCase().replace(/\s+/g, '')}@dealership.com`;
    const resolvedUserId = emailOrId;
    const localAvatar = meta?.avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('crm_user_avatar') || '' : '');

    const newSession: UserSession = {
      isLoggedIn: true,
      userId: resolvedUserId,
      fullName: resolvedName,
      email: resolvedEmail,
      role: role,
      avatarUrl: localAvatar,
      phone: meta?.phone,
      loggedAt: new Date().toISOString(),
      employeeId: meta?.employeeId,
      employeeCode: meta?.employeeCode,
      isAdmin: meta?.isAdmin,
      accessControl: meta?.accessControl,
    };

    saveUserSession(newSession);

    setActiveRole(role);
    setIsLoggedIn(true);
    setUserContext((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        id: resolvedUserId,
        email: resolvedEmail,
        fullName: resolvedName,
        phone: meta?.phone || prev.user.phone,
        avatarUrl: localAvatar,
      },
      membership: {
        ...prev.membership,
        roleKey: role,
      },
    }));
  };

  const updateUserProfile = (updates: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }) => {
    const current = getUserSession() || {
      isLoggedIn: true,
      userId: userContext.user.id || 'usr-admin-01',
      fullName: userContext.user.fullName || 'Administrator',
      email: userContext.user.email || 'admin@dealership.com',
      role: activeRole,
      loggedAt: new Date().toISOString(),
    };
    const updated: UserSession = {
      ...current,
      ...(updates.fullName ? { fullName: updates.fullName } : {}),
      ...(updates.email ? { email: updates.email } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
    };
    saveUserSession(updated);

    if (updates.avatarUrl !== undefined) {
      if (updates.avatarUrl) {
        localStorage.setItem('crm_user_avatar', updates.avatarUrl);
      } else {
        localStorage.removeItem('crm_user_avatar');
      }
    }

    setUserContext((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        ...(updates.fullName ? { fullName: updates.fullName } : {}),
        ...(updates.email ? { email: updates.email } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
      },
    }));

    window.dispatchEvent(new CustomEvent('crm-user-profile-changed', { detail: updated }));
  };

  const logout = () => {
    clearUserSession();
    setIsLoggedIn(false);
    setUserContext(initialContext);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userContext,
        currentBranch,
        setBranch,
        activeRole,
        switchRole,
        loginUser,
        updateUserProfile,
        logout,
        isLoggedIn,
        isMounted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
