'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Deal, DealStage } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  Briefcase,
  CheckCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  Car,
  ArrowRight,
  Search,
  X,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>(api.getDeals());
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const totalValue = deals.reduce((sum, d) => sum + d.grandTotal, 0);
  const totalPaid = deals.reduce((sum, d) => sum + d.amountPaid, 0);

  const filteredDeals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return deals.filter((deal) => {
      if (activeFilter !== 'all' && deal.stage !== activeFilter) return false;
      if (!q) return true;
      const num = (deal.dealNumber || '').toLowerCase();
      const cust = (deal.customerName || '').toLowerCase();
      const veh = (deal.vehicleName || '').toLowerCase();
      const lender = (deal.lenderName || '').toLowerCase();
      return num.includes(q) || cust.includes(q) || veh.includes(q) || lender.includes(q);
    });
  }, [deals, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: deals.length,
      initiated: deals.filter((d) => d.stage === 'initiated').length,
      documents: deals.filter((d) => d.stage === 'documents').length,
      finance: deals.filter((d) => d.stage === 'finance').length,
      pdi: deals.filter((d) => d.stage === 'pdi').length,
      ready: deals.filter((d) => d.stage === 'ready').length,
      delivered: deals.filter((d) => d.stage === 'delivered').length,
    };
  }, [deals]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Sales Deals & Gate Clearance Pipeline" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Deal closing progress, 5-stage handover gates (Payment, Documents, Finance, PDI, Delivery)."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
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
            placeholder="Search deals by deal number, customer name, vehicle, or lender..."
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
              <span>All Deals</span>
              <span className="pill-count">{counts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('initiated')}
              className={`search-filter-pill ${activeFilter === 'initiated' ? 'is-active' : ''}`}
            >
              <span>1. Initiated</span>
              <span className="pill-count">{counts.initiated}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('documents')}
              className={`search-filter-pill ${activeFilter === 'documents' ? 'is-active' : ''}`}
            >
              <span>2. KYC Docs</span>
              <span className="pill-count">{counts.documents}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('finance')}
              className={`search-filter-pill ${activeFilter === 'finance' ? 'is-active' : ''}`}
            >
              <span>3. Finance / Loan</span>
              <span className="pill-count">{counts.finance}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pdi')}
              className={`search-filter-pill ${activeFilter === 'pdi' ? 'is-active' : ''}`}
            >
              <span>4. PDI</span>
              <span className="pill-count">{counts.pdi}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('delivered')}
              className={`search-filter-pill ${activeFilter === 'delivered' ? 'is-active' : ''}`}
            >
              <span>6. Delivered</span>
              <span className="pill-count">{counts.delivered}</span>
            </button>
          </div>

          <div className="search-results-counter">
            Showing <strong>{filteredDeals.length}</strong> of {deals.length} Deals
          </div>
        </div>
      </div>

      {/* Table-Wise Row Cards List */}
      {filteredDeals.length > 0 ? (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '1.8fr 2.4fr 1.3fr 1.6fr 1.6fr 1.4fr 140px' }}
          >
            <div>Deal Number</div>
            <div>Customer & Vehicle</div>
            <div>Stage</div>
            <div>Total Value</div>
            <div>Advance / Balance</div>
            <div>Financing</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          <div className="app-cards-list">
            {filteredDeals.map((deal, index) => {
              const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];

              return (
                <div
                  key={deal.id}
                  className="app-row-card"
                  style={{
                    ['--grid-cols' as any]: '1.8fr 2.4fr 1.3fr 1.6fr 1.6fr 1.4fr 140px',
                    ['--theme-accent' as any]: palette.accent,
                    ['--theme-border' as any]: palette.border,
                    ['--theme-glow' as any]: palette.glow,
                    ['--theme-badge-bg' as any]: palette.badgeBg,
                    ['--theme-badge-text' as any]: palette.badgeText,
                  }}
                >
                  {/* Deal Number */}
                  <div className="app-row-cell-main">
                    <div className="app-row-avatar">
                      <Briefcase size={18} />
                    </div>
                    <div className="app-row-title-wrap">
                      <span className="app-row-title" style={{ color: palette.accent }}>{deal.dealNumber}</span>
                      <span className="app-row-subtitle">Contract Active</span>
                    </div>
                  </div>

                  {/* Customer & Vehicle */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                      {deal.customerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {deal.vehicleName}
                    </div>
                  </div>

                  {/* Current Stage */}
                  <div>
                    <StatusBadge status={deal.stage} />
                  </div>

                  {/* Total Value */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
                      ₹{(deal.grandTotal / 100000).toFixed(2)} Lakh
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      On-Road Invoice
                    </div>
                  </div>

                  {/* Advance / Balance */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#16A34A' }}>
                      Paid: ₹{(deal.amountPaid / 100000).toFixed(2)} L
                    </div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#DC2626' }}>
                      Due: ₹{(deal.balanceDue / 100000).toFixed(2)} L
                    </div>
                  </div>

                  {/* Financing */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>
                      {deal.lenderName || 'Direct Cash'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {deal.loanStatus}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="app-action-btn"
                      onClick={() => setSelectedDeal(deal)}
                      title="Inspect deal gates"
                    >
                      <span>Gates</span>
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
          {deals.length === 0 ? (
            <>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(30,68,59,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1E443B',
                  fontSize: '1.5rem',
                }}
              >
                💼
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                No Active Sales Deals Yet
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '400px' }}>
                Your sales closing pipeline has no recorded deals yet. Convert qualified leads into formal sales orders to track 5-stage handover gates.
              </p>
            </>
          ) : (
            <>
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
                <Briefcase size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                No matching sales deals found
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '380px' }}>
                We couldn&apos;t find any deals matching &ldquo;{searchQuery}&rdquo;. Try adjusting your search query or reset the filters.
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
            </>
          )}
        </div>
      )}

      {/* Deal Detail & Gate Clearance Modal with Top Edit and Close Buttons */}
      {selectedDeal && (
        <Modal
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          title={`Deal Gate Clearance: ${selectedDeal.dealNumber}`}
          maxWidth="720px"
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => {
                  alert('Deal edit mode activated for ' + selectedDeal.dealNumber);
                }}
                title="Edit deal"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedDeal(null)}
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
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.2rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>{selectedDeal.customerName}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>{selectedDeal.vehicleName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#4F46E5' }}>
                  ₹{(selectedDeal.grandTotal / 100000).toFixed(2)} Lakh
                </div>
                <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                  Balance: ₹{(selectedDeal.balanceDue / 100000).toFixed(2)} L
                </div>
              </div>
            </div>

            {/* Delivery Gates Checklist */}
            <div style={{ borderRadius: '16px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1.2rem', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>Mandatory Pre-Delivery Clearance Gates</h4>
              </div>
              <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CheckCircle size={17} style={{ color: '#16A34A' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1E293B' }}>Gate 1: Booking Advance Deposit Settled</span>
                  </div>
                  <span className="badge badge-green">Cleared</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CheckCircle size={17} style={{ color: '#16A34A' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1E293B' }}>Gate 2: Customer Identity & KYC Verified</span>
                  </div>
                  <span className="badge badge-green">Cleared</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Clock size={17} style={{ color: '#D97706' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1E293B' }}>Gate 3: Bank Loan Sanction & Disbursement</span>
                  </div>
                  <span className="badge badge-amber">Sanctioned (Awaiting Disbursal)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <CheckCircle size={17} style={{ color: '#16A34A' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1E293B' }}>Gate 4: Pre-Delivery Technical Inspection (PDI)</span>
                  </div>
                  <span className="badge badge-green">Passed 140/140</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Clock size={17} style={{ color: '#64748B' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1E293B' }}>Gate 5: Customer Handover & Gate Pass</span>
                  </div>
                  <span className="badge badge-neutral">Scheduled</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="button"
                className="unique-lead-submit-btn"
                onClick={() => {
                  alert('Authorized handover gate pass generated for vehicle delivery!');
                  setSelectedDeal(null);
                }}
              >
                <span className="btn-text">Authorize Handover Pass</span>
                <ArrowRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
