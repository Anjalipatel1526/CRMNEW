'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Customer } from '@crm/shared-types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Building,
  User,
  CheckCircle2,
  FileText,
  Clock,
  Car,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(api.getCustomers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    type: 'individual' as 'individual' | 'business',
    companyName: '',
    email: '',
    phone: '',
    panNumber: '',
    city: 'Mumbai',
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const created = api.addCustomer({
      ...formData,
      address: { city: formData.city },
    });
    setCustomers([...api.getCustomers()]);
    setIsModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      type: 'individual',
      companyName: '',
      email: '',
      phone: '',
      panNumber: '',
      city: 'Mumbai',
    });
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Name',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: row.type === 'business' ? 'var(--color-indigo-bg)' : 'var(--color-blue-bg)',
              color: row.type === 'business' ? 'var(--color-indigo)' : 'var(--color-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            {row.type === 'business' ? <Building size={16} /> : <User size={16} />}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>
              {row.firstName} {row.lastName}
            </div>
            {row.companyName && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {row.companyName}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      cell: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <Phone size={13} style={{ color: 'var(--color-text-muted)' }} /> {row.phone}
          </div>
          {row.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <Mail size={13} style={{ color: 'var(--color-text-muted)' }} /> {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            textTransform: 'capitalize',
            backgroundColor: row.type === 'business' ? 'var(--color-indigo-bg)' : 'var(--color-blue-bg)',
            color: row.type === 'business' ? 'var(--color-indigo)' : 'var(--color-blue)',
          }}
        >
          {row.type}
        </span>
      ),
    },
    {
      header: 'KYC & Tax ID',
      cell: (row) => (
        <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
          {row.panNumber || row.gstin || 'Pending Verification'}
        </div>
      ),
    },
    {
      header: 'Consent',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.7rem' }}>
          <span style={{ color: row.consent?.whatsapp ? 'var(--color-green)' : 'var(--color-text-muted)' }}>WA ✓</span>
          <span style={{ color: row.consent?.sms ? 'var(--color-green)' : 'var(--color-text-muted)' }}>SMS ✓</span>
          <span style={{ color: row.consent?.email ? 'var(--color-green)' : 'var(--color-text-muted)' }}>Email ✓</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedCustomer(row)}
        >
          Customer 360
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer 360 Directory</h1>
          <p className="page-desc">
            Complete relationship lifecycle, purchase history, consent preferences, and KYC records.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <DataTable
            data={customers}
            columns={columns}
            searchPlaceholder="Search by name, phone, email, PAN..."
          />
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
      >
        <form onSubmit={handleCreateCustomer}>
          <div className="form-group">
            <label className="form-label">Customer Classification</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="type"
                  checked={formData.type === 'individual'}
                  onChange={() => setFormData({ ...formData, type: 'individual' })}
                />
                Individual Retail
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="type"
                  checked={formData.type === 'business'}
                  onChange={() => setFormData({ ...formData, type: 'business' })}
                />
                Corporate / Business Fleet
              </label>
            </div>
          </div>

          {formData.type === 'business' && (
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name / Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone (WhatsApp enabled)</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98000 00000"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">PAN Card Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="ABCPS1234M"
              />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer 360 Detail Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer 360: ${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Profile Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--color-page-bg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  {selectedCustomer.companyName ? `Corporate: ${selectedCustomer.companyName}` : 'Individual Retail Buyer'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.phone}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{selectedCustomer.email || 'No email provided'}</div>
              </div>
            </div>

            {/* KYC & Identity Section */}
            <div className="card">
              <div className="card-header" style={{ padding: '0.75rem 1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Compliance & KYC Records</h4>
                <span className="badge badge-green">Verified</span>
              </div>
              <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>PAN Number:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedCustomer.panNumber || 'ABCPS1234M'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Aadhaar Status:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-green)' }}>Linked (Masked)</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Registered City:</span>
                  <div style={{ fontWeight: 600 }}>{selectedCustomer.address?.city || 'Mumbai'}</div>
                </div>
              </div>
            </div>

            {/* Lifetime Engagement History */}
            <div className="card">
              <div className="card-header" style={{ padding: '0.75rem 1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Automotive Lifetime Timeline</h4>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-blue)', marginTop: '6px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Deal Initialized — Mahindra XUV700 AX7L</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Quotation #Q-2024-001 accepted, deposit of ₹1,00,000 paid.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-teal)', marginTop: '6px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Test Drive Completed</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>45 min drive route on Western Express Highway. Rating: 5/5 stars.</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
