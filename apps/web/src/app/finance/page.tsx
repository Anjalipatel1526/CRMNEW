'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Payment, Customer } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  DollarSign,
  Plus,
  CreditCard,
  FileText,
  Printer,
  CheckCircle,
  TrendingUp,
  Receipt,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Edit3,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>(api.getPayments());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices' | 'expenses'>('payments');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    method: 'upi' as any,
    amount: '100000',
    referenceNumber: '',
    notes: 'Advance booking token',
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    api.recordPayment(formData);
    setPayments([...api.getPayments()]);
    setIsPaymentModalOpen(false);
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter((p) =>
      p.paymentNumber.toLowerCase().includes(q) ||
      (p.customerName || '').toLowerCase().includes(q) ||
      (p.referenceNumber || '').toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Finance, Bookings & Cash Flow" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Customer token deposits, receipts, GST invoice management, accounts receivable, and dealership expenses."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="btn btn-primary btn-sm"
          style={{
            borderRadius: '999px',
            padding: '0.45rem 1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> Record Payment Receipt
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Total Collections This Month"
          value={`₹${(totalCollected / 100000).toFixed(2)} Lakh`}
          sub="Bank reconciled payments"
          icon={<DollarSign size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Accounts Receivable (Pending)"
          value="₹28.26 Lakh"
          sub="Deal DL-2024-001 loan pending"
          icon={<Receipt size={18} />}
          accentColor="orange"
        />
        <StatCard
          title="Reconditioning Expenses"
          value="₹45,000"
          sub="Fleet touch-up and mechanical prep"
          icon={<CreditCard size={18} />}
          accentColor="indigo"
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
            placeholder="Search payments by receipt #, customer name, transaction reference, or method..."
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

        {/* Tab Pills */}
        <div className="search-controls-row">
          <div className="search-filter-pills">
            <button
              type="button"
              className={`search-filter-pill ${activeTab === 'payments' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <span>Payments Received</span>
              <span className="pill-count">{payments.length}</span>
            </button>
            <button
              type="button"
              className={`search-filter-pill ${activeTab === 'invoices' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              <span>Invoices & Receivables</span>
              <span className="pill-count">2</span>
            </button>
            <button
              type="button"
              className={`search-filter-pill ${activeTab === 'expenses' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <span>Dealership Expenses</span>
              <span className="pill-count">2</span>
            </button>
          </div>

          <div className="search-results-counter">
            Showing <strong>{activeTab === 'payments' ? filteredPayments.length : 2}</strong> records
          </div>
        </div>
      </div>

      {/* Tab 1: Payments */}
      {activeTab === 'payments' && (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '2fr 1.3fr 1.6fr 1.8fr 1.4fr 1.1fr 130px' }}
          >
            <div>Receipt & Customer</div>
            <div>Method</div>
            <div>Amount</div>
            <div>UTR Reference</div>
            <div>Settled Date</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          <div className="app-cards-list">
            {filteredPayments.map((p, index) => {
              const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];

              return (
                <div
                  key={p.id}
                  className="app-row-card"
                  style={{
                    ['--grid-cols' as any]: '2fr 1.3fr 1.6fr 1.8fr 1.4fr 1.1fr 130px',
                    ['--theme-accent' as any]: palette.accent,
                    ['--theme-border' as any]: palette.border,
                    ['--theme-glow' as any]: palette.glow,
                    ['--theme-badge-bg' as any]: palette.badgeBg,
                    ['--theme-badge-text' as any]: palette.badgeText,
                  }}
                >
                  <div className="app-row-cell-main">
                    <div className="app-row-avatar">
                      <Receipt size={18} />
                    </div>
                    <div className="app-row-title-wrap">
                      <span className="app-row-title" style={{ color: palette.accent }}>{p.paymentNumber}</span>
                      <span className="app-row-subtitle">{p.customerName}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#334155' }}>
                      {p.method}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#16A34A' }}>
                    ₹{p.amount.toLocaleString()}
                  </div>

                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#475569' }}>
                    {p.referenceNumber || 'CASH-SHOWROOM'}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    {new Date(p.settledAt || p.createdAt).toLocaleDateString()}
                  </div>

                  <div>
                    <StatusBadge status={p.status} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="app-action-btn"
                      onClick={() => setSelectedReceipt(p)}
                      title="View payment receipt"
                    >
                      <span>Receipt</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '1.8fr 2fr 2fr 1.6fr 1.4fr 1fr' }}
          >
            <div>Invoice #</div>
            <div>Customer</div>
            <div>Vehicle Details</div>
            <div>Invoice Amount</div>
            <div>Due Date</div>
            <div style={{ textAlign: 'right' }}>Status</div>
          </div>

          <div className="app-cards-list">
            <div
              className="app-row-card"
              style={{
                ['--grid-cols' as any]: '1.8fr 2fr 2fr 1.6fr 1.4fr 1fr',
                ['--theme-accent' as any]: '#0284C7',
                ['--theme-border' as any]: 'rgba(2, 132, 199, 0.28)',
                ['--theme-glow' as any]: 'rgba(2, 132, 199, 0.18)',
                ['--theme-badge-bg' as any]: '#E0F2FE',
                ['--theme-badge-text' as any]: '#0369A1',
              }}
            >
              <div className="app-row-cell-main">
                <div className="app-row-avatar">
                  <FileText size={18} />
                </div>
                <div className="app-row-title-wrap">
                  <span className="app-row-title" style={{ color: '#0284C7' }}>INV-2024-001</span>
                  <span className="app-row-subtitle">Tax Invoice</span>
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Rajesh Sharma</div>
              <div style={{ fontSize: '0.84rem', color: '#475569' }}>Mahindra XUV700 AX7L AWD</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹25,80,000</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>2026-10-25</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <StatusBadge status="partially_paid" />
              </div>
            </div>

            <div
              className="app-row-card"
              style={{
                ['--grid-cols' as any]: '1.8fr 2fr 2fr 1.6fr 1.4fr 1fr',
                ['--theme-accent' as any]: '#16A34A',
                ['--theme-border' as any]: 'rgba(22, 163, 74, 0.28)',
                ['--theme-glow' as any]: 'rgba(22, 163, 74, 0.18)',
                ['--theme-badge-bg' as any]: '#DCFCE7',
                ['--theme-badge-text' as any]: '#15803D',
              }}
            >
              <div className="app-row-cell-main">
                <div className="app-row-avatar">
                  <FileText size={18} />
                </div>
                <div className="app-row-title-wrap">
                  <span className="app-row-title" style={{ color: '#16A34A' }}>INV-2024-002</span>
                  <span className="app-row-subtitle">Service Invoice</span>
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Ananya Sengupta</div>
              <div style={{ fontSize: '0.84rem', color: '#475569' }}>Periodic 10k Maintenance</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹12,450</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>2026-10-21</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <StatusBadge status="settled" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Expenses */}
      {activeTab === 'expenses' && (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '2.2fr 2.4fr 1.6fr 1.8fr 1fr' }}
          >
            <div>Vendor & Expense</div>
            <div>Description</div>
            <div>Amount</div>
            <div>Allocated Vehicle</div>
            <div style={{ textAlign: 'right' }}>Status</div>
          </div>

          <div className="app-cards-list">
            <div
              className="app-row-card"
              style={{
                ['--grid-cols' as any]: '2.2fr 2.4fr 1.6fr 1.8fr 1fr',
                ['--theme-accent' as any]: '#4F46E5',
                ['--theme-border' as any]: 'rgba(79, 70, 229, 0.28)',
                ['--theme-glow' as any]: 'rgba(79, 70, 229, 0.18)',
                ['--theme-badge-bg' as any]: '#EEF2FF',
                ['--theme-badge-text' as any]: '#4338CA',
              }}
            >
              <div className="app-row-cell-main">
                <div className="app-row-avatar">
                  <CreditCard size={18} />
                </div>
                <div className="app-row-title-wrap">
                  <span className="app-row-title">SpeedShine Detailing Studio</span>
                  <span className="app-row-subtitle">Ceramic Prep & Interior Deep Clean</span>
                </div>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#334155' }}>Comprehensive 3M ceramic gloss coat</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>₹25,000</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Mahindra XUV700 (STK-2024-001)</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <StatusBadge status="settled" />
              </div>
            </div>

            <div
              className="app-row-card"
              style={{
                ['--grid-cols' as any]: '2.2fr 2.4fr 1.6fr 1.8fr 1fr',
                ['--theme-accent' as any]: '#D97706',
                ['--theme-border' as any]: 'rgba(217, 119, 6, 0.28)',
                ['--theme-glow' as any]: 'rgba(217, 119, 6, 0.18)',
                ['--theme-badge-bg' as any]: '#FEF3C7',
                ['--theme-badge-text' as any]: '#B45309',
              }}
            >
              <div className="app-row-cell-main">
                <div className="app-row-avatar">
                  <CreditCard size={18} />
                </div>
                <div className="app-row-title-wrap">
                  <span className="app-row-title">Metro Express Towing</span>
                  <span className="app-row-subtitle">Inter-branch enclosed flatbed transport WS → DT</span>
                </div>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#334155' }}>Specialist enclosed electric vehicle tow</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>₹20,000</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Tata Nexon EV (STK-2024-002)</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <StatusBadge status="approved" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal (Inspo Form UI Image 2) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record New Customer Payment"
        maxWidth="680px"
      >
        <form onSubmit={handleRecordPayment} className="inspo-form-wrapper">
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
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Payment Method <span className="req-star">*</span>
              </label>
              <select
                className="form-select"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option value="upi">UPI / Instant QR</option>
                <option value="bank_transfer">NEFT / RTGS / IMPS</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cheque">Demand Draft / Cheque</option>
                <option value="cash">Cash Showroom Receipt</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                Amount (₹) <span className="req-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction / Bank UTR Reference</label>
            <input
              type="text"
              className="form-input"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="e.g. UPI/2024/99102849"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Accounting Notes</label>
            <input
              type="text"
              className="form-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Modern Inspo Footer Bar */}
          <div className="unique-modal-footer-bar" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
            >
              <span className="btn-text">Issue Settled Receipt</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Receipt Modal with Top Edit and Close Buttons */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Official Receipt: ${selectedReceipt.paymentNumber}`}
          maxWidth="680px"
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => {
                  alert('Editing payment voucher for ' + selectedReceipt.paymentNumber);
                }}
                title="Edit receipt"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedReceipt(null)}
                title="Close receipt"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ padding: '1.2rem', border: '1.5px solid #E2E8F0', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#16A34A' }}>APEX MOTORS OFFICIAL MONEY RECEIPT</h3>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>Receipt Ref: {selectedReceipt.paymentNumber}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Received From:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedReceipt.customerName}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Payment Mode:</span>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', marginTop: '2px' }}>{selectedReceipt.method}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Bank UTR / Ref:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0F172A', marginTop: '2px' }}>{selectedReceipt.referenceNumber || 'CASH-REC'}</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Settled Date:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{new Date(selectedReceipt.settledAt || selectedReceipt.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ padding: '1rem 1.2rem', backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>Net Amount Received:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803D' }}>
                  ₹{selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="button"
                className="unique-lead-submit-btn"
                onClick={() => {
                  alert('Printing official payment receipt voucher!');
                  setSelectedReceipt(null);
                }}
              >
                <span className="btn-text">Print Receipt Voucher</span>
                <Printer size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
