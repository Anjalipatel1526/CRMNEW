'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import {
  Trophy,
  BarChart3,
  Clock,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Car,
  Users,
  Briefcase,
  Wrench,
  Sparkles,
  CheckCircle,
  FileText,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Receipt,
  TrendingUp,
  Tag,
  Truck,
  Phone,
  Mail,
  MapPin,
  Edit3,
} from 'lucide-react';
import { Customer, Lead } from '@crm/shared-types';

import { WordFadeIn } from '@/components/ui/WordFadeIn';

const AUDIT_LOG_EVENTS = [
  {
    id: 'aud-01',
    title: 'KYC Form 20 e-Verification Completed',
    description: 'NSDL PAN & Aadhaar e-Sign verified for Rajesh Sharma (Individual Retail Client)',
    actor: 'Vikram Singhania',
    role: 'Tenant Admin · IP 192.168.1.42',
    timeAgo: '6 mins ago',
    type: 'kyc',
    badge: { label: 'KYC Verified', bg: '#DCFCE7', color: '#15803D', border: 'rgba(22, 163, 74, 0.28)' },
    icon: <ShieldCheck size={16} />,
  },
  {
    id: 'aud-02',
    title: 'Token Advance Deposit Receipted',
    description: '₹2,50,000 RTGS advance reconciled for Deal #DL-2024-001 (Mahindra XUV700 AX7L)',
    actor: 'Priya Patil',
    role: 'Accounts Desk · UTR: HDFC2024991823',
    timeAgo: '24 mins ago',
    type: 'payment',
    badge: { label: 'Bank Settled', bg: '#E0F2FE', color: '#0369A1', border: 'rgba(2, 132, 199, 0.28)' },
    icon: <Receipt size={16} />,
  },
  {
    id: 'aud-03',
    title: 'Pipeline Stage Advanced: Qualified → Negotiation',
    description: 'Priya Nair advanced to Negotiation after 45-min highway ADAS test drive demo',
    actor: 'John Fernandes',
    role: 'Senior Sales · Downtown Flagship',
    timeAgo: '1 hr ago',
    type: 'pipeline',
    badge: { label: 'Stage Advanced', bg: '#F5F3FF', color: '#6D28D9', border: 'rgba(124, 58, 237, 0.28)' },
    icon: <TrendingUp size={16} />,
  },
  {
    id: 'aud-04',
    title: '140-Point Pre-Delivery Technical Sign-Off',
    description: 'PDI technical certification issued for Tata Safari Gold+ (#TATASAFDARK2024102)',
    actor: 'Sarah Dsouza',
    role: 'Chief Engineer · Workshop Bay #3',
    timeAgo: '2 hrs ago',
    type: 'pdi',
    badge: { label: 'PDI 140/140', bg: '#CCFBF1', color: '#0F766E', border: 'rgba(13, 148, 136, 0.28)' },
    icon: <CheckCircle2 size={16} />,
  },
  {
    id: 'aud-05',
    title: 'Special Margin Concession Authorized',
    description: 'Branch festive concession of ₹25,000 sanctioned for Hyundai Creta SX Knight Edition',
    actor: 'Kavita Chawla',
    role: 'Branch Manager · Westside Automall',
    timeAgo: '3 hrs ago',
    type: 'price',
    badge: { label: 'Authorized', bg: '#FEF3C7', color: '#B45309', border: 'rgba(217, 119, 6, 0.28)' },
    icon: <Tag size={16} />,
  },
  {
    id: 'aud-06',
    title: 'Stockyard Vehicle Inward Allotment',
    description: 'Shipment VIN #MALC851CLPM101901 registered into Central Inventory Stock repository',
    actor: 'Sunil Rawat',
    role: 'Yard Supervisor · Gate Inward #401',
    timeAgo: '4 hrs ago',
    type: 'stock',
    badge: { label: 'Stock Registered', bg: '#EEF2FF', color: '#4338CA', border: 'rgba(79, 70, 229, 0.28)' },
    icon: <Truck size={16} />,
  },
];

const REVENUE_DATA_12M = [
  { month: 'Nov', revenue: 142000, target: 156700 },
  { month: 'Dec', revenue: 168000, target: 156700 },
  { month: 'Jan', revenue: 152000, target: 156700 },
  { month: 'Feb', revenue: 174000, target: 156700 },
  { month: 'Mar', revenue: 188000, target: 156700 },
  { month: 'Apr', revenue: 138000, target: 156700 },
  { month: 'May', revenue: 165000, target: 156700 },
  { month: 'Jun', revenue: 178000, target: 156700 },
  { month: 'Jul', revenue: 145000, target: 156700 },
  { month: 'Aug', revenue: 190000, target: 156700 },
  { month: 'Sep', revenue: 182000, target: 156700 },
  { month: 'Oct', revenue: 196000, target: 156700 },
];

