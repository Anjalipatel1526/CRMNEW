'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserContext, Branch, UserRole } from '@crm/shared-types';
import { api } from './api-client';

interface AuthContextType {
  userContext: UserContext;
  currentBranch: Branch;
  setBranch: (branchId: string) => void;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialContext = api.getUserContext();
  const branches = api.getBranches();

  const [userContext, setUserContext] = useState<UserContext>(initialContext);
  const [currentBranch, setCurrentBranch] = useState<Branch>(branches[0]);
  const [activeRole, setActiveRole] = useState<UserRole>(initialContext.membership.roleKey);

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
  };

  const logout = () => {
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
        logout,
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
