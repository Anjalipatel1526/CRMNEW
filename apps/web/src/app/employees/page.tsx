'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import { Modal } from '@/components/ui/Modal';
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
} from 'lucide-react';

export default function EmployeesPage() {
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedForLeave, setSelectedForLeave] = useState<Employee | null>(null);
  const [selectedForAccess, setSelectedForAccess] = useState<Employee | null>(null);

  // New Employee Form
  const [newEmpForm, setNewEmpForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: 'Sales Executive',
    department: 'Sales' as any,
    branch: 'Apex Downtown Flagship',
    salary: '₹75,000 / mo',
    password: '',
    avatarUrl: '',
  });

  // Leave Form
  const [newLeaveForm, setNewLeaveForm] = useState({
    leaveType: 'casual' as any,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    days: 2,
    reason: '',
  });

  useEffect(() => {
    setEmployees(getEmployees());
    const handleChanged = () => setEmployees(getEmployees());
    window.addEventListener('crm-employees-changed', handleChanged);
    return () => window.removeEventListener('crm-employees-changed', handleChanged);
  }, []);

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
      password: newEmpForm.password.trim() || `Apex@${Math.floor(1000 + Math.random() * 9000)}!Secure`,
      avatarUrl: newEmpForm.avatarUrl || '',
    });

    setIsAddModalOpen(false);
    setNewEmpForm({
      fullName: '',
      email: '',
      phone: '',
      designation: 'Sales Executive',
      department: 'Sales',
      branch: 'Apex Downtown Flagship',
      salary: '₹75,000 / mo',
      password: '',
      avatarUrl: '',
    });
    showToast(`Employee ${created.fullName} (${created.employeeCode}) created successfully!`);
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

        <button
          type="button"
          className="unique-lead-submit-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={15} />
          <span className="btn-text">Add New Employee</span>
        </button>
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
                borderColor: deptFilter === d ? '#1E443B' : '#E2E8F0',
                backgroundColor: deptFilter === d ? '#1E443B' : '#FFFFFF',
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
        {filtered.map((emp) => {
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
                      backgroundColor: '#1E443B',
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
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                      {emp.designation} • {emp.branch}
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons (NO View Card button) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedForLeave(emp)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Calendar size={13} style={{ color: '#2563EB' }} />
                    <span>Leave Records ({emp.leaveHistory.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedForAccess(emp)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #1E443B',
                      background: '#E6F4EF',
                      color: '#1E443B',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
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

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Onboard New Dealership Staff / Employee"
          maxWidth="700px"
        >
          <form onSubmit={handleCreateEmployee} className="inspo-form-wrapper">
            {/* Employee Photo Upload Option */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 14px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1.5px dashed #CBD5E1',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: '1.5px solid #CBD5E1',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                {newEmpForm.avatarUrl ? (
                  <img
                    src={newEmpForm.avatarUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#64748B' }}>
                    <Camera size={22} style={{ color: '#0284C7' }} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>PHOTO</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                  Employee Profile Photo <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>(Optional)</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '8px' }}>
                  Upload a photo from your computer or pick from dealership executive avatars.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#0F172A',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <Upload size={13} style={{ color: '#0284C7' }} />
                    <span>Upload Image</span>
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
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid #FCA5A5',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}

                  {/* Preset Avatar options */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Presets:</span>
                    {PRESET_AVATARS.slice(0, 4).map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewEmpForm((prev) => ({ ...prev, avatarUrl: url }))}
                        title={`Select preset avatar ${idx + 1}`}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          border: newEmpForm.avatarUrl === url ? '2px solid #0284C7' : '1px solid #CBD5E1',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name <span className="req-star">*</span></label>
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
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmpForm.designation}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                  placeholder="e.g. Sales Executive"
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
                  <option value="Service">Service</option>
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
                <label className="form-label">Phone</label>
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

            <div className="form-group" style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <label className="form-label" style={{ fontWeight: 800 }}>Dealership CRM Password</label>
              <input
                type="text"
                className="form-input"
                value={newEmpForm.password}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, password: e.target.value })}
                placeholder="Leave blank to auto-generate password"
              />
            </div>

            <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-btn-cancel"
                onClick={() => setIsAddModalOpen(false)}
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <button type="submit" className="unique-lead-submit-btn">
                <span className="btn-text">Create Employee</span>
                <ChevronRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Leave Modal */}
      {selectedForLeave && (
        <Modal
          isOpen={!!selectedForLeave}
          onClose={() => setSelectedForLeave(null)}
          title={`Leave Records — ${selectedForLeave.fullName}`}
          maxWidth="760px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleApplyLeave} style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px' }}>+ Record New Leave</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Type</label>
                  <select
                    className="form-select"
                    value={newLeaveForm.leaveType}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leaveType: e.target.value as any })}
                    style={{ height: '34px', fontSize: '0.78rem' }}
                  >
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Start</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newLeaveForm.startDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                    style={{ height: '34px', fontSize: '0.78rem' }}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>End</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newLeaveForm.endDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                    style={{ height: '34px', fontSize: '0.78rem' }}
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
                    placeholder="Reason..."
                    style={{ height: '34px', fontSize: '0.78rem' }}
                    required
                  />
                </div>
                <button type="submit" className="unique-lead-submit-btn" style={{ height: '34px', padding: '0 12px' }}>
                  <span className="btn-text">Apply</span>
                </button>
              </div>
            </form>

            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Period</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Reason</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedForLeave.leaveHistory.map((lh) => (
                    <tr key={lh.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, textTransform: 'uppercase' }}>{lh.leaveType}</td>
                      <td style={{ padding: '8px 12px' }}>{lh.startDate} to {lh.endDate} ({lh.days}d)</td>
                      <td style={{ padding: '8px 12px' }}>{lh.reason}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#E6F4EF', color: '#16A34A' }}>
                          {lh.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                      {selectedProfileCardEmp.salary} <span style={{ color: '#64748B', fontWeight: 500 }}>(Base Monthly CTC)</span>
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
