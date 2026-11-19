'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import { Modal } from '@/components/ui/Modal';
import { ToastBanner, useToast } from '@/components/ui/Toast';
import { SearchableCarSelect } from '@/components/ui/SearchableCarSelect';
import { buildInventoryCarOptions } from '@/lib/data/car-catalog';
import { api } from '@/lib/client/api-client';
import {
  getTestDrives,
  fetchTestDrives,
  addTestDrive,
  updateTestDrive,
  deleteTestDrive,
  initTestDrivesRealtime,
  TestDrive,
} from '@/lib/client/stores/test-drive-store';
import {
  Gauge,
  Plus,
  Search,
  Car,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Printer,
  ShieldCheck,
  Star,
} from 'lucide-react';

export default function TestDrivesPage() {
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDriveForComplete, setSelectedDriveForComplete] = useState<TestDrive | null>(null);
  const [endOdo, setEndOdo] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const { toast, showToast, dismissToast } = useToast(3200);

  // New Drive Form
  const [newDriveForm, setNewDriveForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleName: '',
    vehicleReg: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '',
    durationMinutes: 45,
    assignedStaff: '',
    dlNumber: '',
    kycVerified: false,
    startOdo: 0,
    route: '',
  });

  useEffect(() => {
    setTestDrives(getTestDrives());
    fetchTestDrives().then((data) => {
      if (Array.isArray(data)) setTestDrives([...data]);
    });
    initTestDrivesRealtime();
    const handleChanged = () => setTestDrives(getTestDrives());
    window.addEventListener('crm-testdrives-changed', handleChanged);
    return () => window.removeEventListener('crm-testdrives-changed', handleChanged);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveForm.customerName.trim()) return;

    const created = addTestDrive(newDriveForm);
    // Sync newly scheduled test drive directly to Sales Pipeline -> Test Drive stage
    api.syncLeadStageForActivity({
      customerName: created.customerName,
      customerPhone: created.customerPhone,
      customerEmail: created.customerEmail,
      vehicleName: created.vehicleName,
      targetStage: 'test_drive',
      notes: `Test Drive Scheduled (${created.driveCode}) on ${created.date}${created.timeSlot ? ` (${created.timeSlot})` : ''} — ${created.vehicleName}${created.route ? ` | Route: ${created.route}` : ''}`,
      nextActionAt: created.date,
      source: 'Test Drive Desk',
    });
    setIsAddModalOpen(false);
    showToast(`Test drive scheduled for ${created.customerName} (${created.driveCode}) & synced to Pipeline!`);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriveForComplete) return;

    updateTestDrive(selectedDriveForComplete.id, {
      status: 'completed',
      endOdo: Number(endOdo) || selectedDriveForComplete.startOdo + 15,
      feedback: feedback || 'Completed successfully.',
      rating,
    });

    setSelectedDriveForComplete(null);
    setEndOdo('');
    setFeedback('');
    showToast(`Test drive ${selectedDriveForComplete.driveCode} marked as COMPLETED.`);
  };

  const inventoryCarOptions = useMemo(
    () => buildInventoryCarOptions(api.getVehicles(), { includeYear: true }),
    []
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return testDrives.filter((td) => {
      const matchStatus = statusFilter === 'All' || td.status === statusFilter;
      const matchQuery =
        !q ||
        td.customerName.toLowerCase().includes(q) ||
        td.vehicleName.toLowerCase().includes(q) ||
        td.driveCode.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [testDrives, statusFilter, search]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <ToastBanner toast={toast} onDismiss={dismissToast} />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Dealership Test Drive Operations" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Vehicle allocation, driver license & KYC verification, staff pilots, live odometer tracking, and customer feedback."
              baseDelay={0.18}
              staggerDelay={0.025}
            />
          </p>
        </div>

        <button
          type="button"
          className="unique-lead-submit-btn"
          onClick={() => setIsAddModalOpen(true)}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Plus size={15} />
          <span className="btn-text">Schedule Test Drive</span>
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
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test drive, customer, vehicle..."
            style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '34px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['All', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: statusFilter === st ? '#6253F8' : '#E2E8F0',
                backgroundColor: statusFilter === st ? '#6253F8' : '#FFFFFF',
                color: statusFilter === st ? '#FFFFFF' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Test Drives Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px dashed #CBD5E1',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              No Test Drives Scheduled Yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px' }}>
              Schedule customer test drives, assign vehicle inventory, record odometer readings, gate passes, and customer feedback.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#6253F8',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>+</span> Schedule First Test Drive
            </button>
          </div>
        ) : (
          filtered.map((td) => (
          <div
            key={td.id}
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
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Car size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                      {td.vehicleName}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.74rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                      {td.vehicleReg}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background:
                          td.status === 'completed'
                            ? '#E6F4EF'
                            : td.status === 'in_progress'
                            ? '#FEF3C7'
                            : '#EFF6FF',
                        color:
                          td.status === 'completed'
                            ? '#16A34A'
                            : td.status === 'in_progress'
                            ? '#B45309'
                            : '#2563EB',
                      }}
                    >
                      {td.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    Drive #{td.driveCode} • Customer: <strong style={{ color: '#0F172A' }}>{td.customerName}</strong> ({td.customerPhone})
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {td.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateTestDrive(td.id, { status: 'in_progress' });
                      showToast(`Test drive ${td.driveCode} started!`);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#D97706',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Start Drive
                  </button>
                )}

                {td.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDriveForComplete(td);
                      setEndOdo(String(td.startOdo + 15));
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Complete & Log Odo
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Print Gate Pass
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                fontSize: '0.78rem',
              }}
            >
              <div>
                <span style={{ color: '#64748B' }}>Time Slot: </span>
                <strong style={{ color: '#0F172A' }}>{td.date} • {td.timeSlot}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Staff Pilot: </span>
                <strong style={{ color: '#0F172A' }}>{td.assignedStaff}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Driving License: </span>
                <span style={{ color: td.kycVerified ? '#16A34A' : '#EF4444', fontWeight: 700 }}>
                  {td.kycVerified ? `✓ Verified (${td.dlNumber})` : 'Pending'}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Odometer: </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {td.startOdo} km {td.endOdo ? `→ ${td.endOdo} km (+${td.endOdo - td.startOdo} km)` : ''}
                </span>
              </div>
            </div>

            {td.feedback && (
              <div style={{ fontSize: '0.78rem', color: '#334155', fontStyle: 'italic', paddingLeft: '4px' }}>
                &ldquo;{td.feedback}&rdquo; {td.rating ? `• Rating: ${'★'.repeat(td.rating)}` : ''}
              </div>
            )}
          </div>
        ))
      )}
      </div>

      {/* Schedule Test Drive Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Schedule Dealership Test Drive"
          maxWidth="680px"
        >
          <form onSubmit={handleCreate} className="inspo-form-wrapper">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Customer Name <span className="req-star">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.customerName}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, customerName: e.target.value })}
                  placeholder="e.g. Anand Mahindra"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Phone <span className="req-star">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.customerPhone}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, customerPhone: e.target.value })}
                  placeholder="+91 98200 11223"
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Allocated Vehicle</label>
                <SearchableCarSelect
                  value={newDriveForm.vehicleName}
                  onChange={(val) => setNewDriveForm({ ...newDriveForm, vehicleName: val })}
                  inventoryOptions={inventoryCarOptions}
                  placeholder="Search or select test drive vehicle..."
                  openDirection="down"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Staff Pilot</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.assignedStaff}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, assignedStaff: e.target.value })}
                  placeholder="e.g. Sales Consultant"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newDriveForm.date}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDriveForm.timeSlot}
                  onChange={(e) => setNewDriveForm({ ...newDriveForm, timeSlot: e.target.value })}
                  placeholder="03:00 PM - 03:45 PM"
                  required
                />
              </div>
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
                <span className="btn-text">Schedule Test Drive</span>
                <ChevronRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Modal */}
      {selectedDriveForComplete && (
        <Modal
          isOpen={!!selectedDriveForComplete}
          onClose={() => setSelectedDriveForComplete(null)}
          title={`Complete Test Drive — ${selectedDriveForComplete.driveCode}`}
        >
          <form onSubmit={handleComplete} className="inspo-form-wrapper">
            <div className="form-group">
              <label className="form-label">Ending Odometer (km)</label>
              <input
                type="number"
                className="form-input no-spinner"
                value={endOdo}
                onChange={(e) => setEndOdo(e.target.value)}
                placeholder={`e.g. ${selectedDriveForComplete.startOdo + 15}`}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Feedback</label>
              <textarea
                className="form-input"
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback on ride quality, pickup, features..."
              />
            </div>
            <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="unique-btn-cancel"
                onClick={() => setSelectedDriveForComplete(null)}
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <button type="submit" className="unique-lead-submit-btn">
                <span className="btn-text">Finish & Save</span>
                <CheckCircle2 size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
