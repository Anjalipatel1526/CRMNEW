'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Lead, LeadStatus, Customer } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { validateLeadTransition } from '@crm/business-rules';
import {
  Plus,
  LayoutGrid,
  List,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function LeadsPage() {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(api.getLeads());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [branches] = useState(api.getBranches());
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    branchId: branches[0]?.id || '',
    source: 'Google Search Ads',
    preferredMake: 'Mahindra',
    preferredModel: 'XUV700',
    preferredFuelType: 'Diesel',
    budgetMin: '2000000',
    budgetMax: '2500000',
    notes: '',
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const created = api.addLead(formData);
    setLeads([...api.getLeads()]);
    setIsNewLeadModalOpen(false);
  };

  const handleStageTransition = (leadId: string, newStatus: LeadStatus) => {
    api.updateLeadStatus(leadId, newStatus);
    setLeads([...api.getLeads()]);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const stages: { key: LeadStatus; label: string }[] = [
    { key: 'new', label: 'New Inquiries' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'appointment_set', label: 'Appointment Set' },
    { key: 'test_drive', label: 'Test Drive' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'converted', label: 'Converted' },
  ];

  const columns: Column<Lead>[] = [
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.customerName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Source: {row.source}
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle Interest',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.preferredMake} {row.preferredModel}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Budget: ₹{(row.budgetMin! / 100000).toFixed(1)}L - ₹{(row.budgetMax! / 100000).toFixed(1)}L
          </div>
        </div>
      ),
    },
    {
      header: 'Stage',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'AI Purchase Score',
      cell: (row) => (
        <span
          style={{
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: (row.score || 0) >= 80 ? 'var(--color-green)' : 'var(--color-blue)',
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--color-violet)' }} />
          {row.score}/100
        </span>
      ),
    },
    {
      header: 'Branch & Owner',
      cell: (row) => (
        <div>
          <div style={{ fontSize: '0.8125rem' }}>{row.branchName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.assigneeName}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedLead(row)}
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Lead Management & Pipeline" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="End-to-end sales pipeline tracking, AI scoring, branch allocations, and stage progression."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* View Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'kanban' ? 'var(--color-blue-bg)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--color-blue)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <LayoutGrid size={15} /> Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: viewMode === 'table' ? 'var(--color-blue-bg)' : 'transparent',
                color: viewMode === 'table' ? 'var(--color-blue)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <List size={15} /> Table
            </button>
          </div>

          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1.5rem',
            minHeight: '70vh',
          }}
        >
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.key);
            return (
              <div
                key={stage.key}
                style={{
                  minWidth: '280px',
                  maxWidth: '300px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 220px)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-white)',
                    borderTopLeftRadius: 'var(--radius-lg)',
                    borderTopRightRadius: 'var(--radius-lg)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{stage.label}</div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-page-bg)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div
                  style={{
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    overflowY: 'auto',
                    flex: 1,
                  }}
                >
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      style={{
                        backgroundColor: 'var(--color-white)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        boxShadow: 'var(--shadow-xs)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-blue)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lead.customerName}</div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: (lead.score || 0) >= 80 ? 'var(--color-green)' : 'var(--color-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Sparkles size={11} style={{ color: 'var(--color-violet)' }} />
                          {lead.score}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        {lead.preferredMake} {lead.preferredModel}
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--color-border-subtle)',
                          paddingTop: '0.5rem',
                        }}
                      >
                        <span>Budget: ₹{(lead.budgetMin! / 100000).toFixed(0)}-{(lead.budgetMax! / 100000).toFixed(0)}L</span>
                        <span style={{ fontWeight: 500, color: 'var(--color-blue)' }}>{lead.assigneeName?.split(' ')[0]}</span>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '2rem 1rem',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                      }}
                    >
                      No leads in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="card">
          <div className="card-body">
            <DataTable
              data={leads}
              columns={columns}
              searchPlaceholder="Search leads by customer, vehicle, source..."
            />
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Create New Customer Lead"
      >
        <form onSubmit={handleCreateLead}>
          <div className="form-group">
            <label className="form-label">Customer Profile</label>
            <select
              className="form-select"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Branch Destination</label>
              <select
                className="form-select"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select
                className="form-select"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Google Search Ads">Google Search Ads</option>
                <option value="Walk-in Showroom">Walk-in Showroom</option>
                <option value="Website Direct">Website Direct</option>
                <option value="Cardekho / CarWale">Cardekho / CarWale</option>
                <option value="Referral">Referral</option>
                <option value="Meta / Instagram">Meta / Instagram</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Preferred Make</label>
              <input
                type="text"
                className="form-input"
                value={formData.preferredMake}
                onChange={(e) => setFormData({ ...formData, preferredMake: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Model</label>
              <input
                type="text"
                className="form-input"
                value={formData.preferredModel}
                onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <select
                className="form-select"
                value={formData.preferredFuelType}
                onChange={(e) => setFormData({ ...formData, preferredFuelType: e.target.value })}
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Budget Min (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Budget Max (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Notes & Requirements</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Customer is considering top variant, requires auto transmission..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsNewLeadModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Lead Detail & Stage Transition Drawer/Modal */}
      {selectedLead && (
        <Modal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={`Lead: ${selectedLead.customerName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Stage Progress Bar */}
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                Current Stage Transition
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {stages.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleStageTransition(selectedLead.id, s.key)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: selectedLead.status === s.key ? 'var(--color-blue)' : '#F1F5F9',
                      color: selectedLead.status === s.key ? '#FFFFFF' : 'var(--color-text-secondary)',
                      border: '1px solid',
                      borderColor: selectedLead.status === s.key ? 'var(--color-blue)' : 'var(--color-border)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Insights Card */}
            <div
              style={{
                backgroundColor: 'var(--color-violet-bg)',
                border: '1px solid var(--color-violet-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--color-violet-text)', marginBottom: '0.35rem' }}>
                <Sparkles size={16} /> AI Dealership Copilot Recommendation
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                Likelihood score <strong>{selectedLead.score}/100</strong>. Suggested next action: Schedule immediate home test drive for {selectedLead.preferredMake} {selectedLead.preferredModel} or prepare finance quotation.
              </p>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requirement:</span>
                <div style={{ fontWeight: 600 }}>{selectedLead.preferredMake} {selectedLead.preferredModel} ({selectedLead.preferredFuelType})</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Budget:</span>
                <div style={{ fontWeight: 600 }}>₹{(selectedLead.budgetMin! / 100000).toFixed(1)}L - ₹{(selectedLead.budgetMax! / 100000).toFixed(1)}L</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Assigned Sales Exec:</span>
                <div style={{ fontWeight: 600 }}>{selectedLead.assigneeName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Lead Source:</span>
                <div style={{ fontWeight: 600 }}>{selectedLead.source}</div>
              </div>
            </div>

            {/* Notes */}
            {selectedLead.notes && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sales Notes:</span>
                <div style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}>{selectedLead.notes}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLead(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleStageTransition(selectedLead.id, 'negotiation');
                }}
              >
                Advance to Negotiation <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
