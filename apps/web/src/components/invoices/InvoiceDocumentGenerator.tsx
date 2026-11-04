'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Customer } from '@crm/shared-types';
import { getCompanyProfile, DEFAULT_COMPANY_PROFILE, CompanyProfile, saveCompanyProfile } from '@/lib/company-store';
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

export function ExecutiveSignatureSvg({
  color = '#0F172A',
  width = 145,
  height = 50,
}: {
  color?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 150 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* Authentic executive handwriting signature stroke */}
      <path
        d="M 12 42 C 22 18, 32 8, 44 14 C 54 20, 52 44, 38 46 C 24 48, 16 28, 30 18 C 45 6, 68 8, 86 22 C 98 32, 114 36, 134 18"
        stroke={color}
        strokeWidth="3.0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 32 26 C 52 24, 76 22, 98 25"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M 62 44 C 84 41, 112 39, 138 42"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M 124 22 C 132 16, 142 22, 138 32 C 134 40, 120 44, 110 40"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function extractBrandColorFromLogo(logoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !logoUrl) {
      resolve('#6253F8');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#6253F8');
          return;
        }

        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets: Record<string, { count: number; r: number; g: number; b: number }> = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const a = imgData[i + 3];
          if (a < 100) continue; // transparent

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // Skip white/near-white
          if (r > 220 && g > 220 && b > 220) continue;
          // Skip black/near-black
          if (r < 35 && g < 35 && b < 35) continue;

          // Require minimal color saturation so we don't pick grays
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 25) continue;

          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;

          if (!colorBuckets[key]) {
            colorBuckets[key] = { count: 1, r: qr, g: qg, b: qb };
          } else {
            colorBuckets[key].count++;
          }
        }

        const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count);
        if (sorted.length > 0) {
          const best = sorted[0];
          const hex = `#${((1 << 24) + (best.r << 16) + (best.g << 8) + best.b).toString(16).slice(1)}`;
          resolve(hex);
        } else {
          resolve('#6253F8');
        }
      } catch (err) {
        resolve('#6253F8');
      }
    };
    img.onerror = () => {
      resolve('#6253F8');
    };
    img.src = logoUrl;
  });
}

