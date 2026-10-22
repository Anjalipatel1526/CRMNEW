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
              text="Apex Motors Group · Real-time pipeline velocity, stockyard valuation & delivery gates"
              baseDelay={0.18}
              staggerDelay={0.035}
            />
          </p>
        </div>

        {/* Horizontal Stat Capsules */}
        <div className="hero-stats-row">
          {/* Stat 1: Won This Month */}
          <div className="hero-stat-badge">
            <div className="hero-stat-icon">
              <Trophy size={20} style={{ color: 'var(--butter)' }} />
            </div>
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

      {/* ====== 2. TOP HERO 2-COLUMN GRID (REVENUE & HOT DEALS) ====== */}
      <div className="dash-hero-grid">
        {/* Left Card: Revenue & Target Wave Chart */}
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
                ₹1,014,640
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>
                won in 12 months · <strong>8 of 12</strong> at target
              </span>
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--tomato)' }} />
                Won revenue
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                <span style={{ width: '14px', height: '2px', borderTop: '2px dashed var(--muted)' }} />
                Monthly target ₹156.7K
              </span>
            </div>
          </div>

          {/* SVG Smooth Curved Area Wave Chart */}
          <div style={{ width: '100%', height: '220px', position: 'relative', marginTop: '14px' }}>
            <svg
              viewBox="0 0 600 200"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8431f" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#c8431f" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(23, 25, 26, 0.08)" strokeDasharray="3 3" />
              <text x="0" y="24" fill="var(--faint)" fontSize="11" fontWeight="600">₹200K</text>

              {/* Monthly Target Dashed Line */}
              <line x1="0" y1="75" x2="600" y2="75" stroke="#17191a" strokeWidth="1.8" strokeDasharray="6 5" />

              <line x1="0" y1="130" x2="600" y2="130" stroke="rgba(23, 25, 26, 0.08)" strokeDasharray="3 3" />
              <text x="0" y="124" fill="var(--faint)" fontSize="11" fontWeight="600">₹100K</text>

              <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(23, 25, 26, 0.08)" />
              <text x="0" y="174" fill="var(--faint)" fontSize="11" fontWeight="600">₹0</text>

              {/* Area Gradient Fill */}
              <path
                d="M 20 150 Q 80 190 140 145 T 260 160 T 360 195 T 440 140 T 520 160 T 590 145 L 590 180 L 20 180 Z"
                fill="url(#revenueGradient)"
              />

              {/* Smooth Spline Curve Line */}
              <path
                d="M 20 150 Q 80 190 140 145 T 260 160 T 360 195 T 440 140 T 520 160 T 590 145"
                fill="none"
                stroke="#c8431f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* X Axis Month Labels */}
              <text x="25" y="196" fill="var(--muted)" fontSize="11" fontWeight="600">Nov</text>
              <text x="110" y="196" fill="var(--muted)" fontSize="11" fontWeight="600">Jan</text>
              <text x="200" y="196" fill="var(--muted)" fontSize="11" fontWeight="600">Mar</text>
              <text x="290" y="196" fill="var(--muted)" fontSize="11" fontWeight="600">May</text>
              <text x="380" y="196" fill="var(--muted)" fontSize="11" fontWeight="600">Jul</text>
              <text x="470" y="196" fill="var(--muted)" fontSize="11" fontWeight="600">Sep</text>
              <text x="560" y="196" fill="var(--muted)" fontSize="11" fontWeight="600">Oct</text>
            </svg>
          </div>
        </div>

        {/* Right Card: Hot Deals (2x2 Dark Cards) */}
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

          {/* 2x2 Dark Deal Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Dark Deal Card 1 */}
            <div className="deal-card">
              <div className="deal-card__top">
                <span className="deal-card__date">Closes Oct 27</span>
                <button className="deal-card__more"><MoreHorizontal size={14} /></button>
              </div>
              <div>
                <div className="deal-card__title">Mahindra XUV700</div>
                <div className="deal-card__sub">Vikram Singhania · Downtown</div>
              </div>
              <div className="deal-card__bottom">
                <div>
                  <div className="deal-card__value">₹24,80,000</div>
                  <div className="deal-card__prob">Closing · 90%</div>
                </div>
                <div className="deal-card__avatars">
                  <div className="deal-avatar" style={{ backgroundColor: 'var(--tomato)' }}>VS</div>
                  <div className="deal-avatar" style={{ backgroundColor: 'var(--pine)' }}>AP</div>
                </div>
              </div>
            </div>

            {/* Dark Deal Card 2 */}
            <div className="deal-card">
              <div className="deal-card__top">
                <span className="deal-card__date">Closes Nov 15</span>
                <button className="deal-card__more"><MoreHorizontal size={14} /></button>
              </div>
              <div>
                <div className="deal-card__title">Tata Safari Gold+</div>
                <div className="deal-card__sub">Amit Patel · Westside</div>
              </div>
              <div className="deal-card__bottom">
                <div>
                  <div className="deal-card__value">₹25,50,000</div>
                  <div className="deal-card__prob">Closing · 90%</div>
                </div>
                <div className="deal-card__avatars">
                  <div className="deal-avatar" style={{ backgroundColor: 'var(--color-blue)' }}>AP</div>
                  <div className="deal-avatar" style={{ backgroundColor: 'var(--violet)' }}>RK</div>
                </div>
              </div>
            </div>

            {/* Dark Deal Card 3 */}
            <div className="deal-card">
              <div className="deal-card__top">
                <span className="deal-card__date">Closes Nov 21</span>
                <button className="deal-card__more"><MoreHorizontal size={14} /></button>
              </div>
              <div>
                <div className="deal-card__title">Hyundai Creta SX</div>
                <div className="deal-card__sub">Priya Sharma · Flagship</div>
              </div>
              <div className="deal-card__bottom">
                <div>
                  <div className="deal-card__value">₹18,90,000</div>
                  <div className="deal-card__prob">Closing · 85%</div>
                </div>
                <div className="deal-card__avatars">
                  <div className="deal-avatar" style={{ backgroundColor: 'var(--butter)', color: '#17191a' }}>PS</div>
                  <div className="deal-avatar" style={{ backgroundColor: 'var(--pine)' }}>VS</div>
                </div>
              </div>
            </div>

            {/* Dark Deal Card 4 */}
            <div className="deal-card">
              <div className="deal-card__top">
                <span className="deal-card__date">Closes Nov 28</span>
                <button className="deal-card__more"><MoreHorizontal size={14} /></button>
              </div>
              <div>
                <div className="deal-card__title">Honda City ZX</div>
                <div className="deal-card__sub">Rajesh Nair · Downtown</div>
              </div>
              <div className="deal-card__bottom">
                <div>
                  <div className="deal-card__value">₹15,20,000</div>
                  <div className="deal-card__prob">Delivered · 100%</div>
                </div>
                <div className="deal-card__avatars">
                  <div className="deal-avatar" style={{ backgroundColor: 'var(--pine)' }}>RN</div>
                </div>
              </div>
            </div>
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
