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
  MapPin,
  Sparkles,
  Edit3,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  ExternalLink,
  Trash2,
  Lock,
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
  const [isEditingCard, setIsEditingCard] = useState(false);

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
    avatar: '',
  });

  // Edit Employee Form
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
      avatar: newEmpForm.avatar,
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
      avatar: '',
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
                {/* Card 1: CRM Login Credentials (matches Target Vehicle Interest in Image 2) */}
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

                {/* Card 2: Compensation & Appointment (matches Budget Range in Image 2) */}
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

                {/* Card 3: Leave Record Balances (matches AI Purchase Propensity in Image 2) */}
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
                      Leave Record Balances
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedForLeave(selectedProfileCardEmp)}
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

                {/* Card 4: Authorized CRM Sections (matches Destination & Source in Image 2) */}
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
    </div>
  );
}
