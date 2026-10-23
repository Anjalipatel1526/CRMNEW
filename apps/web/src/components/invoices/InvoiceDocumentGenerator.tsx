'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Customer } from '@crm/shared-types';
import { getCompanyProfile, CompanyProfile } from '@/lib/company-store';
import {
  FileText,
  Save,
  Download,
  Share2,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  X,
  Upload,
  Copy,
  Printer,
  Sparkles,
  Building,
  Mail,
  Phone,
  Check,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  qty: string | number;
  rate: string | number;
  taxPercent: number;
}

interface InvoiceDocumentGeneratorProps {
  initialCustomer?: Customer | null;
  onClose?: () => void;
  onSave?: (invoiceData: any) => void;
  isModal?: boolean;
}

const DEFAULT_TERMS = `1. Payment due within 15 days of invoice date.
2. Vehicle ownership title and registration documents will be handed over upon realization of full payment.
3. All pre-owned certified vehicles undergo 140-point technical inspection with comprehensive 1-year dealership warranty.
4. Statutory road taxes and RTO transfer charges are applicable as per actuals.`;

function numberToWordsINR(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  num = Math.floor(num);
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    } else {
      str += a[n];
    }
    return str;
  };

  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let hundred = Math.floor(num / 100);
  num %= 100;
  let rem = num;

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (hundred > 0) res += inWords(hundred) + 'Hundred ';
  if (rem > 0) {
    if (res !== '') res += 'and ';
    res += inWords(rem);
  }
  return res.trim() + ' Rupees Only';
}

