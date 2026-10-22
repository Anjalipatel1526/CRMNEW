'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import { Modal } from '@/components/ui/Modal';
import {
  getEmployees,
  addEmployee,
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
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                    }}
                  >
                    {emp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        {emp.fullName}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.74rem', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                        {emp.employeeCode}
                      </span>
                      <span className="badge badge-green">{emp.department}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                      {emp.designation} • {emp.branch}
                    </div>
                  </div>
                </div>

                {/* Password Credentials */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '6px 12px' }}>
                  <KeyRound size={15} style={{ color: '#D97706' }} />
                  <div style={{ fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748B' }}>Password: </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                      {isPassVisible ? emp.password : '••••••••••••'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevealedPasswords((prev) => ({ ...prev, [emp.id]: !prev[emp.id] }))}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px' }}
                    title={isPassVisible ? 'Hide' : 'Show'}
                  >
                    {isPassVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${emp.employeeCode} / ${emp.password}`, emp.id)}
                    style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: '2px' }}
                    title="Copy Login Credentials"
                  >
                    {copiedId === emp.id ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Action Buttons */}
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

              {/* Bottom Details & Leave Balance Chips */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid #F1F5F9',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748B' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} /> {emp.phone}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={13} /> {emp.email}
                  </span>
                  <span>Salary: {emp.salary}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Leave Balance:</span>
                  <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                    Casual: {emp.leaveBalance.casual.total - emp.leaveBalance.casual.used} left
                  </span>
                  <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                    Sick: {emp.leaveBalance.sick.total - emp.leaveBalance.sick.used} left
                  </span>
                  <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                    Paid: {emp.leaveBalance.paid.total - emp.leaveBalance.paid.used} left
                  </span>
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
    </div>
  );
}
