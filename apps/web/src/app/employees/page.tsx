'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import { Modal } from '@/components/ui/Modal';
import {
  getEmployees,
  fetchEmployees,
  addEmployee,
  updateEmployee,
  updateEmployeePassword,
  updateEmployeeAccessControl,
  addLeaveRecord,
  updateLeaveRecordStatus,
  deleteEmployee,
  initEmployeesRealtime,
  Employee,
  EmployeeAccessControl,
} from '@/lib/employee-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserSession } from '@/lib/auth-context';
import {
  Users,
  Plus,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  ExternalLink,
  Trash2,
  Lock,
  Camera,
  Upload,
  Edit3,
  Pencil,
  MapPin,
  Building2,
  X,
  UserPlus,
  Banknote,
  Briefcase,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [selectedProfileCardEmp, setSelectedProfileCardEmp] = useState<Employee | null>(null);
  const [isEditingDossier, setIsEditingDossier] = useState(false);
  const [editDossierForm, setEditDossierForm] = useState<Partial<Employee>>({});

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  ];

  const openEmployeeDossier = (emp: Employee) => {
    setSelectedProfileCardEmp(emp);
    setEditDossierForm({ ...emp });
    setIsEditingDossier(false);
  };

  const handleSaveDossierChanges = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProfileCardEmp) return;
    const updated = updateEmployee(selectedProfileCardEmp.id, editDossierForm);
    if (updated) {
      setSelectedProfileCardEmp(updated);
      setEmployees(getEmployees());
      setIsEditingDossier(false);
      showToast(`Employee details for ${updated.fullName} updated successfully!`);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size exceeds 3MB. Please select a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (target === 'add') {
          setNewEmpForm((prev) => ({ ...prev, avatarUrl: result }));
        } else {
          setEditDossierForm((prev) => ({ ...prev, avatarUrl: result }));
        }
        showToast('Photo uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleEmployeeCard = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Modals
  const [isMounted, setIsMounted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedForLeave, setSelectedForLeave] = useState<Employee | null>(null);
  const [selectedForAccess, setSelectedForAccess] = useState<Employee | null>(null);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({ isOpen: false, employee: null });
  const [showTempPassInModal, setShowTempPassInModal] = useState(false);
  const [showAccessRolesExpanded, setShowAccessRolesExpanded] = useState(true);

  // New Employee Form matching user screenshot
  const [newEmpForm, setNewEmpForm] = useState({
    fullName: '',
    designation: '',
    customDesignation: '',
    phone: '',
    email: '',
    salary: '',
    salaryCategory: 'Annual CTC',
    isAdmin: false,
    department: 'Sales' as any,
    branch: 'Apex Downtown Flagship',
    employeeCode: '',
    password: '',
    avatarUrl: '',
    accessControl: {
      pipeline: true,
      customers: true,
      inventory: true,
      procurement: false,
      deals: true,
      finance: false,
      testDrives: true,
      documents: false,
      reports: false,
      settings: false,
    } as EmployeeAccessControl,
  });

  const handleOpenAddModal = () => {
    const currentList = getEmployees();
    const nextCount = currentList.length + 1;
    const nextCode = `EMP-${String(nextCount).padStart(3, '0')}`;
    const generatedPass = `Temp@${Math.floor(1000 + Math.random() * 9000)}`;

    setNewEmpForm({
      fullName: '',
      designation: '',
      customDesignation: '',
      phone: '',
      email: '',
      salary: '',
      salaryCategory: 'Annual CTC',
      isAdmin: false,
      department: 'Sales',
      branch: 'Apex Downtown Flagship',
      employeeCode: nextCode,
      password: generatedPass,
      avatarUrl: '',
      accessControl: {
        pipeline: true,
        customers: true,
        inventory: true,
        procurement: false,
        deals: true,
        finance: false,
        testDrives: true,
        documents: false,
        reports: false,
        settings: false,
      },
    });
    setShowTempPassInModal(false);
    setShowAccessRolesExpanded(true);
    setIsAddModalOpen(true);
  };

  const handleRegeneratePassword = () => {
    const generatedPass = `Temp@${Math.floor(1000 + Math.random() * 9000)}`;
    setNewEmpForm((prev) => ({ ...prev, password: generatedPass }));
  };

  const handleRolePreset = (preset: 'all' | 'sales' | 'finance' | 'service' | 'clear') => {
    if (preset === 'all') {
      setNewEmpForm((prev) => ({
        ...prev,
        accessControl: {
          pipeline: true,
          customers: true,
          inventory: true,
          procurement: true,
          deals: true,
          finance: true,
          testDrives: true,
          documents: true,
          reports: true,
          settings: true,
        },
      }));
    } else if (preset === 'sales') {
      setNewEmpForm((prev) => ({
        ...prev,
        accessControl: {
          pipeline: true,
          customers: true,
          inventory: true,
          procurement: false,
          deals: true,
          finance: false,
          testDrives: true,
          documents: false,
          reports: false,
          settings: false,
        },
      }));
    } else if (preset === 'finance') {
      setNewEmpForm((prev) => ({
        ...prev,
        accessControl: {
          pipeline: false,
          customers: true,
          inventory: false,
          procurement: true,
          deals: true,
          finance: true,
          testDrives: false,
          documents: true,
          reports: true,
          settings: false,
        },
      }));
    } else if (preset === 'service') {
      setNewEmpForm((prev) => ({
        ...prev,
        accessControl: {
          pipeline: false,
          customers: true,
          inventory: true,
          procurement: false,
          deals: false,
          finance: false,
          testDrives: true,
          documents: true,
          reports: false,
          settings: false,
        },
      }));
    } else {
      setNewEmpForm((prev) => ({
        ...prev,
        accessControl: {
          pipeline: false,
          customers: false,
          inventory: false,
          procurement: false,
          deals: false,
          finance: false,
          testDrives: false,
          documents: false,
          reports: false,
          settings: false,
        },
      }));
    }
  };

  // Leave Form
  const [newLeaveForm, setNewLeaveForm] = useState({
    leaveType: 'casual' as any,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    days: 2,
    reason: '',
  });

  useEffect(() => {
    const session = getUserSession();
    if (session?.employeeId && !session?.isAdmin) {
      router.replace('/empportal');
      return;
    }
    setIsMounted(true);
    setEmployees(getEmployees());
    fetchEmployees().then((data) => {
      if (Array.isArray(data)) setEmployees([...data]);
    });
    // Listen for Supabase Realtime changes so deletions in Supabase Table Editor delete live on the frontend
    initEmployeesRealtime();
    const handleChanged = () => setEmployees(getEmployees());
    window.addEventListener('crm-employees-changed', handleChanged);
    return () => window.removeEventListener('crm-employees-changed', handleChanged);
  }, []);

  useEffect(() => {
    if (isAddModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAddModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Credentials copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.fullName.trim()) {
      showToast('Please enter the employee full name.');
      return;
    }

    const resolvedRole =
      newEmpForm.designation === 'custom'
        ? (newEmpForm.customDesignation.trim() || 'Staff Member')
        : (newEmpForm.designation || 'Sales Executive');

    let resolvedDept = 'Sales';
    const dLower = resolvedRole.toLowerCase();
    if (dLower.includes('finance') || dLower.includes('account')) resolvedDept = 'Finance';
    else if (dLower.includes('inventory') || dLower.includes('procurement')) resolvedDept = 'Operations';
    else if (dLower.includes('service') || dLower.includes('tech')) resolvedDept = 'Service';
    else if (dLower.includes('manager') || dLower.includes('director')) resolvedDept = 'Management';
    if (newEmpForm.isAdmin) resolvedDept = 'Admin';

    const empCode = newEmpForm.employeeCode.trim() || `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    const tempPass = newEmpForm.password.trim() || `Temp@${Math.floor(1000 + Math.random() * 9000)}`;

    const created = addEmployee({
      fullName: newEmpForm.fullName.trim(),
      email: newEmpForm.email.trim() || `${empCode.toLowerCase()}@dealership.com`,
      phone: newEmpForm.phone.trim() || '+91 98000 00000',
      designation: resolvedRole,
      department: resolvedDept as any,
      branch: newEmpForm.branch,
      salary: newEmpForm.salary.trim()
        ? (newEmpForm.salary.startsWith('₹') ? newEmpForm.salary.trim() : `₹${newEmpForm.salary.trim()}`)
        : (newEmpForm.salaryCategory === 'Annual CTC' ? '₹6,00,000' : '₹50,000'),
      salaryCategory: newEmpForm.salaryCategory || 'Annual CTC',
      isAdmin: newEmpForm.isAdmin,
      employeeCode: empCode,
      password: tempPass,
      isTemporaryPassword: true,
      mustChangePassword: true,
      avatarUrl: newEmpForm.avatarUrl || '',
      accessControl: newEmpForm.isAdmin ? {
        pipeline: true,
        customers: true,
        inventory: true,
        procurement: true,
        deals: true,
        finance: true,
        testDrives: true,
        documents: true,
        reports: true,
        settings: true,
      } : newEmpForm.accessControl,
    });

    setIsAddModalOpen(false);
    setEmployees(getEmployees());
    setCreatedCredentialsModal({ isOpen: true, employee: created });
    showToast(`Employee ${created.fullName} (${created.employeeCode}) onboarded successfully!`);

    // Refetch in background to ensure Supabase state synchronization
    fetchEmployees().then((fresh) => {
      if (Array.isArray(fresh)) setEmployees([...fresh]);
    });
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForLeave) return;

    addLeaveRecord(selectedForLeave.id, {
      leaveType: newLeaveForm.leaveType,
      startDate: newLeaveForm.startDate,
      endDate: newLeaveForm.endDate,
      days: Number(newLeaveForm.days) || 1,
      reason: newLeaveForm.reason || 'Personal leave',
      status: 'approved',
      approvedBy: 'Tenant Admin',
    });

    const updated = getEmployees().find((e) => e.id === selectedForLeave.id);
    setSelectedForLeave(updated || null);
    showToast(`Leave recorded for ${selectedForLeave.fullName}!`);
  };

  const handleApproveLeave = (recordId: string, approved: boolean) => {
    if (!selectedForLeave) return;
    const newStatus = approved ? 'approved' : 'rejected';
    const success = updateLeaveRecordStatus(selectedForLeave.id, recordId, newStatus, 'Tenant Admin');
    if (success) {
      const all = getEmployees();
      setEmployees(all);
      const updated = all.find((e) => e.id === selectedForLeave.id);
      setSelectedForLeave(updated || null);
      showToast(
        approved
          ? `Leave request approved for ${selectedForLeave.fullName}! Balance updated.`
          : `Leave request rejected for ${selectedForLeave.fullName}.`
      );
    } else {
      showToast('Failed to update leave record status.');
    }
  };

  const handleToggleAccess = (key: keyof EmployeeAccessControl) => {
    if (!selectedForAccess) return;
    const current = { ...selectedForAccess.accessControl };
    current[key] = !current[key];
    updateEmployeeAccessControl(selectedForAccess.id, current);
    const updated = getEmployees().find((e) => e.id === selectedForAccess.id);
    setSelectedForAccess(updated || null);
    showToast(`Updated permissions for ${selectedForAccess.fullName}.`);
  };

  const handleToggleCardAccess = (key: keyof EmployeeAccessControl) => {
    if (!selectedProfileCardEmp) return;
    const current = { ...selectedProfileCardEmp.accessControl };
    current[key] = !current[key];
    updateEmployeeAccessControl(selectedProfileCardEmp.id, current);
    const updated = getEmployees().find((e) => e.id === selectedProfileCardEmp.id);
    setSelectedProfileCardEmp(updated || null);
    showToast(`Updated permissions for ${selectedProfileCardEmp.fullName}.`);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees.filter((e) => {
      const matchDept = deptFilter === 'All' || e.department === deptFilter;
      const matchQuery =
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q);
      return matchDept && matchQuery;
    });
  }, [employees, deptFilter, search]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            zIndex: 99999,
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Staff & Employee Workforce Management" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Dealership employee directory, CRM ID & passwords, individual leave logs, and granular section access control."
              baseDelay={0.18}
              staggerDelay={0.025}
            />
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <button
            type="button"
            className="unique-lead-submit-btn"
            onClick={handleOpenAddModal}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Plus size={15} />
            <span className="btn-text">Add Employee</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, designation, or email..."
            style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['All', 'Sales', 'Finance', 'Operations', 'Service', 'Management'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDeptFilter(d)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: deptFilter === d ? '#6253F8' : '#E2E8F0',
                backgroundColor: deptFilter === d ? '#6253F8' : '#FFFFFF',
                color: deptFilter === d ? '#FFFFFF' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Employees List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px dashed #CBD5E1',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(30,68,59,0.08)',
                color: '#6253F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                margin: '0 auto 16px',
              }}
            >
              👥
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              No Staff Members Registered Yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px' }}>
              Your dealership team roster is empty. Register employees, assign department roles, credentials, and track commissions.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#6253F8',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>+</span> Add First Employee
            </button>
          </div>
        ) : (
          filtered.map((emp) => {
          const isPassVisible = revealedPasswords[emp.id];
          const isExpanded = !!expandedCardIds[emp.id];

          return (
            <div
              key={emp.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '16px 20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Main Row: Clean, Uncluttered, Clickable to open Card in middle of page */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div
                  onClick={() => openEmployeeDossier(emp)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                  title="Click to view full employee dossier"
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#6253F8',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.fullName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      emp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div>
                    {/* Clickable Employee Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        className="emp-name-title"
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          cursor: 'pointer',
                        }}
                      >
                        {emp.fullName}
                      </span>

                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color: '#2563EB',
                          background: '#EFF6FF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #DBEAFE',
                        }}
                      >
                        {emp.employeeCode}
                      </span>
                      <span className="badge badge-green">{emp.department}</span>
                      {emp.isAdmin && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FDE68A',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Shield size={11} /> Admin Privileges
                        </span>
                      )}
                      {emp.mustChangePassword ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#FFFBEB',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <KeyRound size={11} /> Temp Password (1st Login Pending)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                            border: '1px solid #BBF7D0',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={11} /> Permanent Password Active
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{emp.designation} • {emp.branch}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {emp.salary || '₹6,00,000'} ({emp.salaryCategory || 'Annual CTC'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {(() => {
                    const casualRem = (emp.leaveBalance?.casual.total || 12) - (emp.leaveBalance?.casual.used || 0);
                    const sickRem = (emp.leaveBalance?.sick.total || 7) - (emp.leaveBalance?.sick.used || 0);
                    const paidRem = (emp.leaveBalance?.paid.total || 18) - (emp.leaveBalance?.paid.used || 0);
                    const totalAvailLeave = Math.max(0, casualRem + sickRem + paidRem);
                    const pendingCount = (emp.leaveHistory || []).filter((lh) => lh.status === 'pending').length;

                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedForLeave(emp)}
                        title="View Leave Balance and Pending Leave Requests"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: pendingCount > 0 ? '1.5px solid #F59E0B' : '1px solid #CBD5E1',
                          background: pendingCount > 0 ? '#FFFBEB' : '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: pendingCount > 0 ? '#B45309' : '#1E293B',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <Calendar size={13} style={{ color: pendingCount > 0 ? '#D97706' : '#2563EB' }} />
                        <span>Leave Balance: {totalAvailLeave} Days</span>
                        {pendingCount > 0 && (
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '999px',
                              backgroundColor: '#EF4444',
                              color: '#FFFFFF',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                            }}
                          >
                            {pendingCount} Pending
                          </span>
                        )}
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => setSelectedForAccess(emp)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #6253F8',
                      background: '#E6F4EF',
                      color: '#6253F8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Shield size={13} />
                    <span>Access Roles</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Add Employee Modal - Portaled to document.body to cover full screen including top bar */}
      {isAddModalOpen && isMounted && createPortal(
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.60)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '640px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '22px 28px 18px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    backgroundColor: '#EEF2FF',
                    color: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.12)',
                  }}
                >
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Add Employee
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
                    Configure staff access and login credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateEmployee} style={{ padding: '24px 28px', maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Profile Photo Upload */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 18px',
                    backgroundColor: '#F8FAFC',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '14px',
                  }}
                >
                  {/* Photo Avatar Preview */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      backgroundColor: newEmpForm.avatarUrl ? '#FFFFFF' : '#EEF2FF',
                      border: '2px solid #E0E7FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.08)',
                    }}
                  >
                    {newEmpForm.avatarUrl ? (
                      <img
                        src={newEmpForm.avatarUrl}
                        alt="Employee Avatar Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <User size={30} style={{ color: '#6366F1' }} />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                        Profile Photo
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
                        (PNG, JPG or WEBP up to 3MB)
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      Upload staff portrait for identity badge, customer test-drive assignments and directory.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Camera size={13} />
                        <span>{newEmpForm.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, 'add')}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {newEmpForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setNewEmpForm((prev) => ({ ...prev, avatarUrl: '' }))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '7px 12px',
                            borderRadius: '10px',
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 1: Full Name & Designation / Role */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Full Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User
                        size={16}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                      />
                      <input
                        type="text"
                        required
                        value={newEmpForm.fullName}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, fullName: e.target.value })}
                        placeholder="e.g. John Doe"
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 12px 0 38px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.88rem',
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Designation / Role */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Designation / Role
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase
                        size={16}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}
                      />
                      <select
                        value={newEmpForm.designation}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 32px 0 38px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.88rem',
                          color: newEmpForm.designation ? '#0F172A' : '#94A3B8',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 14px center',
                        }}
                      >
                        <option value="" disabled>Select a Role</option>
                        <option value="Sales Executive">Sales Executive</option>
                        <option value="Sales Manager">Sales Manager</option>
                        <option value="Finance Manager">Finance Manager</option>
                        <option value="Inventory Manager">Inventory Manager</option>
                        <option value="Service Advisor">Service Advisor</option>
                        <option value="Technician">Technician</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Telecaller">Telecaller</option>
                        <option value="Accountant">Accountant</option>
                        <option value="General Manager">General Manager</option>
                        <option value="custom">+ Custom Role</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* If Custom Role selected */}
                {newEmpForm.designation === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Enter Custom Designation / Job Title
                    </label>
                    <input
                      type="text"
                      value={newEmpForm.customDesignation}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, customDesignation: e.target.value })}
                      placeholder="e.g. Lead Valuator & Inspector"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #C7D2FE',
                        backgroundColor: '#F8FAFC',
                        fontSize: '0.88rem',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Row 2: Phone Number & Email Address */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* Phone Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone
                        size={16}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                      />
                      <input
                        type="tel"
                        value={newEmpForm.phone}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                        placeholder="e.g. +1 555 0199"
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 12px 0 38px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.88rem',
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={16}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                      />
                      <input
                        type="email"
                        value={newEmpForm.email}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                        placeholder="e.g. john@example.com"
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 12px 0 38px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.88rem',
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Salary & Salary Category */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* Salary */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>
                        {newEmpForm.salaryCategory === 'Annual CTC' ? 'Annual CTC (₹)' : 'Salary (₹)'}
                      </label>
                      {newEmpForm.salaryCategory === 'Annual CTC' && newEmpForm.salary && !isNaN(Number(newEmpForm.salary.replace(/[^0-9.]/g, ''))) && Number(newEmpForm.salary.replace(/[^0-9.]/g, '')) > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
                          ≈ ₹{Math.round(Number(newEmpForm.salary.replace(/[^0-9.]/g, '')) / 12).toLocaleString('en-IN')}/mo
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Banknote
                        size={16}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                      />
                      <input
                        type="text"
                        value={newEmpForm.salary}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, salary: e.target.value })}
                        placeholder={newEmpForm.salaryCategory === 'Annual CTC' ? 'e.g. 600000' : 'e.g. 50000'}
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 12px 0 38px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.88rem',
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Salary Category */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Salary Category
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar
                        size={16}
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}
                      />
                      <select
                        value={newEmpForm.salaryCategory}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, salaryCategory: e.target.value })}
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 32px 0 38px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.88rem',
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 14px center',
                        }}
                      >
                        <option value="Annual CTC">Annual CTC</option>
                        <option value="Monthly Fixed">Monthly Fixed</option>
                        <option value="Monthly + Commission">Monthly + Commission</option>
                        <option value="Bi-Weekly">Bi-Weekly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                        <option value="Contract / Retainer">Contract / Retainer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 4: Admin Privileges Banner Card */}
                <div
                  style={{
                    backgroundColor: '#FEFCE8',
                    border: '1.5px solid #FDE68A',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={24} style={{ color: '#D97706', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400E' }}>
                        Admin Privileges
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#78350F', marginTop: '2px' }}>
                        Grant full system access and allow viewing all company documents/financial data.
                      </div>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={newEmpForm.isAdmin}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setNewEmpForm({
                        ...newEmpForm,
                        isAdmin: val,
                        accessControl: val ? {
                          pipeline: true,
                          customers: true,
                          inventory: true,
                          procurement: true,
                          deals: true,
                          finance: true,
                          testDrives: true,
                          documents: true,
                          reports: true,
                          settings: true,
                        } : newEmpForm.accessControl,
                      });
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#4F46E5',
                      borderRadius: '6px',
                    }}
                  />
                </div>

                {/* Row 5: Access Roles for Employee */}
                {!newEmpForm.isAdmin && (
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Module Access Roles
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleRolePreset('all')}
                          style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRolePreset('sales')}
                          style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Sales
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRolePreset('finance')}
                          style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Finance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRolePreset('service')}
                          style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}
                        >
                          Service
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      {[
                        { key: 'pipeline', label: 'Pipeline & Leads' },
                        { key: 'customers', label: 'Customers' },
                        { key: 'inventory', label: 'Inventory' },
                        { key: 'deals', label: 'Deals & Quotes' },
                        { key: 'testDrives', label: 'Test Drives' },
                        { key: 'procurement', label: 'Procurement' },
                        { key: 'finance', label: 'Finance & Accounts' },
                        { key: 'documents', label: 'Invoices & Docs' },
                        { key: 'reports', label: 'Reports / BI' },
                        { key: 'settings', label: 'Settings' },
                      ].map((item) => {
                        const isChecked = !!(newEmpForm.accessControl as any)[item.key];
                        return (
                          <label
                            key={item.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: isChecked ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                              backgroundColor: isChecked ? '#EEF2FF' : '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              color: isChecked ? '#4338CA' : '#475569',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setNewEmpForm({
                                  ...newEmpForm,
                                  accessControl: {
                                    ...newEmpForm.accessControl,
                                    [item.key]: e.target.checked,
                                  },
                                });
                              }}
                              style={{ width: '14px', height: '14px', accentColor: '#4F46E5', cursor: 'pointer' }}
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section: LOGIN CREDENTIALS */}
                <div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: '#64748B',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                    }}
                  >
                    LOGIN CREDENTIALS
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {/* Employee ID */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={newEmpForm.employeeCode}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, employeeCode: e.target.value })}
                        placeholder="e.g. EMP-001"
                        style={{
                          width: '100%',
                          height: '44px',
                          padding: '0 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#2563EB',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Temporary Password */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>
                          Temporary Password
                        </label>
                        <button
                          type="button"
                          onClick={handleRegeneratePassword}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4F46E5',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <RefreshCw size={11} /> Regenerate
                        </button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <Lock
                          size={16}
                          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                        />
                        <input
                          type={showTempPassInModal ? 'text' : 'password'}
                          value={newEmpForm.password}
                          onChange={(e) => setNewEmpForm({ ...newEmpForm, password: e.target.value })}
                          placeholder="Temporary password"
                          style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 40px 0 38px',
                            borderRadius: '12px',
                            border: '1.5px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            fontFamily: 'monospace',
                            fontSize: '0.88rem',
                            color: '#0F172A',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowTempPassInModal(!showTempPassInModal)}
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
                          {showTempPassInModal ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      marginTop: '12px',
                      fontSize: '0.76rem',
                      color: '#475569',
                      lineHeight: '1.4',
                    }}
                  >
                    <KeyRound size={15} style={{ color: '#4F46E5', flexShrink: 0 }} />
                    <span>
                      <strong>First-Time Login Workflow:</strong> Give this temporary password to the employee. When they log in at <code>/emplogin</code>, they will be required to create their own personal password before accessing the system.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '11px 26px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '11px 32px',
                    borderRadius: '12px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Create Login</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Pop-up Credentials Modal when employee is created */}
      {createdCredentialsModal.isOpen && createdCredentialsModal.employee && (
        <Modal
          isOpen={createdCredentialsModal.isOpen}
          onClose={() => setCreatedCredentialsModal({ isOpen: false, employee: null })}
          title="Employee Login Created Successfully!"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '4px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                backgroundColor: '#DCFCE7',
                borderRadius: '14px',
                border: '1px solid #86EFAC',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532D' }}>
                  {createdCredentialsModal.employee.fullName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                  {createdCredentialsModal.employee.designation} • Temporary credentials generated
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: '1.45' }}>
              Share these temporary login details with the staff member. They will be prompted to create their own permanent password upon signing in.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Employee ID */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Employee ID
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', fontFamily: 'monospace' }}>
                    {createdCredentialsModal.employee.employeeCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(createdCredentialsModal.employee!.employeeCode, 'cred-id')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === 'cred-id' ? <Check size={14} style={{ color: '#16A34A' }} /> : <Copy size={14} />}
                  <span>{copiedId === 'cred-id' ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              {/* Temporary Password */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Temporary Password
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4F46E5', fontFamily: 'monospace' }}>
                    {createdCredentialsModal.employee.password}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(createdCredentialsModal.employee!.password, 'cred-pass')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === 'cred-pass' ? <Check size={14} style={{ color: '#16A34A' }} /> : <Copy size={14} />}
                  <span>{copiedId === 'cred-pass' ? 'Copied' : 'Copy Password'}</span>
                </button>
              </div>

              {/* Portal URL */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FF',
                  border: '1.5px solid #C7D2FE',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#4338CA', fontWeight: 700, textTransform: 'uppercase' }}>
                    Staff Login URL
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#312E81' }}>
                    /emplogin
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`${window.location.origin}/emplogin`, 'cred-url')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #C7D2FE',
                    background: '#FFFFFF',
                    color: '#4F46E5',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === 'cred-url' ? <Check size={14} style={{ color: '#16A34A' }} /> : <Copy size={14} />}
                  <span>{copiedId === 'cred-url' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setCreatedCredentialsModal({ isOpen: false, employee: null })}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
              <Link
                href={`/emplogin?emp=${createdCredentialsModal.employee.employeeCode}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                }}
              >
                <span>Open Employee Login (/emplogin)</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Leave Balance & Approval Modal */}
      {selectedForLeave && (
        <Modal
          isOpen={!!selectedForLeave}
          onClose={() => setSelectedForLeave(null)}
          title={`Leave Balance & Requests — ${selectedForLeave.fullName}`}
          maxWidth="820px"
        >
          {(() => {
            const casualTotal = selectedForLeave.leaveBalance?.casual.total || 12;
            const casualUsed = selectedForLeave.leaveBalance?.casual.used || 0;
            const casualRem = Math.max(0, casualTotal - casualUsed);

            const sickTotal = selectedForLeave.leaveBalance?.sick.total || 7;
            const sickUsed = selectedForLeave.leaveBalance?.sick.used || 0;
            const sickRem = Math.max(0, sickTotal - sickUsed);

            const paidTotal = selectedForLeave.leaveBalance?.paid.total || 18;
            const paidUsed = selectedForLeave.leaveBalance?.paid.used || 0;
            const paidRem = Math.max(0, paidTotal - paidUsed);

            const totalRem = casualRem + sickRem + paidRem;
            const pendingRequests = (selectedForLeave.leaveHistory || []).filter((lh) => lh.status === 'pending');

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Leave Balance Overview Cards */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>
                        Staff Leave Balance
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        Annual allocated time-off balance for {selectedForLeave.fullName}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        border: '1px solid #C7D2FE',
                      }}
                    >
                      Total Balance: {totalRem} Days Remaining
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {/* Casual */}
                    <div
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        backgroundColor: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        Casual Leave
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                        {casualRem}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>
                          / {casualTotal} days
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                        Used: {casualUsed} days
                      </div>
                    </div>

                    {/* Sick */}
                    <div
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        backgroundColor: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        Sick Leave
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                        {sickRem}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>
                          / {sickTotal} days
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                        Used: {sickUsed} days
                      </div>
                    </div>

                    {/* Paid */}
                    <div
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        backgroundColor: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        Paid Annual Leave
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                        {paidRem}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>
                          / {paidTotal} days
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '3px' }}>
                        Used: {paidUsed} days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave Requests & Approval Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                        Employee Leave Requests
                      </span>
                      {pendingRequests.length > 0 && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#FEF3C7',
                            color: '#D97706',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            border: '1px solid #FDE68A',
                          }}
                        >
                          {pendingRequests.length} Pending Approval
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      {selectedForLeave.leaveHistory.length} Total Submissions
                    </span>
                  </div>

                  {(!selectedForLeave.leaveHistory || selectedForLeave.leaveHistory.length === 0) ? (
                    <div
                      style={{
                        padding: '32px 20px',
                        borderRadius: '12px',
                        border: '1.5px dashed #CBD5E1',
                        textAlign: 'center',
                        color: '#64748B',
                        fontSize: '0.84rem',
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      No leave requests submitted by {selectedForLeave.fullName} yet. When this employee requests time off from their Employee Portal, it will appear here with an approval option.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Type</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Dates & Duration</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Reason</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>Approval Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedForLeave.leaveHistory.map((lh) => {
                            const isPending = lh.status === 'pending';
                            const isApproved = lh.status === 'approved';
                            const isRejected = lh.status === 'rejected';

                            return (
                              <tr
                                key={lh.id}
                                style={{
                                  borderBottom: '1px solid #F1F5F9',
                                  backgroundColor: isPending ? 'rgba(245, 158, 11, 0.04)' : undefined,
                                }}
                              >
                                <td style={{ padding: '12px 14px' }}>
                                  <span
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: '#EEF2FF',
                                      color: '#4F46E5',
                                      fontWeight: 800,
                                      fontSize: '0.74rem',
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    {lh.leaveType}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: 700, color: '#0F172A' }}>
                                    {lh.startDate} to {lh.endDate}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                    {lh.days} {lh.days === 1 ? 'day' : 'days'}
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px', color: '#334155' }}>
                                  {lh.reason || 'Personal leave'}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  {isPending && (
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        padding: '3px 9px',
                                        borderRadius: '999px',
                                        background: '#FEF3C7',
                                        color: '#D97706',
                                        border: '1px solid #FDE68A',
                                      }}
                                    >
                                      PENDING
                                    </span>
                                  )}
                                  {isApproved && (
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        padding: '3px 9px',
                                        borderRadius: '999px',
                                        background: '#ECFDF5',
                                        color: '#059669',
                                        border: '1px solid #A7F3D0',
                                      }}
                                    >
                                      APPROVED
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        padding: '3px 9px',
                                        borderRadius: '999px',
                                        background: '#FEF2F2',
                                        color: '#DC2626',
                                        border: '1px solid #FECACA',
                                      }}
                                    >
                                      REJECTED
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  {isPending ? (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveLeave(lh.id, true)}
                                        style={{
                                          padding: '6px 12px',
                                          borderRadius: '8px',
                                          backgroundColor: '#10B981',
                                          color: '#FFFFFF',
                                          fontSize: '0.76rem',
                                          fontWeight: 800,
                                          border: 'none',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)',
                                        }}
                                      >
                                        <CheckCircle2 size={13} />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveLeave(lh.id, false)}
                                        style={{
                                          padding: '6px 12px',
                                          borderRadius: '8px',
                                          backgroundColor: '#FFFFFF',
                                          color: '#DC2626',
                                          border: '1px solid #FECACA',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        <XCircle size={13} />
                                        <span>Reject</span>
                                      </button>
                                    </div>
                                  ) : isApproved ? (
                                    <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>
                                      ✓ Approved by {lh.approvedBy || 'Admin'}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                                      ✕ Declined
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Access Control Modal */}
      {selectedForAccess && (
        <Modal
          isOpen={!!selectedForAccess}
          onClose={() => setSelectedForAccess(null)}
          title={`Section Access Control — ${selectedForAccess.fullName}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { key: 'pipeline' as const, label: 'Pipeline & Leads' },
                { key: 'customers' as const, label: 'Customers' },
                { key: 'inventory' as const, label: 'Inventory Stock' },
                { key: 'procurement' as const, label: 'Procurement' },
                { key: 'deals' as const, label: 'Deals & Closing' },
                { key: 'finance' as const, label: 'Finance & Invoices' },
                { key: 'testDrives' as const, label: 'Test Drives' },
                { key: 'documents' as const, label: 'Documents & RTO' },
                { key: 'reports' as const, label: 'Reports' },
                { key: 'settings' as const, label: 'Settings & Administration' },
              ].map((s) => {
                const checked = selectedForAccess.accessControl[s.key];
                return (
                  <div
                    key={s.key}
                    onClick={() => handleToggleAccess(s.key)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: checked ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                      backgroundColor: checked ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: checked ? '#166534' : '#0F172A',
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => {}} style={{ accentColor: '#10B981' }} />
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          CENTERED EMPLOYEE PROFILE CARD DOSSIER MODAL
          (Styled identically to Image 2 Customer Lead Dossier, supports edit mode)
          ======================================================== */}
      {selectedProfileCardEmp && (
        <Modal
          isOpen={!!selectedProfileCardEmp}
          onClose={() => {
            setSelectedProfileCardEmp(null);
            setIsEditingDossier(false);
          }}
          maxWidth="680px"
          headerContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text, #0F172A)' }}>
                Staff &amp; Employee Dossier
              </div>
              <span
                className="badge"
                style={{
                  background: '#EEF2FF',
                  color: '#4338CA',
                  border: '1px solid rgba(79, 70, 229, 0.25)',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Dept: {selectedProfileCardEmp.department}
              </span>
            </div>
          }
          headerActions={
            <div className="modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsEditingDossier((prev) => !prev)}
                className="modal-header-edit-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: '1px solid #E2E8F0',
                  background: isEditingDossier ? '#0284C7' : '#FFFFFF',
                  color: isEditingDossier ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {isEditingDossier ? (
                  <>
                    <Check size={13} /> View Mode
                  </>
                ) : (
                  <>
                    <Pencil size={13} /> Edit Details
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProfileCardEmp(null);
                  setIsEditingDossier(false);
                }}
                className="modal-header-close-btn"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          }
          footer={
            <div className="unique-modal-footer-bar" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedProfileCardEmp(null);
                  setIsEditingDossier(false);
                }}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '999px', padding: '0.45rem 1.25rem' }}
              >
                &lt; Cancel
              </button>
              {isEditingDossier ? (
                <button
                  type="button"
                  onClick={handleSaveDossierChanges}
                  className="unique-lead-submit-btn"
                  style={{
                    borderRadius: '999px',
                    padding: '0.5rem 1.4rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                  }}
                >
                  <span>Save Changes</span>
                  <Check size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingDossier(true)}
                  className="unique-lead-submit-btn"
                  style={{
                    borderRadius: '999px',
                    padding: '0.5rem 1.4rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                  }}
                >
                  <span>Edit Details</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Identity & Profile Banner (Styled identically to Image 2) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #F0F9FF 0%, #EEF2FF 100%)',
                border: '1px solid rgba(2, 132, 199, 0.22)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {(isEditingDossier ? editDossierForm.avatarUrl : selectedProfileCardEmp.avatarUrl) ? (
                  <img
                    src={(isEditingDossier ? editDossierForm.avatarUrl : selectedProfileCardEmp.avatarUrl)}
                    alt={selectedProfileCardEmp.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  selectedProfileCardEmp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditingDossier ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: '32px', fontSize: '0.82rem' }}
                          value={editDossierForm.fullName || ''}
                          onChange={(e) => setEditDossierForm({ ...editDossierForm, fullName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Department</label>
                        <select
                          className="form-select"
                          style={{ height: '32px', fontSize: '0.82rem' }}
                          value={editDossierForm.department || 'Sales'}
                          onChange={(e) => setEditDossierForm({ ...editDossierForm, department: e.target.value as any })}
                        >
                          <option value="Sales">Sales</option>
                          <option value="Finance">Finance</option>
                          <option value="Operations">Operations</option>
                          <option value="Service">Service</option>
                          <option value="Management">Management</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          cursor: 'pointer',
                        }}
                      >
                        <Camera size={12} style={{ color: '#0284C7' }} />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, 'edit')}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {editDossierForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditDossierForm({ ...editDossierForm, avatarUrl: '' })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #FCA5A5',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={11} /> Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0F172A' }}>
                        {selectedProfileCardEmp.fullName}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: '#E0F2FE',
                          color: '#0369A1',
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {selectedProfileCardEmp.employeeCode}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: '#EEF2FF',
                          color: '#4338CA',
                          border: '1px solid rgba(79, 70, 229, 0.25)',
                        }}
                      >
                        {selectedProfileCardEmp.department}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: '#DCFCE7',
                          color: '#15803D',
                          border: '1px solid rgba(22, 163, 74, 0.25)',
                        }}
                      >
                        Active Staff ✓
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#64748B',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} style={{ color: '#0284C7' }} />
                        <a href={`tel:${selectedProfileCardEmp.phone}`} style={{ color: '#0F172A', fontWeight: 700, textDecoration: 'none' }}>
                          {selectedProfileCardEmp.phone}
                        </a>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={13} style={{ color: '#0284C7' }} />
                        <a href={`mailto:${selectedProfileCardEmp.email}`} style={{ color: '#0F172A', fontWeight: 700, textDecoration: 'none' }}>
                          {selectedProfileCardEmp.email}
                        </a>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: '#0284C7' }} />
                        {selectedProfileCardEmp.branch}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Grid of Information Cards (Styled identically to Image 2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Card 1: CRM Login Credentials */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                    CRM Login Credentials
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '2px 6px', borderRadius: '4px' }}>
                    Active
                  </span>
                </div>

                {isEditingDossier ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.72rem', color: '#64748B' }}>Password</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: '32px', fontSize: '0.82rem' }}
                      value={editDossierForm.password || ''}
                      onChange={(e) => setEditDossierForm({ ...editDossierForm, password: e.target.value })}
                      placeholder="Enter new CRM password"
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748B' }}>ID:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0284C7' }}>{selectedProfileCardEmp.employeeCode}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748B' }}>Pass:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', letterSpacing: revealedPasswords[selectedProfileCardEmp.id] ? '0' : '0.12em' }}>
                          {revealedPasswords[selectedProfileCardEmp.id] ? selectedProfileCardEmp.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRevealedPasswords((prev) => ({ ...prev, [selectedProfileCardEmp.id]: !prev[selectedProfileCardEmp.id] }))}
                          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                          title={revealedPasswords[selectedProfileCardEmp.id] ? 'Hide' : 'Show'}
                        >
                          {revealedPasswords[selectedProfileCardEmp.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedProfileCardEmp.password, `pass-${selectedProfileCardEmp.id}`)}
                          style={{ background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer', padding: '2px' }}
                          title="Copy Password"
                        >
                          {copiedId === `pass-${selectedProfileCardEmp.id}` ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Designation & Compensation */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                  Designation &amp; Compensation
                </span>

                {isEditingDossier ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#64748B' }}>Designation</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: '30px', fontSize: '0.8rem' }}
                        value={editDossierForm.designation || ''}
                        onChange={(e) => setEditDossierForm({ ...editDossierForm, designation: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#64748B' }}>Monthly Salary</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: '30px', fontSize: '0.8rem' }}
                        value={editDossierForm.salary || ''}
                        onChange={(e) => setEditDossierForm({ ...editDossierForm, salary: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', marginTop: '4px' }}>
                      {selectedProfileCardEmp.designation}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 800, marginTop: '3px' }}>
                      {selectedProfileCardEmp.salary} <span style={{ color: '#64748B', fontWeight: 500 }}>({selectedProfileCardEmp.salaryCategory || 'Annual CTC'})</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                      Joined: {selectedProfileCardEmp.joiningDate}
                    </div>
                  </>
                )}
              </div>

              {/* Card 3: Leave Record Balances */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                    Leave Record Balances
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedForLeave(selectedProfileCardEmp)}
                    style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Leave Logs ({selectedProfileCardEmp.leaveHistory.length}) &rarr;
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', marginTop: '4px' }}>
                  <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>CASUAL</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                      {selectedProfileCardEmp.leaveBalance.casual.total - selectedProfileCardEmp.leaveBalance.casual.used}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>of {selectedProfileCardEmp.leaveBalance.casual.total} left</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>SICK</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                      {selectedProfileCardEmp.leaveBalance.sick.total - selectedProfileCardEmp.leaveBalance.sick.used}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>of {selectedProfileCardEmp.leaveBalance.sick.total} left</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '6px 4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>PAID</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                      {selectedProfileCardEmp.leaveBalance.paid.total - selectedProfileCardEmp.leaveBalance.paid.used}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>of {selectedProfileCardEmp.leaveBalance.paid.total} left</div>
                  </div>
                </div>
              </div>

              {/* Card 4: Authorized CRM Sections */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                    Authorized CRM Sections
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Click to toggle</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                  {[
                    { key: 'pipeline' as const, label: 'Pipeline' },
                    { key: 'customers' as const, label: 'Customers' },
                    { key: 'inventory' as const, label: 'Inventory' },
                    { key: 'procurement' as const, label: 'Procurement' },
                    { key: 'deals' as const, label: 'Deals' },
                    { key: 'finance' as const, label: 'Finance' },
                    { key: 'testDrives' as const, label: 'Test Drives' },
                    { key: 'documents' as const, label: 'Documents' },
                    { key: 'reports' as const, label: 'Reports' },
                    { key: 'settings' as const, label: 'Settings' },
                  ].map((s) => {
                    const currentAccess = isEditingDossier && editDossierForm.accessControl
                      ? editDossierForm.accessControl[s.key]
                      : selectedProfileCardEmp.accessControl[s.key];

                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          if (isEditingDossier) {
                            const updatedAccess = {
                              ...(editDossierForm.accessControl || selectedProfileCardEmp.accessControl),
                              [s.key]: !currentAccess,
                            };
                            setEditDossierForm({ ...editDossierForm, accessControl: updatedAccess });
                          } else {
                            handleToggleCardAccess(s.key);
                          }
                        }}
                        title={`Click to ${currentAccess ? 'revoke' : 'grant'} ${s.label}`}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: currentAccess ? '#ECFDF5' : '#F8FAFC',
                          color: currentAccess ? '#065F46' : '#94A3B8',
                          border: currentAccess ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '0.76rem' }}>{currentAccess ? '✓' : '✕'}</span>
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
