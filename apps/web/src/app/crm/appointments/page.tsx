'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Appointment, Customer, Vehicle } from '@crm/shared-types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Calendar as CalendarIcon,
  Plus,
  Car,
  Clock,
  MapPin,
  Star,
  CheckCircle,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(api.getAppointments());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [vehicles] = useState<Vehicle[]>(api.getVehicles());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    vehicleId: vehicles[0]?.id || '',
    appointmentType: 'test_drive' as any,
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: '45',
    notes: '',
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    api.addAppointment(formData);
    setAppointments([...api.getAppointments()]);
    setIsModalOpen(false);
  };

  const columns: Column<Appointment>[] = [
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.customerName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Advisor: {row.assignedToName || 'Sales Desk'}
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle Model',
      accessorKey: 'vehicleName',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Car size={16} style={{ color: 'var(--color-teal)' }} />
          <span style={{ fontWeight: 600 }}>{row.vehicleName}</span>
        </div>
      ),
    },
    {
      header: 'Appointment Type',
      cell: (row) => <StatusBadge status={row.appointmentType} />,
    },
    {
      header: 'Schedule',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
            {new Date(row.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={12} /> {new Date(row.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({row.durationMinutes} min)
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedApt(row)}
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div>
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
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <DataTable
            data={appointments}
            columns={columns}
            searchPlaceholder="Search appointments by customer or vehicle..."
          />
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Test Drive or Showroom Visit"
      >
        <form onSubmit={handleCreateAppointment}>
          <div className="form-group">
            <label className="form-label">Customer</label>
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

          <div className="form-group">
            <label className="form-label">Vehicle for Test Drive</label>
            <select
              className="form-select"
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.variant}) — {v.color}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
              >
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
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date and Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
            >
            </input>
          </div>

          <div className="form-group">
            <label className="form-label">Special Route or Customer Instructions</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Test drive on coastal highway to demonstrate ADAS and cruise control..."
            />
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
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* Appointment Detail Modal */}
      {selectedApt && (
        <Modal
          isOpen={!!selectedApt}
          onClose={() => setSelectedApt(null)}
          title={`Booking: ${selectedApt.appointmentType.replace('_', ' ')}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedApt.customerName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Vehicle: {selectedApt.vehicleName}</div>
              </div>
              <StatusBadge status={selectedApt.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Scheduled Timing:</span>
                <div style={{ fontWeight: 600 }}>{new Date(selectedApt.scheduledAt).toLocaleString()}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Assigned Executive:</span>
                <div style={{ fontWeight: 600 }}>{selectedApt.assignedToName || 'John Fernandes'}</div>
              </div>
            </div>

            {selectedApt.notes && (
              <div style={{ fontSize: '0.8125rem', backgroundColor: 'var(--color-teal-bg)', border: '1px solid var(--color-teal-border)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <strong>Route & Notes:</strong> {selectedApt.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedApt(null)}>
                Close
              </button>
              <button
                className="btn btn-success"
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
