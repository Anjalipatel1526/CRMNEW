'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import {
  getModules,
  toggleModulePlugin,
  addCustomModule,
  deleteCustomModule,
  resetModulesToDefault,
  DealershipModule,
} from '@/lib/modules-registry';
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  updateEmployeePassword,
  updateEmployeeAccessControl,
  addLeaveRecord,
  deleteEmployee,
  Employee,
  EmployeeAccessControl,
} from '@/lib/employee-store';
import {
  getTestDrives,
  addTestDrive,
  updateTestDrive,
  deleteTestDrive,
  TestDrive,
} from '@/lib/test-drive-store';
import {
  Settings,
  Layers,
  Users,
  Building2,
  Shield,
  CreditCard,
  Plus,
  CheckCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
  UserCheck,
  Gauge,
  Car,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Lock,
  Unlock,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  BadgePercent,
  SlidersHorizontal,
  Edit3,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    'plugins' | 'employees' | 'testdrives' | 'branches' | 'roles' | 'subscription'
  >('plugins');

  // Live Module Plugins State
  const [modules, setModules] = useState<DealershipModule[]>([]);
  const [pluginCategoryFilter, setPluginCategoryFilter] = useState<string>('All');
  const [pluginSearch, setPluginSearch] = useState<string>('');

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState<string>('All');
  const [selectedEmployeeForLeave, setSelectedEmployeeForLeave] = useState<Employee | null>(null);
  const [selectedEmployeeForAccess, setSelectedEmployeeForAccess] = useState<Employee | null>(null);
  const [selectedEmployeeForCreds, setSelectedEmployeeForCreds] = useState<Employee | null>(null);
  const [selectedProfileCardEmp, setSelectedProfileCardEmp] = useState<Employee | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  const toggleEmployeeCard = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Test Drives State
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [testDriveSearch, setTestDriveSearch] = useState<string>('');
  const [testDriveStatusFilter, setTestDriveStatusFilter] = useState<string>('All');
  const [selectedDriveForComplete, setSelectedDriveForComplete] = useState<TestDrive | null>(null);

  // Branches & Modals
  const [branches, setBranches] = useState(api.getBranches());
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCustomModuleModalOpen, setIsCustomModuleModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [isNewTestDriveModalOpen, setIsNewTestDriveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for new custom section
  const [newSectionForm, setNewSectionForm] = useState({
    label: '',
    href: '',
    category: 'Custom' as any,
    icon: 'Layers',
    description: '',
  });

  // Form states for new employee
  const [newEmpForm, setNewEmpForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: 'Sales Executive',
    department: 'Sales' as any,
    branch: 'Apex Downtown Flagship',
    salary: '₹75,000 / mo',
    password: '',
    avatar: '',
  });

  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editEmpForm, setEditEmpForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    department: 'Sales' as any,
    branch: 'Apex Downtown Flagship',
    salary: '',
    password: '',
    avatar: '',
  });

  // Form states for new leave
  const [newLeaveForm, setNewLeaveForm] = useState({
    leaveType: 'casual' as any,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    days: 2,
    reason: '',
  });

  // Form states for new test drive
  const [newDriveForm, setNewDriveForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleName: 'Mahindra XUV700 AX7L AWD (Midnight Black)',
    vehicleReg: 'MH-02-EZ-4120',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '04:00 PM - 04:45 PM',
    durationMinutes: 45,
    assignedStaff: 'John Fernandes',
    dlNumber: '',
    kycVerified: true,
    startOdo: 5000,
    route: 'Western Express Highway Sprint (15 km)',
  });

  // End drive form
  const [endDriveOdo, setEndDriveOdo] = useState<string>('');
  const [endDriveFeedback, setEndDriveFeedback] = useState<string>('');
  const [endDriveRating, setEndDriveRating] = useState<number>(5);

  // Initial load
  useEffect(() => {
    setModules(getModules());
    setEmployees(getEmployees());
    setTestDrives(getTestDrives());

    const handleModulesChanged = () => setModules(getModules());
    const handleEmployeesChanged = () => setEmployees(getEmployees());
    const handleTestDrivesChanged = () => setTestDrives(getTestDrives());

    window.addEventListener('crm-modules-changed', handleModulesChanged);
    window.addEventListener('crm-employees-changed', handleEmployeesChanged);
    window.addEventListener('crm-testdrives-changed', handleTestDrivesChanged);

    return () => {
      window.removeEventListener('crm-modules-changed', handleModulesChanged);
      window.removeEventListener('crm-employees-changed', handleEmployeesChanged);
      window.removeEventListener('crm-testdrives-changed', handleTestDrivesChanged);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Toggle Module Plugin (Plugin In / Plugin Out)
  const handleTogglePlugin = (mod: DealershipModule) => {
    const nextState = !mod.isPluggedIn;
    toggleModulePlugin(mod.id, nextState);
    showToast(
      nextState
        ? `"${mod.label}" is now PLUGGED IN to CRM navigation!`
        : `"${mod.label}" has been PLUGGED OUT (Deactivated).`
    );
  };

  // Create Custom Module
  const handleCreateCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionForm.label.trim()) return;

    addCustomModule({
      label: newSectionForm.label.trim(),
      href: newSectionForm.href.trim() || `/${newSectionForm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      category: newSectionForm.category,
      icon: newSectionForm.icon || 'Sparkles',
      description: newSectionForm.description || 'Custom dealership operations module.',
      isCore: false,
      isPluggedIn: true,
    });

    setIsCustomModuleModalOpen(false);
    setNewSectionForm({ label: '', href: '', category: 'Custom', icon: 'Layers', description: '' });
    showToast(`New custom section "${newSectionForm.label}" created and plugged in!`);
  };

  // Delete Custom Module
  const handleDeleteCustomSection = (id: string, label: string) => {
    if (confirm(`Are you sure you want to delete custom section "${label}"?`)) {
      deleteCustomModule(id);
      showToast(`Custom section "${label}" removed.`);
    }
  };

  // Image Upload Handler
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size should be less than 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = (emp: Employee) => {
    setEditEmpForm({
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      designation: emp.designation,
      department: emp.department,
      branch: emp.branch,
      salary: emp.salary,
      password: emp.password,
      avatar: emp.avatar || '',
    });
    setIsEditingCard(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileCardEmp) return;
    const updated = updateEmployee(selectedProfileCardEmp.id, {
      fullName: editEmpForm.fullName.trim(),
      email: editEmpForm.email.trim(),
      phone: editEmpForm.phone.trim(),
      designation: editEmpForm.designation.trim(),
      department: editEmpForm.department,
      branch: editEmpForm.branch.trim(),
      salary: editEmpForm.salary.trim(),
      password: editEmpForm.password.trim(),
      avatar: editEmpForm.avatar,
    });
    if (updated) {
      setSelectedProfileCardEmp(updated);
      setIsEditingCard(false);
      showToast(`Employee profile for ${updated.fullName} updated successfully!`);
    }
  };

  // Create Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.fullName.trim()) return;

    const created = addEmployee({
      fullName: newEmpForm.fullName.trim(),
      email: newEmpForm.email.trim(),
      phone: newEmpForm.phone.trim(),
      designation: newEmpForm.designation,
      department: newEmpForm.department,
      branch: newEmpForm.branch,
      salary: newEmpForm.salary,
      password: newEmpForm.password.trim() || `Apex@${Math.floor(1000 + Math.random() * 9000)}!Pass`,
      avatar: newEmpForm.avatar,
    });

    setIsNewEmployeeModalOpen(false);
    setNewEmpForm({
      fullName: '',
      email: '',
      phone: '',
      designation: 'Sales Executive',
      department: 'Sales',
      branch: 'Apex Downtown Flagship',
      salary: '₹75,000 / mo',
      password: '',
      avatar: '',
    });
    showToast(`Employee ${created.fullName} (${created.employeeCode}) onboarded successfully!`);
  };

  // Submit Leave
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForLeave) return;

    addLeaveRecord(selectedEmployeeForLeave.id, {
      leaveType: newLeaveForm.leaveType,
      startDate: newLeaveForm.startDate,
      endDate: newLeaveForm.endDate,
      days: Number(newLeaveForm.days) || 1,
      reason: newLeaveForm.reason || 'Personal / Medical leave request',
      status: 'approved',
      approvedBy: 'Tenant Admin',
    });

    // Refresh selected employee
    const updated = getEmployees().find((e) => e.id === selectedEmployeeForLeave.id);
    setSelectedEmployeeForLeave(updated || null);
    showToast(`Leave recorded for ${selectedEmployeeForLeave.fullName}!`);
  };

  // Toggle Access Control section
  const handleToggleAccessSection = (sectionKey: keyof EmployeeAccessControl) => {
    if (!selectedEmployeeForAccess) return;
    const currentAccess = { ...selectedEmployeeForAccess.accessControl };
    currentAccess[sectionKey] = !currentAccess[sectionKey];

    updateEmployeeAccessControl(selectedEmployeeForAccess.id, currentAccess);
    const updated = getEmployees().find((e) => e.id === selectedEmployeeForAccess.id);
    setSelectedEmployeeForAccess(updated || null);
    showToast(`Access permissions updated for ${selectedEmployeeForAccess.fullName}.`);
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

  // Preset Access Control roles
  const handleApplyAccessPreset = (preset: 'admin' | 'sales' | 'finance' | 'service') => {
    if (!selectedEmployeeForAccess) return;
    let access: EmployeeAccessControl;

    if (preset === 'admin') {
      access = {
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
      };
    } else if (preset === 'sales') {
      access = {
        pipeline: true,
        customers: true,
        inventory: true,
        procurement: false,
        deals: true,
        finance: false,
        testDrives: true,
        documents: true,
        reports: false,
        settings: false,
      };
    } else if (preset === 'finance') {
      access = {
        pipeline: false,
        customers: true,
        inventory: false,
        procurement: false,
        deals: true,
        finance: true,
        testDrives: false,
        documents: true,
        reports: true,
        settings: false,
      };
    } else {
      access = {
        pipeline: false,
        customers: false,
        inventory: true,
        procurement: true,
        deals: false,
        finance: false,
        testDrives: true,
        documents: true,
        reports: false,
        settings: false,
      };
    }

    updateEmployeeAccessControl(selectedEmployeeForAccess.id, access);
    const updated = getEmployees().find((e) => e.id === selectedEmployeeForAccess.id);
    setSelectedEmployeeForAccess(updated || null);
    showToast(`Applied "${preset.toUpperCase()}" access preset.`);
  };

  // Schedule Test Drive
  const handleScheduleTestDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveForm.customerName.trim()) return;

    const created = addTestDrive(newDriveForm);
    setIsNewTestDriveModalOpen(false);
    showToast(`Test Drive ${created.driveCode} scheduled for ${created.customerName}!`);
  };

  // Complete Drive
  const handleCompleteDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriveForComplete) return;

    updateTestDrive(selectedDriveForComplete.id, {
      status: 'completed',
      endOdo: Number(endDriveOdo) || selectedDriveForComplete.startOdo + 15,
      feedback: endDriveFeedback || 'Test drive completed with full customer satisfaction.',
      rating: endDriveRating,
    });

    setSelectedDriveForComplete(null);
    setEndDriveOdo('');
    setEndDriveFeedback('');
    showToast(`Test drive ${selectedDriveForComplete.driveCode} marked as COMPLETED.`);
  };

  // Copy to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Plugins
  const filteredModules = useMemo(() => {
    const q = pluginSearch.toLowerCase().trim();
    return modules.filter((m) => {
      const matchCat = pluginCategoryFilter === 'All' || m.category === pluginCategoryFilter;
      const matchQuery =
        !q ||
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.href.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [modules, pluginCategoryFilter, pluginSearch]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.toLowerCase().trim();
    return employees.filter((e) => {
      const matchDept = employeeDeptFilter === 'All' || e.department === employeeDeptFilter;
      const matchQuery =
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q);
      return matchDept && matchQuery;
    });
  }, [employees, employeeDeptFilter, employeeSearch]);

  // Filtered Test Drives
  const filteredTestDrives = useMemo(() => {
    const q = testDriveSearch.toLowerCase().trim();
    return testDrives.filter((td) => {
      const matchStatus = testDriveStatusFilter === 'All' || td.status === testDriveStatusFilter;
      const matchQuery =
        !q ||
        td.customerName.toLowerCase().includes(q) ||
        td.vehicleName.toLowerCase().includes(q) ||
        td.driveCode.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [testDrives, testDriveStatusFilter, testDriveSearch]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Toast Notification */}
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
            <WordFadeIn text="Dealership Administration & Settings" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Modular dealership configuration, plugin in/out section switches, employee credentials, leave management, and test drive operations."
              baseDelay={0.18}
              staggerDelay={0.025}
            />
          </p>
        </div>

        {/* System Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: '#E6F4EF',
              color: '#1E443B',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
          >
            <ShieldCheck size={14} /> Multi-Tenant Apex Group
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: '#EFF6FF',
              color: '#1E40AF',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
          >
            <Sparkles size={14} /> {modules.filter((m) => m.isPluggedIn).length} Modules Plugged In
          </span>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            Plugged-in Modules
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16A34A', marginTop: '4px' }}>
            {modules.filter((m) => m.isPluggedIn).length}
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}> / {modules.length}</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>
            Active across top navigation
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            Employees & Staff
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563EB', marginTop: '4px' }}>
            {employees.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
            {employees.filter((e) => e.status === 'active').length} Active • With CRM Passwords
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            Test Drives Logged
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
            {testDrives.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
            {testDrives.filter((td) => td.status === 'in_progress').length} In-Progress • {testDrives.filter((td) => td.status === 'scheduled').length} Scheduled
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            Dealership Showrooms
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
            {branches.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 600, marginTop: '2px' }}>
            100% Operational & Synced
          </div>
        </div>
      </div>

      {/* Unique Capsule Tabs Bar */}
      <div className="settings-tabs-wrap">
        <button
          className={`settings-tab-btn ${activeTab === 'plugins' ? 'active' : ''}`}
          onClick={() => setActiveTab('plugins')}
        >
          <Layers size={16} />
          <span>Modules & Plugins</span>
          <span className="tab-counter-badge">{modules.filter((m) => m.isPluggedIn).length} Active</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <UserCheck size={16} />
          <span>Staff & Employees</span>
          <span className="tab-counter-badge">{employees.length}</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'testdrives' ? 'active' : ''}`}
          onClick={() => setActiveTab('testdrives')}
        >
          <Gauge size={16} />
          <span>Test Drives</span>
          <span className="tab-counter-badge">{testDrives.length}</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          <Building2 size={16} />
          <span>Branches & Showrooms</span>
          <span className="tab-counter-badge">{branches.length}</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={16} />
          <span>RBAC Matrix</span>
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <CreditCard size={16} />
          <span>SaaS Plan & Security</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: PLUGINS & SECTION MANAGER (Plugin In / Plugin Out)
          ======================================================== */}
      {activeTab === 'plugins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            }}
          >
            {/* Search & Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  value={pluginSearch}
                  onChange={(e) => setPluginSearch(e.target.value)}
                  placeholder="Search modules or routes..."
                  style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['All', 'Core CRM', 'Sales', 'Operations', 'Workforce', 'Customer Experience', 'Custom'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPluginCategoryFilter(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: pluginCategoryFilter === cat ? '#1E443B' : '#E2E8F0',
                      backgroundColor: pluginCategoryFilter === cat ? '#1E443B' : '#FFFFFF',
                      color: pluginCategoryFilter === cat ? '#FFFFFF' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: + Create New Section / Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => resetModulesToDefault()}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Defaults
              </button>
              <button
                type="button"
                className="unique-lead-submit-btn"
                onClick={() => setIsCustomModuleModalOpen(true)}
              >
                <Plus size={15} />
                <span className="btn-text">Create New Section / Plugin</span>
              </button>
            </div>
          </div>

          {/* Plugin Cards Grid */}
          <div className="plugin-grid">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className={`plugin-card ${mod.isPluggedIn ? 'active-plugin' : 'deactivated-plugin'}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: mod.isPluggedIn ? '#E6F4EF' : '#F1F5F9',
                          color: mod.isPluggedIn ? '#1E443B' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Layers size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                            {mod.label}
                          </span>
                          {!mod.isCore && (
                            <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#64748B' }}>
                          {mod.href}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Switch */}
                    <label className="plugin-switch" title={`Click to ${mod.isPluggedIn ? 'Plugin Out (Deactivate)' : 'Plugin In (Activate)'}`}>
                      <input
                        type="checkbox"
                        checked={mod.isPluggedIn}
                        onChange={() => handleTogglePlugin(mod)}
                      />
                      <span className="plugin-slider" />
                    </label>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.45, marginBottom: '14px', minHeight: '38px' }}>
                    {mod.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '12px',
                    marginTop: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: mod.isPluggedIn ? '#F0FDF4' : '#F8FAFC',
                        color: mod.isPluggedIn ? '#16A34A' : '#94A3B8',
                        border: mod.isPluggedIn ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      }}
                    >
                      {mod.isPluggedIn ? '● Plugged In' : '○ Plugged Out'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
                      {mod.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!mod.isCore && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSection(mod.id, mod.label)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Delete custom module"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {mod.isPluggedIn && (
                      <a
                        href={mod.href}
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#2563EB',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <span>Open</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: STAFF & EMPLOYEES (Details, ID/Password, Leave, Access Control)
          ======================================================== */}
      {activeTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search staff by name, ID, or email..."
                  style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['All', 'Sales', 'Finance', 'Operations', 'Service', 'Management'].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setEmployeeDeptFilter(dept)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: employeeDeptFilter === dept ? '#1E443B' : '#E2E8F0',
                      backgroundColor: employeeDeptFilter === dept ? '#1E443B' : '#FFFFFF',
                      color: employeeDeptFilter === dept ? '#FFFFFF' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="unique-lead-submit-btn"
              onClick={() => setIsNewEmployeeModalOpen(true)}
            >
              <Plus size={15} />
              <span className="btn-text">Add New Employee</span>
            </button>
          </div>

          {/* Employee Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEmployees.map((emp) => {
              const isPasswordVisible = revealedPasswords[emp.id];
              const isExpanded = !!expandedCardIds[emp.id];

              return (
                <div
                  key={emp.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: isExpanded ? '1.5px solid #1E443B' : '1.5px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    boxShadow: isExpanded ? '0 4px 20px rgba(30, 68, 59, 0.08)' : '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Clean, uncluttered row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div
                      onClick={() => setSelectedProfileCardEmp(emp)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                      title="Click to view full employee card in middle of page"
                    >
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          backgroundColor: '#1E443B',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
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
                          <span className="badge badge-green">
                            {emp.department}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                          {emp.designation} • {emp.branch}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons (NO View Card button) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeForLeave(emp)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Calendar size={13} style={{ color: '#2563EB' }} />
                        <span>Leave Records ({emp.leaveHistory.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeForAccess(emp)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #1E443B',
                          backgroundColor: '#E6F4EF',
                          color: '#1E443B',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Shield size={13} />
                        <span>Access Control</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: TEST DRIVE MANAGEMENT (Vehicle Allocation, Staff, KYC, Odometer)
          ======================================================== */}
      {activeTab === 'testdrives' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  value={testDriveSearch}
                  onChange={(e) => setTestDriveSearch(e.target.value)}
                  placeholder="Search test drive, customer, vehicle..."
                  style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['All', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTestDriveStatusFilter(st)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: testDriveStatusFilter === st ? '#1E443B' : '#E2E8F0',
                      backgroundColor: testDriveStatusFilter === st ? '#1E443B' : '#FFFFFF',
                      color: testDriveStatusFilter === st ? '#FFFFFF' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="unique-lead-submit-btn"
              onClick={() => setIsNewTestDriveModalOpen(true)}
            >
              <Plus size={15} />
              <span className="btn-text">Schedule Test Drive</span>
            </button>
          </div>

          {/* Test Drive Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTestDrives.map((td) => (
              <div
                key={td.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Car size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          {td.vehicleName}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.74rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                          {td.vehicleReg}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background:
                              td.status === 'completed'
                                ? '#E6F4EF'
                                : td.status === 'in_progress'
                                ? '#FEF3C7'
                                : '#EFF6FF',
                            color:
                              td.status === 'completed'
                                ? '#16A34A'
                                : td.status === 'in_progress'
                                ? '#B45309'
                                : '#2563EB',
                          }}
                        >
                          {td.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                        Drive #{td.driveCode} • Client: <strong style={{ color: '#0F172A' }}>{td.customerName}</strong> ({td.customerPhone})
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {td.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateTestDrive(td.id, { status: 'in_progress' });
                          showToast(`Test drive ${td.driveCode} started!`);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#D97706',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Start Drive Now
                      </button>
                    )}

                    {td.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDriveForComplete(td);
                          setEndDriveOdo(String(td.startOdo + 15));
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#16A34A',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Complete & Log Odo
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Print Gate Pass
                    </button>
                  </div>
                </div>

                {/* Sub details */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B' }}>Time Slot: </span>
                    <strong style={{ color: '#0F172A' }}>{td.date} • {td.timeSlot}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Staff Pilot: </span>
                    <strong style={{ color: '#0F172A' }}>{td.assignedStaff}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>KYC / DL: </span>
                    <span style={{ color: td.kycVerified ? '#16A34A' : '#EF4444', fontWeight: 700 }}>
                      {td.kycVerified ? `✓ Verified (${td.dlNumber})` : 'Pending Verification'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Odometer: </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {td.startOdo} km {td.endOdo ? `→ ${td.endOdo} km (+${td.endOdo - td.startOdo} km)` : ''}
                    </span>
                  </div>
                </div>

                {td.feedback && (
                  <div style={{ fontSize: '0.78rem', color: '#334155', fontStyle: 'italic', paddingLeft: '4px' }}>
                    "{td.feedback}" {td.rating ? `• Rating: ${'★'.repeat(td.rating)}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: DEALERSHIP BRANCHES
          ======================================================== */}
      {activeTab === 'branches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsBranchModalOpen(true)}
              className="unique-lead-submit-btn"
            >
              <Plus size={15} />
              <span className="btn-text">Add Dealership Branch</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {branches.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
                      {b.code}
                    </span>
                    <h3 style={{ margin: '6px 0 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                      {b.name}
                    </h3>
                  </div>
                  <span className="badge badge-green">Active Showroom</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, marginTop: '8px' }}>
                  <div>{b.address?.line1 || b.address?.city}</div>
                  <div style={{ marginTop: '4px' }}>Phone: {b.phone}</div>
                  <div>Email: {b.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: RBAC PERMISSIONS MATRIX
          ======================================================== */}
      {activeTab === 'roles' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Enforced Enterprise Permission Matrix</h3>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Platform Permission Capability</th>
                  <th>Tenant Admin</th>
                  <th>Branch Manager</th>
                  <th>Sales Executive</th>
                  <th>Service Advisor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>View Customer & CRM Database</td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                </tr>
                <tr>
                  <td>Inspect Wholesale Acquisition Costs</td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>Approve Commercial Discounts & Deal Overrides</td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /> (up to 7.5%)</td>
                  <td>— (max 2%)</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>Issue Invoices & Settle Cash Receipts</td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                </tr>
                <tr>
                  <td>Authorize Vehicle Delivery Gate Pass Handover</td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td><CheckCircle size={16} style={{ color: 'var(--color-green)' }} /></td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: SAAS SUBSCRIPTION & SECURITY
          ======================================================== */}
      {activeTab === 'subscription' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Active SaaS Plan</h3>
              <span className="badge badge-green">Enterprise Active</span>
            </div>
            <div className="card-body">
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E443B', marginBottom: '0.4rem' }}>
                Professional Dealership Enterprise Plan
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
                Billed monthly at ₹12,999/mo. Next billing cycle on November 20, 2026.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                  <span>User Seats:</span>
                  <strong>{employees.length} / 25 Used</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                  <span>Branch Outlets:</span>
                  <strong>{branches.length} / 5 Branches Configured</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                  <span>Vehicle Inventory Capacity:</span>
                  <strong>6 / 250 Vehicles Live</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>AI Copilot & Valuations:</span>
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>Unlimited Enabled</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Dealership Security & Audit Trail</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: '#16A34A' }} />
                <span>Multi-tenant Row-Level Security (RLS) active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: '#16A34A' }} />
                <span>Immutable audit logging enabled for all staff actions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: '#16A34A' }} />
                <span>AES-256 server-side encryption for customer KYC documents</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: '#16A34A' }} />
                <span>Bcrypt password hashing & JWT tenant session isolation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE NEW CUSTOM SECTION / PLUGIN
          ======================================================== */}
      {isCustomModuleModalOpen && (
        <Modal
          isOpen={isCustomModuleModalOpen}
          onClose={() => setIsCustomModuleModalOpen(false)}
          title="Create New Custom Section / Dealership Plugin"
        >
          <form onSubmit={handleCreateCustomSection} className="inspo-form-wrapper">
            <div className="form-group">
              <label className="form-label">
                Section Name <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={newSectionForm.label}
                onChange={(e) => setNewSectionForm({ ...newSectionForm, label: e.target.value })}
                placeholder="e.g. VIP Fleet Management, Customer Loyalty, Accessories Desk"
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Section Route / URL Slug</label>
                <input
                  type="text"
                  className="form-input"
                  value={newSectionForm.href}
                  onChange={(e) => setNewSectionForm({ ...newSectionForm, href: e.target.value })}
                  placeholder="e.g. /fleet, /loyalty, /accessories"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newSectionForm.category}
                  onChange={(e) => setNewSectionForm({ ...newSectionForm, category: e.target.value as any })}
                >
                  <option value="Custom">Custom Operations</option>
                  <option value="Sales">Sales & Revenue</option>
                  <option value="Operations">Lot & Inventory</option>
                  <option value="Workforce">Workforce & HR</option>
                  <option value="Customer Experience">Customer Experience</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Capabilities</label>
              <textarea
                className="form-input"
                rows={2}
                value={newSectionForm.description}
                onChange={(e) => setNewSectionForm({ ...newSectionForm, description: e.target.value })}
                placeholder="Describe what operations this custom section handles..."
              />
            </div>

            <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-btn-cancel"
                onClick={() => setIsCustomModuleModalOpen(false)}
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <button type="submit" className="unique-lead-submit-btn">
                <span className="btn-text">Plug In & Activate Section</span>
                <ChevronRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL: ADD NEW EMPLOYEE
          ======================================================== */}
      {isNewEmployeeModalOpen && (
        <Modal
          isOpen={isNewEmployeeModalOpen}
          onClose={() => setIsNewEmployeeModalOpen(false)}
          title="Onboard New Dealership Staff / Employee"
          maxWidth="720px"
        >
          <form onSubmit={handleCreateEmployee} className="inspo-form-wrapper">
            {/* Employee Profile Image Upload Option */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Employee Profile Image / Photo</label>
              <div className="avatar-upload-wrap">
                <div className="avatar-preview-box">
                  {newEmpForm.avatar ? (
                    <img src={newEmpForm.avatar} alt="Employee Avatar" className="avatar-preview-img" />
                  ) : (
                    <Camera size={22} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="avatar-upload-btn">
                      <Upload size={13} />
                      <span>{newEmpForm.avatar ? 'Change Photo' : 'Upload Employee Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handleImageUpload(e, (val) =>
                            setNewEmpForm((prev) => ({ ...prev, avatar: val }))
                          )
                        }
                      />
                    </label>
                    {newEmpForm.avatar && (
                      <button
                        type="button"
                        className="avatar-remove-btn"
                        onClick={() => setNewEmpForm((prev) => ({ ...prev, avatar: '' }))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Recommended JPG, PNG, or WEBP up to 3MB. Displays on staff dossiers & CRM cards.
                  </span>
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmpForm.fullName}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, fullName: e.target.value })}
                  placeholder="e.g. Rahul Deshmukh"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation / Role Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmpForm.designation}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                  placeholder="e.g. Sales Executive, Test Pilot"
                  required
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={newEmpForm.department}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value as any })}
                >
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance & Accounts</option>
                  <option value="Operations">Operations</option>
                  <option value="Service">Service & Inspection</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Corporate Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newEmpForm.email}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                  placeholder="rahul@apexmotors.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmpForm.phone}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Dealership Showroom Branch</label>
                <select
                  className="form-select"
                  value={newEmpForm.branch}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, branch: e.target.value })}
                >
                  <option value="Apex Downtown Flagship">Apex Downtown Flagship</option>
                  <option value="Apex Westside Automall">Apex Westside Automall</option>
                  <option value="All Branches">All Branches</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Salary / Compensation</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmpForm.salary}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, salary: e.target.value })}
                  placeholder="₹85,000 / mo"
                />
              </div>
            </div>

            <div className="form-group" style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <label className="form-label" style={{ color: '#0F172A', fontWeight: 800 }}>
                Dealership CRM Password (Login Credentials)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newEmpForm.password}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, password: e.target.value })}
                  placeholder="Leave empty to auto-generate secure password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewEmpForm({
                      ...newEmpForm,
                      password: `Apex@${Math.floor(1000 + Math.random() * 9000)}!Secure`,
                    })
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#2563EB',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Auto Generate
                </button>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                Employee ID will be generated automatically (e.g. APEX-EMP-{String(employees.length + 1).padStart(3, '0')}).
              </div>
            </div>

            <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-btn-cancel"
                onClick={() => setIsNewEmployeeModalOpen(false)}
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <button type="submit" className="unique-lead-submit-btn">
                <span className="btn-text">Create Employee Profile</span>
                <ChevronRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL: EMPLOYEE LEAVE RECORDS & HISTORY
          ======================================================== */}
      {selectedEmployeeForLeave && (
        <Modal
          isOpen={!!selectedEmployeeForLeave}
          onClose={() => setSelectedEmployeeForLeave(null)}
          title={`Leave Records — ${selectedEmployeeForLeave.fullName} (${selectedEmployeeForLeave.employeeCode})`}
          maxWidth="780px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Balance Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                <span style={{ fontSize: '0.74rem', color: '#1E40AF', fontWeight: 700 }}>CASUAL LEAVE</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E3A8A', marginTop: '2px' }}>
                  {selectedEmployeeForLeave.leaveBalance.casual.total - selectedEmployeeForLeave.leaveBalance.casual.used} Days Left
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  Used: {selectedEmployeeForLeave.leaveBalance.casual.used} of {selectedEmployeeForLeave.leaveBalance.casual.total}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#FEF3C7', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '0.74rem', color: '#92400E', fontWeight: 700 }}>SICK LEAVE</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#78350F', marginTop: '2px' }}>
                  {selectedEmployeeForLeave.leaveBalance.sick.total - selectedEmployeeForLeave.leaveBalance.sick.used} Days Left
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  Used: {selectedEmployeeForLeave.leaveBalance.sick.used} of {selectedEmployeeForLeave.leaveBalance.sick.total}
                </div>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#E6F4EF', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>PAID / ANNUAL LEAVE</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#14532D', marginTop: '2px' }}>
                  {selectedEmployeeForLeave.leaveBalance.paid.total - selectedEmployeeForLeave.leaveBalance.paid.used} Days Left
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  Used: {selectedEmployeeForLeave.leaveBalance.paid.used} of {selectedEmployeeForLeave.leaveBalance.paid.total}
                </div>
              </div>
            </div>

            {/* Leave Application Form */}
            <form
              onSubmit={handleApplyLeave}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                + Record / Apply New Leave for Employee
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Leave Type</label>
                  <select
                    className="form-select"
                    value={newLeaveForm.leaveType}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leaveType: e.target.value as any })}
                    style={{ fontSize: '0.78rem', height: '34px' }}
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="paid">Paid Annual Leave</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newLeaveForm.startDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '34px' }}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newLeaveForm.endDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                    style={{ fontSize: '0.78rem', height: '34px' }}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLeaveForm.reason}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                    placeholder="e.g. Medical, Family event"
                    style={{ fontSize: '0.78rem', height: '34px' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="unique-lead-submit-btn"
                  style={{ height: '34px', padding: '0 14px' }}
                >
                  <span className="btn-text">Record Leave</span>
                </button>
              </div>
            </form>

            {/* Leave History Table */}
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                Complete Leave Records History ({selectedEmployeeForLeave.leaveHistory.length})
              </div>

              {selectedEmployeeForLeave.leaveHistory.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
                  No leave records logged yet for this employee.
                </div>
              ) : (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Leave Type</th>
                        <th style={{ padding: '8px 12px' }}>Dates & Duration</th>
                        <th style={{ padding: '8px 12px' }}>Reason</th>
                        <th style={{ padding: '8px 12px' }}>Applied On</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployeeForLeave.leaveHistory.map((lh) => (
                        <tr key={lh.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A' }}>
                            {lh.leaveType}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {lh.startDate} to {lh.endDate} ({lh.days} days)
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            {lh.reason}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>
                            {lh.appliedOn}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: lh.status === 'approved' ? '#E6F4EF' : '#FEF3C7',
                                color: lh.status === 'approved' ? '#16A34A' : '#B45309',
                              }}
                            >
                              {lh.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          MODAL: EMPLOYEE SECTION ACCESS CONTROL
          ======================================================== */}
      {selectedEmployeeForAccess && (
        <Modal
          isOpen={!!selectedEmployeeForAccess}
          onClose={() => setSelectedEmployeeForAccess(null)}
          title={`Section Access Control — ${selectedEmployeeForAccess.fullName}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Configure exactly what CRM sections and operational tools this employee is authorized to handle:
            </p>

            {/* Quick Role Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>Role Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyAccessPreset('admin')}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Full Admin Access
              </button>
              <button
                type="button"
                onClick={() => handleApplyAccessPreset('sales')}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Sales & Test Drives
              </button>
              <button
                type="button"
                onClick={() => handleApplyAccessPreset('finance')}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Finance & Invoices
              </button>
              <button
                type="button"
                onClick={() => handleApplyAccessPreset('service')}
                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Inventory & Procurement
              </button>
            </div>

            {/* Section Access Checkboxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { key: 'pipeline' as const, label: 'Pipeline & Leads', desc: 'Enquiries, stage updates, allocations' },
                { key: 'customers' as const, label: 'Customers Directory', desc: 'Customer profiles, KYC documents' },
                { key: 'inventory' as const, label: 'Inventory Lot', desc: 'Vehicle stock, inspections, lot details' },
                { key: 'procurement' as const, label: 'Procurement & Exchange', desc: 'Vehicle intake, refurbishment costing' },
                { key: 'deals' as const, label: 'Deals & Quotations', desc: 'Price negotiations, down payments' },
                { key: 'finance' as const, label: 'Finance & Invoices', desc: 'Payment receipts, GST invoices' },
                { key: 'testDrives' as const, label: 'Test Drive Management', desc: 'Scheduling, vehicle allotment, routes' },
                { key: 'documents' as const, label: 'Documents & RTO Vault', desc: 'Agreements, Form 29/30 transfer' },
                { key: 'reports' as const, label: 'Reports & Analytics', desc: 'Dealership profit & audit logs' },
                { key: 'settings' as const, label: 'System Administration', desc: 'Dealership settings, user credentials' },
              ].map((sec) => {
                const isChecked = selectedEmployeeForAccess.accessControl[sec.key];

                return (
                  <div
                    key={sec.key}
                    onClick={() => handleToggleAccessSection(sec.key)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isChecked ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                      backgroundColor: isChecked ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div
                      style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#10B981', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isChecked ? '#166534' : '#0F172A' }}>
                        {sec.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {sec.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-lead-submit-btn"
                onClick={() => setSelectedEmployeeForAccess(null)}
              >
                <CheckCircle2 size={15} />
                <span className="btn-text">Done & Save Permissions</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          MODAL: EMPLOYEE PASSWORD & CREDENTIALS
          ======================================================== */}
      {selectedEmployeeForCreds && (
        <Modal
          isOpen={!!selectedEmployeeForCreds}
          onClose={() => setSelectedEmployeeForCreds(null)}
          title={`CRM Password & Credentials — ${selectedEmployeeForCreds.fullName}`}
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Employee ID:</div>
              <div style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                {selectedEmployeeForCreds.employeeCode}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Current Password:</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                  {selectedEmployeeForCreds.password}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedEmployeeForCreds.password, 'pwd')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#2563EB',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === 'pwd' ? 'Copied!' : 'Copy Password'}
                </button>
              </div>
            </div>

            {/* Set New Password */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const newPass = form.newPassword.value;
                if (newPass) {
                  updateEmployeePassword(selectedEmployeeForCreds.id, newPass);
                  const updated = getEmployees().find((e) => e.id === selectedEmployeeForCreds.id);
                  setSelectedEmployeeForCreds(updated || null);
                  showToast('Password updated successfully!');
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}
            >
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Set New Password</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  name="newPassword"
                  className="form-input"
                  placeholder="Enter new password"
                  required
                />
                <button type="submit" className="unique-lead-submit-btn" style={{ whiteSpace: 'nowrap' }}>
                  <span className="btn-text">Update</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ========================================================
          CENTERED EMPLOYEE STAFF DOSSIER MODAL (MATCHING IMAGE 2 EXACTLY)
          ======================================================== */}
      {selectedProfileCardEmp && (
        <Modal
          isOpen={!!selectedProfileCardEmp}
          onClose={() => {
            setSelectedProfileCardEmp(null);
            setIsEditingCard(false);
          }}
          maxWidth="700px"
          headerContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0F172A' }}>
                {isEditingCard ? 'Edit Employee Details' : 'Dealership Staff Dossier'}
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
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                DEPARTMENT: {selectedProfileCardEmp.department}
              </span>
            </div>
          }
          headerActions={
            <div className="modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (isEditingCard) {
                    setIsEditingCard(false);
                  } else {
                    handleStartEdit(selectedProfileCardEmp);
                  }
                }}
                className="modal-header-edit-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Edit3 size={13} /> {isEditingCard ? 'View Dossier' : 'Edit Details'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProfileCardEmp(null);
                  setIsEditingCard(false);
                }}
                className="modal-header-close-btn"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0F172A',
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
                  if (isEditingCard) {
                    setIsEditingCard(false);
                  } else {
                    setSelectedProfileCardEmp(null);
                  }
                }}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '999px', padding: '0.45rem 1.25rem' }}
              >
                &lt; {isEditingCard ? 'Back to Dossier' : 'Cancel'}
              </button>
              {isEditingCard ? (
                <button
                  type="button"
                  onClick={handleSaveEdit}
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
                  Save Changes ✓
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartEdit(selectedProfileCardEmp)}
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
                  Edit Employee Details &rarr;
                </button>
              )}
            </div>
          }
        >
          {isEditingCard ? (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Employee Photo Upload Field */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Employee Profile Photo</label>
                <div className="avatar-upload-wrap">
                  <div className="avatar-preview-box">
                    {editEmpForm.avatar ? (
                      <img src={editEmpForm.avatar} alt="Employee Avatar" className="avatar-preview-img" />
                    ) : (
                      <Camera size={22} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label className="avatar-upload-btn">
                        <Upload size={13} />
                        <span>{editEmpForm.avatar ? 'Change Photo' : 'Upload Employee Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            handleImageUpload(e, (val) =>
                              setEditEmpForm((prev) => ({ ...prev, avatar: val }))
                            )
                          }
                        />
                      </label>
                      {editEmpForm.avatar && (
                        <button
                          type="button"
                          className="avatar-remove-btn"
                          onClick={() => setEditEmpForm((prev) => ({ ...prev, avatar: '' }))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      JPG, PNG, or WEBP up to 3MB. Displays in all employee cards and directory rows.
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="req-star">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={editEmpForm.fullName}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation <span className="req-star">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={editEmpForm.designation}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, designation: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={editEmpForm.department}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, department: e.target.value as any })}
                  >
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance & Accounts</option>
                    <option value="Operations">Operations</option>
                    <option value="Service">Service</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dealership Branch</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editEmpForm.branch}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, branch: e.target.value })}
                    placeholder="e.g. Apex Downtown Flagship"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Corporate Email <span className="req-star">*</span></label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmpForm.email}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span className="req-star">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={editEmpForm.phone}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Base Monthly Salary / CTC</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editEmpForm.salary}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, salary: e.target.value })}
                    placeholder="e.g. ₹95,000 / mo"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dealership CRM Password</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editEmpForm.password}
                    onChange={(e) => setEditEmpForm({ ...editEmpForm, password: e.target.value })}
                    placeholder="CRM access password"
                  />
                </div>
              </div>
            </form>
          ) : (
            /* ================= VIEW DOSSIER MODE (MATCHING IMAGE 2) ================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Customer/Staff Identity & Profile Banner (Exact Image 2 linear gradient) */}
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
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: '#0284C7',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    letterSpacing: '0.02em',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {selectedProfileCardEmp.avatar ? (
                    <img
                      src={selectedProfileCardEmp.avatar}
                      alt={selectedProfileCardEmp.fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    selectedProfileCardEmp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
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
                      {selectedProfileCardEmp.employeeCode}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} style={{ color: '#0284C7' }} />
                      <a href={`tel:${selectedProfileCardEmp.phone}`} style={{ color: '#0F172A', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedProfileCardEmp.phone}
                      </a>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={13} style={{ color: '#0284C7' }} />
                      <a href={`mailto:${selectedProfileCardEmp.email}`} style={{ color: '#0F172A', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedProfileCardEmp.email}
                      </a>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} style={{ color: '#0284C7' }} />
                      {selectedProfileCardEmp.branch}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Grid of Information (Exact 2x2 Image 2 structure) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Card 1: CRM Login Credentials */}
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                      CRM Login Credentials
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setRevealedPasswords((prev) => ({ ...prev, [selectedProfileCardEmp.id]: !prev[selectedProfileCardEmp.id] }))}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                        title={revealedPasswords[selectedProfileCardEmp.id] ? 'Hide' : 'Reveal password'}
                      >
                        {revealedPasswords[selectedProfileCardEmp.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(`ID: ${selectedProfileCardEmp.employeeCode}\nPassword: ${selectedProfileCardEmp.password}`, selectedProfileCardEmp.id)}
                        style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: '2px' }}
                        title="Copy credentials"
                      >
                        {copiedId === selectedProfileCardEmp.id ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#2563EB' }}>{selectedProfileCardEmp.employeeCode}</span>
                    <span style={{ color: '#CBD5E1' }}>/</span>
                    <span style={{ fontFamily: 'monospace', letterSpacing: revealedPasswords[selectedProfileCardEmp.id] ? '0' : '0.15em' }}>
                      {revealedPasswords[selectedProfileCardEmp.id] ? selectedProfileCardEmp.password : '••••••••••••'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                    Clearance: <strong style={{ color: '#16A34A' }}>Active Dealership Portal Access ✓</strong>
                  </div>
                </div>

                {/* Card 2: Compensation & Appointment */}
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                    Compensation & Appointment
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#15803D', marginTop: '3px' }}>
                    {selectedProfileCardEmp.salary}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                    Designation: <strong>{selectedProfileCardEmp.designation}</strong>
                  </div>
                </div>

                {/* Card 3: Leave Record Balances */}
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                      Leave Record Balances
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeForLeave(selectedProfileCardEmp)}
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      History ({selectedProfileCardEmp.leaveHistory.length}) &rarr;
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', marginTop: '3px' }}>
                    <span>Casual: <strong style={{ color: '#0284C7' }}>{selectedProfileCardEmp.leaveBalance.casual.total - selectedProfileCardEmp.leaveBalance.casual.used}d</strong></span>
                    <span>·</span>
                    <span>Sick: <strong style={{ color: '#D97706' }}>{selectedProfileCardEmp.leaveBalance.sick.total - selectedProfileCardEmp.leaveBalance.sick.used}d</strong></span>
                    <span>·</span>
                    <span>Paid: <strong style={{ color: '#16A34A' }}>{selectedProfileCardEmp.leaveBalance.paid.total - selectedProfileCardEmp.leaveBalance.paid.used}d</strong></span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                    Status: <strong style={{ color: '#16A34A' }}>In Good Standing</strong> · Recorded leaves tracked
                  </div>
                </div>

                {/* Card 4: Authorized CRM Sections */}
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                      Authorized CRM Sections
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Click to toggle</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {[
                      { key: 'pipeline' as const, label: 'Pipeline' },
                      { key: 'customers' as const, label: 'Customers' },
                      { key: 'inventory' as const, label: 'Inventory' },
                      { key: 'procurement' as const, label: 'Procure' },
                      { key: 'deals' as const, label: 'Deals' },
                      { key: 'finance' as const, label: 'Finance' },
                      { key: 'testDrives' as const, label: 'Test Drive' },
                      { key: 'documents' as const, label: 'Docs' },
                      { key: 'reports' as const, label: 'Reports' },
                      { key: 'settings' as const, label: 'Settings' },
                    ].map((s) => {
                      const hasAccess = selectedProfileCardEmp.accessControl[s.key];
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => handleToggleCardAccess(s.key)}
                          title={`Click to ${hasAccess ? 'revoke' : 'grant'} ${s.label}`}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            border: hasAccess ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                            backgroundColor: hasAccess ? '#F0FDF4' : '#F8FAFC',
                            color: hasAccess ? '#15803D' : '#94A3B8',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <span>{hasAccess ? '✓' : '✕'}</span>
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Statutory Compliance Strip (matches PAN / Statutory RTO Eligibility in Image 2) */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                    Permanent Staff Code
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2563EB', fontFamily: 'monospace', marginTop: '2px' }}>
                    {selectedProfileCardEmp.employeeCode}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                    Statutory CRM Eligibility
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#15803D', marginTop: '2px' }}>
                    Enterprise Clearance Level 3 ✓
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                    Dealership Branch
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', marginTop: '2px' }}>
                    {selectedProfileCardEmp.branch}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ========================================================
          MODAL: SCHEDULE NEW TEST DRIVE
          ======================================================== */}
      {isNewTestDriveModalOpen && (
        <Modal
          isOpen={isNewTestDriveModalOpen}
          onClose={() => setIsNewTestDriveModalOpen(false)}
          title="Schedule Dealership Test Drive"
          maxWidth="700px"
        >
          <form onSubmit={handleScheduleTestDrive} className="inspo-form-wrapper">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Customer Name <span className="req-star">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.customerName}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, customerName: e.target.value })}
                  placeholder="e.g. Ramesh Kulkarni"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Phone <span className="req-star">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.customerPhone}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, customerPhone: e.target.value })}
                  placeholder="+91 98200 55443"
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Allocated Vehicle</label>
                <select
                  className="form-select"
                  value={newDriveForm.vehicleName}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, vehicleName: e.target.value })}
                >
                  <option value="Mahindra XUV700 AX7L AWD (Midnight Black)">Mahindra XUV700 AX7L AWD (MH-02-EZ-4120)</option>
                  <option value="Hyundai Creta SX(O) Turbo DCT (Polar White)">Hyundai Creta SX(O) Turbo (MH-03-DF-8812)</option>
                  <option value="Toyota Fortuner 4x4 AT Legender">Toyota Fortuner 4x4 Legender (MH-01-DA-1008)</option>
                  <option value="Tata Nexon EV Max (Intense Teal)">Tata Nexon EV Max (MH-47-BE-6601)</option>
                  <option value="Skoda Slavia 1.5 TSI Style DSG">Skoda Slavia 1.5 TSI (MH-02-SK-9988)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Staff Pilot</label>
                <select
                  className="form-select"
                  value={newDriveForm.assignedStaff}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, assignedStaff: e.target.value })}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.fullName}>
                      {e.fullName} ({e.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newDriveForm.date}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.timeSlot}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, timeSlot: e.target.value })}
                  placeholder="e.g. 04:00 PM - 04:45 PM"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Driving License #</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.dlNumber}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, dlNumber: e.target.value })}
                  placeholder="e.g. MH02 20190012345"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Test Route</label>
                <select
                  className="form-select"
                  value={newDriveForm.route}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, route: e.target.value })}
                >
                  <option value="Western Express Highway Sprint (15 km)">Western Express Highway Sprint (15 km)</option>
                  <option value="Coastal Road Suburban Loop (12 km)">Coastal Road Suburban Loop (12 km)</option>
                  <option value="Sea Link Expressway High Speed Run (25 km)">Sea Link Expressway High Speed Run (25 km)</option>
                  <option value="City Eco Drive & Parking Assist (8 km)">City Eco Drive & Parking Assist (8 km)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Starting Odometer (km)</label>
                <input
                  type="number"
                  className="form-input no-spinner"
                  value={newDriveForm.startOdo}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, startOdo: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-btn-cancel"
                onClick={() => setIsNewTestDriveModalOpen(false)}
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <button type="submit" className="unique-lead-submit-btn">
                <span className="btn-text">Schedule Test Drive</span>
                <ChevronRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL: COMPLETE TEST DRIVE & LOG ODOMETER
          ======================================================== */}
      {selectedDriveForComplete && (
        <Modal
          isOpen={!!selectedDriveForComplete}
          onClose={() => setSelectedDriveForComplete(null)}
          title={`Complete Drive — ${selectedDriveForComplete.driveCode}`}
        >
          <form onSubmit={handleCompleteDrive} className="inspo-form-wrapper">
            <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Vehicle: <strong>{selectedDriveForComplete.vehicleName}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                Customer: <strong>{selectedDriveForComplete.customerName}</strong> • Start ODO: {selectedDriveForComplete.startOdo} km
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Ending Odometer Reading (km) <span className="req-star">*</span>
              </label>
              <input
                type="number"
                className="form-input no-spinner"
                value={endDriveOdo}
                onChange={(e) => setEndDriveOdo(e.target.value)}
                placeholder={`e.g. ${selectedDriveForComplete.startOdo + 15}`}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Feedback & Observations</label>
              <textarea
                className="form-input"
                rows={2}
                value={endDriveFeedback}
                onChange={(e) => setEndDriveFeedback(e.target.value)}
                placeholder="Client comments on suspension, pickup, braking, features..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client Interest Rating (1 to 5 Stars)</label>
              <select
                className="form-select"
                value={endDriveRating}
                onChange={(e) => setEndDriveRating(Number(e.target.value))}
              >
                <option value={5}>★★★★★ 5 Stars — Ready to Close Deal</option>
                <option value={4}>★★★★☆ 4 Stars — Very Interested</option>
                <option value={3}>★★★☆☆ 3 Stars — Comparing Competitors</option>
                <option value={2}>★★☆☆☆ 2 Stars — Budget Constraint</option>
                <option value={1}>★☆☆☆☆ 1 Star — Dropped</option>
              </select>
            </div>

            <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-btn-cancel"
                onClick={() => setSelectedDriveForComplete(null)}
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <button type="submit" className="unique-lead-submit-btn">
                <span className="btn-text">Finalize & Log Completion</span>
                <CheckCircle2 size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          MODAL: ADD DEALERSHIP BRANCH
          ======================================================== */}
      {isBranchModalOpen && (
        <Modal
          isOpen={isBranchModalOpen}
          onClose={() => setIsBranchModalOpen(false)}
          title="Add New Dealership Branch / Showroom"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as any;
              const code = form.branchCode.value;
              const name = form.branchName.value;
              const address = form.address.value;
              const phone = form.phone.value;

              const newBranch = {
                id: 'b-' + Date.now(),
                tenantId: 't-apex-001',
                code,
                name,
                address: { line1: address, city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
                phone: phone || '+91 22 2200 4400',
                email: `${code.toLowerCase()}@apexmotors.com`,
                timezone: 'Asia/Kolkata',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              setBranches([...branches, newBranch]);
              setIsBranchModalOpen(false);
              showToast(`Branch ${name} (${code}) configured successfully!`);
            }}
            className="inspo-form-wrapper"
          >
            <div className="form-group">
              <label className="form-label">Branch Code</label>
              <input name="branchCode" type="text" className="form-input" placeholder="e.g. ES-03, BKC-04" required />
            </div>
            <div className="form-group">
              <label className="form-label">Branch Name</label>
              <input name="branchName" type="text" className="form-input" placeholder="e.g. Apex BKC Luxury Hub" required />
            </div>
            <div className="form-group">
              <label className="form-label">Physical Address</label>
              <input name="address" type="text" className="form-input" placeholder="Plot / Street / Area, City" required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input name="phone" type="text" className="form-input" placeholder="+91 22 2600 9900" />
            </div>
            <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-btn-cancel"
                onClick={() => setIsBranchModalOpen(false)}
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <button type="submit" className="unique-lead-submit-btn">
                <span className="btn-text">Register Branch</span>
                <ChevronRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
