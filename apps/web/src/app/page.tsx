'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
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
} from 'lucide-react';

import { WordFadeIn } from '@/components/ui/WordFadeIn';

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
    vehicle: 'Mahindra XUV700 AX7L',
    variant: 'Diesel AWD Luxury',
    customer: 'Vikram Singhania',
    branch: 'Downtown',
    value: 2480000,
    prob: 95,
    badge: '⚡ High Velocity',
    badgeType: 'velocity',
    date: 'Closes Oct 27',
    stages: ['Token', 'KYC', 'Loan', 'PDI'],
    currentStage: 2,
    avatars: [
      { text: 'VS', bg: 'var(--tomato)' },
      { text: 'AP', bg: 'var(--pine)' },
    ],
  },
  {
    id: 'hd-2',
    vehicle: 'Tata Safari Gold+',
    variant: 'Dark Edition 6-Str',
    customer: 'Amit Patel',
    branch: 'Westside',
    value: 2550000,
    prob: 90,
    badge: '🔥 Hot Closing',
    badgeType: 'hot',
    date: 'Closes Nov 15',
    stages: ['Token', 'KYC', 'Loan', 'PDI'],
    currentStage: 3,
    avatars: [
      { text: 'AP', bg: 'var(--color-blue)' },
      { text: 'RK', bg: 'var(--violet)' },
    ],
  },
  {
    id: 'hd-3',
    vehicle: 'Hyundai Creta SX',
    variant: '1.5L Turbo Petrol DCT',
    customer: 'Priya Sharma',
    branch: 'Flagship',
    value: 1890000,
    prob: 85,
    badge: '🎯 Loan Approved',
    badgeType: 'loan',
    date: 'Closes Nov 21',
    stages: ['Token', 'KYC', 'Loan', 'Delivery'],
    currentStage: 2,
    avatars: [
      { text: 'PS', bg: 'var(--butter)', color: '#17191a' },
      { text: 'VS', bg: 'var(--pine)' },
    ],
  },
  {
    id: 'hd-4',
    vehicle: 'Honda City ZX',
    variant: 'e:HEV Hybrid Sedan',
    customer: 'Rajesh Nair',
    branch: 'Downtown',
    value: 1520000,
    prob: 100,
    badge: '✨ Delivery Ready',
    badgeType: 'delivery',
    date: 'Closes Nov 28',
    stages: ['Token', 'KYC', 'Loan', 'Delivery'],
    currentStage: 3,
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
  const [timeRange, setTimeRange] = useState<'6M' | '12M'>('12M');

  // Aggregated totals
  const totalStockValue = vehicles.reduce((sum, v) => sum + v.askingPrice, 0);
  const totalDealValue = deals.reduce((sum, d) => sum + d.grandTotal, 0);
  const totalDeposits = deals.reduce((sum, d) => sum + d.amountPaid, 0);

  const activeRevenueData = timeRange === '12M' ? REVENUE_DATA_12M : REVENUE_DATA_6M;
  const activeWonTotal = timeRange === '12M' ? '₹1,014,640' : '₹564,200';
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
          <div className="card-header">
            <h2 className="card-title">Revenue</h2>
            <div className="card-tools">
              <button
                className={`seg-btn ${timeRange === '6M' ? 'active' : ''}`}
                onClick={() => setTimeRange('6M')}
              >
                6M
              </button>
              <button
                className={`seg-btn ${timeRange === '12M' ? 'active' : ''}`}
                onClick={() => setTimeRange('12M')}
              >
                12M
              </button>
              <button className="tool-round-btn" title="More options">
                <MoreHorizontal size={15} />
              </button>
              <Link href="/finance" className="tool-round-btn" title="Open Finance">
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* Large Metric Display */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                {activeWonTotal}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>
                won in {timeRange === '12M' ? '12' : '6'} months · <strong>{targetMetCount} of {activeRevenueData.length}</strong> at target
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
          <div key={timeRange} className="unique-chart-wrap">
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
              {activeRevenueData.map((d, index) => {
                const maxVal = 200000;
                const fillPct = Math.min(100, Math.max(10, (d.revenue / maxVal) * 100));
                const isMet = d.revenue >= d.target;
                const isPeak = d.revenue === 196000;
                const staggerDelay = (0.08 + index * 0.055).toFixed(3);

                return (
                  <div
                    key={d.month}
                    className="unique-bar-col"
                  >
                    {/* Hover Floating Tooltip */}
                    <div className="unique-bar-popover">
                      <div className="unique-popover-val">₹{(d.revenue).toLocaleString('en-IN')}</div>
                      <div className="unique-popover-meta">
                        {d.month} · {isMet ? 'Target Met ✓' : 'Shortfall'}
                      </div>
                    </div>

                    {/* Peak Best Month Badge */}
                    {isPeak && timeRange === '12M' && (
                      <span className="unique-peak-badge" title="Highest Revenue Month">
                        ★
                      </span>
                    )}

                    {/* Track */}
                    <div className="unique-bar-track">
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
                <div key={deal.id} className="unique-deal-card">
                  {/* Top Status & Date */}
                  <div className="unique-deal-header">
                    <span className={`unique-deal-badge unique-deal-badge--${deal.badgeType}`}>
                      {deal.badge}
                    </span>
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

                  {/* 4-Stage Progress Tracker */}
                  <div className="unique-deal-stages">
                    {deal.stages.map((stage, sIdx) => {
                      const isDone = sIdx < deal.currentStage;
                      const isActive = sIdx === deal.currentStage;
                      return (
                        <div
                          key={stage}
                          className={`unique-stage-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                        >
                          {isDone ? `✓ ${stage}` : stage}
                        </div>
                      );
                    })}
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

      {/* ====== 3. OPERATIONAL METRIC TILES ====== */}
      <div className="grid-4">
        {/* Metric 1 */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vehicle Stockyard
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--well)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={16} style={{ color: 'var(--text)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {vehicles.filter(v => v.status === 'available').length} Available
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
            Valuation: ₹{(totalStockValue / 10000000).toFixed(2)} Cr ({vehicles.length} total units)
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Inquiries
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--well)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} style={{ color: 'var(--tomato)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {leads.length} Leads
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
            {leads.filter(l => (l.score || 0) >= 80).length} high-intent purchase prospects
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Workshop Throughput
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--well)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={16} style={{ color: 'var(--pine)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {jobCards.length} In-Service
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
            98.5% on-time turnaround rate
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Advance Collections
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--well)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={16} style={{ color: 'var(--color-blue)' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            ₹{(totalDeposits / 100000).toFixed(2)} Lakh
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
            Bank reconciled tokens received
          </div>
        </div>
      </div>

      {/* ====== 4. SHOWROOM LEADS & HANDOVER CLEARANCE GATES ====== */}
      <div className="dash-bottom-grid">
        {/* Left: Active CRM Leads Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Live Inquiries & CRM Pipeline</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                Sorted by AI purchase likelihood score
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
                  <th>AI Score</th>
                  <th>Stage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 5).map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{lead.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Source: {lead.source}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.preferredMake} {lead.preferredModel}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Budget: ₹{((lead.budgetMin || 0) / 100000).toFixed(1)}L - ₹{((lead.budgetMax || 0) / 100000).toFixed(1)}L
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: (lead.score || 0) >= 80 ? 'var(--pine)' : 'var(--text)',
                        }}
                      >
                        <Sparkles size={13} style={{ color: 'var(--color-violet)' }} />
                        {lead.score}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${lead.status === 'converted' ? 'badge-green' : lead.status === 'negotiation' ? 'badge-amber' : 'badge-neutral'}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/crm/leads`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Mandatory Pre-Delivery Clearance Gates (Section 6.3 of plan) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Delivery Clearance Gates</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                5-gate checklist before vehicle handover pass
              </div>
            </div>
            <Link href="/sales/deals" className="pill-btn">
              Deals <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Gate 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--r-tile)', background: 'var(--float)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} style={{ color: 'var(--pine)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Gate 1: Booking Advance Deposit</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Bank verified token received</div>
                </div>
              </div>
              <span className="badge badge-green">Cleared</span>
            </div>

            {/* Gate 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--r-tile)', background: 'var(--float)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} style={{ color: 'var(--pine)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Gate 2: Customer Identity & KYC</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>PAN & Aadhaar document verified</div>
                </div>
              </div>
              <span className="badge badge-green">Cleared</span>
            </div>

            {/* Gate 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--r-tile)', background: 'var(--float)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} style={{ color: 'var(--butter)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Gate 3: Bank Loan Sanction</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>HDFC disbursement pending</div>
                </div>
              </div>
              <span className="badge badge-amber">Sanctioned</span>
            </div>

            {/* Gate 4 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--r-tile)', background: 'var(--float)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} style={{ color: 'var(--pine)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Gate 4: 140-Point PDI Inspection</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Passed technical certification</div>
                </div>
              </div>
              <span className="badge badge-green">Passed 140/140</span>
            </div>

            {/* Gate 5 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--r-tile)', background: 'var(--float)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} style={{ color: 'var(--faint)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Gate 5: Handover Gate Pass</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Authorized delivery pass</div>
                </div>
              </div>
              <span className="badge badge-neutral">Ready to Issue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
