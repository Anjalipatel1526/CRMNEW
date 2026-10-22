'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Lead, LeadStatus, Customer } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { validateLeadTransition } from '@crm/business-rules';
import {
  Plus,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ArrowRight,
  Filter,
  Car,
  GripVertical,
  CheckCircle2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

interface StageQuestionItem {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface StageQuestionConfig {
  stageKey: LeadStatus;
  stageTitle: string;
  stageSubtitle: string;
  questions: StageQuestionItem[];
}

const STAGE_QUESTION_MAP: Partial<Record<LeadStatus, StageQuestionConfig>> = {
  new: {
    stageKey: 'new',
    stageTitle: 'New Inquiries Intake Checklist',
    stageSubtitle: 'Capture inbound inquiry details, purchase timeline, and customer question.',
    questions: [
      {
        id: 'timeline',
        label: 'Purchase Timeline & Urgency',
        type: 'select',
        options: [
          'Immediate (Within 7 days)',
          'Within 15-30 days',
          'Exploring / Next 2-3 months',
          'Future purchase planning',
        ],
      },
      {
        id: 'sourceChannel',
        label: 'Primary Inbound Source',
        type: 'select',
        options: [
          'Google Search Ads',
          'Walk-in Showroom',
          'Website Direct',
          'Cardekho / CarWale',
          'Referral',
          'Meta / Instagram',
        ],
      },
      {
        id: 'inquiryQuestion',
        label: 'Customer Initial Question & Vehicle Requirement',
        type: 'textarea',
        placeholder: 'e.g. Inquiring about AX7L diesel AWD ready stock, delivery timeline, and warranty...',
        required: true,
      },
    ],
  },
  contacted: {
    stageKey: 'contacted',
    stageTitle: 'Contacted Stage Intake & Call Checklist',
    stageSubtitle: 'Log first contact outcome, customer disposition, and follow-up plan.',
    questions: [
      {
        id: 'contactMode',
        label: 'Communication Channel',
        type: 'select',
        options: [
          'Phone Call (Showroom Desk)',
          'WhatsApp Official Chat',
          'In-Person Showroom Visit',
          'Email Consultation',
        ],
      },
      {
        id: 'disposition',
        label: 'Customer Engagement Level',
        type: 'select',
        options: [
          'Highly Interested & Engaged',
          'Requested Detailed Quotation',
          'Wants Showroom Visit Demo',
          'Requested Callback Later',
          'Price Comparison Shopping',
        ],
      },
      {
        id: 'customerQuestion',
        label: 'Specific Questions Customer Raised on Call',
        type: 'textarea',
        placeholder: 'e.g. Customer asked about fuel efficiency in city traffic, exchange value for old car, and waiting period...',
        required: true,
      },
      {
        id: 'followupSlot',
        label: 'Next Scheduled Follow-up',
        type: 'text',
        placeholder: 'e.g. Tomorrow at 3:00 PM',
      },
    ],
  },
  qualified: {
    stageKey: 'qualified',
    stageTitle: 'Lead Qualification & Gate Check',
    stageSubtitle: 'Validate budget authority, trade-in exchange, and financing readiness.',
    questions: [
      {
        id: 'budgetReadiness',
        label: 'Budget & Financing Readiness',
        type: 'select',
        options: [
          'Pre-approved Bank Loan Sanctioned',
          'Self-Funded / Full Cash Payment',
          'Requires Dealership Loan Assistance',
          'Corporate Fleet Lease Eligibility',
        ],
      },
      {
        id: 'tradeIn',
        label: 'Used Car Exchange / Trade-in',
        type: 'select',
        options: [
          'No Exchange Required (Fresh Purchase)',
          'Has Old Car for Evaluation & Trade-in',
          'Exchange Value Critical for Deal',
        ],
      },
      {
        id: 'decisionMaker',
        label: 'Decision-Making Authority',
        type: 'select',
        options: [
          'Self / Sole Decision Maker',
          'Family Joint Decision (Spouse / Parents)',
          'Corporate Fleet Board Approval',
        ],
      },
      {
        id: 'qualificationNotes',
        label: 'Core Qualification Notes & Must-Have Features',
        type: 'textarea',
        placeholder: 'e.g. Customer budget confirmed up to ₹24 Lakhs. Requires 7-seater with ADAS safety features...',
        required: true,
      },
    ],
  },
  appointment_set: {
    stageKey: 'appointment_set',
    stageTitle: 'Showroom Appointment & Demo Booking',
    stageSubtitle: 'Reserve consultation slot, test vehicle, and assign host.',
    questions: [
      {
        id: 'appointmentSlot',
        label: 'Appointment Date & Slot',
        type: 'text',
        placeholder: 'e.g. Saturday 24th Oct, 11:30 AM',
        required: true,
      },
      {
        id: 'visitType',
        label: 'Appointment Format',
        type: 'select',
        options: [
          'Showroom Demo & Test Drive',
          'Family Walkaround & Feature Demo',
          'VIP Private Viewing Lounge',
          'Doorstep Home Consultation',
        ],
      },
      {
        id: 'assignedHost',
        label: 'Assigned Showroom Consultant',
        type: 'select',
        options: [
          'Rajesh Patil (Senior Sales Desk)',
          'Kavita Chawla',
          'John Fernandes',
        ],
      },
      {
        id: 'demoRequirements',
        label: 'Special Preparation & Features to Showcase',
        type: 'textarea',
        placeholder: 'e.g. Keep Midnight Black demo car clean and charged. Focus demonstration on rear seat comfort and ADAS...',
      },
    ],
  },
  test_drive: {
    stageKey: 'test_drive',
    stageTitle: 'Test Drive Scheduling & Route',
    stageSubtitle: 'Route assignment, driver license verification, and evaluation goals.',
    questions: [
      {
        id: 'testRoute',
        label: 'Test Drive Route Preference',
        type: 'select',
        options: [
          'Dealership Expressway Loop (12 km)',
          'City Traffic & Bumper-to-Bumper Route (5 km)',
          'Off-Road & Rough Road Suspension Test',
          'Home Doorstep Test Drive',
        ],
      },
      {
        id: 'licenseStatus',
        label: 'Driving License Status',
        type: 'select',
        options: [
          'Valid Driving License Verified',
          'Digital DL Verified via DigiLocker',
          'Will Present Physical License at Desk',
        ],
      },
      {
        id: 'drivingFocus',
        label: 'Vehicle Dynamics Customer Wants to Test',
        type: 'textarea',
        placeholder: 'e.g. Customer wants to evaluate automatic gearbox smoothness, cabin quietness (NVH), and high-speed braking...',
        required: true,
      },
    ],
  },
  negotiation: {
    stageKey: 'negotiation',
    stageTitle: 'Price & Offer Negotiation Intake',
    stageSubtitle: 'Record customer counter-offers, accessory bundles, and closing terms.',
    questions: [
      {
        id: 'targetPrice',
        label: 'Customer Expected On-Road Price (₹)',
        type: 'number',
        placeholder: 'e.g. 2420000',
        required: true,
      },
      {
        id: 'incentivesDiscussed',
        label: 'Deal Scheme / Incentive Proposed',
        type: 'select',
        options: [
          'Corporate Discount + Insurance Price Match',
          'Accessories Pack (₹35,000 value)',
          'Extended 5-Year Warranty Free',
          'Zero Depreciation Insurance Waiver',
          'Exchange Bonus Match',
        ],
      },
      {
        id: 'competitorModel',
        label: 'Alternative Vehicle Being Considered',
        type: 'text',
        placeholder: 'e.g. Tata Safari Adventure+, Hyundai Creta SX(O)',
      },
      {
        id: 'closingCondition',
        label: 'Deal Closing Condition / Action Needed',
        type: 'textarea',
        placeholder: 'e.g. Ready to book if ready delivery can be guaranteed before Diwali festival...',
      },
    ],
  },
  converted: {
    stageKey: 'converted',
    stageTitle: 'Converted Won Deal & Booking Receipt',
    stageSubtitle: 'Record token advance payment, allotted VIN, and delivery target.',
    questions: [
      {
        id: 'tokenAmount',
        label: 'Booking Token Advance Received (₹)',
        type: 'number',
        placeholder: 'e.g. 50000',
        required: true,
      },
      {
        id: 'paymentMode',
        label: 'Payment Method',
        type: 'select',
        options: [
          'UPI / QR Code Transfer',
          'Credit / Debit Card POS Swipe',
          'Direct Bank IMPS / RTGS',
          'Showroom Account Cheque',
        ],
      },
      {
        id: 'targetDeliveryDate',
        label: 'Target Handover / Delivery Date',
        type: 'text',
        placeholder: 'e.g. 2026-10-27',
      },
      {
        id: 'conversionChecklist',
        label: 'KYC & Booking Compliance Notes',
        type: 'textarea',
        placeholder: 'e.g. Form 20 signed. Token receipt #RCP-9042 issued. Loan sanction letter attached...',
      },
    ],
  },
};

export default function LeadsPage() {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(api.getLeads());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [branches] = useState(api.getBranches());
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Drag and drop states
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const emptyLeadForm = {
    customerId: '',
    branchId: '',
    source: 'Walk-in Showroom',
    preferredMake: '',
    preferredModel: '',
    preferredFuelType: '',
    budgetMin: '',
    budgetMax: '',
    notes: '',
  };

  // Form state & stage questionnaire
  const [formStage, setFormStage] = useState<LeadStatus>('new');
  const [stageQuestions, setStageQuestions] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptyLeadForm);

  const openStageModal = (stageKey: LeadStatus) => {
    setFormStage(stageKey);
    setStageQuestions({});
    setFormData(emptyLeadForm);
    setIsNewLeadModalOpen(true);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const currentQ = STAGE_QUESTION_MAP[formStage];
    const targetStageConfig = stages.find((s) => s.key === formStage) || stages[0];

    const qSummary = currentQ?.questions
      .map((q) => {
        const val = stageQuestions[q.id];
        return val ? `• ${q.label}: ${val}` : null;
      })
      .filter(Boolean)
      .join('\n');

    const combinedNotes = [
      formData.notes ? `Initial Requirements: ${formData.notes}` : null,
      qSummary ? `[${targetStageConfig.label} Stage Intake]:\n${qSummary}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const created = api.addLead({
      ...formData,
      status: formStage,
      notes: combinedNotes,
    });

    setLeads([...api.getLeads()]);
    setRecentlyMovedId(created.id);
    setTimeout(() => setRecentlyMovedId(null), 1500);
    setFormData(emptyLeadForm);
    setStageQuestions({});
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
        <button
          onClick={() => {
            setFormData(emptyLeadForm);
            setStageQuestions({});
            setFormStage('new');
            setIsNewLeadModalOpen(true);
          }}
          className="btn btn-primary btn-sm"
          style={{ borderRadius: '999px', padding: '0.45rem 1.15rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> New Lead
        </button>
      </div>

      {/* Kanban Board View */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className="kanban-col-badge"
                      style={{
                        backgroundColor: stage.badgeBg,
                        color: stage.badgeText,
                      }}
                    >
                      {stageLeads.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openStageModal(stage.key);
                      }}
                      className="kanban-col-add-btn"
                      title={`Add lead in ${stage.label}`}
                      aria-label={`Add lead to ${stage.label}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
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

      {/* New Lead Modal with Pipeline Questionnaire */}
      {(() => {
        const currentStageConfig = stages.find((s) => s.key === formStage) || stages[0];
        const currentStageQuestions = STAGE_QUESTION_MAP[formStage];
        const stageIndex = stages.findIndex((s) => s.key === formStage);

        return (
          <Modal
            isOpen={isNewLeadModalOpen}
            onClose={() => setIsNewLeadModalOpen(false)}
            maxWidth="840px"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  {currentStageQuestions?.stageTitle || 'Create New Lead'}
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '3px 11px',
                    borderRadius: '999px',
                    backgroundColor: currentStageConfig.badgeBg,
                    color: currentStageConfig.badgeText,
                    border: `1.5px solid ${currentStageConfig.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: currentStageConfig.accent }} />
                  Stage: {currentStageConfig.label}
                </span>
              </div>
            }
            footer={
              <div className="unique-modal-footer-bar">
                <button
                  type="button"
                  className="unique-btn-cancel"
                  onClick={() => setIsNewLeadModalOpen(false)}
                >
                  <ChevronLeft size={16} />
                  <span>Cancel</span>
                </button>

                <div className="unique-stage-counter-pill">
                  <span className="step-num">{stageIndex + 1} / {stages.length}</span>
                  <span className="step-dot" style={{ backgroundColor: currentStageConfig.accent }} />
                  <span className="step-label" style={{ color: currentStageConfig.accent }}>
                    {currentStageConfig.label}
                  </span>
                </div>

                <button
                  type="submit"
                  form="new-lead-form"
                  className="unique-lead-submit-btn"
                  style={{
                    ['--btn-accent' as any]: currentStageConfig.accent,
                    ['--btn-glow' as any]: currentStageConfig.glow,
                  }}
                >
                  <span className="btn-icon-pod">
                    <Sparkles size={13} />
                  </span>
                  <span className="btn-text">Create Lead in {currentStageConfig.label}</span>
                  <ArrowRight size={15} className="btn-arrow-icon" />
                </button>
              </div>
            }
          >
            <form id="new-lead-form" onSubmit={handleCreateLead} className="inspo-form-wrapper">
              {/* Target Pipeline Stage Gate Selector */}
              <div className="target-stage-selector-wrap">
                <div className="target-stage-label">
                  <span>Target Pipeline Stage</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'none', fontWeight: 500 }}>
                    Select stage to load dedicated intake questionnaire
                  </span>
                </div>
                <div className="target-stage-pills">
                  {stages.map((s) => {
                    const isActive = formStage === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setFormStage(s.key)}
                        className={`target-stage-pill ${isActive ? 'is-active' : ''}`}
                        style={{
                          ['--pill-accent' as any]: s.accent,
                          ['--pill-glow' as any]: s.glow,
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Profile & Branch Destination */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Customer Profile <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Customer Profile --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Branch Destination</label>
                  <select
                    className="form-select"
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  >
                    <option value="">-- Select Branch Destination --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Make, Model, Fuel Type */}
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">
                    Preferred Make <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.preferredMake}
                    onChange={(e) => setFormData({ ...formData, preferredMake: e.target.value })}
                    placeholder="e.g. Mahindra"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Preferred Model <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.preferredModel}
                    onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value })}
                    placeholder="e.g. XUV700"
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
                    <option value="">-- Select Fuel Type --</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Budget Range */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Budget Min (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="e.g. 2000000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Max (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="e.g. 2500000"
                  />
                </div>
              </div>

              {/* Pipeline Stage Intake & Specific Questions Container */}
              {currentStageQuestions && (
                <div
                  className="stage-intake-box"
                  style={{
                    ['--box-accent' as any]: currentStageConfig.accent,
                    ['--box-bg' as any]: currentStageConfig.lightBg,
                    ['--box-border' as any]: currentStageConfig.border,
                  }}
                >
                  <div className="stage-intake-header">
                    <Sparkles size={17} style={{ color: currentStageConfig.accent }} />
                    <span>{currentStageQuestions.stageTitle}</span>
                  </div>
                  <div className="stage-intake-desc">
                    {currentStageQuestions.stageSubtitle}
                  </div>

                  <div className="stage-intake-grid">
                    {currentStageQuestions.questions.map((q) => (
                      <div
                        key={q.id}
                        className={`form-group ${q.type === 'textarea' ? 'full-span' : ''}`}
                      >
                        <label className="form-label">
                          {q.label} {q.required && <span className="req-star">*</span>}
                        </label>
                        {q.type === 'select' ? (
                          <select
                            className="form-select"
                            value={stageQuestions[q.id] || q.options?.[0] || ''}
                            onChange={(e) => setStageQuestions({ ...stageQuestions, [q.id]: e.target.value })}
                          >
                            {q.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : q.type === 'textarea' ? (
                          <textarea
                            className="form-textarea"
                            rows={2}
                            value={stageQuestions[q.id] || ''}
                            onChange={(e) => setStageQuestions({ ...stageQuestions, [q.id]: e.target.value })}
                            placeholder={q.placeholder}
                            required={q.required}
                          />
                        ) : (
                          <input
                            type={q.type}
                            className="form-input"
                            value={stageQuestions[q.id] || ''}
                            onChange={(e) => setStageQuestions({ ...stageQuestions, [q.id]: e.target.value })}
                            placeholder={q.placeholder}
                            required={q.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Initial Notes & Requirements */}
              <div className="form-group">
                <label className="form-label">Initial Notes & Requirements</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Customer is considering top variant, requires auto transmission..."
                />
                <div className="form-helper">
                  Optional notes captured during initial consultation or intake.
                </div>
              </div>

              {/* Privacy & Compliance Notice */}
              <div className="inspo-footer-compliance" style={{ margin: '8px 0 0 0' }}>
                <ShieldCheck size={14} style={{ color: '#16A34A' }} />
                <span>© 2026 UNAI CRM · All data is encrypted per our Enterprise Security Policy</span>
              </div>
            </form>
          </Modal>
        );
      })()}

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