export function getInvoiceColorSystem(brandColor: string = '#6253F8') {
  const hex = (brandColor || '#6253F8').trim();
  const lower = hex.toLowerCase();

  const isPurple =
    lower.includes('6253') ||
    lower.includes('7c3a') ||
    lower.includes('6366') ||
    lower.includes('4f46') ||
    lower.includes('8b5cf6') ||
    lower === '#6253f8';

  const isOrange =
    lower.includes('ea58') ||
    lower.includes('f27a') ||
    lower.includes('f973') ||
    lower.includes('c241') ||
    lower.includes('d977') ||
    lower === '#f27a1a' ||
    lower === '#ea580c';

  const isBlue =
    lower.includes('0284') ||
    lower.includes('2563') ||
    lower.includes('1d4e') ||
    lower.includes('3b82') ||
    lower.includes('0ea5');

  const isGreen =
    lower.includes('0596') ||
    lower.includes('10b9') ||
    lower.includes('16a3') ||
    lower.includes('1580');

  let graphicAccent = hex;
  let textAccent = hex;
  let lightTint = '#EEF2FF';
  let borderTint = '#C7D2FE';

  if (isPurple) {
    graphicAccent = '#6253F8'; // Official unAI royal violet
    textAccent = '#4338CA';    // High contrast violet text
    lightTint = '#EEF2FF';
    borderTint = '#C7D2FE';
  } else if (isOrange) {
    graphicAccent = '#EA580C'; // Vivid amber orange for shapes
    textAccent = '#C2410C';    // Deep burnt orange for text (contrast 4.8:1)
    lightTint = '#FFF7ED';
    borderTint = '#FED7AA';
  } else if (isBlue) {
    graphicAccent = '#0284C7';
    textAccent = '#0369A1';
    lightTint = '#F0F9FF';
    borderTint = '#BAE6FD';
  } else if (isGreen) {
    graphicAccent = '#059669';
    textAccent = '#047857';
    lightTint = '#ECFDF5';
    borderTint = '#A7F3D0';
  } else {
    graphicAccent = hex;
    textAccent = hex;
    lightTint = '#F8FAFC';
    borderTint = '#CBD5E1';
  }

  return {
    graphicAccent,
    textAccent,
    lightTint,
    borderTint,
  };
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

  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [autoThemeColor, setAutoThemeColor] = useState<string>('#6253F8');

  useEffect(() => {
    const profile = getCompanyProfile();
    setCompany(profile);
    const targetLogo = profile.logoUrl || '/unai-logo.png';
    extractBrandColorFromLogo(targetLogo).then((color) => {
      setAutoThemeColor(color);
      if (profile.brandColor !== color) {
        const updated = saveCompanyProfile({ brandColor: color });
        setCompany(updated);
      }
    });

    const handleCompanyChanged = () => {
      const p = getCompanyProfile();
      setCompany(p);
      const l = p.logoUrl || '/unai-logo.png';
      extractBrandColorFromLogo(l).then((c) => {
        setAutoThemeColor(c);
      });
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
                  color: '#6253F8',
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
                  backgroundColor: showPreview ? '#6253F8' : '#F1F5F9',
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

          {/* AUTHORIZED SIGNATORY SETTINGS */}
          <div
            style={{
              marginTop: '14px',
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              AUTHORIZED SIGNATORY DETAILS
            </span>
            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Authorized Signatory Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={company.authorizedSignatoryName || ''}
                  onChange={(e) => {
                    const updated = saveCompanyProfile({ authorizedSignatoryName: e.target.value });
                    setCompany(updated);
                  }}
                  placeholder="Anjali"
                  style={{ backgroundColor: '#FFFFFF' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Signatory Designation</label>
                <input
                  type="text"
                  className="form-input"
                  value={company.authorizedSignatoryDesignation || ''}
                  onChange={(e) => {
                    const updated = saveCompanyProfile({ authorizedSignatoryDesignation: e.target.value });
                    setCompany(updated);
                  }}
                  placeholder="COO"
                  style={{ backgroundColor: '#FFFFFF' }}
                />
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
                backgroundColor: '#6253F8',
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
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF', fontSize: '0.82rem', fontWeight: 700 }}>
              <Sparkles size={16} />
              <span>A4 Document Preview — Complete with Company Watermark & Signature</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  color: '#334155',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                }}
              >
                <Printer size={13} /> Print / Save as PDF
              </button>
            </div>
          </div>

          {/* THE OFFICIAL A4 PRINT SHEET MATCHING EXACT DESIGN TEMPLATE */}
          {(() => {
            const { graphicAccent, textAccent } = getInvoiceColorSystem(autoThemeColor || company.brandColor || '#6253F8');

            return (
              <div
                className="print-invoice-sheet"
                style={{
                  position: 'relative',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px solid #CBD5E1',
                  padding: '24px 30px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  minHeight: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {/* COMPANY WATERMARK (Straight horizontal with real logo colors, visible opacity) */}
                {company.watermarkEnabled && (
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
                      opacity: Math.max(company.watermarkOpacity || 0, 0.22),
                    }}
                  >
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt="Watermark"
                        style={{
                          maxWidth: '400px',
                          maxHeight: '400px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '4.2rem',
                          fontWeight: 900,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: textAccent,
                          textAlign: 'center',
                        }}
                      >
                        {company.tradeName || company.legalName || 'DEALERSHIP'}
                      </div>
                    )}
                  </div>
                )}

                {/* Document Content (z-index 2 over decorative graphics & watermark) */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  {/* TOP HEADER: INVOICE title & Company Contact */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Left: Big Bold "INVOICE" and Invoice No */}
                    <div>
                      <h1
                        style={{
                          fontSize: '2.1rem',
                          fontWeight: 900,
                          color: '#0F172A',
                          margin: 0,
                          letterSpacing: '-0.02em',
                          lineHeight: 1,
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        INVOICE
                      </h1>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          color: '#334155',
                          marginTop: '6px',
                          fontWeight: 600,
                        }}
                      >
                        Invoice no : <span style={{ fontWeight: 800, color: '#0F172A' }}>{invoiceNumber}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Date : {invoiceDate}
                      </div>
                    </div>

                    {/* Right: Logo and Contact Details in Logo/Brand Color */}
                    <div style={{ textAlign: 'right' }}>
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.tradeName || 'Logo'}
                          style={{
                            maxHeight: '44px',
                            maxWidth: '160px',
                            objectFit: 'contain',
                            marginBottom: '6px',
                            display: 'inline-block',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: '1.35rem',
                            fontWeight: 900,
                            color: textAccent,
                            letterSpacing: '-0.02em',
                            marginBottom: '4px',
                          }}
                        >
                          {company.tradeName || company.legalName || 'YourLogo'}
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: '0.76rem',
                          color: '#1E293B',
                          lineHeight: 1.5,
                          fontWeight: 600,
                        }}
                      >
                        {company.phone && (
                          <div>
                            <span style={{ color: textAccent, fontWeight: 700 }}>Tel: </span>
                            {company.phone}
                          </div>
                        )}
                        {company.email && (
                          <div>
                            <span style={{ color: textAccent, fontWeight: 700 }}>Mail: </span>
                            {company.email}
                          </div>
                        )}
                        {company.website && (
                          <div>
                            <span style={{ color: textAccent, fontWeight: 700 }}>Web: </span>
                            {company.website}
                          </div>
                        )}
                        <div>
                          {company.address ? `${company.address}${company.city ? `, ${company.city}` : ''}` : 'Walsh, Somerfield - US'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INVOICE TO (Customer Billing Address) */}
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        color: textAccent,
                        marginBottom: '3px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Invoice to:
                    </div>
                    <div
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#0F172A',
                      }}
                    >
                      {customerName || 'Gabriela Moder'}
                    </div>
                    {companyName && (
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                        {companyName}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: '#475569',
                        lineHeight: 1.4,
                        marginTop: '2px',
                        maxWidth: '440px',
                      }}
                    >
                      {billingAddress || 'Jl. Klakahrejo - Manyang'}
                      {(state || pincode) && (
                        <span>, {state || 'Central Java'} {pincode ? `- ${pincode}` : ''}</span>
                      )}
                      {phone && <span> | Phone: {phone}</span>}
                      {gstin && (
                        <span> | GSTIN: <strong style={{ color: '#0F172A' }}>{gstin}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* CLEAN ITEMIZED PRODUCTS / SERVICES TABLE */}
                  <div style={{ marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 800, color: '#0F172A', width: '45px' }}>
                            No.
                          </th>
                          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 800, color: '#0F172A' }}>
                            Product Deskription
                          </th>
                          <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A', width: '110px' }}>
                            Price
                          </th>
                          <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#0F172A', width: '60px' }}>
                            QTY
                          </th>
                          <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: '#0F172A', width: '120px' }}>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, i) => {
                          const q = parseFloat(String(it.qty)) || 0;
                          const r = parseFloat(String(it.rate)) || 0;
                          const lineTot = q * r;
                          const numPadded = String(i + 1).padStart(2, '0');
                          const qtyPadded = String(it.qty).padStart(2, '0');

                          return (
                            <tr
                              key={it.id}
                              style={{
                                borderBottom: '1px solid #F1F5F9',
                              }}
                            >
                              <td style={{ padding: '8px 6px', color: '#64748B', fontWeight: 600 }}>
                                {numPadded}
                              </td>
                              <td style={{ padding: '8px 6px', fontWeight: 600, color: '#0F172A' }}>
                                {it.description || 'Certified Pre-Owned Vehicle Delivery'}
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'right', color: '#0F172A', fontWeight: 600 }}>
                                ₹{r.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                                {qtyPadded}
                              </td>
                              <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                                ₹{lineTot.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* PAYMENT METHOD & TERMS (LEFT) VS TOTALS CALCULATION (RIGHT) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1fr',
                      gap: '20px',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Left Side: Payment Method & Terms */}
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '3px' }}>
                          Payment Method
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.5, fontWeight: 600 }}>
                          <div>Bank Account: <span style={{ color: '#0F172A', fontWeight: 700 }}>{company.accountNumber || '123456789012'}</span> ({company.bankName || 'HDFC Bank'})</div>
                          <div>IFSC / UPI: <span style={{ color: '#0F172A', fontWeight: 700 }}>{company.ifscCode || 'HDFC0001234'}</span> {company.upiId ? `• ${company.upiId}` : ''}</div>
                          <div>Settlement / UTR: <span style={{ color: textAccent, fontWeight: 800 }}>{utrReference || 'CONFIRMED'}</span></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '3px' }}>
                          Terms & Condition
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#475569',
                            lineHeight: 1.45,
                            maxWidth: '380px',
                            fontWeight: 500,
                          }}
                        >
                          Payment due within 15 days. Vehicle ownership title and registration documents will be handed over upon realization of full payment. Statutory road taxes and RTO transfer charges applicable as per actuals.
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Sub Total, Tax, Grand Total */}
                    <div style={{ fontSize: '0.82rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569', fontWeight: 600 }}>
                        <span>Sub Total</span>
                        <span style={{ color: '#0F172A', fontWeight: 700 }}>₹{calc.subtotal.toLocaleString('en-IN')}</span>
                      </div>

                      {calc.discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#DC2626', fontWeight: 600 }}>
                          <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})</span>
                          <span>-₹{calc.discountAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569', fontWeight: 600 }}>
                        <span>Tax ({items[0]?.taxPercent || 18}%)</span>
                        <span style={{ color: '#0F172A', fontWeight: 700 }}>
                          ₹{(calc.cgst + calc.sgst + calc.igst).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {calc.roundOffDiff !== 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#64748B', fontSize: '0.76rem' }}>
                          <span>Round-off</span>
                          <span>₹{calc.roundOffDiff.toFixed(2)}</span>
                        </div>
                      )}

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
                        <span>₹{calc.grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM SECTION: Contact Info (Left), Thank You Message (Center), Signature (Right) */}
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
                    <div><span style={{ color: textAccent, fontWeight: 800 }}>P :</span> {company.phone || '+00 123 345 445'}</div>
                    <div><span style={{ color: textAccent, fontWeight: 800 }}>E :</span> {company.email || 'youremail@gmail.com'}</div>
                    <div>{company.address ? `${company.address}` : 'Walsh, Somerfield - US'}</div>
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
                      {company.signatureUrl ? (
                        <img
                          src={company.signatureUrl}
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
                        {company.authorizedSignatoryName || 'Anjali'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#1E293B', fontWeight: 700, marginTop: '2px' }}>
                        {company.authorizedSignatoryDesignation || 'COO'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
