'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Appointment, Customer, Vehicle } from '@crm/shared-types';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  Calendar as CalendarIcon,
  Plus,
  Car,
  Clock,
  MapPin,
  CheckCircle,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Edit3,
  User,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(api.getAppointments());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [vehicles] = useState<Vehicle[]>(api.getVehicles());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [editingAptId, setEditingAptId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'test_drive' | 'showroom_visit' | 'confirmed' | 'completed'>('all');

  const emptyFormData = {
    customerId: '',
    vehicleId: '',
    appointmentType: '' as any,
    scheduledAt: '',
    durationMinutes: '',
    notes: '',
  };

  const [formData, setFormData] = useState(emptyFormData);

  const handleStartEdit = (apt: Appointment) => {
    setFormData({
      customerId: apt.customerId,
      vehicleId: apt.vehicleId || vehicles[0]?.id || '',
      appointmentType: apt.appointmentType,
      scheduledAt: new Date(apt.scheduledAt).toISOString().slice(0, 16),
      durationMinutes: String(apt.durationMinutes || '45'),
      notes: apt.notes || '',
    });
    setEditingAptId(apt.id);
    setSelectedApt(null);
    setIsModalOpen(true);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAptId) {
      // In-memory update
      const existing = appointments.find((a) => a.id === editingAptId);
      if (existing) {
        const cust = customers.find((c) => c.id === formData.customerId);
        const veh = vehicles.find((v) => v.id === formData.vehicleId);
        Object.assign(existing, {
          ...formData,
          customerName: cust ? `${cust.firstName} ${cust.lastName}` : existing.customerName,
          vehicleName: veh ? `${veh.year} ${veh.make} ${veh.model}` : existing.vehicleName,
        });
      }
      setEditingAptId(null);
    } else {
      api.addAppointment(formData);
    }
    setAppointments([...api.getAppointments()]);
    setIsModalOpen(false);
    setFormData(emptyFormData);
  };

  // Filtered List
  const filteredAppointments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return appointments.filter((apt) => {
      // Filter Category
      if (activeFilter === 'test_drive' && apt.appointmentType !== 'test_drive') return false;
      if (activeFilter === 'showroom_visit' && apt.appointmentType !== 'showroom_visit') return false;
      if (activeFilter === 'confirmed' && apt.status !== 'confirmed') return false;
      if (activeFilter === 'completed' && apt.status !== 'completed') return false;

      // Query
      if (!q) return true;
      const cName = (apt.customerName || '').toLowerCase();
      const vName = (apt.vehicleName || '').toLowerCase();
      const advisor = (apt.assignedToName || '').toLowerCase();
      const type = (apt.appointmentType || '').toLowerCase();
      return cName.includes(q) || vName.includes(q) || advisor.includes(q) || type.includes(q);
    });
  }, [appointments, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: appointments.length,
      test_drive: appointments.filter((a) => a.appointmentType === 'test_drive').length,
      showroom_visit: appointments.filter((a) => a.appointmentType === 'showroom_visit').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
    };
  }, [appointments]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Appointments & Test Drive Calendar" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Organize customer showroom visits, highway test drive routes, vehicle availability, and feedback."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAptId(null);
            setFormData(emptyFormData);
            setIsModalOpen(true);
          }}
          className="btn btn-primary btn-sm"
          style={{
            borderRadius: '999px',
            padding: '0.45rem 1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Unique Search Bar & Filters */}
      <div className="unique-search-wrapper">
        <div className="unique-search-bar">
          <div className="search-lens-pod">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="search-input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search appointments by customer, vehicle model, advisor, or type..."
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <div className="search-kbd-badge">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="search-controls-row">
          <div className="search-filter-pills">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`search-filter-pill ${activeFilter === 'all' ? 'is-active' : ''}`}
            >
              <span>All Appointments</span>
              <span className="pill-count">{counts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('test_drive')}
              className={`search-filter-pill ${activeFilter === 'test_drive' ? 'is-active' : ''}`}
            >
              <span>Test Drive</span>
              <span className="pill-count">{counts.test_drive}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('showroom_visit')}
              className={`search-filter-pill ${activeFilter === 'showroom_visit' ? 'is-active' : ''}`}
            >
              <span>Showroom Visit</span>
              <span className="pill-count">{counts.showroom_visit}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('confirmed')}
              className={`search-filter-pill ${activeFilter === 'confirmed' ? 'is-active' : ''}`}
            >
              <span>Confirmed</span>
              <span className="pill-count">{counts.confirmed}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className={`search-filter-pill ${activeFilter === 'completed' ? 'is-active' : ''}`}
            >
              <span>Completed</span>
              <span className="pill-count">{counts.completed}</span>
            </button>
          </div>

          <div className="search-results-counter">
            Showing <strong>{filteredAppointments.length}</strong> of {appointments.length} Appointments
          </div>
        </div>
      </div>

      {/* Table-Wise Row Cards List */}
      {filteredAppointments.length > 0 ? (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '2.2fr 2fr 1.3fr 1.8fr 1.1fr 130px' }}
          >
            <div>Customer</div>
            <div>Vehicle Model</div>
            <div>Type</div>
            <div>Schedule</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          <div className="app-cards-list">
            {filteredAppointments.map((apt, index) => {
              const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];
              const aptDate = new Date(apt.scheduledAt);

              return (
                <div
                  key={apt.id}
                  className="app-row-card"
                  style={{
                    ['--grid-cols' as any]: '2.2fr 2fr 1.3fr 1.8fr 1.1fr 130px',
                    ['--theme-accent' as any]: palette.accent,
                    ['--theme-border' as any]: palette.border,
                    ['--theme-glow' as any]: palette.glow,
                    ['--theme-badge-bg' as any]: palette.badgeBg,
                    ['--theme-badge-text' as any]: palette.badgeText,
                  }}
                >
                  {/* Customer */}
                  <div className="app-row-cell-main">
                    <div className="app-row-avatar">
                      <User size={18} />
                    </div>
                    <div className="app-row-title-wrap">
                      <span className="app-row-title">{apt.customerName}</span>
                      <span className="app-row-subtitle">
                        Advisor: {apt.assignedToName || 'Sales Desk'}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Model */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Car size={16} style={{ color: palette.accent, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1E293B' }} className="text-truncate">
                      {apt.vehicleName}
                    </span>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <StatusBadge status={apt.appointmentType} />
                  </div>

                  {/* Schedule */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0F172A' }}>
                      {aptDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      <span>{aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({apt.durationMinutes} min)</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={apt.status} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="app-action-btn"
                      onClick={() => setSelectedApt(apt)}
                      title="View appointment details"
                    >
                      <span>Details</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px dashed #CBD5E1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
            }}
          >
            <CalendarIcon size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            No matching appointments found
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '380px' }}>
            We couldn&apos;t find any appointments matching &ldquo;{searchQuery}&rdquo;. Try adjusting your search query or reset the filters.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            style={{ marginTop: '6px' }}
          >
            Clear Search & Filters
          </button>
        </div>
      )}

      {/* Book / Edit Appointment Modal (Inspo Form UI Image 2) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAptId(null);
          setFormData(emptyFormData);
        }}
        title={editingAptId ? 'Edit Appointment' : 'Schedule Test Drive or Showroom Visit'}
        maxWidth="680px"
      >
        <form onSubmit={handleCreateAppointment} className="inspo-form-wrapper">
          <div className="form-group">
            <label className="form-label">
              Customer <span className="req-star">*</span>
            </label>
            <select
              className="form-select"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Vehicle for Test Drive <span className="req-star">*</span>
            </label>
            <select
              className="form-select"
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              required
            >
              <option value="">Select Vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.variant}) — {v.color}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
              >
                <option value="">Select Type...</option>
                <option value="test_drive">Test Drive Highway/City</option>
                <option value="showroom_visit">Showroom Consultation</option>
                <option value="document_pickup">Document Signing</option>
                <option value="delivery">Vehicle Delivery</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <select
                className="form-select"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              >
                <option value="">Select Duration...</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Date and Time <span className="req-star">*</span>
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Special Route or Customer Instructions</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter special route or customer instructions..."
            />
          </div>

          {/* Modern Inspo Footer Bar */}
          <div className="unique-modal-footer-bar" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => {
                setIsModalOpen(false);
                setEditingAptId(null);
                setFormData(emptyFormData);
              }}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
            >
              <span className="btn-text">{editingAptId ? 'Save Changes' : 'Confirm Appointment'}</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Appointment Detail Modal with Top Edit and Close Buttons */}
      {selectedApt && (
        <Modal
          isOpen={!!selectedApt}
          onClose={() => setSelectedApt(null)}
          title={`Booking: ${selectedApt.appointmentType.replace('_', ' ')}`}
          maxWidth="680px"
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => handleStartEdit(selectedApt)}
                title="Edit appointment"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedApt(null)}
                title="Close modal"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.2rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>{selectedApt.customerName}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Car size={14} style={{ color: '#0284C7' }} />
                  <span>{selectedApt.vehicleName}</span>
                </div>
              </div>
              <StatusBadge status={selectedApt.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>Scheduled Timing</span>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{new Date(selectedApt.scheduledAt).toLocaleString()}</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Executive</span>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedApt.assignedToName || 'John Fernandes'}</div>
              </div>
            </div>

            {selectedApt.notes && (
              <div style={{ fontSize: '0.82rem', backgroundColor: '#F0FDFA', border: '1.5px solid #99F6E4', padding: '0.9rem', borderRadius: '14px', color: '#0F766E' }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Route & Instructions:</strong>
                {selectedApt.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '4px' }}>
              <button
                type="button"
                className="btn btn-success"
                style={{
                  borderRadius: '999px',
                  padding: '0.45rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => {
                  alert('Test drive marked completed! Customer feedback recorded.');
                  setSelectedApt(null);
                }}
              >
                <CheckCircle size={15} /> Mark Drive Completed
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