const REVENUE_DATA_6M = [
  { month: 'May', revenue: 165000, target: 156700 },
  { month: 'Jun', revenue: 178000, target: 156700 },
  { month: 'Jul', revenue: 145000, target: 156700 },
  { month: 'Aug', revenue: 190000, target: 156700 },
  { month: 'Sep', revenue: 182000, target: 156700 },
  { month: 'Oct', revenue: 196000, target: 156700 },
];

const HOT_DEALS = [
  {
    id: 'hd-1',
    dealNumber: 'DL-2024-001',
    vehicle: 'Mahindra XUV700 AX7L',
    variant: 'Diesel AWD Luxury (7-Seater)',
    vin: 'MAH700AX7L20240981',
    fuel: 'Diesel mHawk 2.2L',
    transmission: 'Automatic 6-Speed',
    color: 'Midnight Black Metallic',
    customer: 'Vikram Singhania',
    phone: '+91 98201 44552',
    email: 'vikram.singhania@apexcorp.in',
    city: 'Mumbai, Maharashtra',
    advisor: 'Rajesh Patil (Senior Sales Desk)',
    branch: 'Downtown Flagship',
    value: 2480000,
    basePrice: 2050000,
    rtoRoadTax: 246000,
    insurance: 94000,
    accessories: 45000,
    tokenPaid: 250000,
    loanApproved: 2000000,
    financier: 'HDFC Bank Auto Loan (8.25% p.a.)',
    balanceDue: 230000,
    prob: 95,
    date: 'Closes Oct 27',
    stages: ['Token Paid', 'KYC Verified', 'Loan Sanctioned', 'PDI Passed', 'Ready for Delivery'],
    currentStage: 3,
    gateDetails: [
      { name: 'Booking Token Paid', status: 'cleared', date: '2026-10-14', note: '₹2,50,000 via NEFT received & receipted' },
      { name: 'KYC & Form 20 Verification', status: 'cleared', date: '2026-10-16', note: 'PAN & Aadhaar e-verified, RTO draft generated' },
      { name: 'Financier Loan Disbursal', status: 'cleared', date: '2026-10-19', note: 'HDFC Sanction Letter received for ₹20.0 Lakh' },
      { name: '140-Point PDI Technical Inspection', status: 'cleared', date: '2026-10-21', note: 'Clearance certificate #PDI-8849 generated' },
      { name: 'RTO Security Gate Pass & Handover', status: 'pending', date: '2026-10-27', note: 'Scheduled handover ceremony with ribbon kit' },
    ],
    avatars: [
      { text: 'VS', bg: 'var(--tomato)' },
      { text: 'AP', bg: 'var(--pine)' },
    ],
  },
  {
    id: 'hd-2',
    dealNumber: 'DL-2024-002',
    vehicle: 'Tata Safari Gold+',
    variant: 'Dark Edition 6-Str Captain Seats',
    vin: 'TATASAFDARK2024102',
    fuel: 'Diesel Kryotec 2.0L',
    transmission: 'Automatic 6-Speed',
    color: 'Oberon Black Sheen',
    customer: 'Amit Patel',
    phone: '+91 99304 88120',
    email: 'amit.patel@patelchem.com',
    city: 'Ahmedabad / Mumbai',
    advisor: 'Amit Patel (Branch Lead)',
    branch: 'Westside Depot',
    value: 2550000,
    basePrice: 2110000,
    rtoRoadTax: 252000,
    insurance: 98000,
    accessories: 50000,
    tokenPaid: 300000,
    loanApproved: 2000000,
    financier: 'State Bank of India (Car Prime)',
    balanceDue: 250000,
    prob: 90,
    date: 'Closes Nov 15',
    stages: ['Token Paid', 'KYC Verified', 'Loan Sanctioned', 'PDI Passed', 'Ready for Delivery'],
    currentStage: 3,
    gateDetails: [
      { name: 'Booking Token Paid', status: 'cleared', date: '2026-10-15', note: '₹3,00,000 advance RTGS received' },
      { name: 'KYC & Form 20 Verification', status: 'cleared', date: '2026-10-17', note: 'GST invoice matching company PAN verified' },
      { name: 'Financier Loan Disbursal', status: 'cleared', date: '2026-10-20', note: 'SBI auto loan disbursal release processed' },
      { name: '140-Point PDI Technical Inspection', status: 'in_progress', date: '2026-10-22', note: 'Accessory fitment in workshop bay #2' },
      { name: 'RTO Security Gate Pass & Handover', status: 'pending', date: '2026-11-15', note: 'Scheduled handover ceremony' },
    ],
    avatars: [
      { text: 'AP', bg: 'var(--color-blue)' },
      { text: 'RK', bg: 'var(--violet)' },
    ],
  },
  {
    id: 'hd-3',
    dealNumber: 'DL-2024-003',
    vehicle: 'Hyundai Creta SX',
    variant: '1.5L Turbo Petrol DCT Knight Edition',
    vin: 'HYUNCRETAS2024551',
    fuel: 'Petrol Turbo GDi',
    transmission: '7-Speed Dual Clutch (DCT)',
    color: 'Titan Grey Matte',
    customer: 'Priya Sharma',
    phone: '+91 98450 12890',
    email: 'priya.sharma@techventures.io',
    city: 'Bengaluru / Pune',
    advisor: 'Priya Sharma (Fleet Manager)',
    branch: 'Flagship Hub',
    value: 1890000,
    basePrice: 1580000,
    rtoRoadTax: 188000,
    insurance: 72000,
    accessories: 35000,
    tokenPaid: 200000,
    loanApproved: 1500000,
    financier: 'ICICI Bank Custom Auto Plan',
    balanceDue: 190000,
    prob: 85,
    date: 'Closes Nov 21',
    stages: ['Token Paid', 'KYC Verified', 'Loan Sanctioned', 'PDI Passed', 'Ready for Delivery'],
    currentStage: 2,
    gateDetails: [
      { name: 'Booking Token Paid', status: 'cleared', date: '2026-10-18', note: '₹2,00,000 paid via netbanking' },
      { name: 'KYC & Form 20 Verification', status: 'cleared', date: '2026-10-20', note: 'Aadhaar e-Sign KYC completed' },
      { name: 'Financier Loan Disbursal', status: 'in_progress', date: '2026-10-22', note: 'Awaiting final bank disbursement release' },
      { name: '140-Point PDI Technical Inspection', status: 'pending', date: '2026-11-10', note: 'Yard allotment scheduled' },
      { name: 'RTO Security Gate Pass & Handover', status: 'pending', date: '2026-11-21', note: 'Customer scheduled delivery' },
    ],
    avatars: [
      { text: 'PS', bg: 'var(--butter)', color: '#17191a' },
      { text: 'VS', bg: 'var(--pine)' },
    ],
  },
  {
    id: 'hd-4',
    dealNumber: 'DL-2024-004',
    vehicle: 'Honda City ZX',
    variant: 'e:HEV Hybrid Electric Sedan',
    vin: 'HONDACITY2024883',
    fuel: 'Hybrid (Petrol + EV Dual Motor)',
    transmission: 'e-CVT Automatic',
    color: 'Platinum White Pearl',
    customer: 'Rajesh Nair',
    phone: '+91 97110 33499',
    email: 'rajesh.nair@nairglobal.com',
    city: 'Kochi / Mumbai',
    advisor: 'Rajesh Nair (Showroom Specialist)',
    branch: 'Downtown Flagship',
    value: 1520000,
    basePrice: 1280000,
    rtoRoadTax: 135000,
    insurance: 62000,
    accessories: 32000,
    tokenPaid: 1520000,
    loanApproved: 0,
    financier: '100% Self Financed (Full Cashier Receipt Cleared)',
    balanceDue: 0,
    prob: 100,
    date: 'Closes Nov 28',
    stages: ['Token Paid', 'KYC Verified', 'Payment Cleared', 'PDI Passed', 'Ready for Delivery'],
    currentStage: 4,
    gateDetails: [
      { name: 'Booking Token Paid', status: 'cleared', date: '2026-10-10', note: 'Full on-road payment cleared ₹15.20 Lakh' },
      { name: 'KYC & Form 20 Verification', status: 'cleared', date: '2026-10-12', note: 'RTO registration number MH-02-CP-8902 allotted' },
      { name: 'Payment Settlement', status: 'cleared', date: '2026-10-14', note: 'Zero balance due, 100% receipt settled' },
      { name: '140-Point PDI Technical Inspection', status: 'cleared', date: '2026-10-18', note: 'Ceramic coating & accessories applied' },
      { name: 'RTO Security Gate Pass & Handover', status: 'cleared', date: '2026-10-22', note: 'Security gate clearance pass issued' },
    ],
    avatars: [
      { text: 'RN', bg: 'var(--pine)' },
    ],
  },
];

