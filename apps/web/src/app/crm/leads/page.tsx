'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { getTestDrives, fetchTestDrives } from '@/lib/test-drive-store';
import { ALL_CAR_BRANDS, getModelsForBrand } from '@/lib/car-catalog';
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
  Edit3,
  X,
  MessageSquare,
  AlertCircle,
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
    stageTitle: 'New Enquiries Intake Checklist',
    stageSubtitle: 'Capture inbound enquiry details, purchase timeline, and customer question.',
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
        label: 'Customer Initial Enquiry & Vehicle Requirement',
        type: 'textarea',
        placeholder: 'e.g. Enquiring about AX7L diesel AWD ready stock, delivery timeline, and warranty...',
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Drag and drop states
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<{
    lead: Lead;
    fromStatus: LeadStatus;
    toStatus: LeadStatus;
    note: string;
  } | null>(null);

  React.useEffect(() => {
    setMounted(true);

    const syncFromActivities = (drivesList = getTestDrives()) => {
      api.reconcilePipelineFromActivities(drivesList);
      setLeads([...api.getLeads()]);
      setCustomers([...api.getCustomers()]);
      setBranches([...api.getBranches()]);
    };

    syncFromActivities();

    Promise.all([
      api.fetchCustomers(),
      api.fetchLeads(),
      api.fetchAppointments(),
      api.fetchBranches(),
      fetchTestDrives(),
    ]).then(([, , , , remoteDrives]) => {
      syncFromActivities(Array.isArray(remoteDrives) ? remoteDrives : getTestDrives());
    });

    const handleDataChanged = () => {
      setLeads([...api.getLeads()]);
      setCustomers([...api.getCustomers()]);
      setBranches([...api.getBranches()]);
    };
    const handleTestDrivesChanged = () => {
      syncFromActivities(getTestDrives());
    };
    window.addEventListener('crm-data-changed', handleDataChanged);
    window.addEventListener('crm-testdrives-changed', handleTestDrivesChanged);
    return () => {
      window.removeEventListener('crm-data-changed', handleDataChanged);
      window.removeEventListener('crm-testdrives-changed', handleTestDrivesChanged);
    };
  }, []);

  const emptyLeadForm = {
    customerId: '',
    branchId: '',
    source: '',
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
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  const openStageModal = (stageKey: LeadStatus) => {
    setEditingLeadId(null);
    setFormStage(stageKey);
    setStageQuestions({});
    setFormData(emptyLeadForm);
    setIsNewLeadModalOpen(true);
  };

  const handleStartEditLead = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setFormStage(lead.status);
    setFormData({
      customerId: lead.customerId || '',
      branchId: lead.branchId || '',
      source: lead.source || 'Walk-in Showroom',
      preferredMake: lead.preferredMake || '',
      preferredModel: lead.preferredModel || '',
      preferredFuelType: lead.preferredFuelType || '',
      budgetMin: lead.budgetMin ? String(lead.budgetMin) : '',
      budgetMax: lead.budgetMax ? String(lead.budgetMax) : '',
      notes: lead.notes || '',
    });
    setStageQuestions({});
    setSelectedLead(null);
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

    if (editingLeadId) {
      api.updateLead(editingLeadId, {
        ...formData,
        budgetMin: formData.budgetMin ? Number(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? Number(formData.budgetMax) : undefined,
        status: formStage,
        notes: combinedNotes || formData.notes,
      });
      setEditingLeadId(null);
    } else {
      const created = api.addLead({
        ...formData,
        status: formStage,
        notes: combinedNotes,
      });
      setRecentlyMovedId(created.id);
      setTimeout(() => setRecentlyMovedId(null), 1500);
    }

    setLeads([...api.getLeads()]);
    setFormData(emptyLeadForm);
    setStageQuestions({});
    setIsNewLeadModalOpen(false);
  };

  const commitStageTransition = (leadId: string, newStatus: LeadStatus, remark?: string) => {
    setTransitionError(null);
    if (remark && remark.trim()) {
      const target = api.getLeads().find((l) => l.id === leadId);
      if (target) {
        const stageLabel = stages.find((s) => s.key === newStatus)?.label || newStatus;
        const appended = `[Moved to ${stageLabel}]: ${remark.trim()}`;
        api.updateLead(leadId, {
          notes: target.notes ? `${target.notes}\n${appended}` : appended,
        });
      }
    }
    api.updateLeadStatus(leadId, newStatus);
    setLeads([...api.getLeads()]);
    setRecentlyMovedId(leadId);
    setTimeout(() => setRecentlyMovedId(null), 1400);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleStageTransition = (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    if (lead.status === newStatus) return;

    // Validate state transition using business rules engine
    const isAllowed = validateLeadTransition(lead.status, newStatus);
    if (!isAllowed) {
      setTransitionError(`Transition from '${lead.status}' to '${newStatus}' is not allowed in sales lifecycle.`);
      setTimeout(() => setTransitionError(null), 4500);
      return;
    }

    // Require explicit confirmation dialog when moving customer enquiry out of Contacted stage
    if (lead.status === 'contacted') {
      setPendingTransition({
        lead,
        fromStatus: lead.status,
        toStatus: newStatus,
        note: '',
      });
      return;
    }

    commitStageTransition(leadId, newStatus);
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
      label: 'New Enquiries',
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
          style={{
            borderRadius: '999px',
            padding: '0.45rem 1.15rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
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
                      suppressHydrationWarning
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

                        {/* Workflow Progression & Quick Action Options */}
                        <div
                          className="kanban-card-actions"
                          style={{
                            marginTop: '9px',
                            paddingTop: '8px',
                            borderTop: '1px dashed rgba(15, 23, 42, 0.09)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.status === 'new' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <button
                                type="button"
                                onClick={() => handleStageTransition(lead.id, 'contacted')}
                                style={{
                                  flex: 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  backgroundColor: '#EEF2FF',
                                  color: '#4338CA',
                                  border: '1px solid rgba(79, 70, 229, 0.3)',
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#4F46E5';
                                  e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#EEF2FF';
                                  e.currentTarget.style.color = '#4338CA';
                                }}
                                title="Customer has been contacted - advance to Contacted"
                              >
                                <Phone size={11} />
                                <span>Mark Contacted →</span>
                              </button>
                              {((lead as any).customerPhone || lead.customer?.phone) && (
                                <a
                                  href={`tel:${(lead as any).customerPhone || lead.customer?.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  title={`Call ${(lead as any).customerPhone || lead.customer?.phone}`}
                                  style={{
                                    padding: '5px 7px',
                                    borderRadius: '8px',
                                    backgroundColor: '#F8FAFC',
                                    color: '#475569',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Phone size={11} />
                                </a>
                              )}
                            </div>
                          )}

                          {lead.status === 'contacted' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.67rem', color: '#64748B', fontWeight: 600 }}>
                                <span>Contacted Options:</span>
                                {((lead as any).customerPhone || lead.customer?.phone) && (
                                  <a
                                    href={`https://wa.me/${String((lead as any).customerPhone || lead.customer?.phone).replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: '#16A34A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.67rem' }}
                                    title="Open WhatsApp chat"
                                  >
                                    <MessageSquare size={10} /> WhatsApp
                                  </a>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStageTransition(lead.id, 'qualified')}
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#F5F3FF',
                                    color: '#6D28D9',
                                    border: '1px solid rgba(124, 58, 237, 0.25)',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Requirement & budget qualified"
                                >
                                  <CheckCircle2 size={10} />
                                  <span>Qualify</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStageTransition(lead.id, 'appointment_set')}
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#FFFBEB',
                                    color: '#B45309',
                                    border: '1px solid rgba(217, 119, 6, 0.25)',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Schedule showroom appointment"
                                >
                                  <Calendar size={10} />
                                  <span>Appt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStageTransition(lead.id, 'test_drive')}
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#F0FDFA',
                                    color: '#0F766E',
                                    border: '1px solid rgba(13, 148, 136, 0.25)',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Book test drive demo"
                                >
                                  <Car size={10} />
                                  <span>Drive</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {lead.status === 'qualified' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleStageTransition(lead.id, 'appointment_set')}
                                style={{
                                  flex: 1,
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  backgroundColor: '#FFFBEB',
                                  color: '#B45309',
                                  border: '1px solid rgba(217, 119, 6, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Calendar size={10} />
                                <span>Set Appointment →</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStageTransition(lead.id, 'test_drive')}
                                style={{
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  backgroundColor: '#F0FDFA',
                                  color: '#0F766E',
                                  border: '1px solid rgba(13, 148, 136, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Test Drive
                              </button>
                            </div>
                          )}

                          {lead.status === 'appointment_set' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleStageTransition(lead.id, 'test_drive')}
                                style={{
                                  flex: 1,
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  backgroundColor: '#F0FDFA',
                                  color: '#0F766E',
                                  border: '1px solid rgba(13, 148, 136, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Car size={10} />
                                <span>Start Test Drive →</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStageTransition(lead.id, 'negotiation')}
                                style={{
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  backgroundColor: '#FFF1F2',
                                  color: '#BE123C',
                                  border: '1px solid rgba(225, 29, 72, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Negotiate
                              </button>
                            </div>
                          )}

                          {lead.status === 'test_drive' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleStageTransition(lead.id, 'negotiation')}
                                style={{
                                  flex: 1,
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  backgroundColor: '#FFF1F2',
                                  color: '#BE123C',
                                  border: '1px solid rgba(225, 29, 72, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <span>Commercial Negotiation →</span>
                              </button>
                            </div>
                          )}

                          {lead.status === 'negotiation' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleStageTransition(lead.id, 'converted')}
                                style={{
                                  flex: 1,
                                  padding: '4px 7px',
                                  borderRadius: '6px',
                                  backgroundColor: '#F0FDF4',
                                  color: '#15803D',
                                  border: '1px solid rgba(22, 163, 74, 0.25)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Sparkles size={10} />
                                <span>Win & Convert Deal 🎉</span>
                              </button>
                            </div>
                          )}

                          {lead.status === 'converted' && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803D', fontSize: '0.7rem', fontWeight: 700, padding: '2px 0' }}>
                              <CheckCircle2 size={12} />
                              <span>Deal Converted / Won</span>
                            </div>
                          )}
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
            onClose={() => {
              setIsNewLeadModalOpen(false);
              setEditingLeadId(null);
            }}
            maxWidth="840px"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  {editingLeadId ? 'Edit Lead Details' : (currentStageQuestions?.stageTitle || 'Create New Lead')}
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
                  onClick={() => {
                    setIsNewLeadModalOpen(false);
                    setEditingLeadId(null);
                  }}
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
                  <span className="btn-text">
                    {editingLeadId ? 'Save Lead Changes' : `Create Lead in ${currentStageConfig.label}`}
                  </span>
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
                  <select
                    className="form-select"
                    value={formData.preferredMake}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredMake: e.target.value,
                        preferredModel: '',
                      })
                    }
                    required
                  >
                    <option value="">-- Select Car Brand --</option>
                    {ALL_CAR_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                    {formData.preferredMake && !ALL_CAR_BRANDS.includes(formData.preferredMake) && (
                      <option value={formData.preferredMake}>{formData.preferredMake}</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Preferred Model <span className="req-star">*</span>
                  </label>
                  {getModelsForBrand(formData.preferredMake).length > 0 ? (
                    <select
                      className="form-select"
                      value={formData.preferredModel}
                      onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value })}
                      required
                    >
                      <option value="">-- Select Model --</option>
                      {getModelsForBrand(formData.preferredMake).map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                      {formData.preferredModel &&
                        !getModelsForBrand(formData.preferredMake).includes(formData.preferredModel) && (
                          <option value={formData.preferredModel}>{formData.preferredModel}</option>
                        )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      value={formData.preferredModel}
                      onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value })}
                      placeholder={formData.preferredMake ? 'Enter preferred model' : 'Select brand first'}
                      required
                    />
                  )}
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
                    placeholder="Enter minimum budget (₹)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Max (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="Enter maximum budget (₹)"
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
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => handleStartEditLead(selectedLead)}
                title="Edit lead details"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedLead(null)}
                title="Close lead details"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Contact & Communication Bar */}
            {((selectedLead as any).customerPhone || selectedLead.customer?.phone) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                    Phone: {(selectedLead as any).customerPhone || selectedLead.customer?.phone}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a
                    href={`tel:${(selectedLead as any).customerPhone || selectedLead.customer?.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      border: '1px solid #BFDBFE',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Phone size={12} /> Call Customer
                  </a>
                  <a
                    href={`https://wa.me/${String((selectedLead as any).customerPhone || selectedLead.customer?.phone).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#F0FDF4',
                      color: '#15803D',
                      border: '1px solid #BBF7D0',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <MessageSquare size={12} /> WhatsApp
                  </a>
                </div>
              </div>
            )}

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


          </div>
        </Modal>
      )}

      {/* State Transition Error Toast */}
      {transitionError && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #FECACA',
            color: '#991B1B',
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
          <span>{transitionError}</span>
          <button
            type="button"
            onClick={() => setTransitionError(null)}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#991B1B',
              padding: '2px',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Stage Transition Confirmation Dialog (Contacted -> Next Stage) */}
      <Modal
        isOpen={!!pendingTransition}
        onClose={() => setPendingTransition(null)}
        title="Confirm Stage Progression"
        maxWidth="460px"
      >
        {pendingTransition && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Customer Enquiry
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {pendingTransition.lead.customerName || 'Customer'}
              </div>
              {(pendingTransition.lead.preferredMake || pendingTransition.lead.preferredModel) && (
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                  {pendingTransition.lead.preferredMake} {pendingTransition.lead.preferredModel}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#4338CA' }}>
                {stages.find((s) => s.key === pendingTransition.fromStatus)?.label || pendingTransition.fromStatus}
              </span>
              <ArrowRight size={16} style={{ color: '#6366F1' }} />
              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0F172A' }}>
                {stages.find((s) => s.key === pendingTransition.toStatus)?.label || pendingTransition.toStatus}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to move this customer enquiry from{' '}
              <strong>
                {stages.find((s) => s.key === pendingTransition.fromStatus)?.label || pendingTransition.fromStatus}
              </strong>{' '}
              to{' '}
              <strong>
                {stages.find((s) => s.key === pendingTransition.toStatus)?.label || pendingTransition.toStatus}
              </strong>
              ?
            </p>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                Call / Follow-up Remark (Optional)
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={pendingTransition.note}
                onChange={(e) =>
                  setPendingTransition((prev) => (prev ? { ...prev, note: e.target.value } : null))
                }
                placeholder="e.g. Customer confirmed interest, moving forward..."
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPendingTransition(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const { lead, toStatus, note } = pendingTransition;
                  setPendingTransition(null);
                  commitStageTransition(lead.id, toStatus, note);
                }}
              >
                <CheckCircle2 size={15} style={{ marginRight: '6px' }} />
                Confirm Move
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