export function InvoiceDocumentGenerator({
  initialCustomer,
  onClose,
  onSave,
  isModal = true,
}: InvoiceDocumentGeneratorProps) {
  const [customers] = useState<Customer[]>(api.getCustomers());
  const [showPreview, setShowPreview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile());

  useEffect(() => {
    const handleCompanyChanged = () => {
      setCompany(getCompanyProfile());
    };
    window.addEventListener('crm-company-profile-changed', handleCompanyChanged);
    return () => {
      window.removeEventListener('crm-company-profile-changed', handleCompanyChanged);
    };
  }, []);

  // Form State
  const [invoiceNumber] = useState('INV-2024-' + Math.floor(100 + Math.random() * 900));
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);

  const [customerId, setCustomerId] = useState(initialCustomer?.id || '');
  const [customerName, setCustomerName] = useState(
    initialCustomer ? `${initialCustomer.firstName} ${initialCustomer.lastName}` : ''
  );
  const [companyName, setCompanyName] = useState(initialCustomer?.companyName || '');
  const [gstin, setGstin] = useState(initialCustomer?.gstin || '');
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [phone, setPhone] = useState(initialCustomer?.phone || '');
  const [billingAddress, setBillingAddress] = useState(
    initialCustomer?.address?.street || ''
  );
  const [state, setState] = useState(initialCustomer?.address?.state || '');
  const [pincode, setPincode] = useState(initialCustomer?.address?.pincode || '');
  const [sameShipping, setSameShipping] = useState(true);

  // Items & Particulars - ZERO Mock Data
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: '',
      qty: '1',
      rate: '',
      taxPercent: 18,
    },
  ]);

  // Tax & Discount Adjustments
  const [taxMode, setTaxMode] = useState<'cgst_sgst' | 'igst' | 'exempt'>('cgst_sgst');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string | number>('0');
  const [applyRoundOff, setApplyRoundOff] = useState(true);

  // Payment Details (Clean & Minimal)
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [utrReference, setUtrReference] = useState('');

  // Auto-fill customer without mock fallback strings
  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(`${found.firstName} ${found.lastName}`.trim());
      setCompanyName(found.companyName || '');
      setGstin(found.gstin || '');
      setEmail(found.email || '');
      setPhone(found.phone || '');
      setBillingAddress(found.address?.street || '');
      setState(found.address?.state || '');
      setPincode(found.address?.pincode || '');
    } else {
      setCustomerName('');
      setCompanyName('');
      setGstin('');
      setEmail('');
      setPhone('');
      setBillingAddress('');
      setState('');
      setPincode('');
    }
  };

  // Add Item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        description: '',
        qty: '1',
        rate: '',
        taxPercent: 18,
      },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update Item field
  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Calculations
  const calc = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const q = parseFloat(String(item.qty)) || 0;
      const r = parseFloat(String(item.rate)) || 0;
      return sum + q * r;
    }, 0);

    const dVal = parseFloat(String(discountValue)) || 0;
    const discountAmount =
      discountType === 'percentage' ? (subtotal * dVal) / 100 : dVal;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    let totalTax = 0;
    if (taxMode !== 'exempt') {
      totalTax = items.reduce((sum, item) => {
        const q = parseFloat(String(item.qty)) || 0;
        const r = parseFloat(String(item.rate)) || 0;
        const itemSubtotal = q * r;
        const itemRatio = subtotal > 0 ? itemSubtotal / subtotal : 0;
        const itemDiscounted = itemSubtotal - discountAmount * itemRatio;
        return sum + itemDiscounted * ((item.taxPercent || 0) / 100);
      }, 0);
    }

    const rawTotal = discountedSubtotal + totalTax;
    const grandTotal = applyRoundOff ? Math.round(rawTotal) : rawTotal;
    const roundOffDiff = grandTotal - rawTotal;

    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      totalTax,
      cgst: taxMode === 'cgst_sgst' ? totalTax / 2 : 0,
      sgst: taxMode === 'cgst_sgst' ? totalTax / 2 : 0,
      igst: taxMode === 'igst' ? totalTax : 0,
      roundOffDiff,
      grandTotal,
    };
  }, [items, discountType, discountValue, taxMode, applyRoundOff]);

  // Handle Save
  const handleSave = () => {
    const invoicePayload = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      invoiceDate,
      dueDate,
      customerId,
      customerName: customerName || 'Valued Customer',
      companyName,
      gstin,
      email,
      phone,
      billingAddress,
      state,
      pincode,
      items,
      paymentMethod,
      utrReference,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      totalTax: calc.totalTax,
      grandTotal: calc.grandTotal,
      status: 'settled',
    };

    if (onSave) {
      onSave(invoicePayload);
    }
    setToastMessage(`Invoice ${invoiceNumber} saved automatically!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Download PDF / Print
  const handleDownloadPDF = () => {
    setShowPreview(true);
    setToastMessage('Opening print dialog to Save / Download as PDF...');
    setTimeout(() => {
      window.print();
      setToastMessage(null);
    }, 450);
  };

  // Social Media Sharing
  const shareViaWhatsApp = () => {
    const text =
      `*APEX MOTORS — OFFICIAL INVOICE & RECEIPT*\n` +
      `Invoice #: ${invoiceNumber}\n` +
      `Date: ${invoiceDate}\n` +
      `Customer: ${customerName || 'Valued Customer'}\n` +
      `Amount Settled: ₹${calc.grandTotal.toLocaleString('en-IN')}\n` +
      `Payment Method: ${paymentMethod.toUpperCase()}\n` +
      (utrReference ? `Reference: ${utrReference}\n\n` : '\n') +
      `Certified Pre-Owned Luxury Dealership\n` +
      `Thank you for your business!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareDropdownOpen(false);
  };

  const shareViaEmail = () => {
    const subject = `Official Invoice ${invoiceNumber} — APEX MOTORS`;
    const body =
      `Dear ${customerName || 'Customer'},\n\n` +
      `Please find the summary of your vehicle purchase / booking invoice:\n` +
      `Invoice Number: ${invoiceNumber}\n` +
      `Date: ${invoiceDate}\n` +
      `Grand Total: ₹${calc.grandTotal.toLocaleString('en-IN')} (${numberToWordsINR(calc.grandTotal)})\n` +
      `Payment Mode: ${paymentMethod.toUpperCase()}\n` +
      (utrReference ? `Transaction Ref: ${utrReference}\n\n` : '\n') +
      `Thank you for trusting Apex Motors.\n\n` +
      `Warm regards,\nAPEX MOTORS PVT LTD\nBilling & Finance Desk`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setShareDropdownOpen(false);
  };

  const handleCopySummary = () => {
    const summary =
      `APEX MOTORS OFFICIAL INVOICE: ${invoiceNumber}\n` +
      `Customer: ${customerName || 'Customer'} | ₹${calc.grandTotal.toLocaleString('en-IN')}\n` +
      `Date: ${invoiceDate}` + (utrReference ? ` | Ref: ${utrReference}` : '');
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setToastMessage('Invoice summary copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
      setShareDropdownOpen(false);
    }, 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoiceNumber} - Apex Motors`,
          text: `Apex Motors Official Invoice for ${customerName} - Total: ₹${calc.grandTotal.toLocaleString('en-IN')}`,
          url: window.location.href,
        });
        setShareDropdownOpen(false);
      } catch (err) {
        // user dismissed
      }
    } else {
      shareViaWhatsApp();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            zIndex: 9999,
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card / Action Toolbar */}
      {!isModal ? (
        <div
          className="no-print"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid #E2E8F0',
            padding: '14px 18px',
            marginBottom: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#1E443B',
                  background: '#E6F4EF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                New Invoice
              </span>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                Create Document
              </h2>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="modal-top-close-btn"
                title="Close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Subtitle Bar with Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '10px',
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>
                New INVOICE
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Click Preview Document to view the complete A4 document page with company watermark.
              </div>
            </div>

            {/* Action Buttons: Save, Preview, Download PDF, Share */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Save size={14} />
                <span>Save Document</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: showPreview ? '#1E443B' : '#F1F5F9',
                  color: showPreview ? '#FFFFFF' : '#1E293B',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Eye size={14} />
                <span>{showPreview ? 'Edit Form' : 'Preview A4'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>

              {/* Social Share Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShareDropdownOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>

                {shareDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '38px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                      border: '1.5px solid #E2E8F0',
                      width: '210px',
                      zIndex: 100,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={shareViaWhatsApp}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#047857',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>💬</span> Share on WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={shareViaEmail}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#1E40AF',
                        textAlign: 'left',
                      }}
                    >
                      <Mail size={15} /> Send via Email
                    </button>

                    <button
                      type="button"
                      onClick={handleNativeShare}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#0F172A',
                        textAlign: 'left',
                      }}
                    >
                      <Share2 size={15} /> Social Media / More...
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySummary}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#475569',
                        textAlign: 'left',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      {copied ? <Check size={15} style={{ color: '#10B981' }} /> : <Copy size={15} />}
                      <span>{copied ? 'Copied Link!' : 'Copy Summary Link'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Container: Form Editor vs Live A4 Watermarked Invoice */}
      {!showPreview ? (
        /* FORM EDITOR (Image 2 & 3 UI) */
        <div className="no-print inspo-form-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Customer Selection Dropdown (from Image 2) */}
          <div className="form-group">
            <select
              className="form-select"
              value={customerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              style={{ fontWeight: 600, color: customerId ? '#0F172A' : '#64748B' }}
            >
              <option value="">-- Select a Customer to Auto-fill Details --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Details Grid (Image 2) */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Customer Name <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe / TechCorp"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="TechCorp Solutions"
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">GSTIN</label>
              <input
                type="text"
                className="form-input"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="27ABCDE1234F1Z5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@techcorp.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Billing Address</label>
              <input
                type="text"
                className="form-input"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Street address, Suite / Flat number"
              />
            </div>
            <div className="form-group">
              <label className="form-label">State & Pincode</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  style={{ flex: 1.2 }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode"
                  style={{ flex: 0.9 }}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address Checkbox (Image 2) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              id="same-shipping-box"
              checked={sameShipping}
              onChange={(e) => setSameShipping(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
            />
            <label htmlFor="same-shipping-box" style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer', margin: 0 }}>
              Shipping address same as billing
            </label>
          </div>

          {/* Items & Particulars Section (Image 2 & 3) */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                Items & Particulars
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#2563EB',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((it, idx) => {
                const q = parseFloat(String(it.qty)) || 0;
                const r = parseFloat(String(it.rate)) || 0;
                const lineTotal = q * r;

                return (
                  <div
                    key={it.id}
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px',
                      backgroundColor: '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        ITEM #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={it.description}
                        onChange={(e) => handleUpdateItem(it.id, 'description', e.target.value)}
                        placeholder="Item description / Vehicle details (e.g. Mahindra XUV700 AX7L AWD)"
                        required
                        style={{ backgroundColor: '#FFFFFF' }}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 2fr', gap: '8px', alignItems: 'center' }}>
                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                            Qty
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-input no-spinner"
                            value={it.qty}
                            onChange={(e) => handleUpdateItem(it.id, 'qty', e.target.value.replace(/[^0-9.]/g, ''))}
                            style={{
                              backgroundColor: '#FFFFFF',
                              MozAppearance: 'textfield',
                              WebkitAppearance: 'none',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                            Rate (₹)
                          </label>
                          {/* Rate input with NO up/down arrows */}
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-input no-spinner"
                            value={it.rate}
                            onChange={(e) => handleUpdateItem(it.id, 'rate', e.target.value.replace(/[^0-9.]/g, ''))}
                            placeholder="0"
                            style={{
                              backgroundColor: '#FFFFFF',
                              MozAppearance: 'textfield',
                              WebkitAppearance: 'none',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                            Tax %
                          </label>
                          <select
                            className="form-select"
                            value={it.taxPercent}
                            onChange={(e) => handleUpdateItem(it.id, 'taxPercent', Number(e.target.value))}
                            style={{ backgroundColor: '#FFFFFF', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18% GST</option>
                            <option value={28}>28% Luxury</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '2px' }}>
                            Amount
                          </label>
                          <div
                            style={{
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 10px',
                              backgroundColor: '#F1F5F9',
                              borderRadius: '8px',
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              color: '#0F172A',
                            }}
                          >
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TAX & PAYMENT ADJUSTMENTS */}
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              TAX & PAYMENT DETAILS
            </span>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Tax Calculation Mode</label>
                <select
                  className="form-select"
                  value={taxMode}
                  onChange={(e) => setTaxMode(e.target.value as any)}
                >
                  <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                  <option value="igst">IGST (Inter-state)</option>
                  <option value="exempt">Zero Tax / Exempt</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Discount Type</label>
                <select
                  className="form-select"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Discount Value</label>
                {/* Discount input with NO up/down arrows */}
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input no-spinner"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  style={{
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0 10px 0' }}>
              <input
                type="checkbox"
                id="apply-round-off-box"
                checked={applyRoundOff}
                onChange={(e) => setApplyRoundOff(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
              />
              <label htmlFor="apply-round-off-box" style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer', margin: 0 }}>
                Apply automatic round off to grand total
              </label>
            </div>

            {/* Live Breakdown Summary Card */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Subtotal: </span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{calc.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {calc.discountAmount > 0 && (
                  <div>
                    <span style={{ color: '#EF4444' }}>Discount: </span>
                    <span style={{ fontWeight: 700, color: '#EF4444' }}>-₹{calc.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {calc.totalTax > 0 && (
                  <div>
                    <span style={{ color: '#2563EB' }}>
                      {taxMode === 'cgst_sgst' ? 'CGST+SGST: ' : 'IGST: '}
                    </span>
                    <span style={{ fontWeight: 700, color: '#2563EB' }}>₹{calc.totalTax.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Grand Total:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16A34A' }}>
                  ₹{calc.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Bottom Actions Bar - Clean right aligned buttons, no cancel button */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              type="button"
              className="unique-lead-submit-btn"
              onClick={() => setShowPreview(true)}
              style={{
                backgroundColor: '#1E443B',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '9px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Eye size={15} />
              <span>Preview Watermarked A4</span>
            </button>
            <button
              type="button"
              className="unique-lead-submit-btn"
              onClick={handleSave}
              style={{
                borderRadius: '10px',
                padding: '9px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Save & Issue Invoice</span>
              <CheckCircle2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        /* LIVE A4 WATERMARKED INVOICE VIEW (SCREEN & PRINT) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Bar for Preview View */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#EFF6FF',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid #BFDBFE',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF', fontSize: '0.82rem', fontWeight: 600 }}>
              <Sparkles size={16} />
              <span>A4 Document Preview — Complete with Diagonal Company Watermark</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Back to Edit Form
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Printer size={13} /> Print / Save as PDF
              </button>
            </div>
          </div>

          {/* THE OFFICIAL A4 PRINT SHEET WITH WATERMARK */}
          <div
            className="print-invoice-sheet"
            style={{
              position: 'relative',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px solid #CBD5E1',
              padding: '36px 32px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              minHeight: '750px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* COMPANY WATERMARK (Rotated diagonally across background) */}
            {company.watermarkEnabled && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 0,
                  opacity: company.watermarkOpacity || 0.08,
                }}
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt="Watermark"
                    style={{
                      maxWidth: '380px',
                      maxHeight: '380px',
                      objectFit: 'contain',
                      filter: 'grayscale(100%)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: '4.2rem',
                      fontWeight: 900,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: '#1E443B',
                      textAlign: 'center',
                      fontFamily: 'serif',
                    }}
                  >
                    {company.tradeName || company.legalName || 'DEALERSHIP'}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: '#1E443B',
                    marginTop: '8px',
                  }}
                >
                  ★ OFFICIAL TAX INVOICE & PROFORMA RECEIPT ★
                </div>
              </div>
            )}

            {/* Document Content (z-index 2 over watermark) */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #1E443B',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt="Logo"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          objectFit: 'contain',
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#1E443B',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.1rem',
                        }}
                      >
                        {(company.tradeName || company.legalName || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#1E443B' }}>
                        {company.tradeName || company.legalName || 'APEX MOTORS'}
                      </span>
                      {company.tagline && (
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{company.tagline}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '6px' }}>
                    {company.address}, {company.city}, {company.state} {company.pincode}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    GSTIN: {company.gstin} {company.pan ? `| PAN: ${company.pan}` : ''} {company.cin ? `| CIN: ${company.cin}` : ''} | Phone: {company.phone}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#E6F4EF',
                      color: '#1E443B',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    TAX INVOICE / RECEIPT
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{invoiceNumber}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>Date: {invoiceDate}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>Due Date: {dueDate}</div>
                </div>
              </div>

              {/* Billed To / Shipped To Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    BILLED TO:
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {customerName || 'Valued Customer'}
                  </div>
                  {companyName && (
                    <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>{companyName}</div>
                  )}
                  {gstin && (
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                      GSTIN: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{gstin}</span>
                    </div>
                  )}
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
                    {billingAddress || 'Showroom Delivery'}, {state} - {pincode}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    Phone: {phone || 'N/A'} | Email: {email || 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    PAYMENT & BANK SETTLEMENT:
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                    Mode: <span style={{ textTransform: 'uppercase', color: '#16A34A' }}>{paymentMethod}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    Bank: <strong>{company.bankName || 'HDFC Bank Ltd'}</strong> • A/c: <span style={{ fontFamily: 'monospace' }}>{company.accountNumber || '50200012345678'}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    IFSC: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{company.ifscCode || 'HDFC0000042'}</span> {company.upiId ? `• UPI: ${company.upiId}` : ''}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                    Ref / UTR: <span style={{ fontFamily: 'monospace' }}>{utrReference || 'SETTLED & VERIFIED'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1E443B', color: '#FFFFFF' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Particulars / Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Rate (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Tax</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => {
                      const q = parseFloat(String(it.qty)) || 0;
                      const r = parseFloat(String(it.rate)) || 0;
                      const lineTot = q * r;

                      return (
                        <tr key={it.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '10px', color: '#64748B' }}>{i + 1}</td>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#0F172A' }}>
                            {it.description || 'Pre-owned Certified Vehicle Delivery'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>{it.qty}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            ₹{r.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>{it.taxPercent}%</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                            ₹{lineTot.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals & In-Words section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ padding: '10px 14px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      Amount in Words:
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803D', marginTop: '2px' }}>
                      {numberToWordsINR(calc.grandTotal)}
                    </div>
                  </div>

                  {/* Dealership Bank Details */}
                  <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>Bank Transfer Details:</span><br />
                    Bank: HDFC Bank Ltd | A/C Name: APEX MOTORS PVT LTD<br />
                    Account No: 50200088991122 | IFSC: HDFC0001234 | Branch: Andheri Commercial
                  </div>
                </div>

                {/* Calculation summary */}
                <div style={{ fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748B' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{calc.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {calc.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#EF4444' }}>
                      <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}):</span>
                      <span style={{ fontWeight: 600 }}>-₹{calc.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {calc.cgst > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748B' }}>
                        <span>CGST:</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{calc.cgst.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748B' }}>
                        <span>SGST:</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{calc.sgst.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  {calc.igst > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748B' }}>
                      <span>IGST:</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{calc.igst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {calc.roundOffDiff !== 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748B' }}>
                      <span>Round-off:</span>
                      <span style={{ fontWeight: 600 }}>₹{calc.roundOffDiff.toFixed(2)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderTop: '2px solid #0F172A',
                      marginTop: '6px',
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: '#0F172A',
                    }}
                  >
                    <span>Grand Total:</span>
                    <span style={{ color: '#16A34A' }}>₹{calc.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Signature */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr',
                  gap: '16px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Terms & Conditions:</div>
                  <div style={{ whiteSpace: 'pre-line', lineHeight: 1.45 }}>{DEFAULT_TERMS}</div>
                </div>

                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '150px',
                      height: '52px',
                      borderBottom: '1.5px dashed #94A3B8',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8',
                      fontSize: '0.72rem',
                      fontStyle: 'italic',
                      position: 'relative',
                    }}
                  >
                    {company.signatureUrl ? (
                      <img
                        src={company.signatureUrl}
                        alt="Authorized Signature"
                        style={{
                          maxHeight: '48px',
                          maxWidth: '140px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <span>[Seal & Signature]</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A' }}>
                    For {company.legalName || company.tradeName || 'APEX MOTORS PVT LTD'}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E443B' }}>
                    {company.authorizedSignatoryName || 'Authorized Signatory'}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64748B' }}>
                    {company.authorizedSignatoryDesignation || 'Managing Director'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
