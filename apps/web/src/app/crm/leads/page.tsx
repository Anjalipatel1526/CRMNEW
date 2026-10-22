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
  Car,
  GripVertical,
  MoveHorizontal,
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

  // Drag and drop states
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | null>(null);

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

  const stages: {
    key: LeadStatus;
    label: string;
    accent: string;
    lightBg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
  }[] = [
    {
      key: 'new',
      label: 'New Inquiries',
      accent: '#0284C7',
      lightBg: '#F0F9FF',
      border: 'rgba(2, 132, 199, 0.25)',
      badgeBg: '#E0F2FE',
      badgeText: '#0369A1',
      glow: 'rgba(2, 132, 199, 0.16)',
    },
    {
      key: 'contacted',
      label: 'Contacted',
      accent: '#4F46E5',
      lightBg: '#EEF2FF',
      border: 'rgba(79, 70, 229, 0.25)',
      badgeBg: '#EEF2FF',
      badgeText: '#4338CA',
      glow: 'rgba(79, 70, 229, 0.16)',
    },
    {
      key: 'qualified',
      label: 'Qualified',
      accent: '#7C3AED',
      lightBg: '#F5F3FF',
      border: 'rgba(124, 58, 237, 0.25)',
      badgeBg: '#F5F3FF',
      badgeText: '#6D28D9',
      glow: 'rgba(124, 58, 237, 0.16)',
    },
    {
      key: 'appointment_set',
      label: 'Appointment Set',
      accent: '#D97706',
      lightBg: '#FFFBEB',
      border: 'rgba(217, 119, 6, 0.25)',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
      glow: 'rgba(217, 119, 6, 0.16)',
    },
    {
      key: 'test_drive',
      label: 'Test Drive',
      accent: '#0D9488',
      lightBg: '#F0FDFA',
      border: 'rgba(13, 148, 136, 0.25)',
      badgeBg: '#CCFBF1',
      badgeText: '#0F766E',
      glow: 'rgba(13, 148, 136, 0.16)',
    },
    {
      key: 'negotiation',
      label: 'Negotiation',
      accent: '#E11D48',
      lightBg: '#FFF1F2',
      border: 'rgba(225, 29, 72, 0.25)',
      badgeBg: '#FFE4E6',
      badgeText: '#BE123C',
      glow: 'rgba(225, 29, 72, 0.16)',
    },
    {
      key: 'converted',
      label: 'Converted',
      accent: '#16A34A',
      lightBg: '#F0FDF4',
      border: 'rgba(22, 163, 74, 0.25)',
      badgeBg: '#DCFCE7',
      badgeText: '#15803D',
      glow: 'rgba(22, 163, 74, 0.16)',
    },
  ];

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: LeadStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverStage === stageKey) {
        setDragOverStage(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      handleStageTransition(leadId, targetStage);
      setRecentlyMovedId(leadId);
      setTimeout(() => setRecentlyMovedId(null), 1400);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Helpful Drag & Drop Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: 'var(--pearl-green)',
              background: 'rgba(35, 78, 67, 0.07)',
              border: '1px solid rgba(35, 78, 67, 0.15)',
              padding: '6px 12px',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            <MoveHorizontal size={14} />
            <span>Drag cards between columns to change stage</span>
          </div>

          {/* View Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FAFBF9',
              border: '1px solid var(--line-2)',
              borderRadius: '999px',
              padding: '3px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                backgroundColor: viewMode === 'kanban' ? 'var(--pearl-green)' : 'transparent',
                color: viewMode === 'kanban' ? '#FFFFFF' : 'var(--muted)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutGrid size={14} /> Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                backgroundColor: viewMode === 'table' ? 'var(--pearl-green)' : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : 'var(--muted)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <List size={14} /> Table
            </button>
          </div>

          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: '999px', padding: '0.45rem 1rem' }}
          >
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="kanban-board-container">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.key);
            const isOver = dragOverStage === stage.key;

            return (
              <div
                key={stage.key}
                className={`kanban-column ${isOver ? 'is-drag-over' : ''}`}
                style={{
                  ['--col-accent' as any]: stage.accent,
                  ['--col-light-bg' as any]: stage.lightBg,
                  ['--col-glow' as any]: stage.glow,
                }}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={(e) => handleDragLeave(e, stage.key)}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                {/* Column Header */}
                <div className="kanban-col-header">
                  <div className="kanban-col-title-wrap">
                    <span className="kanban-col-dot" style={{ backgroundColor: stage.accent }} />
                    <span className="kanban-col-title">{stage.label}</span>
                  </div>
                  <span
                    className="kanban-col-badge"
                    style={{
                      backgroundColor: stage.badgeBg,
                      color: stage.badgeText,
                    }}
                  >
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Body */}
                <div className="kanban-cards-body">
                  {stageLeads.map((lead) => {
                    const isDragging = draggedLeadId === lead.id;
                    const wasRecentlyMoved = recentlyMovedId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={() => {
                          setDraggedLeadId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => setSelectedLead(lead)}
                        className={`kanban-lead-card ${isDragging ? 'is-dragging' : ''} ${wasRecentlyMoved ? 'just-dropped' : ''}`}
                        style={{
                          ['--card-accent' as any]: stage.accent,
                          ['--card-light-bg' as any]: stage.lightBg,
                          ['--card-border' as any]: stage.border,
                          ['--card-badge-bg' as any]: stage.badgeBg,
                        }}
                        title="Drag to advance stage, or click to open full details"
                      >
                        {/* Top: Customer name & Grip + Score */}
                        <div className="kanban-card-top">
                          <div className="kanban-card-title-group">
                            <GripVertical size={14} className="kanban-grip-icon" />
                            <span className="kanban-customer-name">{lead.customerName}</span>
                          </div>
                          <span
                            className="kanban-score-pill"
                            style={{
                              color: (lead.score || 0) >= 80 ? '#15803D' : stage.accent,
                              borderColor: (lead.score || 0) >= 80 ? 'rgba(22, 163, 74, 0.3)' : stage.border,
                            }}
                          >
                            <Sparkles size={11} style={{ color: (lead.score || 0) >= 80 ? '#16A34A' : stage.accent }} />
                            {lead.score}
                          </span>
                        </div>

                        {/* Vehicle Interest Pill */}
                        <div className="kanban-vehicle-tag">
                          <Car size={13} style={{ color: stage.accent, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.preferredMake} {lead.preferredModel}
                          </span>
                          {lead.preferredFuelType && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                              · {lead.preferredFuelType}
                            </span>
                          )}
                        </div>

                        {/* Footer: Budget & Sales Exec */}
                        <div className="kanban-card-footer">
                          <span className="kanban-budget-label">
                            Budget: ₹{(lead.budgetMin! / 100000).toFixed(0)}-{(lead.budgetMax! / 100000).toFixed(0)}L
                          </span>
                          <span className="kanban-assignee-pill">
                            {lead.assigneeName?.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Active Drop Slot Indicator when Dragging Over */}
                  {isOver && draggedLeadId && (
                    <div className="kanban-drop-placeholder">
                      <ArrowRight size={14} />
                      <span>Drop to move to {stage.label}</span>
                    </div>
                  )}

                  {stageLeads.length === 0 && !isOver && (
                    <div className="kanban-empty-col">
                      <span style={{ fontSize: '1.2rem', opacity: 0.55 }}>📥</span>
                      <span>No leads in stage</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Drag leads here</span>
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
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: selectedLead.status === s.key ? s.accent : s.lightBg,
                      color: selectedLead.status === s.key ? '#FFFFFF' : s.badgeText,
                      border: '1px solid',
                      borderColor: selectedLead.status === s.key ? s.accent : s.border,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
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
