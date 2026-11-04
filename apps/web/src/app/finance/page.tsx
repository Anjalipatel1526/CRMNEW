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
  Download,
  Share2,
  Sparkles,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import { InvoiceDocumentGenerator, ExecutiveSignatureSvg, getInvoiceColorSystem } from '@/components/invoices/InvoiceDocumentGenerator';
import { getCompanyProfile } from '@/lib/company-store';

export default function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>(api.getPayments());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices' | 'expenses'>('payments');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const handleSaveInvoice = (inv: any) => {
    const newPayment: Payment = {
      id: 'pay-' + Date.now(),
      tenantId: 't-apex-001',
      branchId: 'b-dt-001',
      currency: 'INR',
      paymentNumber: inv.invoiceNumber,
      customerId: inv.customerId || 'c-101',
      customerName: inv.customerName || 'Valued Customer',
      amount: inv.grandTotal,
      method: (inv.paymentMethod || 'upi') as any,
      referenceNumber: inv.utrReference || 'CASH-REC',
      notes: inv.notes,
      status: 'settled',
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const newInvoice = {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName || 'Valued Customer',
      vehicleDetails: inv.items?.[0]?.description || 'Vehicle Delivery & Services',
      amount: inv.grandTotal,
      dueDate: inv.dueDate,
      status: 'settled',
      method: inv.paymentMethod || 'upi',
      referenceNumber: inv.utrReference || 'CASH-REC',
      date: inv.invoiceDate,
      rawInvoice: inv,
    };

    setPayments((prev) => [newPayment, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);
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
          onClick={() => {
            setIsPaymentModalOpen(true);
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
          <Plus size={16} /> Create Document / Invoice
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
          value="₹0.00 Lakh"
          sub="No pending loans or receipts"
          icon={<Receipt size={18} />}
          accentColor="orange"
        />
        <StatCard
          title="Reconditioning Expenses"
          value="₹0"
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
              <span className="pill-count">{invoices.length}</span>
            </button>
            <button
              type="button"
              className={`search-filter-pill ${activeTab === 'expenses' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <span>Dealership Expenses</span>
              <span className="pill-count">{expenses.length}</span>
            </button>
          </div>

          <div className="search-results-counter">
            Showing <strong>{activeTab === 'payments' ? filteredPayments.length : activeTab === 'invoices' ? invoices.length : expenses.length}</strong> records
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
            {filteredPayments.length === 0 ? (
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
                <Receipt size={36} style={{ color: '#94A3B8' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No Payments or Receipts Recorded</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px' }}>
                  Customer booking advances, tokens, and bank settlements will be listed here.
                </div>
              </div>
            ) : (
              filteredPayments.map((p, index) => {
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
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '1.8fr 2fr 2fr 1.6fr 1.4fr 1fr 120px' }}
          >
            <div>Invoice #</div>
            <div>Customer</div>
            <div>Vehicle Details</div>
            <div>Invoice Amount</div>
            <div>Due Date</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          <div className="app-cards-list">
            {invoices.length === 0 ? (
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
                <FileText size={36} style={{ color: '#94A3B8' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No GST Invoices Created</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px' }}>
                  Generate vehicle delivery tax invoices and accounts receivable documents using &ldquo;Create Document / Invoice&rdquo;.
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsPaymentModalOpen(true)}
                  style={{ marginTop: '6px' }}
                >
                  <Plus size={14} /> Create First Invoice
                </button>
              </div>
            ) : (
              invoices.map((inv, index) => {
                const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];

                return (
                  <div
                    key={inv.id}
                    className="app-row-card"
                    style={{
                      ['--grid-cols' as any]: '1.8fr 2fr 2fr 1.6fr 1.4fr 1fr 120px',
                      ['--theme-accent' as any]: palette.accent,
                      ['--theme-border' as any]: palette.border,
                      ['--theme-glow' as any]: palette.glow,
                      ['--theme-badge-bg' as any]: palette.badgeBg,
                      ['--theme-badge-text' as any]: palette.badgeText,
                    }}
                  >
                    <div className="app-row-cell-main">
                      <div className="app-row-avatar">
                        <FileText size={18} />
                      </div>
                      <div className="app-row-title-wrap">
                        <span className="app-row-title" style={{ color: palette.accent }}>{inv.invoiceNumber}</span>
                        <span className="app-row-subtitle">Tax Invoice</span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{inv.customerName}</div>
                    <div style={{ fontSize: '0.84rem', color: '#475569' }}>{inv.vehicleDetails}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{inv.amount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{inv.dueDate}</div>
                    <div>
                      <StatusBadge status={inv.status as any} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="app-action-btn"
                        onClick={() => setSelectedInvoice(inv)}
                        title="Inspect watermarked invoice"
                      >
                        <span>Invoice</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
            {expenses.length === 0 ? (
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
                <CreditCard size={36} style={{ color: '#94A3B8' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No Dealership Expenses Recorded</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px' }}>
                  Detailing, transportation, and workshop vendor invoices will appear here.
                </div>
              </div>
            ) : (
              expenses.map((exp: any, index: number) => {
                const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];
                return (
                  <div
                    key={exp.id || index}
                    className="app-row-card"
                    style={{
                      ['--grid-cols' as any]: '2.2fr 2.4fr 1.6fr 1.8fr 1fr',
                      ['--theme-accent' as any]: palette.accent,
                      ['--theme-border' as any]: palette.border,
                      ['--theme-glow' as any]: palette.glow,
                      ['--theme-badge-bg' as any]: palette.badgeBg,
                      ['--theme-badge-text' as any]: palette.badgeText,
                    }}
                  >
                    <div className="app-row-cell-main">
                      <div className="app-row-avatar">
                        <CreditCard size={18} />
                      </div>
                      <div className="app-row-title-wrap">
                        <span className="app-row-title">{exp.vendor}</span>
                        <span className="app-row-subtitle">{exp.category}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#334155' }}>{exp.description}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>₹{exp.amount?.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{exp.vehicleDetails}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <StatusBadge status={exp.status || 'settled'} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create Document / Invoice Modal */}
      {isPaymentModalOpen && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          headerContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#6253F8',
                  background: '#E6F4EF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                New Invoice
              </span>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0F172A' }}>
                Create Document / Invoice
              </h3>
            </div>
          }
          maxWidth="840px"
        >
          <InvoiceDocumentGenerator
            onClose={() => setIsPaymentModalOpen(false)}
            onSave={handleSaveInvoice}
            isModal={true}
          />
        </Modal>
      )}

      {/* Inspect Watermarked Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Official Invoice: ${selectedInvoice.invoiceNumber}`}
          maxWidth="780px"
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => {
                  window.print();
                }}
                title="Print or Save as PDF"
              >
                <Printer size={14} />
                <span>Print / PDF</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedInvoice(null)}
                title="Close"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Share bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                Official Certified Dealership Document
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const text = `*APEX MOTORS — OFFICIAL INVOICE*\nInvoice: ${selectedInvoice.invoiceNumber}\nCustomer: ${selectedInvoice.customerName}\nAmount: ₹${selectedInvoice.amount.toLocaleString('en-IN')}\nStatus: Settled`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>💬 WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Watermarked A4 Sheet Matching Reference Template */}
            {(() => {
              const comp = getCompanyProfile();
              const { graphicAccent, textAccent } = getInvoiceColorSystem(comp.brandColor);

              return (
                <div
                  className="print-invoice-sheet"
                  style={{
                    position: 'relative',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px solid #CBD5E1',
                    padding: '24px 28px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    minHeight: 'auto',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {/* STRAIGHT HORIZONTAL WATERMARK WITH AUTHENTIC LOGO COLOR */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      zIndex: 1,
                      opacity: Math.max(comp.watermarkOpacity || 0, 0.22),
                    }}
                  >
                    {comp.logoUrl ? (
                      <img
                        src={comp.logoUrl}
                        alt="Watermark"
                        style={{
                          maxWidth: '380px',
                          maxHeight: '380px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '3.8rem',
                          fontWeight: 900,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: textAccent,
                          textAlign: 'center',
                        }}
                      >
                        {comp.tradeName || comp.legalName || 'APEX MOTORS'}
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative', zIndex: 2 }}>
                    {/* Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <h1
                          style={{
                            fontSize: '2.1rem',
                            fontWeight: 900,
                            color: '#0F172A',
                            margin: 0,
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                          }}
                        >
                          INVOICE
                        </h1>
                        <div style={{ fontSize: '0.86rem', color: '#334155', marginTop: '6px', fontWeight: 600 }}>
                          Invoice no : <span style={{ fontWeight: 800, color: '#0F172A' }}>{selectedInvoice.invoiceNumber}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                          Due Date : {selectedInvoice.dueDate}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt="Logo"
                            style={{
                              maxHeight: '42px',
                              maxWidth: '150px',
                              objectFit: 'contain',
                              marginBottom: '6px',
                              display: 'inline-block',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize: '1.3rem',
                              fontWeight: 900,
                              color: textAccent,
                              letterSpacing: '-0.02em',
                              marginBottom: '4px',
                            }}
                          >
                            {comp.tradeName || 'YourLogo'}
                          </div>
                        )}
                        <div style={{ fontSize: '0.76rem', color: '#1E293B', lineHeight: 1.5, fontWeight: 600 }}>
                          {comp.phone && (
                            <div>
                              <span style={{ color: textAccent, fontWeight: 700 }}>Tel: </span>
                              {comp.phone}
                            </div>
                          )}
                          {comp.email && (
                            <div>
                              <span style={{ color: textAccent, fontWeight: 700 }}>Mail: </span>
                              {comp.email}
                            </div>
                          )}
                          <div>{comp.city ? `${comp.city}, ${comp.state || ''}` : 'Walsh, Somerfield - US'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Billed To */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: textAccent, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Invoice to:
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>
                        {selectedInvoice.customerName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                        Showroom Delivery • Valid KYC Completed
                      </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '16px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 800, color: '#0F172A', width: '45px' }}>No.</th>
                          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 800, color: '#0F172A' }}>Product Deskription</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A', width: '100px' }}>Price</th>
                          <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#0F172A', width: '60px' }}>QTY</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A', width: '110px' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 6px', color: '#64748B', fontWeight: 600 }}>01</td>
                          <td style={{ padding: '8px 6px', fontWeight: 600, color: '#0F172A' }}>{selectedInvoice.vehicleDetails}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', color: '#0F172A', fontWeight: 600 }}>
                            ₹{selectedInvoice.amount.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>01</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                            ₹{selectedInvoice.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Payment Method & Total */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '3px' }}>
                          Payment Method
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.5, fontWeight: 600 }}>
                          <div>Method: <span style={{ color: '#0F172A', fontWeight: 700 }}>{selectedInvoice.method || 'Bank Transfer'}</span></div>
                          <div>Reference / UTR: <span style={{ color: textAccent, fontWeight: 800 }}>{selectedInvoice.referenceNumber || 'SETTLED & VERIFIED'}</span></div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569', fontWeight: 600 }}>
                          <span>Sub Total</span>
                          <span style={{ color: '#0F172A', fontWeight: 700 }}>₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderTop: '2px solid #0F172A',
                            marginTop: '6px',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            color: '#0F172A',
                          }}
                        >
                          <span>Total</span>
                          <span>₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Contact Info (Left), Thank You Note (Center), Signature (Right) */}
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        paddingTop: '12px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      {/* Left Contact */}
                      <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.45, fontWeight: 600 }}>
                        <div><span style={{ color: textAccent, fontWeight: 800 }}>P :</span> {comp.phone || '+00 123 345 445'}</div>
                        <div><span style={{ color: textAccent, fontWeight: 800 }}>E :</span> {comp.email || 'youremail@dealership.com'}</div>
                        <div>{comp.city ? `${comp.city}, ${comp.state || ''}` : 'Walsh, Somerfield - US'}</div>
                      </div>

                      {/* Center Friendly Note */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.96rem',
                            fontWeight: 900,
                            color: '#0F172A',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          Thank you for your Business!
                        </span>
                      </div>

                      {/* Right Signature Area - Centered & Bold Dark Visible */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          width: '165px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            minHeight: '52px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '4px',
                          }}
                        >
                          {comp.signatureUrl ? (
                            <img
                              src={comp.signatureUrl}
                              alt="Authorized Signature"
                              style={{
                                maxHeight: '54px',
                                maxWidth: '150px',
                                objectFit: 'contain',
                                mixBlendMode: 'multiply',
                                display: 'block',
                                margin: '0 auto',
                              }}
                            />
                          ) : (
                            <ExecutiveSignatureSvg color="#0F172A" width={140} height={46} />
                          )}
                        </div>

                        <div
                          style={{
                            borderTop: '2px solid #0F172A',
                            paddingTop: '4px',
                            width: '100%',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
                            {comp.authorizedSignatoryName || 'Anjali'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#1E293B', fontWeight: 700, marginTop: '2px' }}>
                            {comp.authorizedSignatoryDesignation || 'COO'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}

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
                  window.print();
                }}
                title="Print Receipt"
              >
                <Printer size={14} />
                <span>Print</span>
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
            <div
              className="print-invoice-sheet"
              style={{
                position: 'relative',
                padding: '1.2rem',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
              }}
            >
              {/* STRAIGHT HORIZONTAL WATERMARK */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '3.6rem',
                  fontWeight: 900,
                  color: 'rgba(98, 83, 248, 0.18)',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 0,
                  fontFamily: 'serif',
                }}
              >
                APEX MOTORS
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  const text = `*APEX MOTORS — OFFICIAL PAYMENT RECEIPT*\nReceipt: ${selectedReceipt.paymentNumber}\nCustomer: ${selectedReceipt.customerName}\nAmount Received: ₹${selectedReceipt.amount.toLocaleString()}\nMethod: ${selectedReceipt.method.toUpperCase()}\nReference: ${selectedReceipt.referenceNumber || 'CASH'}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>💬 Share on WhatsApp</span>
              </button>
              <button
                type="button"
                className="unique-lead-submit-btn"
                onClick={() => {
                  window.print();
                }}
              >
                <span className="btn-text">Print / Download PDF</span>
                <Printer size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
