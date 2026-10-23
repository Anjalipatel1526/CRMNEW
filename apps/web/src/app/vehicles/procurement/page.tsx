'use client';

import React, { useState, useMemo } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  Truck,
  Plus,
  ClipboardCheck,
  RefreshCw,
  Building,
  CheckCircle,
  Clock,
  Car,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'tradeins' | 'inspections'>('orders');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial procurement data
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [tradeIns, setTradeIns] = useState<any[]>([]);
  const [inspections] = useState<any[]>([]);

  // Filtered datasets based on search
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return purchaseOrders;
    return purchaseOrders.filter((po) =>
      po.orderNumber.toLowerCase().includes(q) ||
      po.supplierName.toLowerCase().includes(q) ||
      po.vehicleDescription.toLowerCase().includes(q)
    );
  }, [purchaseOrders, searchQuery]);

  const filteredTradeIns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tradeIns;
    return tradeIns.filter((ti) =>
      ti.customerName.toLowerCase().includes(q) ||
      ti.vehicle.toLowerCase().includes(q) ||
      ti.dealId.toLowerCase().includes(q)
    );
  }, [tradeIns, searchQuery]);

  const filteredInspections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return inspections;
    return inspections.filter((insp) =>
      insp.vehicle.toLowerCase().includes(q) ||
      insp.inspector.toLowerCase().includes(q) ||
      insp.grade.toLowerCase().includes(q)
    );
  }, [inspections, searchQuery]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Procurement, Trade-In & Intake Inspections" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Supplier purchase orders, customer exchange vehicle appraisals, and showroom intake grading."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsTradeInModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{
              borderRadius: '999px',
              padding: '0.45rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} /> New Trade-In Appraisal
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{
              borderRadius: '999px',
              padding: '0.45rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Active Purchase Orders"
          value={`₹${(purchaseOrders.reduce((sum, p) => sum + (p.expectedCost || 0), 0) / 100000).toFixed(1)} Lakh`}
          sub={`${purchaseOrders.length} incoming vehicle shipments`}
          icon={<Truck size={18} />}
          accentColor="teal"
        />
        <StatCard
          title="Pending Trade-In Value"
          value={`₹${(tradeIns.reduce((sum, t) => sum + (t.offeredPrice || 0), 0) / 100000).toFixed(2)} Lakh`}
          sub="Exchange credit allocated to deals"
          icon={<RefreshCw size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Intake Inspection Pass Rate"
          value={inspections.length > 0 ? "100%" : "0%"}
          sub="Rigorous 140-point technical checklist"
          icon={<ClipboardCheck size={18} />}
          accentColor="green"
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
            placeholder="Search purchase orders, trade-in valuations, or intake inspection vehicles..."
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

        {/* Filter / Section Pills */}
        <div className="search-controls-row">
          <div className="search-filter-pills">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`search-filter-pill ${activeTab === 'orders' ? 'is-active' : ''}`}
            >
              <span>Purchase Orders</span>
              <span className="pill-count">{purchaseOrders.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tradeins')}
              className={`search-filter-pill ${activeTab === 'tradeins' ? 'is-active' : ''}`}
            >
              <span>Trade-In Appraisals</span>
              <span className="pill-count">{tradeIns.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inspections')}
              className={`search-filter-pill ${activeTab === 'inspections' ? 'is-active' : ''}`}
            >
              <span>Intake Inspections</span>
              <span className="pill-count">{inspections.length}</span>
            </button>
          </div>

          <div className="search-results-counter">
            Showing <strong>
              {activeTab === 'orders' ? filteredOrders.length : activeTab === 'tradeins' ? filteredTradeIns.length : filteredInspections.length}
            </strong> records
          </div>
        </div>
      </div>

      {/* Tab Content: Table-Wise Row Cards */}
      {activeTab === 'orders' && (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '2fr 2.6fr 1.6fr 1.6fr 1.2fr' }}
          >
            <div>Order & Supplier</div>
            <div>Vehicle Details</div>
            <div>Expected Cost</div>
            <div>Delivery Expected</div>
            <div style={{ textAlign: 'right' }}>Status</div>
          </div>

          <div className="app-cards-list">
            {filteredOrders.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Truck size={36} style={{ color: '#94A3B8' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No Purchase Orders</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px' }}>
                  Supplier vehicle stock orders and incoming shipments will appear here.
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsOrderModalOpen(true)}
                  style={{ marginTop: '6px' }}
                >
                  <Plus size={14} /> Create Purchase Order
                </button>
              </div>
            ) : (
              filteredOrders.map((po, index) => {
                const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];

                return (
                  <div
                    key={po.id}
                    className="app-row-card"
                    style={{
                      ['--grid-cols' as any]: '2fr 2.6fr 1.6fr 1.6fr 1.2fr',
                      ['--theme-accent' as any]: palette.accent,
                      ['--theme-border' as any]: palette.border,
                      ['--theme-glow' as any]: palette.glow,
                      ['--theme-badge-bg' as any]: palette.badgeBg,
                      ['--theme-badge-text' as any]: palette.badgeText,
                    }}
                  >
                    <div className="app-row-cell-main">
                      <div className="app-row-avatar">
                        <Truck size={18} />
                      </div>
                      <div className="app-row-title-wrap">
                        <span className="app-row-title" style={{ color: palette.accent }}>{po.orderNumber}</span>
                        <span className="app-row-subtitle">{po.supplierName}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1E293B' }}>
                      {po.vehicleDescription}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                      ₹{(po.expectedCost / 100000).toFixed(2)} Lakh
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} style={{ color: '#64748B' }} />
                      <span>{po.expectedDate}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <StatusBadge status={po.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'tradeins' && (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '2.2fr 1.4fr 1.8fr 1.6fr 1.2fr 1fr' }}
          >
            <div>Customer & Vehicle</div>
            <div>Odometer</div>
            <div>Valuation Range</div>
            <div>Offered Value</div>
            <div>Linked Deal</div>
            <div style={{ textAlign: 'right' }}>Status</div>
          </div>

          <div className="app-cards-list">
            {filteredTradeIns.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={36} style={{ color: '#94A3B8' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No Trade-In Appraisals</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px' }}>
                  Customer vehicle exchange valuations and appraisals will appear here.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsTradeInModalOpen(true)}
                  style={{ marginTop: '6px' }}
                >
                  <RefreshCw size={14} /> New Trade-In Appraisal
                </button>
              </div>
            ) : (
              filteredTradeIns.map((ti, index) => {
                const palette = APP_CARD_PALETTES[(index + 2) % APP_CARD_PALETTES.length];

                return (
                  <div
                    key={ti.id}
                    className="app-row-card"
                    style={{
                      ['--grid-cols' as any]: '2.2fr 1.4fr 1.8fr 1.6fr 1.2fr 1fr',
                      ['--theme-accent' as any]: palette.accent,
                      ['--theme-border' as any]: palette.border,
                      ['--theme-glow' as any]: palette.glow,
                      ['--theme-badge-bg' as any]: palette.badgeBg,
                      ['--theme-badge-text' as any]: palette.badgeText,
                    }}
                  >
                    <div className="app-row-cell-main">
                      <div className="app-row-avatar">
                        <RefreshCw size={18} />
                      </div>
                      <div className="app-row-title-wrap">
                        <span className="app-row-title">{ti.customerName}</span>
                        <span className="app-row-subtitle">{ti.vehicle}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                      {ti.odometerKm.toLocaleString()} km
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      ₹{(ti.estimatedLow / 100000).toFixed(2)}L - ₹{(ti.estimatedHigh / 100000).toFixed(2)}L
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#16A34A' }}>
                      ₹{(ti.offeredPrice / 100000).toFixed(2)} Lakh
                    </div>

                    <div>
                      <span className="badge badge-indigo">{ti.dealId}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <StatusBadge status={ti.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'inspections' && (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '2.4fr 1.2fr 2fr 1.4fr 1.6fr 1fr' }}
          >
            <div>Vehicle Inspected</div>
            <div>Type</div>
            <div>Inspector</div>
            <div>Technical Grade</div>
            <div>Repair Estimate</div>
            <div style={{ textAlign: 'right' }}>Result</div>
          </div>

          <div className="app-cards-list">
            {filteredInspections.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ClipboardCheck size={36} style={{ color: '#94A3B8' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No Intake Inspections</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px' }}>
                  140-point technical intake checks and showroom grading reports will be cataloged here.
                </div>
              </div>
            ) : (
              filteredInspections.map((insp, index) => {
                const palette = APP_CARD_PALETTES[(index + 4) % APP_CARD_PALETTES.length];

                return (
                  <div
                    key={insp.id}
                    className="app-row-card"
                    style={{
                      ['--grid-cols' as any]: '2.4fr 1.2fr 2fr 1.4fr 1.6fr 1fr',
                      ['--theme-accent' as any]: palette.accent,
                      ['--theme-border' as any]: palette.border,
                      ['--theme-glow' as any]: palette.glow,
                      ['--theme-badge-bg' as any]: palette.badgeBg,
                      ['--theme-badge-text' as any]: palette.badgeText,
                    }}
                  >
                    <div className="app-row-cell-main">
                      <div className="app-row-avatar">
                        <ClipboardCheck size={18} />
                      </div>
                      <div className="app-row-title-wrap">
                        <span className="app-row-title">{insp.vehicle}</span>
                        <span className="app-row-subtitle">Completed: {insp.completedAt}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>
                        {insp.type}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                      {insp.inspector}
                    </div>

                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: palette.accent }}>{insp.grade}</span>
                    </div>

                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A' }}>
                      ₹{insp.repairEstimate.toLocaleString()}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <StatusBadge status={insp.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal (Inspo Form UI Image 2) */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Manufacturer / Supplier Purchase Order"
        maxWidth="680px"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Purchase Order submitted for manager approval!');
            setIsOrderModalOpen(false);
          }}
          className="inspo-form-wrapper"
        >
          <div className="form-group">
            <label className="form-label">
              Authorized Supplier <span className="req-star">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter authorized supplier"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Vehicle Description & Quantities <span className="req-star">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Enter vehicle description and quantities"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Expected Net Cost (₹) <span className="req-star">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter expected net cost (₹)"
              required
            />
          </div>

          {/* Modern Inspo Footer Bar */}
          <div className="unique-modal-footer-bar" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsOrderModalOpen(false)}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
            >
              <span className="btn-text">Submit Purchase Order</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>

      {/* New Trade-In Modal (Inspo Form UI Image 2) */}
      <Modal
        isOpen={isTradeInModalOpen}
        onClose={() => setIsTradeInModalOpen(false)}
        title="New Customer Trade-In Appraisal"
        maxWidth="680px"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Trade-in appraisal calculated and logged!');
            setIsTradeInModalOpen(false);
          }}
          className="inspo-form-wrapper"
        >
          <div className="form-group">
            <label className="form-label">
              Customer Name <span className="req-star">*</span>
            </label>
            <input type="text" className="form-input" placeholder="Enter customer name" required />
          </div>
          <div className="form-group">
            <label className="form-label">
              Existing Vehicle (Make, Model, Year, Variant) <span className="req-star">*</span>
            </label>
            <input type="text" className="form-input" placeholder="Enter vehicle make, model, year, variant" required />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Odometer (km) <span className="req-star">*</span>
              </label>
              <input type="number" className="form-input" placeholder="Enter odometer (km)" required />
            </div>
            <div className="form-group">
              <label className="form-label">
                Offered Exchange Value (₹) <span className="req-star">*</span>
              </label>
              <input type="number" className="form-input" placeholder="Enter offered exchange value (₹)" required />
            </div>
          </div>

          {/* Modern Inspo Footer Bar */}
          <div className="unique-modal-footer-bar" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsTradeInModalOpen(false)}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
            >
              <span className="btn-text">Confirm Appraisal</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
