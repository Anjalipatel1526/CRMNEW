'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api-client';
import { Deal, Quotation } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { WordFadeIn } from '@/components/ui/WordFadeIn';
import {
  Briefcase,
  FileText,
  BadgePercent,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  Car,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function SalesOverviewPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    setDeals(api.getDeals());
    setQuotations(api.getQuotations());

    api.fetchDeals().then((data) => {
      if (Array.isArray(data)) setDeals([...data]);
    });

    const handleDataChanged = () => {
      setDeals([...api.getDeals()]);
      setQuotations([...api.getQuotations()]);
    };
    window.addEventListener('crm-data-changed', handleDataChanged);
    return () => window.removeEventListener('crm-data-changed', handleDataChanged);
  }, []);

  const totalDealsValue = deals.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const wonDeals = deals.filter((d) => (d.stage as string) === 'ready' || (d.stage as string) === 'delivered' || (d.stage as string) === 'pdi');
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <WordFadeIn text="Sales Operations & Revenue Hub" className="text-2xl font-bold tracking-tight text-gray-900" />
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Unified command center for commercial vehicle deal negotiations, GST quotations, and delivery milestones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            href="/sales/quotations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <FileText size={16} />
            <span>Quotations Builder</span>
          </Link>
          <Link
            href="/sales/deals"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '999px',
              backgroundColor: '#6253F8',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(98, 83, 248, 0.25)',
            }}
          >
            <Briefcase size={16} />
            <span>Manage Deals</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          title="Total Deal Pipeline"
          value={`₹${(totalDealsValue / 100000).toFixed(2)} Lakh`}
          sub={`${deals.length} active negotiations`}
          icon={<Briefcase size={20} />}
          accentColor="blue"
        />
        <StatCard
          title="Realized Revenue (Won)"
          value={`₹${(wonValue / 100000).toFixed(2)} Lakh`}
          sub={`${wonDeals.length} vehicles delivered / ready`}
          icon={<TrendingUp size={20} />}
          accentColor="green"
        />
        <StatCard
          title="Conversion Velocity"
          value={`${winRate}%`}
          sub="Pipeline to delivery closure"
          icon={<BadgePercent size={20} />}
          accentColor="violet"
        />
        <StatCard
          title="Active Quotations"
          value={String(quotations.length)}
          sub="Official GST proposals"
          icon={<FileText size={20} />}
          accentColor="amber"
        />
      </div>

      {/* Primary Section Links (Deals & Quotations) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Deals Hub Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.25rem',
            border: '1px solid #E2E8F0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(98, 83, 248, 0.1)',
                  color: '#6253F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Briefcase size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Commercial Deals Pipeline
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Stage-gate commercial tracking from booking deposit to RTO delivery
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Monitor down payments, hypothecation status, insurance locking, and gate pass clearances across all active buyer agreements.
            </p>
          </div>

          <Link
            href="/sales/deals"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#6253F8',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <span>Open Deals Manager ({deals.length})</span>
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Quotations Builder Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1.25rem',
            border: '1px solid #E2E8F0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Quotations & Proformas
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  On-road pricing engine with dynamic GST, road tax, and accessories
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Create compliance-locked cost estimates, enforce managerial discount approvals, and export branded client PDFs.
            </p>
          </div>

          <Link
            href="/sales/quotations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#10B981',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <span>Open Quotations Builder ({quotations.length})</span>
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Recent Deals Table Overview */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
              Recent Sales Deals
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Live transaction records and payment reconciliation status
            </p>
          </div>

          <Link
            href="/sales/deals"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#6253F8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View all deals <ArrowRight size={14} />
          </Link>
        </div>

        {deals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            <Briefcase size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No deals registered yet</p>
            <p style={{ margin: '4px 0 1rem 0', fontSize: '0.825rem' }}>
              Create a new deal or convert a qualified lead from the pipeline.
            </p>
            <Link
              href="/crm/leads"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                backgroundColor: '#6253F8',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go to Pipeline Leads
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Deal #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Stage</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Value</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Paid Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Balance Due</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 5).map((deal) => {
                  const balance = (deal.grandTotal || 0) - (deal.amountPaid || 0);
                  return (
                    <tr key={deal.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#0F172A' }}>
                        {deal.dealNumber || deal.id.slice(0, 8)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={deal.stage} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#0F172A' }}>
                        ₹{deal.grandTotal?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#16A34A', fontWeight: 600 }}>
                        ₹{deal.amountPaid?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: balance > 0 ? '#DC2626' : '#64748B', fontWeight: 600 }}>
                        ₹{balance > 0 ? balance.toLocaleString('en-IN') : '0'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Link
                          href="/sales/deals"
                          style={{
                            color: '#6253F8',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.825rem',
                          }}
                        >
                          Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
