'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  KeyRound,
  Sparkles,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
} from 'lucide-react';
import {
  getEmployees,
  fetchEmployees,
  verifyEmployeeLogin,
  setEmployeePermanentPassword,
  Employee,
} from '@/lib/employee-store';
import { getCompanyProfile, DEFAULT_COMPANY_PROFILE, CompanyProfile } from '@/lib/company-store';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Form states
  const [employeeIdOrEmail, setEmployeeIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow states: 'login' | 'first_time_password_change' | 'success'
  const [workflowStep, setWorkflowStep] = useState<'login' | 'first_time_password_change' | 'success'>('login');
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);

  // New password state for first-time login
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setCompany(getCompanyProfile());
    const initial = getEmployees();
    setEmployeesList(initial);

    fetchEmployees().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setEmployeesList(data);
      }
    });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefilledId = params.get('emp');
      if (prefilledId) {
        setEmployeeIdOrEmail(prefilledId);
      }
    }
  }, []);

  // Quick fill helper for demo/testing
  const handleQuickFill = (emp: Employee) => {
    setEmployeeIdOrEmail(emp.employeeCode || emp.email);
    setPassword(emp.password || '');
    setError(null);
  };

  // Step 1: Handle initial Employee ID + Password submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputId = employeeIdOrEmail.trim();
    const inputPass = password;

    if (!inputId) {
      setError('Please enter your Employee ID or Corporate Email.');
      return;
    }
    if (!inputPass) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = verifyEmployeeLogin(inputId, inputPass);

      if (!result.success || !result.employee) {
        setLoading(false);
        setError(result.error || 'Invalid credentials. Please verify your Employee ID and password.');
        return;
      }

      const emp = result.employee;
      setActiveEmployee(emp);

      // Check if employee needs to set their own password (First-Time Login)
      if (result.requiresPasswordChange) {
        setLoading(false);
        setWorkflowStep('first_time_password_change');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
      } else {
        // Returning employee: log in directly
        completeLogin(emp);
      }
    }, 400);
  };

  // Helper to map employee designation to system UserRole
  const resolveRole = (emp: Employee) => {
    if (emp.isAdmin) return 'tenant_admin' as const;
    const d = emp.designation.toLowerCase();
    if (d.includes('sales')) return 'sales_executive' as const;
    if (d.includes('finance') || d.includes('account')) return 'finance_manager' as const;
    if (d.includes('inventory')) return 'inventory_manager' as const;
    if (d.includes('service')) return 'service_advisor' as const;
    return 'sales_executive' as const;
  };

  // Complete session & route to employee page
  const completeLogin = (emp: Employee) => {
    const role = resolveRole(emp);

    loginUser(emp.email || `${emp.employeeCode.toLowerCase()}@dealership.com`, emp.fullName, role, {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      isAdmin: emp.isAdmin,
      avatarUrl: emp.avatarUrl,
      phone: emp.phone,
      accessControl: emp.accessControl,
    });

    setWorkflowStep('success');
    setLoading(false);

    setTimeout(() => {
      router.push('/employees');
    }, 1200);
  };

  // Step 2: Handle First-Time Password Creation
  const handleCreateOwnPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!activeEmployee) return;

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword === activeEmployee.password) {
      setPasswordError('New password cannot be the same as your temporary password. Please choose a new secure password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter to confirm.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Save permanent password and clear temporary flags
      const success = setEmployeePermanentPassword(activeEmployee.id, newPassword);

      if (success) {
        const updated = {
          ...activeEmployee,
          password: newPassword,
          mustChangePassword: false,
          isTemporaryPassword: false,
        };
        setActiveEmployee(updated);
        completeLogin(updated);
      } else {
        setLoading(false);
        setPasswordError('Failed to save your new password. Please try again.');
      }
    }, 450);
  };

  const dealershipName = company.tradeName || company.legalName || 'UNAI Dealership Platform';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#FCFDFC',
        backgroundImage: `
          radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
          radial-gradient(circle at 10% 90%, rgba(79, 70, 229, 0.05) 0%, transparent 40%),
          linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.25rem',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: 'var(--font, inherit)',
      }}
    >
      {/* Top Bar Navigation */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.84rem',
            fontWeight: 600,
            color: '#64748B',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={15} /> Back to Admin Login
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              fontSize: '0.76rem',
              fontWeight: 700,
              border: '1px solid #C7D2FE',
            }}
          >
            <ShieldCheck size={14} /> Staff & Employee Portal
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          marginTop: '2rem',
        }}
      >
        {/* Dealership Header Banner */}
        <div
          style={{
            padding: '24px 28px 20px',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
            borderBottom: '1px solid #F1F5F9',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.28)',
            }}
          >
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }} />
            ) : (
              <Building2 size={28} />
            )}
          </div>

          <h1 style={{ fontSize: '1.28rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
            {dealershipName}
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
            {workflowStep === 'first_time_password_change'
              ? 'Security Setup • Create Your Personal Password'
              : 'Staff & Team Member Login'}
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px' }}>
          {/* STEP 1: LOGIN FORM */}
          {workflowStep === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '12px',
                    color: '#DC2626',
                    fontSize: '0.84rem',
                    lineHeight: '1.4',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{error}</div>
                </div>
              )}

              {/* Employee ID or Email Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '6px',
                  }}
                >
                  Employee ID or Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type="text"
                    value={employeeIdOrEmail}
                    onChange={(e) => setEmployeeIdOrEmail(e.target.value)}
                    placeholder="e.g. EMP-001 or rahul@dealership.com"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 14px 0 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px' }}>
                  Enter the Employee ID provided by your administrator.
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E293B' }}>
                    Password <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#4F46E5', fontWeight: 600 }}>
                    Temporary or Permanent
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password given by admin"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 42px 0 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.15s ease',
                  marginTop: '8px',
                }}
              >
                {loading ? (
                  <span>Verifying credentials...</span>
                ) : (
                  <>
                    <span>Sign In to Employee Portal</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Demo Staff Accounts Quick-Fill Section */}
              {employeesList.length > 0 && (
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px dashed #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Active Staff Members ({employeesList.length})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#4F46E5', fontWeight: 600 }}>Click to auto-fill</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {employeesList.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleQuickFill(emp)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              backgroundColor: emp.isAdmin ? '#FEF3C7' : '#EEF2FF',
                              color: emp.isAdmin ? '#D97706' : '#4F46E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {emp.employeeCode.slice(-3)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {emp.fullName}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                              {emp.employeeCode} • {emp.designation}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '3px 7px',
                            borderRadius: '6px',
                            backgroundColor: emp.mustChangePassword ? '#FEF3C7' : '#DCFCE7',
                            color: emp.mustChangePassword ? '#92400E' : '#166534',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {emp.mustChangePassword ? '1st Login' : 'Password Set'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* STEP 2: FIRST TIME LOGIN - CREATE OWN PERMANENT PASSWORD */}
          {workflowStep === 'first_time_password_change' && activeEmployee && (
            <form onSubmit={handleCreateOwnPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Employee Welcome Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: '#EEF2FF',
                  border: '1.5px solid #C7D2FE',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {activeEmployee.fullName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E1B4B' }}>
                    Welcome, {activeEmployee.fullName}!
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#4338CA', fontWeight: 600 }}>
                    ID: {activeEmployee.employeeCode} • {activeEmployee.designation}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '4px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontWeight: 700,
                  }}
                >
                  1st Time Login
                </span>
              </div>

              {/* Requirement Notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  fontSize: '0.78rem',
                  color: '#92400E',
                  lineHeight: '1.45',
                }}
              >
                <KeyRound size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
                <div>
                  <strong>Admin Temporary Password Verified.</strong>
                  <br />
                  For your privacy and security, please create your own personal password to access your CRM employee account.
                </div>
              </div>

              {passwordError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '10px',
                    color: '#DC2626',
                    fontSize: '0.82rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* New Password Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  Create New Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new secret password"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 42px 0 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                  Minimum 6 characters with letters and numbers.
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  Confirm New Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                    }}
                  />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 14px 0 42px',
                      borderRadius: '12px',
                      border:
                        confirmPassword && confirmPassword === newPassword
                          ? '1.5px solid #16A34A'
                          : confirmPassword && confirmPassword !== newPassword
                          ? '1.5px solid #DC2626'
                          : '1.5px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {confirmPassword && confirmPassword === newPassword && (
                    <CheckCircle2
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#16A34A',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setWorkflowStep('login')}
                  style={{
                    flex: '1',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: '2',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  {loading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Save & Enter CRM</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS SPLASH */}
          {workflowStep === 'success' && activeEmployee && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  boxShadow: '0 6px 18px rgba(22, 163, 74, 0.25)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                Welcome to Dealership Workspace!
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '0 0 16px 0' }}>
                Your password has been saved. Opening employee page...
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: '#4F46E5',
                  fontWeight: 700,
                }}
              >
                <span>Loading your staff modules...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '16px 28px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.76rem',
            color: '#64748B',
          }}
        >
          <span>UNAI CRM Enterprise Edition</span>
          <span>Security 256-bit Encrypted</span>
        </div>
      </div>
    </div>
  );
}
