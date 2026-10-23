'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserContext, Branch, UserRole } from '@crm/shared-types';
import { api } from './api-client';

const SESSION_KEY = 'crm_active_user_session_v1';

export interface UserSession {
  isLoggedIn: boolean;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  loggedAt: string;
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
  loginUser: (emailOrId: string, fullName?: string, role?: UserRole) => void;
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
          },
          membership: {
            ...prev.membership,
            roleKey: saved.role,
          },
        }));
      } else {
        setIsLoggedIn(false);
      }
    };

    applySession();

    const handleSessionChanged = () => {
      applySession();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        applySession();
      }
    };

    window.addEventListener('crm-session-changed', handleSessionChanged);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('crm-session-changed', handleSessionChanged);
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

  const loginUser = (emailOrId: string, fullName?: string, role: UserRole = 'tenant_admin') => {
    const resolvedName = fullName || emailOrId.split('@')[0] || 'Administrator';
    const resolvedEmail = emailOrId.includes('@') ? emailOrId : `${emailOrId.toLowerCase().replace(/\s+/g, '')}@dealership.com`;
    const resolvedUserId = emailOrId;

    const newSession: UserSession = {
      isLoggedIn: true,
      userId: resolvedUserId,
      fullName: resolvedName,
      email: resolvedEmail,
      role: role,
      loggedAt: new Date().toISOString(),
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
      },
      membership: {
        ...prev.membership,
        roleKey: role,
      },
    }));
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
