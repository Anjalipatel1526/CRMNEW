'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Deal, DealStage } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import {
  Briefcase,
  CheckCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  Car,
  ArrowRight,
} from 'lucide-react';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>(api.getDeals());
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const stages: { key: DealStage; label: string }[] = [
    { key: 'initiated', label: '1. Initiated' },
    { key: 'documents', label: '2. KYC Docs' },
    { key: 'finance', label: '3. Finance / Loan' },
    { key: 'pdi', label: '4. PDI Inspection' },
    { key: 'ready', label: '5. Ready for Delivery' },
    { key: 'delivered', label: '6. Delivered' },
  ];

  const totalValue = deals.reduce((sum, d) => sum + d.grandTotal, 0);
  const totalPaid = deals.reduce((sum, d) => sum + d.amountPaid, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Deals & Gate Clearance Pipeline</h1>
          <p className="page-desc">
            Deal closing progress, 5-stage handover gates (Payment, Documents, Finance, PDI, Delivery).
          </p>
        </div>
      </div>

      <div className="grid-3">
        <StatCard
          title="Active Deal Value"
          value={`₹${(totalValue / 100000).toFixed(2)} Lakh`}
          sub={`${deals.length} deals in closing stages`}
          icon={<Briefcase size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Deposits Received"
          value={`₹${(totalPaid / 100000).toFixed(2)} Lakh`}
          sub="Bank verified advance tokens"
          icon={<CreditCard size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Pending Gate Approvals"
          value="1 Deal"
          sub="HDFC Bank loan disbursement pending"
          icon={<Clock size={18} />}
          accentColor="orange"
        />
      </div>

      {/* Deals Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Active Deals Under Execution</h2>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal Number</th>
                <th>Customer & Vehicle</th>
                <th>Current Stage</th>
                <th>Total Value</th>
                <th>Advance Paid</th>
                <th>Balance Due</th>
                <th>Financing</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td>
                    <strong style={{ color: 'var(--color-indigo)' }}>{deal.dealNumber}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{deal.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {deal.vehicleName}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={deal.stage} />
                  </td>
                  <td>
                    <strong>₹{(deal.grandTotal / 100000).toFixed(2)} Lakh</strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                      ₹{(deal.amountPaid / 100000).toFixed(2)} L
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>
                      ₹{(deal.balanceDue / 100000).toFixed(2)} L
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem' }}>{deal.lenderName || 'Direct Cash'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{deal.loanStatus}</div>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      Clearance Gates
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deal Detail & Gate Clearance Modal */}
      {selectedDeal && (
        <Modal
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          title={`Deal Gate Clearance: ${selectedDeal.dealNumber}`}
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedDeal.customerName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{selectedDeal.vehicleName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-indigo)' }}>
                  ₹{(selectedDeal.grandTotal / 100000).toFixed(2)} Lakh
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Balance: ₹{(selectedDeal.balanceDue / 100000).toFixed(2)} L
                </div>
              </div>
            </div>

            {/* Delivery Gates Checklist */}
            <div className="card">
              <div className="card-header" style={{ padding: '0.75rem 1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mandatory Pre-Delivery Clearance Gates</h4>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} style={{ color: 'var(--color-green)' }} />
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>Gate 1: Booking Advance Deposit Settled</span>
                  </div>
                  <span className="badge badge-green">Cleared</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} style={{ color: 'var(--color-green)' }} />
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>Gate 2: Customer Identity & KYC Verified</span>
                  </div>
                  <span className="badge badge-green">Cleared</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} style={{ color: 'var(--color-amber)' }} />
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>Gate 3: Bank Loan Sanction & Disbursement</span>
                  </div>
                  <span className="badge badge-amber">Sanctioned (Awaiting Disbursal)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} style={{ color: 'var(--color-green)' }} />
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>Gate 4: Pre-Delivery Technical Inspection (PDI)</span>
                  </div>
                  <span className="badge badge-green">Passed 140/140</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>Gate 5: Customer Handover & Gate Pass</span>
                  </div>
                  <span className="badge badge-neutral">Scheduled</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedDeal(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert('Authorized handover gate pass generated for vehicle delivery!');
                  setSelectedDeal(null);
                }}
              >
                Authorize Handover Pass <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
