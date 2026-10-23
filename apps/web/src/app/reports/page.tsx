'use client';

import React, { useState, useMemo } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Car,
  DollarSign,
  ArrowUpRight,
  Search,
  X,
  User,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function ReportsPage() {
  const [reportRange, setReportRange] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [performance, setPerformance] = useState<any[]>([]);

  const filteredPerformance = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return performance.filter((p) => {
      if (roleFilter !== 'all' && !p.role.toLowerCase().includes(roleFilter)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q);
    });
  }, [performance, searchQuery, roleFilter]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Dealership Business Intelligence & Reports" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Multi-branch revenue performance, sales conversion funnel, stock aging analysis, and gross margin reporting."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={reportRange}
            onChange={(e) => setReportRange(e.target.value)}
            style={{ width: '160px', borderRadius: '12px', padding: '0.45rem 0.85rem' }}
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">Fiscal Year 2024-25</option>
          </select>
          <button
            onClick={() => alert('Exporting comprehensive dealership audit Excel report!')}
            className="btn btn-secondary btn-sm"
            style={{
              borderRadius: '999px',
              padding: '0.45rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={15} /> Export Audit Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Gross Booked Revenue"
          value="₹0"
          sub="0% vs previous quarter"
          icon={<DollarSign size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Overall Conversion"
          value="0%"
          sub="Lead inquiry to deal closure"
          icon={<TrendingUp size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Average Inventory Age"
          value="0 Days"
          sub="Real-time stock turnaround"
          icon={<Car size={18} />}
          accentColor="teal"
        />
        <StatCard
          title="Net Gross Margin"
          value="0%"
          sub="Gross margin reporting"
          icon={<BarChart3 size={18} />}
          accentColor="blue"
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
            placeholder="Search performance reports by team member name or role..."
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

        {/* Filter Pills */}
        <div className="search-controls-row">
          <div className="search-filter-pills">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`search-filter-pill ${roleFilter === 'all' ? 'is-active' : ''}`}
            >
              <span>All Staff</span>
              <span className="pill-count">{performance.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('sales')}
              className={`search-filter-pill ${roleFilter === 'sales' ? 'is-active' : ''}`}
            >
              <span>Sales Executives</span>
              <span className="pill-count">2</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('service')}
              className={`search-filter-pill ${roleFilter === 'service' ? 'is-active' : ''}`}
            >
              <span>Service Advisors</span>
              <span className="pill-count">1</span>
            </button>
          </div>

          <div className="search-results-counter">
            Showing <strong>{filteredPerformance.length}</strong> of {performance.length} Executives
          </div>
        </div>
      </div>

      {/* Sales Executive Leaderboard: Table-Wise Row Cards */}
      <div style={{ marginBottom: '24px' }}>
        <div
          className="app-table-header"
          style={{ ['--grid-cols' as any]: '2.2fr 1.8fr 1.4fr 1.4fr 1.6fr 1.8fr' }}
        >
          <div>Team Member</div>
          <div>Role</div>
          <div>Leads Handled</div>
          <div>Deals Closed</div>
          <div>Conversion Rate</div>
          <div style={{ textAlign: 'right' }}>Total Revenue</div>
        </div>

        <div className="app-cards-list">
          {filteredPerformance.length === 0 ? (
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
              <Users size={36} style={{ color: '#94A3B8' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No Team Performance Records</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: '400px' }}>
                Sales conversion benchmarks, lead allocation counts, and gross closed revenue will be tracked here.
              </div>
            </div>
          ) : (
            filteredPerformance.map((p, index) => {
              const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];
              const initials = p.name.split(' ').map((n: string) => n[0]).join('');

              return (
                <div
                  key={index}
                  className="app-row-card"
                  style={{
                    ['--grid-cols' as any]: '2.2fr 1.8fr 1.4fr 1.4fr 1.6fr 1.8fr',
                    ['--theme-accent' as any]: palette.accent,
                    ['--theme-border' as any]: palette.border,
                    ['--theme-glow' as any]: palette.glow,
                    ['--theme-badge-bg' as any]: palette.badgeBg,
                    ['--theme-badge-text' as any]: palette.badgeText,
                  }}
                >
                  <div className="app-row-cell-main">
                    <div className="app-row-avatar">
                      {initials}
                    </div>
                    <div className="app-row-title-wrap">
                      <span className="app-row-title">{p.name}</span>
                      <span className="app-row-subtitle">Dealership Key Contributor</span>
                    </div>
                  </div>

                  <div>
                    <span className="badge badge-neutral">{p.role}</span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                    {p.assigned} leads
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                      {p.converted} units
                    </span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#16A34A' }}>
                      {p.rate}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#4F46E5' }}>
                      ₹{(p.revenue / 100000).toFixed(2)} Lakh
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stock Aging Breakdown & Channel Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Inventory Aging Distribution */}
        <div className="card" style={{ borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
          <div className="card-header" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700 }}>Inventory Aging Distribution</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>0 - 15 Days (Fresh Arrivals)</span>
                <strong style={{ color: '#0F172A' }}>0 Vehicles (0%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', backgroundColor: '#16A34A' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>16 - 30 Days (Active Showroom)</span>
                <strong style={{ color: '#0F172A' }}>0 Vehicles (0%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', backgroundColor: '#0284C7' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>31 - 60 Days (Markdown Proposed)</span>
                <strong style={{ color: '#0F172A' }}>0 Vehicles (0%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', backgroundColor: '#D97706' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>60+ Days (Critical Stagnant)</span>
                <strong style={{ color: '#0F172A' }}>0 Vehicles (0%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', backgroundColor: '#DC2626' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Lead Source Channel Effectiveness */}
        <div className="card" style={{ borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
          <div className="card-header" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700 }}>Inquiry Acquisition Channel Breakdown</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>Google Search & Maps Ads</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>High-intent SUV queries</div>
              </div>
              <span className="badge badge-green">42% Conversion</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>Showroom Walk-in Traffic</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Direct footfall at Downtown flagship</div>
              </div>
              <span className="badge badge-green">48% Conversion</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>CarWale & Cardekho Portals</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Sedan & EV comparison leads</div>
              </div>
              <span className="badge badge-blue">28% Conversion</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
              <div>
                <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>Customer Word-of-Mouth Referral</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Existing owner advocate referrals</div>
              </div>
              <span className="badge badge-violet">65% Conversion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
