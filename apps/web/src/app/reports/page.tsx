'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { StatCard } from '@/components/ui/StatCard';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Car,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

export default function ReportsPage() {
  const [reportRange, setReportRange] = useState('month');

  const performance = [
    { name: 'John Fernandes', role: 'Senior Sales Executive', assigned: 14, converted: 5, rate: '35.7%', revenue: 6450000 },
    { name: 'Kavita Chawla', role: 'Branch Manager / Sales', assigned: 11, converted: 4, rate: '36.3%', revenue: 7200000 },
    { name: 'Sarah Dsouza', role: 'Service Advisor', assigned: 28, converted: 26, rate: '92.8%', revenue: 198000 },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealership Business Intelligence & Reports</h1>
          <p className="page-desc">
            Multi-branch revenue performance, sales conversion funnel, stock aging analysis, and gross margin reporting.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="form-select"
            value={reportRange}
            onChange={(e) => setReportRange(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">Fiscal Year 2024-25</option>
          </select>
          <button
            onClick={() => alert('Exporting comprehensive dealership audit Excel report!')}
            className="btn btn-secondary btn-sm"
          >
            <Download size={15} /> Export Audit Report
          </button>
        </div>
      </div>

      <div className="grid-4">
        <StatCard
          title="Gross Booked Revenue"
          value="₹1.36 Cr"
          sub="↑ 24% vs previous quarter"
          icon={<DollarSign size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Overall Conversion"
          value="38.2%"
          sub="Lead inquiry to deal closure"
          icon={<TrendingUp size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Average Inventory Age"
          value="18.5 Days"
          sub="Industry benchmark: 35 days"
          icon={<Car size={18} />}
          accentColor="teal"
        />
        <StatCard
          title="Net Gross Margin"
          value="11.8%"
          sub="After trade-in and reconditioning"
          icon={<BarChart3 size={18} />}
          accentColor="blue"
        />
      </div>

      {/* Sales Executive Leaderboard */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Sales Performance by Team Member</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Tracks customer engagement speed, test drive conversion, and closed revenue
            </div>
          </div>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role</th>
                <th>Leads Handled</th>
                <th>Deals Closed</th>
                <th>Conversion Rate</th>
                <th>Total Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{p.role}</span>
                  </td>
                  <td>{p.assigned} leads</td>
                  <td>
                    <strong>{p.converted} units</strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--color-green)' }}>{p.rate}</strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--color-indigo)' }}>
                      ₹{(p.revenue / 100000).toFixed(2)} Lakh
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Aging Breakdown & Channel Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Inventory Aging Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inventory Aging Distribution</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span>0 - 15 Days (Fresh Arrivals)</span>
                <strong>4 Vehicles (66%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '66%', height: '100%', backgroundColor: 'var(--color-green)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span>16 - 30 Days (Active Showroom)</span>
                <strong>1 Vehicle (17%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '17%', height: '100%', backgroundColor: 'var(--color-blue)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span>31 - 60 Days (Markdown Proposed)</span>
                <strong>1 Vehicle (17%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '17%', height: '100%', backgroundColor: 'var(--color-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <span>60+ Days (Critical Stagnant)</span>
                <strong>0 Vehicles (0%)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', backgroundColor: 'var(--color-red)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Lead Source Channel Effectiveness */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inquiry Acquisition Channel Breakdown</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '0.85rem' }}>Google Search & Maps Ads</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>High-intent SUV queries</div>
              </div>
              <span className="badge badge-green">42% Conversion</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '0.85rem' }}>Showroom Walk-in Traffic</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Direct footfall at Downtown flagship</div>
              </div>
              <span className="badge badge-green">48% Conversion</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div>
                <strong style={{ fontSize: '0.85rem' }}>CarWale & Cardekho Portals</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Sedan & EV comparison leads</div>
              </div>
              <span className="badge badge-blue">28% Conversion</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0' }}>
              <div>
                <strong style={{ fontSize: '0.85rem' }}>Customer Word-of-Mouth Referral</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Existing owner advocate referrals</div>
              </div>
              <span className="badge badge-violet">65% Conversion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
