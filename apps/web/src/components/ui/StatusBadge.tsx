import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  let colorClass = 'badge-neutral';

  switch (norm) {
    // Green
    case 'available':
    case 'settled':
    case 'paid':
    case 'active':
    case 'approved':
    case 'closed_won':
    case 'pass':
    case 'completed':
    case 'delivered':
      colorClass = 'badge-green';
      break;

    // Red
    case 'lost':
    case 'failed':
    case 'rejected':
    case 'cancelled':
    case 'fail':
    case 'closed_lost':
    case 'suspended':
      colorClass = 'badge-red';
      break;

    // Orange
    case 'pending':
    case 'pending_payment':
    case 'pending_clearance':
    case 'in_transit':
    case 'appointment_set':
    case 'cancel_requested':
      colorClass = 'badge-orange';
      break;

    // Blue
    case 'new':
    case 'assigned':
    case 'contacted':
    case 'confirmed':
    case 'showroom_visit':
      colorClass = 'badge-blue';
      break;

    // Teal
    case 'test_drive':
    case 'inspection':
    case 'reconditioning':
    case 'in_progress':
    case 'open':
    case 'scheduled':
      colorClass = 'badge-teal';
      break;

    // Indigo
    case 'qualified':
    case 'negotiation':
    case 'proposal':
    case 'finance':
    case 'issued':
    case 'partially_paid':
    case 'ready':
      colorClass = 'badge-indigo';
      break;

    // Violet
    case 'nurture':
    case 'trial':
      colorClass = 'badge-violet';
      break;

    // Amber
    case 'reserved':
    case 'under_review':
    case 'conditional':
    case 'waiting_parts':
      colorClass = 'badge-amber';
      break;

    default:
      colorClass = 'badge-neutral';
  }

  const label = status.replace(/_/g, ' ');

  return (
    <span className={`badge ${colorClass} ${className}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}
