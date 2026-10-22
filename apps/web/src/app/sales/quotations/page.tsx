'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Customer, Vehicle, Quotation } from '@crm/shared-types';
import { PricingEngine } from '@crm/business-rules';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Calculator,
  ShieldAlert,
  CheckCircle,
  Building,
} from 'lucide-react';

interface LineItemInput {
  itemType: 'vehicle' | 'accessory' | 'service' | 'fee' | 'insurance' | 'warranty';
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRatePercent: number;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>(api.getQuotations());
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [vehicles] = useState<Vehicle[]>(api.getVehicles());
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);

  // Builder State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [items, setItems] = useState<LineItemInput[]>([
    {
      itemType: 'vehicle',
      description: 'Vehicle Base Showroom Price',
      quantity: 1,
      unitPrice: 1950000,
      discountAmount: 25000,
      taxRatePercent: 18,
    },
    {
      itemType: 'fee',
      description: 'RTO Registration, Road Tax & Handling',
      quantity: 1,
      unitPrice: 35000,
      discountAmount: 0,
      taxRatePercent: 0,
    },
    {
      itemType: 'insurance',
      description: 'Zero Depreciation 1-Year Comprehensive Insurance',
      quantity: 1,
      unitPrice: 42000,
      discountAmount: 5000,
      taxRatePercent: 18,
    },
  ]);
  const [quoteNotes, setQuoteNotes] = useState('Includes 3 years manufacturer warranty & RSA roadside assistance.');

  // Live Pricing Calculation
  const totals = PricingEngine.calculateQuotationTotals(items);

  // Live Discount Validation
  const discountCheck = PricingEngine.validateDiscount(
    totals.discountTotal,
    totals.subtotal,
    'sales_executive'
  );

  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId);
    const veh = vehicles.find((v) => v.id === vId);
    if (veh) {
      setItems((prev) => [
        {
          itemType: 'vehicle',
          description: `${veh.year} ${veh.make} ${veh.model} ${veh.variant} (${veh.color})`,
          quantity: 1,
          unitPrice: veh.askingPrice,
          discountAmount: 25000,
          taxRatePercent: 18,
        },
        ...prev.filter((i) => i.itemType !== 'vehicle'),
      ]);
    }
  };

  const addItem = (type: LineItemInput['itemType'], desc: string, price: number) => {
    setItems((prev) => [
      ...prev,
      {
        itemType: type,
        description: desc,
        quantity: 1,
        unitPrice: price,
        discountAmount: 0,
        taxRatePercent: type === 'fee' ? 0 : 18,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const created = api.createQuotation({
      customerId: selectedCustomerId,
      branchId: 'b-dt-001',
      items: items.map((it, idx) => ({
        id: 'item-' + idx,
        quotationId: 'q-new',
        ...it,
        taxAmount: ((it.unitPrice * it.quantity - it.discountAmount) * it.taxRatePercent) / 100,
        lineTotal: it.unitPrice * it.quantity - it.discountAmount,
      })),
      validUntil: new Date(Date.now() + 86400000 * 14).toISOString(),
      notes: quoteNotes,
    });
    setQuotations([...api.getQuotations()]);
    setIsBuilderOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotation Desk & Pricing Engine</h1>
          <p className="page-desc">
            Multi-tier pricing calculation, GST taxation, line item accessories, and discount approval matrix.
          </p>
        </div>
        <button
          onClick={() => setIsBuilderOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> New Quotation Builder
        </button>
      </div>

      {/* Quotations List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Generated Quotations</h2>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote Number</th>
                <th>Customer</th>
                <th>Validity Date</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Taxes & Fees</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td>
                    <strong style={{ color: 'var(--color-indigo)' }}>{q.quoteNumber}</strong>
                  </td>
                  <td>
                    <strong>{q.customerName}</strong>
                  </td>
                  <td>{new Date(q.validUntil).toLocaleDateString()}</td>
                  <td>₹{(q.totals.subtotal / 100000).toFixed(2)} L</td>
                  <td>
                    <span style={{ color: 'var(--color-green)' }}>
                      -₹{(q.totals.discountTotal / 100000).toFixed(2)} L
                    </span>
                  </td>
                  <td>₹{((q.totals.taxTotal + q.totals.feesTotal) / 100000).toFixed(2)} L</td>
                  <td>
                    <strong style={{ fontSize: '0.95rem' }}>
                      ₹{(q.totals.grandTotal / 100000).toFixed(2)} Lakh
                    </strong>
                  </td>
                  <td>
                    <StatusBadge status={q.status} />
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewQuote(q)}
                    >
                      <Printer size={14} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Builder Modal */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title="Interactive Dealership Quotation Builder"
        maxWidth="840px"
      >
        <form onSubmit={handleSaveQuotation}>
          {/* Customer & Vehicle Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Client / Customer</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Showroom Vehicle</label>
              <select
                className="form-select"
                value={selectedVehicleId}
                onChange={(e) => handleVehicleSelect(e.target.value)}
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model} — ₹{(v.askingPrice / 100000).toFixed(2)}L
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Item Add Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addItem('accessory', 'Premium Floor Mats & Car Care Kit', 8500)}
            >
              + Accessory Kit (₹8.5k)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addItem('warranty', '2-Year Extended Drivetrain Warranty', 28000)}
            >
              + Extended Warranty (₹28k)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addItem('service', '3-Year Prepaid Scheduled Maintenance', 35000)}
            >
              + Service Package (₹35k)
            </button>
          </div>

          {/* Line Items Table */}
          <div className="table-container" style={{ marginBottom: '1.25rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line Item Description</th>
                  <th>Type</th>
                  <th style={{ width: '120px' }}>Unit Price (₹)</th>
                  <th style={{ width: '100px' }}>Discount (₹)</th>
                  <th style={{ width: '80px' }}>GST %</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '0.35rem 0.5rem' }}
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].description = e.target.value;
                          setItems(updated);
                        }}
                      />
                    </td>
                    <td>
                      <span className="badge badge-neutral">{item.itemType}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        style={{ padding: '0.35rem 0.5rem' }}
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].unitPrice = Number(e.target.value);
                          setItems(updated);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        style={{ padding: '0.35rem 0.5rem' }}
                        value={item.discountAmount}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].discountAmount = Number(e.target.value);
                          setItems(updated);
                        }}
                      />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{item.taxRatePercent}%</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        style={{ color: 'var(--color-red)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live Discount Approval Matrix Check */}
          {discountCheck.requiresApproval && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--color-orange-bg)',
                border: '1px solid var(--color-orange-border)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-orange-text)',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}
            >
              <ShieldAlert size={18} />
              <span>
                <strong>Manager Approval Required:</strong> Total discount ₹{totals.discountTotal.toLocaleString()} exceeds your sales executive threshold (max allowed: {discountCheck.maxAllowedPercent}%). An approval request will be routed to Branch Manager.
              </span>
            </div>
          )}

          {/* Pricing Totals Box */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Base Subtotal:</span>
              <strong>₹{totals.subtotal.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-green)' }}>
              <span>Total Approved Discounts:</span>
              <strong>-₹{totals.discountTotal.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>GST & Cess Taxes (18%):</span>
              <strong>+₹{totals.taxTotal.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Statutory RTO & Handling Fees:</span>
              <strong>+₹{totals.feesTotal.toLocaleString()}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                fontWeight: 700,
                borderTop: '1px solid var(--color-border)',
                paddingTop: '0.5rem',
                color: 'var(--color-indigo)',
              }}
            >
              <span>On-Road Grand Total:</span>
              <span>₹{totals.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsBuilderOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Official Quotation
            </button>
          </div>
        </form>
      </Modal>

      {/* Quotation Preview Modal */}
      {previewQuote && (
        <Modal
          isOpen={!!previewQuote}
          onClose={() => setPreviewQuote(null)}
          title={`Quotation Preview: ${previewQuote.quoteNumber}`}
          maxWidth="700px"
        >
          <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-indigo)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-indigo)' }}>APEX MOTORS GROUP</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>42 MG Road, Downtown Flagship • GST: 27AAACA1234F1Z1</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{previewQuote.quoteNumber}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Date: {new Date(previewQuote.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Quotation Prepared For:</div>
              <div style={{ fontWeight: 700 }}>{previewQuote.customerName}</div>
            </div>

            <div className="table-container" style={{ marginBottom: '1rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Tax</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {previewQuote.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.description}</td>
                      <td>{it.quantity}</td>
                      <td>₹{it.unitPrice.toLocaleString()}</td>
                      <td>₹{it.taxAmount.toLocaleString()}</td>
                      <td><strong>₹{it.lineTotal.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-indigo)', padding: '0.5rem 0' }}>
              Final On-Road Price: ₹{previewQuote.totals.grandTotal.toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setPreviewQuote(null)}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                alert('Printing official PDF quotation with dealership stamp!');
                setPreviewQuote(null);
              }}
            >
              <Printer size={15} /> Print Official PDF
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