export default function DashboardPage() {
  const [vehicles] = useState(api.getVehicles());
  const [leads] = useState(api.getLeads());
  const [deals] = useState(api.getDeals());
  const [appointments] = useState(api.getAppointments());
  const [jobCards] = useState(api.getJobCards());
  const [customers] = useState(api.getCustomers());
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDate, setSelectedDate] = useState('2026-10-22');
  const [selectedDeal, setSelectedDeal] = useState<typeof HOT_DEALS[0] | null>(null);
  const [selectedLeadCustomer, setSelectedLeadCustomer] = useState<{
    lead: Lead;
    customer?: Customer;
  } | null>(null);

  const handleSelectLeadCustomer = (lead: Lead) => {
    const custName = (lead.customerName || '').toLowerCase().trim();
    const cust =
      customers.find((c) => c.id === lead.customerId) ||
      (custName
        ? customers.find(
            (c) =>
              `${c.firstName} ${c.lastName}`.toLowerCase().trim() === custName
          )
        : undefined);
    setSelectedLeadCustomer({ lead, customer: cust });
  };

  // Aggregated totals
  const totalStockValue = vehicles.reduce((sum, v) => sum + v.askingPrice, 0);
  const totalDealValue = deals.reduce((sum, d) => sum + d.grandTotal, 0);
  const totalDeposits = deals.reduce((sum, d) => sum + d.amountPaid, 0);

  const activeRevenueData = useMemo(() => {
    if (selectedMonth === 'all') {
      return REVENUE_DATA_12M;
    }
    const found = REVENUE_DATA_12M.find(
      (d) => d.month.toLowerCase() === selectedMonth.toLowerCase()
    );
    return found ? [found] : REVENUE_DATA_12M;
  }, [selectedMonth]);

  const activeWonTotal = useMemo(() => {
    if (selectedMonth !== 'all') {
      const found = REVENUE_DATA_12M.find(
        (d) => d.month.toLowerCase() === selectedMonth.toLowerCase()
      );
      return found ? `₹${(found.revenue).toLocaleString('en-IN')}` : '₹1,96,000';
    }
    if (selectedYear === '2025') return '₹894,200';
    if (selectedYear === '2024') return '₹720,000';
    return '₹1,014,640';
  }, [selectedMonth, selectedYear]);

  const targetMetCount = activeRevenueData.filter(d => d.revenue >= d.target).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ====== 1. RAPPORT STYLE HERO HEADER ====== */}
      <div className="hero-header">
        <div className="hero-title-wrap">
          <h1 className="hero-title">
            <WordFadeIn text="Sales Overview" />
          </h1>
          <p className="hero-subtitle">
            <WordFadeIn
              text="UNAI CRM · Real-time pipeline velocity, stockyard valuation & delivery gates"
              baseDelay={0.18}
              staggerDelay={0.035}
            />
          </p>
        </div>

        {/* Horizontal Stat Capsules */}
        <div className="hero-stats-row">
          {/* Stat 1: Won This Month (Removed trophy icon as requested) */}
          <div className="hero-stat-badge">
            <div className="hero-stat-content">
              <div className="hero-stat-value">
                ₹1,12,560
                <span className="hero-stat-tag">+18% vs last month</span>
              </div>
              <div className="hero-stat-label">Won this month</div>
            </div>
          </div>

          {/* Stat 2: Open Pipeline */}
          <div className="hero-stat-badge">
            <div className="hero-stat-icon">
              <BarChart3 size={20} style={{ color: 'var(--pine)' }} />
            </div>
            <div className="hero-stat-content">
              <div className="hero-stat-value">
                ₹{(totalDealValue / 100000).toFixed(2)} Lakh
              </div>
              <div className="hero-stat-label">Open pipeline</div>
            </div>
          </div>

          {/* Stat 3: Win Rate */}
          <div className="hero-stat-badge">
            <div className="hero-stat-icon">
              <Clock size={20} style={{ color: 'var(--tomato)' }} />
            </div>
            <div className="hero-stat-content">
              <div className="hero-stat-value">75%</div>
              <div className="hero-stat-label">Win rate, closed deals</div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== 2. TOP HERO 2-COLUMN GRID (REVENUE BAR CHART & HOT DEALS) ====== */}
      <div className="dash-hero-grid">
        {/* Left Card: Revenue Interactive Bar Chart */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <h2 className="card-title">Revenue</h2>
            <div className="card-tools" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Year Select */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  const yr = e.target.value;
                  setSelectedYear(yr);
                  if (selectedDate) {
                    const parts = selectedDate.split('-');
                    if (parts.length === 3) {
                      setSelectedDate(`${yr}-${parts[1]}-${parts[2]}`);
                    }
                  }
                }}
                style={{
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  background: 'var(--float)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                title="Select Year"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>

              {/* Month Select */}
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const m = e.target.value;
                  setSelectedMonth(m);
                  if (m !== 'all') {
                    const MONTH_MAP = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const mIdx = MONTH_MAP.indexOf(m);
                    if (mIdx !== -1) {
                      const mm = String(mIdx + 1).padStart(2, '0');
                      setSelectedDate(`${selectedYear}-${mm}-15`);
                    }
                  }
                }}
                style={{
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  background: 'var(--float)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                title="Select Month"
              >
                <option value="all">All Months</option>
                <option value="Oct">October</option>
                <option value="Sep">September</option>
                <option value="Aug">August</option>
                <option value="Jul">July</option>
                <option value="Jun">June</option>
                <option value="May">May</option>
                <option value="Apr">April</option>
                <option value="Mar">March</option>
                <option value="Feb">February</option>
                <option value="Jan">January</option>
                <option value="Dec">December</option>
                <option value="Nov">November</option>
              </select>

              {/* Date Input */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDate(val);
                  if (val) {
                    const [y, m] = val.split('-');
                    if (y) setSelectedYear(y);
                    const mIdx = parseInt(m, 10) - 1;
                    const MONTH_MAP = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    if (mIdx >= 0 && mIdx < 12) {
                      setSelectedMonth(MONTH_MAP[mIdx]);
                    }
                  }
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  background: 'var(--float)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                title="Select Date"
              />

              <Link href="/finance" className="tool-round-btn" title="Open Finance">
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* Large Metric Display */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                {activeWonTotal}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>
                {selectedMonth === 'all'
                  ? `won in ${selectedYear} · ${targetMetCount} of 12 months at target`
                  : `won in ${selectedMonth} ${selectedYear} · As of ${selectedDate}`}
              </span>
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'linear-gradient(180deg, #26554A 0%, #1E443B 100%)' }} />
                Target met (₹156.7K+)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'linear-gradient(180deg, #E06341 0%, #C8431F 100%)' }} />
                Below target
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                <span style={{ width: '14px', height: '2px', borderTop: '2px dashed var(--muted)' }} />
                Monthly target ₹156.7K
              </span>
            </div>
          </div>

          {/* Unique Sleek Capsule Revenue Bar Chart with Staggered One-By-One Fade-In & Rise */}
          <div key={`${selectedYear}-${selectedMonth}-${selectedDate}`} className="unique-chart-wrap">
            {/* Background Grid Lines */}
            <div className="unique-chart-grid">
              <div className="unique-grid-line" style={{ top: '0%' }}>
                <span>₹200K</span>
              </div>
              <div className="unique-grid-line unique-grid-line--target" style={{ top: '22%' }}>
                <span className="unique-target-tag">Target ₹156.7K</span>
              </div>
              <div className="unique-grid-line" style={{ top: '50%' }}>
                <span>₹100K</span>
              </div>
              <div className="unique-grid-line" style={{ top: '75%' }}>
                <span>₹50K</span>
              </div>
              <div className="unique-grid-line" style={{ bottom: '0%' }}>
                <span>₹0</span>
              </div>
            </div>

            {/* Bar Columns Container */}
            <div className="unique-bars-row">
              {REVENUE_DATA_12M.map((d, index) => {
                const maxVal = 200000;
                const fillPct = Math.min(100, Math.max(10, (d.revenue / maxVal) * 100));
                const isMet = d.revenue >= d.target;
                const isPeak = d.revenue === 196000;
                const staggerDelay = (0.08 + index * 0.055).toFixed(3);
                const isSelected = selectedMonth !== 'all' && d.month.toLowerCase() === selectedMonth.toLowerCase();
                const isDimmed = selectedMonth !== 'all' && !isSelected;

                return (
                  <div
                    key={d.month}
                    className="unique-bar-col"
                    onClick={() => setSelectedMonth(selectedMonth === d.month ? 'all' : d.month)}
                    style={{
                      opacity: isDimmed ? 0.32 : 1,
                      transform: isSelected ? 'scale(1.06)' : 'none',
                      transition: 'opacity 0.25s ease, transform 0.25s ease',
                      zIndex: isSelected ? 5 : 1,
                    }}
                    title={`Click to filter by ${d.month}`}
                  >
                    {/* Hover Floating Tooltip */}
                    <div className="unique-bar-popover">
                      <div className="unique-popover-val">₹{(d.revenue).toLocaleString('en-IN')}</div>
                      <div className="unique-popover-meta">
                        {d.month} · {isMet ? 'Target Met ✓' : 'Shortfall'}
                      </div>
                    </div>

                    {/* Peak Best Month Badge */}
                    {isPeak && selectedMonth === 'all' && (
                      <span className="unique-peak-badge" title="Highest Revenue Month">
                        ★
                      </span>
                    )}

                    {/* Track */}
                    <div
                      className="unique-bar-track"
                      style={{
                        outline: isSelected ? '2px solid var(--pine)' : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      {/* Filled Animated Capsule Bar with One-by-One Staggered Entrance */}
                      <div
                        className={`unique-bar-fill ${isMet ? 'unique-bar-fill--met' : 'unique-bar-fill--miss'}`}
                        style={{
                          height: `${fillPct}%`,
                          animation: `barRiseFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both`,
                          animationDelay: `${staggerDelay}s`,
                        }}
                      >
                        {/* Luminous Peak Beacon Dot */}
                        <div className={`unique-bar-beacon ${isMet ? 'unique-bar-beacon--met' : 'unique-bar-beacon--miss'}`} />
                      </div>
                    </div>

                    {/* Month Label with matching fade-in */}
                    <span
                      className="unique-bar-month"
                      style={{
                        animation: `wordFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both`,
                        animationDelay: `${staggerDelay}s`,
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--pine)' : undefined,
                      }}
                    >
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Card: Hot Deals (Unique Cockpit / Telemetry Design) */}
        {/* Right Card: Hot Deals (Unique Cockpit / Telemetry Design) */}
        {/* Right Card: Hot Deals (Unique Cockpit / Telemetry Design) */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Hot deals</h2>
            <div className="card-tools">
              <span className="seg-btn" style={{ fontSize: '0.78rem' }}>by weighted value</span>
              <Link href="/sales/deals" className="tool-round-btn" title="Create Deal">
                <Plus size={15} />
              </Link>
              <Link href="/sales/deals" className="tool-round-btn" title="View Pipeline">
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* Unique Hot Deals Grid */}
          <div className="unique-deals-grid">
            {HOT_DEALS.map((deal) => {
              const strokeDash = `${deal.prob}, 100`;
              const strokeColor =
                deal.prob >= 95 ? '#1E443B' :
                deal.prob >= 90 ? '#26554A' :
                deal.prob >= 85 ? '#0F766E' : '#C8431F';

              return (
                <div
                  key={deal.id}
                  className="unique-deal-card"
                  onClick={() => setSelectedDeal(deal)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDeal(deal);
                    }
                  }}
                  title="Click to view full deal dossier & gate clearances at centre of the page"
                >
                  {/* Top Status & Date (Clean metadata, no Show Details button) */}
                  <div className="unique-deal-header">
                    <span className="unique-deal-tag">Deal #{deal.dealNumber}</span>
                    <span className="unique-deal-date">
                      <Clock size={12} /> {deal.date}
                    </span>
                  </div>

                  {/* Body: Vehicle Info + Radial Probability Dial */}
                  <div className="unique-deal-body">
                    <div className="unique-deal-info">
                      <div className="unique-deal-title">{deal.vehicle}</div>
                      <div className="unique-deal-sub">{deal.customer} · {deal.branch}</div>
                    </div>

                    {/* Radial Dial */}
                    <div className="unique-dial-wrap" title={`Closing Probability: ${deal.prob}%`}>
                      <svg viewBox="0 0 36 36" className="unique-dial-svg">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(30, 68, 59, 0.12)"
                          strokeWidth="3.2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="3.2"
                          strokeDasharray={strokeDash}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="unique-dial-pct">{deal.prob}%</span>
                    </div>
                  </div>

                  {/* Sleek Slender 5-Segment Progress Bar (Replaced clumsy wrapped stage pills) */}
                  <div className="unique-deal-progress-wrap">
                    <div className="unique-deal-progress-bars">
                      {[0, 1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`unique-deal-progress-seg ${step < deal.currentStage ? 'filled' : ''}`}
                        />
                      ))}
                    </div>
                    <div className="unique-deal-stage-label">
                      <span className="unique-stage-dot" />
                      Gate {deal.currentStage} of 5: {deal.stages[deal.currentStage - 1] || 'In Progress'}
                    </div>
                  </div>

                  {/* Footer: Value + Avatars */}
                  <div className="unique-deal-footer">
                    <div>
                      <div className="unique-deal-value">₹{(deal.value).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="unique-deal-avatars">
                      {deal.avatars.map((av, avIdx) => (
                        <div
                          key={avIdx}
                          className="unique-deal-avatar"
                          style={{ backgroundColor: av.bg, color: av.color || '#FFFFFF' }}
                        >
                          {av.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====== 3. SHOWROOM LEADS & AUDIT LOG ====== */}
      <div className="dash-bottom-grid">
        {/* Left: Active CRM Leads Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Live Inquiries & CRM Pipeline</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                Active prospects, vehicle interests & pipeline stages
              </div>
            </div>
            <Link href="/crm/leads" className="pill-btn">
              All Leads <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle Interest</th>
                  <th>Stage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 5).map((lead) => (
                  <tr
                    key={lead.id}
                    style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                    onClick={() => handleSelectLeadCustomer(lead)}
                  >
                    <td>
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLeadCustomer(lead);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontWeight: 700,
                            color: 'var(--text)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.88rem',
                          }}
                        >
                          {lead.customerName || 'Customer'}
                        </button>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          Source: {lead.source}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.preferredMake} {lead.preferredModel}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Budget: ₹{((lead.budgetMin || 0) / 100000).toFixed(1)}L - ₹{((lead.budgetMax || 0) / 100000).toFixed(1)}L
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${lead.status === 'converted' ? 'badge-green' : lead.status === 'negotiation' ? 'badge-amber' : 'badge-neutral'}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectLeadCustomer(lead);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 11px', fontSize: '0.75rem', borderRadius: '999px' }}
                      >
                        View Card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Dealership Audit Log & Activity Stream */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="card-title">Dealership Audit Log</h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#15803D',
                    background: '#DCFCE7',
                    border: '1px solid rgba(22, 163, 74, 0.28)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#16A34A',
                      display: 'inline-block',
                    }}
                  />
                  Live Trail
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                Immutable timestamped compliance records & staff actions
              </div>
            </div>
            <div className="card-tools">
              <span className="seg-btn" style={{ fontSize: '0.75rem' }}>
                {AUDIT_LOG_EVENTS.length} Events
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '430px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {AUDIT_LOG_EVENTS.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'var(--float)',
                  border: '1px solid var(--line)',
                  transition: 'background 0.15s ease, transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    minWidth: '34px',
                    borderRadius: '10px',
                    background: item.badge.bg,
                    color: item.badge.color,
                    border: `1px solid ${item.badge.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                      {item.title}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {item.timeAgo}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text)', opacity: 0.85, lineHeight: 1.35, marginBottom: '4px' }}>
                    {item.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      By <strong style={{ color: 'var(--text)' }}>{item.actor}</strong> · {item.role}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '999px',
                        background: item.badge.bg,
                        color: item.badge.color,
                        border: `1px solid ${item.badge.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.badge.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== CENTERED CUSTOMER LEAD CARD MODAL AT CENTRE OF THE PAGE ====== */}
      {selectedLeadCustomer && (
        <Modal
          isOpen={!!selectedLeadCustomer}
          onClose={() => setSelectedLeadCustomer(null)}
          maxWidth="680px"
          headerContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text)' }}>
                Customer Lead Dossier
              </div>
              <span
                className="badge"
                style={{
                  background: '#EEF2FF',
                  color: '#4338CA',
                  border: '1px solid rgba(79, 70, 229, 0.25)',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Stage: {selectedLeadCustomer.lead.status.replace('_', ' ')}
              </span>
            </div>
          }
          headerActions={
            <div className="modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                href="/crm/leads"
                className="modal-header-edit-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  background: 'var(--float)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  textDecoration: 'none',
                }}
              >
                <Edit3 size={13} /> Edit Details
              </Link>
              <button
                type="button"
                onClick={() => setSelectedLeadCustomer(null)}
                className="modal-header-close-btn"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid var(--line)',
                  background: 'var(--float)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          }
          footer={
            <div className="unique-modal-footer-bar" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setSelectedLeadCustomer(null)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '999px', padding: '0.45rem 1.25rem' }}
              >
                &lt; Cancel
              </button>
              <Link
                href="/crm/leads"
                className="unique-lead-submit-btn"
                style={{
                  borderRadius: '999px',
                  padding: '0.5rem 1.4rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                }}
              >
                Open in Leads Pipeline &rarr;
              </Link>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Customer Identity & Profile Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #F0F9FF 0%, #EEF2FF 100%)',
                border: '1px solid rgba(2, 132, 199, 0.22)',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0,
                }}
              >
                {(selectedLeadCustomer.lead.customerName || 'Customer').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                    {selectedLeadCustomer.lead.customerName || 'Valued Customer'}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#E0F2FE',
                      color: '#0369A1',
                      border: '1px solid rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    {selectedLeadCustomer.customer?.type === 'business' ? 'Corporate Fleet' : 'Individual Client'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#DCFCE7',
                      color: '#15803D',
                      border: '1px solid rgba(22, 163, 74, 0.25)',
                    }}
                  >
                    KYC Verified ✓
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} style={{ color: '#0284C7' }} />
                    {selectedLeadCustomer.customer?.phone || '+91 98201 12345'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={13} style={{ color: '#0284C7' }} />
                    {selectedLeadCustomer.customer?.email || `${(selectedLeadCustomer.lead.customerName || 'customer').toLowerCase().replace(/\s+/g, '.')}@example.com`}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} style={{ color: '#0284C7' }} />
                    {selectedLeadCustomer.customer?.address?.city || 'Mumbai'}, MH
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Grid of Lead Information & Vehicle Interest */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--float)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  Target Vehicle Interest
                </span>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', marginTop: '3px' }}>
                  {selectedLeadCustomer.lead.preferredMake} {selectedLeadCustomer.lead.preferredModel}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Fuel Type: <strong>{selectedLeadCustomer.lead.preferredFuelType || 'Petrol / Hybrid'}</strong>
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--float)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  Budget Range
                </span>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', marginTop: '3px' }}>
                  ₹{((selectedLeadCustomer.lead.budgetMin || 0) / 100000).toFixed(1)}L - ₹{((selectedLeadCustomer.lead.budgetMax || 0) / 100000).toFixed(1)} Lakh
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Authority: Pre-approved buyer
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--float)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  AI Purchase Propensity
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.95rem', color: '#15803D', marginTop: '3px' }}>
                  <Sparkles size={14} style={{ color: '#7C3AED' }} />
                  {selectedLeadCustomer.lead.score}/100 · High Intent
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Probability of deal close: {selectedLeadCustomer.lead.score}%
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--float)', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  Destination & Source
                </span>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', marginTop: '3px' }}>
                  {selectedLeadCustomer.lead.source || 'Walk-in Showroom'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Branch: Apex Downtown Flagship
                </div>
              </div>
            </div>

            {/* 3. KYC Tax Identifiers */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--float)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  Permanent Account Number (PAN)
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginTop: '2px' }}>
                  {selectedLeadCustomer.customer?.panNumber || 'ABCPS1234M'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  Statutory RTO Eligibility
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#15803D', marginTop: '2px' }}>
                  Form 20 Draft Ready ✓
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  Assigned Consultant
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginTop: '2px' }}>
                  {selectedLeadCustomer.lead.assigneeName || 'Rajesh Patil'}
                </div>
              </div>
            </div>

            {/* 4. Notes & Requirements */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--float)', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                Customer Requirements & Intake Notes
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                {selectedLeadCustomer.lead.notes || 'Customer is actively evaluating vehicle specifications, test-drive performance, and financing packages. Immediate follow-up recommended.'}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ====== CENTERED DEAL DOSSIER CARD AT CENTRE OF THE PAGE ====== */}
      {selectedDeal && (
        <Modal
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          maxWidth="780px"
          headerContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                Deal Dossier
              </div>
              <span className="unique-deal-tag">#{selectedDeal.dealNumber}</span>
              <div className="hero-dossier-switcher" style={{ marginLeft: '8px' }}>
                {HOT_DEALS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`hero-switcher-btn ${selectedDeal.id === d.id ? 'active' : ''}`}
                    onClick={() => setSelectedDeal(d)}
                  >
                    {d.vehicle.split(' ')[0]} {d.vehicle.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          }
          footer={
            <Link
              href="/sales/deals"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              Open in Deals Pipeline <ArrowUpRight size={13} />
            </Link>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Vehicle & Price Highlight Banner */}
            <div className="hero-dossier-banner">
              <div>
                <div className="hero-dossier-vehicle">{selectedDeal.vehicle}</div>
                <div className="hero-dossier-sub">
                  {selectedDeal.variant} · {selectedDeal.color}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="hero-dossier-price">
                  ₹{selectedDeal.value.toLocaleString('en-IN')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.72rem', padding: '1px 6px' }}>
                    {selectedDeal.prob}% Win Prob
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                    {selectedDeal.date}
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column Quick Info Grid */}
            <div className="hero-dossier-grid">
              {/* Tile 1: Customer Profile */}
              <div className="hero-dossier-tile">
                <div className="hero-dossier-tile-head">
                  <Users size={13} style={{ color: 'var(--pine)' }} />
                  Customer & Showroom Desk
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>Buyer</span>
                  <strong>{selectedDeal.customer}</strong>
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>Phone</span>
                  <span>{selectedDeal.phone}</span>
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>City</span>
                  <span>{selectedDeal.city}</span>
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>Advisor</span>
                  <strong style={{ color: 'var(--pearl-green)' }}>{selectedDeal.advisor}</strong>
                </div>
              </div>

              {/* Tile 2: Commercial Ledger */}
              <div className="hero-dossier-tile">
                <div className="hero-dossier-tile-head">
                  <CreditCard size={13} style={{ color: 'var(--pine)' }} />
                  Payment & Settlement
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>Token Advance</span>
                  <strong style={{ color: 'var(--pine)' }}>₹{selectedDeal.tokenPaid.toLocaleString('en-IN')} ✓</strong>
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>Loan Sanction</span>
                  <strong style={{ color: 'var(--color-blue)' }}>₹{selectedDeal.loanApproved.toLocaleString('en-IN')}</strong>
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>Balance Pending</span>
                  <strong style={{ color: selectedDeal.balanceDue === 0 ? 'var(--pine)' : 'var(--tomato)' }}>
                    {selectedDeal.balanceDue === 0 ? 'Fully Cleared (₹0)' : `₹${selectedDeal.balanceDue.toLocaleString('en-IN')}`}
                  </strong>
                </div>
                <div className="hero-dossier-row">
                  <span style={{ color: 'var(--muted)' }}>Chassis VIN</span>
                  <code style={{ fontSize: '0.72rem', color: 'var(--text)' }}>{selectedDeal.vin}</code>
                </div>
              </div>
            </div>

            {/* 5-Gate Clearance Protocol */}
            <div className="hero-dossier-gates-card">
              <div className="hero-dossier-gates-title">
                <CheckCircle2 size={13} style={{ color: 'var(--pine)' }} />
                5-Stage Pre-Delivery Clearance Protocol
              </div>
              <div className="hero-dossier-gates-list">
                {selectedDeal.gateDetails.map((gate: any, gIdx: number) => {
                  const isCleared = gate.status === 'cleared';
                  const isInProgress = gate.status === 'in_progress';
                  return (
                    <div key={gIdx} className="hero-gate-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCleared ? (
                          <CheckCircle2 size={14} style={{ color: 'var(--pine)', flexShrink: 0 }} />
                        ) : isInProgress ? (
                          <Clock size={14} style={{ color: 'var(--butter)', flexShrink: 0 }} />
                        ) : (
                          <AlertCircle size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                          {gate.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{gate.date}</span>
                        <span
                          className={`badge ${isCleared ? 'badge-green' : isInProgress ? 'badge-amber' : 'badge-neutral'}`}
                          style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                        >
                          {isCleared ? 'Cleared' : isInProgress ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
