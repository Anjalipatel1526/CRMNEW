'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import {
  Settings,
  Building2,
  Users,
  Shield,
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function SettingsPage() {
  const [branches, setBranches] = useState(api.getBranches());
  const [activeTab, setActiveTab] = useState<'branches' | 'team' | 'roles' | 'subscription'>('branches');
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const teamMembers = [
    { name: 'Vikram Singhania', email: 'admin@apexmotors.com', role: 'Tenant Admin', branch: 'All Branches', status: 'active' },
    { name: 'Kavita Chawla', email: 'manager.west@apexmotors.com', role: 'Branch Manager', branch: 'Apex Westside Automall', status: 'active' },
    { name: 'John Fernandes', email: 'sales.john@apexmotors.com', role: 'Sales Executive', branch: 'Apex Downtown Flagship', status: 'active' },
    { name: 'Sarah Dsouza', email: 'service.sarah@apexmotors.com', role: 'Service Advisor', branch: 'Apex Downtown Flagship', status: 'active' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Dealership Administration & Settings" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Multi-branch physical configuration, staff permissions, role-based access control, and enterprise SaaS subscription."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          Branches ({branches.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Staff & Team Users ({teamMembers.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          RBAC Permissions Matrix
        </button>
        <button
          className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          SaaS Subscription & Plan
        </button>
      </div>

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={() => setIsBranchModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} /> Add Dealership Branch
            </button>
          </div>
          <div className="card">
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Branch Code</th>
                    <th>Branch Name</th>
                    <th>Address</th>
                    <th>Contact Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong style={{ color: 'var(--color-blue)' }}>{b.code}</strong>
                      </td>
                      <td>
                        <strong>{b.name}</strong>
                      </td>
                      <td>{b.address?.line1 || b.address?.city}</td>
                      <td>{b.phone}</td>
                      <td>{b.email}</td>
                      <td>
                        <span className="badge badge-green">Active Showroom</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Team Users Tab */}
      {activeTab === 'team' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} /> Invite Team Member
            </button>
          </div>
          <div className="card">
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Branch Visibility</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{m.name}</strong>
                      </td>
                      <td>{m.email}</td>
                      <td>
                        <span className="badge badge-blue">{m.role}</span>
                      </td>
                      <td>{m.branch}</td>
                      <td>
                        <span className="badge badge-green">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Roles & Permissions Matrix */}
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
                  <td>Inspect Wholesale Vehicle Acquisition Costs</td>
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
                  <td>Issue Legal Invoices & Settle Cash Receipts</td>
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

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Active SaaS Plan</h3>
              <span className="badge badge-green">Enterprise Active</span>
            </div>
            <div className="card-body">
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-blue)', marginBottom: '0.5rem' }}>
                Professional Enterprise Plan
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                Billed monthly at ₹12,999/mo. Next billing cycle on November 20, 2026.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
                  <span>User Seats:</span>
                  <strong>4 / 25 Used</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
                  <span>Branch Outlets:</span>
                  <strong>2 / 5 Branches Configured</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.5rem' }}>
                  <span>Vehicle Inventory Capacity:</span>
                  <strong>6 / 250 Vehicles Live</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>AI Copilot & Valuations:</span>
                  <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>Unlimited Enabled</span>
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
                <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                <span>Multi-tenant Row-Level Security (RLS) active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                <span>Immutable audit logging enabled for all mutations</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                <span>AES-256 server-side encryption for customer KYC documents</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                <span>Bcrypt password hashing (cost 10) & JWT tenant session isolation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title="Add New Dealership Branch"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Branch configured successfully!');
            setIsBranchModalOpen(false);
          }}
        >
          <div className="form-group">
            <label className="form-label">Branch Code</label>
            <input type="text" className="form-input" defaultValue="ES-03" required />
          </div>
          <div className="form-group">
            <label className="form-label">Branch Name</label>
            <input type="text" className="form-input" defaultValue="Apex Eastside Flagship" required />
          </div>
          <div className="form-group">
            <label className="form-label">Physical Address</label>
            <input type="text" className="form-input" defaultValue="Ghatkopar East Highway Junction, Mumbai" required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBranchModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Branch
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Invite New Dealership Staff Member"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Invitation dispatched to staff email!');
            setIsUserModalOpen(false);
          }}
        >
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" defaultValue="Rahul Mehra" required />
          </div>
          <div className="form-group">
            <label className="form-label">Corporate Email</label>
            <input type="email" className="form-input" defaultValue="rahul.m@apexmotors.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Assigned Role</label>
            <select className="form-select">
              <option value="sales_executive">Sales Executive</option>
              <option value="branch_manager">Branch Manager</option>
              <option value="service_advisor">Service Advisor</option>
              <option value="finance_manager">Finance & Accounts Manager</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Staff Invite
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
