'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { JobCard } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle,
  Package,
  AlertCircle,
  ShieldAlert,
  Car,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ServicePage() {
  const [jobCards, setJobCards] = useState<JobCard[]>(api.getJobCards());
  const [activeTab, setActiveTab] = useState<'jobcards' | 'parts' | 'complaints'>('jobcards');
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);

  const [parts, setParts] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Workshop & After-Sales Management</h1>
          <p className="page-desc">
            Job cards, technician allocation, spare parts requisition, warranty claims, and customer service SLAs.
          </p>
        </div>
        <button
          onClick={() => setIsJobCardModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Open Job Card
        </button>
      </div>

      <div className="grid-3">
        <StatCard
          title="Active Workshop Job Cards"
          value={`${jobCards.length} Vehicles`}
          sub="Average turn-around time: 0 hrs"
          icon={<Wrench size={18} />}
          accentColor="teal"
        />
        <StatCard
          title="Workshop Revenue Today"
          value="₹0"
          sub="Labour + spare parts billed"
          icon={<Clock size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Spare Parts In-Stock"
          value={`${parts.reduce((s, p) => s + (p.stock || 0), 0)} Units`}
          sub="Periodic service parts available"
          icon={<Package size={18} />}
          accentColor="indigo"
        />
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'jobcards' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobcards')}
        >
          Active Job Cards ({jobCards.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'parts' ? 'active' : ''}`}
          onClick={() => setActiveTab('parts')}
        >
          Spare Parts Inventory ({parts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Customer Service Complaints ({complaints.length})
        </button>
      </div>

      {/* Job Cards Tab */}
      {activeTab === 'jobcards' && (
        <div className="card">
          {jobCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Wrench size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>No Active Workshop Job Cards</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 16px' }}>
                Vehicle service intakes, maintenance checklists, and repair job cards will appear here.
              </p>
              <button onClick={() => setIsJobCardModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={14} /> Open First Job Card
              </button>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Card #</th>
                    <th>Customer & Vehicle</th>
                    <th>Intake Odometer</th>
                    <th>Customer Complaint / Scope</th>
                    <th>Labour & Parts Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobCards.map((jc) => (
                    <tr key={jc.id}>
                      <td>
                        <strong style={{ color: 'var(--color-teal)' }}>{jc.jobCardNumber}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{jc.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {jc.vehicleName}
                        </div>
                      </td>
                      <td>{jc.intakeOdometer?.toLocaleString()} km ({jc.intakeFuelLevel})</td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', maxWidth: '300px' }}>
                          {jc.customerComplaints}
                        </div>
                      </td>
                      <td>
                        <strong>₹{jc.grandTotal.toLocaleString()}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          Labour: ₹{jc.labourTotal} | Parts: ₹{jc.partsTotal}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={jc.status} />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedJobCard(jc)}
                        >
                          Inspect Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Spare Parts Inventory Tab */}
      {activeTab === 'parts' && (
        <div className="card">
          {parts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Package size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>No Spare Parts Cataloged</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
                Workshop inventory parts, lubricants, filters, and brake assemblies will be listed here.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th>Category</th>
                    <th>Unit Selling Price</th>
                    <th>In-Stock Quantity</th>
                    <th>Inventory Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.partNumber}>
                      <td>
                        <strong style={{ fontFamily: 'monospace' }}>{p.partNumber}</strong>
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{p.category}</span>
                      </td>
                      <td>₹{p.price.toLocaleString()}</td>
                      <td>
                        <strong>{p.stock} units</strong>
                      </td>
                      <td>
                        <span className="badge badge-green">In Stock</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="card">
          {complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <CheckCircle size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>No Service Complaints</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
                Customer quality tickets, workshop escalations, and warranty inquiries will appear here.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Issue Description</th>
                    <th>Technician Assigned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.customer}</strong>
                      </td>
                      <td>{c.vehicle}</td>
                      <td>{c.category}</td>
                      <td>
                        <span className="badge badge-amber">{c.priority}</span>
                      </td>
                      <td>{c.subject}</td>
                      <td>{c.assignedTo}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Open Job Card Modal */}
      <Modal
        isOpen={isJobCardModalOpen}
        onClose={() => setIsJobCardModalOpen(false)}
        title="Open Service Workshop Job Card"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Job card created and technician dispatched!');
            setIsJobCardModalOpen(false);
          }}
          className="inspo-form-wrapper"
        >
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input type="text" className="form-input" placeholder="Enter customer name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle (Model & Reg Number)</label>
            <input type="text" className="form-input" placeholder="Enter vehicle model & registration number" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Intake Odometer (km)</label>
              <input type="number" className="form-input" placeholder="Enter intake odometer (km)" required />
            </div>
            <div className="form-group">
              <label className="form-label">Fuel / Battery Level</label>
              <input type="text" className="form-input" placeholder="e.g. 80% or 1/2 Tank" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Customer Complaints / Work Scope</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe customer complaints or work scope..."
              required
            />
          </div>
          <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsJobCardModalOpen(false)}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button type="submit" className="unique-lead-submit-btn">
              <span className="btn-text">Issue Workshop Card</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Job Card Detail Modal */}
      {selectedJobCard && (
        <Modal
          isOpen={!!selectedJobCard}
          onClose={() => setSelectedJobCard(null)}
          title={`Job Card: ${selectedJobCard.jobCardNumber}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{selectedJobCard.customerName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{selectedJobCard.vehicleName}</div>
              </div>
              <StatusBadge status={selectedJobCard.status} />
            </div>

            <div style={{ fontSize: '0.85rem' }}>
              <strong>Reported Complaint:</strong> {selectedJobCard.customerComplaints}
            </div>

            <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--color-teal-bg)', border: '1px solid var(--color-teal-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Labour Charges:</span>
                <strong>₹{selectedJobCard.labourTotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Spare Parts:</span>
                <strong>₹{selectedJobCard.partsTotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--color-teal-border)', paddingTop: '0.4rem', marginTop: '0.4rem', color: 'var(--color-teal-text)' }}>
                <span>Total Service Invoice:</span>
                <span>₹{selectedJobCard.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedJobCard(null)}>
                Close
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  alert('Job card completed & invoice delivered to customer!');
                  setSelectedJobCard(null);
                }}
              >
                <CheckCircle size={15} /> Complete & Bill
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
