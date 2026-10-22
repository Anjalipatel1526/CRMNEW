'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Payment, Customer } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import {
  DollarSign,
  Plus,
  CreditCard,
  FileText,
  Printer,
  CheckCircle,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export default function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>(api.getPayments());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices' | 'expenses'>('payments');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance, Bookings & Cash Flow</h1>
          <p className="page-desc">
            Customer token deposits, receipts, GST invoice management, accounts receivable, and dealership expenses.
          </p>
        </div>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Record Payment Receipt
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-3">
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

      {/* Navigation Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments Received ({payments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices & Receivables
        </button>
        <button
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Dealership Expenses
        </button>
      </div>

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Transaction Reference</th>
                  <th>Settled Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: 'var(--color-green)' }}>{p.paymentNumber}</strong>
                    </td>
                    <td>
                      <strong>{p.customerName}</strong>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>
                        {p.method}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem' }}>₹{p.amount.toLocaleString()}</strong>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {p.referenceNumber || 'CASH-REC'}
                    </td>
                    <td>{new Date(p.settledAt || p.createdAt).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedReceipt(p)}
                      >
                        <Printer size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>GST (18%)</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong style={{ color: 'var(--color-blue)' }}>INV-2024-001</strong>
                  </td>
                  <td>
                    <strong>Rajesh Sharma</strong>
                  </td>
                  <td>₹24,50,000</td>
                  <td>₹4,41,000</td>
                  <td>
                    <strong>₹29,26,000</strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>₹1,00,000</span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-red)', fontWeight: 700 }}>₹28,26,000</span>
                  </td>
                  <td>
                    <StatusBadge status="partially_paid" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Vehicle Allocated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="badge badge-teal">Vehicle Cost</span>
                  </td>
                  <td>Ceramic coating & deep interior detailing</td>
                  <td>
                    <strong>₹25,000</strong>
                  </td>
                  <td>Mahindra XUV700 (STK-2024-003)</td>
                  <td>
                    <StatusBadge status="approved" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="badge badge-teal">Vehicle Cost</span>
                  </td>
                  <td>Inter-branch enclosed flatbed transport WS → DT</td>
                  <td>
                    <strong>₹20,000</strong>
                  </td>
                  <td>Tata Nexon EV (STK-2024-002)</td>
                  <td>
                    <StatusBadge status="approved" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record New Customer Payment"
      >
        <form onSubmit={handleRecordPayment}>
          <div className="form-group">
            <label className="form-label">Customer Profile</label>
            <select
              className="form-select"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
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
              <label className="form-label">Amount (₹)</label>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Settled Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Official Receipt: ${selectedReceipt.paymentNumber}`}
        >
          <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-green)' }}>APEX MOTORS OFFICIAL MONEY RECEIPT</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Receipt Ref: {selectedReceipt.paymentNumber}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Received From:</span>
                <div style={{ fontWeight: 600 }}>{selectedReceipt.customerName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Payment Mode:</span>
                <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>{selectedReceipt.method}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Bank UTR / Ref:</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedReceipt.referenceNumber || 'CASH-REC'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Settled Date:</span>
                <div style={{ fontWeight: 600 }}>{new Date(selectedReceipt.settledAt || selectedReceipt.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-green-bg)', border: '1px solid var(--color-green-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-green-text)' }}>Net Amount Received:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-green-text)' }}>
                ₹{selectedReceipt.amount.toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setSelectedReceipt(null)}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                alert('Printing official payment receipt voucher!');
                setSelectedReceipt(null);
              }}
            >
              <Printer size={15} /> Print Receipt
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
