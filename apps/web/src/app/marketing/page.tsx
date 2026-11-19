'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/client/api-client';
import { supabase, isSupabaseConfigured } from '@/lib/client/supabase';
import { getActiveTenantId } from '@/lib/client/tenant-context';
import { Campaign } from '@crm/shared-types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import {
  Megaphone,
  Plus,
  Share2,
  TrendingUp,
  MessageSquare,
  Users,
  Target,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(api.getCampaigns());
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    channel: 'whatsapp',
    segment: 'leads',
    template: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const tenantId = getActiveTenantId();
      supabase
        .from('campaigns')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped: Campaign[] = data.map((r: any) => ({
              id: r.id,
              tenantId: r.tenant_id,
              name: r.name,
              campaignType: r.campaign_type,
              status: r.status,
              targetAudience: r.target_audience || {},
              contentTemplate: r.content_template || {},
              scheduledAt: r.scheduled_at,
              budget: r.budget,
              sentCount: r.sent_count || 0,
              deliveredCount: r.delivered_count || 0,
              responseCount: r.response_count || 0,
              createdAt: r.created_at,
            }));
            setCampaigns(mapped);
          }
        });
    }
  }, []);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tenantId = getActiveTenantId();
      const campaignId = 'cmp-' + Date.now();
      const newCampaign: Campaign = {
        id: campaignId,
        tenantId,
        name: formData.title.trim() || 'Festive Broadcast Campaign',
        campaignType: (formData.channel as any) || 'whatsapp',
        status: 'active',
        targetAudience: { segment: formData.segment },
        contentTemplate: { message: formData.template },
        scheduledAt: new Date().toISOString(),
        sentCount: 0,
        deliveredCount: 0,
        responseCount: 0,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('campaigns').insert({
          id: newCampaign.id,
          tenant_id: tenantId,
          name: newCampaign.name,
          campaign_type: newCampaign.campaignType,
          status: newCampaign.status,
          target_audience: newCampaign.targetAudience,
          content_template: newCampaign.contentTemplate,
          scheduled_at: newCampaign.scheduledAt,
          sent_count: 0,
          delivered_count: 0,
          response_count: 0,
          created_at: newCampaign.createdAt,
        });

        if (error) {
          console.error('[Marketing] Supabase campaign insert error:', error.message);
        }
      }

      setCampaigns((prev) => [newCampaign, ...prev]);
      showToast(`Campaign "${newCampaign.name}" launched across ${formData.channel.toUpperCase()} gateway!`, 'success');
      setIsCampaignModalOpen(false);
      setFormData({ title: '', channel: 'whatsapp', segment: 'leads', template: '' });
    } catch (err: any) {
      console.error('[Marketing] Campaign launch error:', err);
      showToast(err?.message || 'Failed to launch campaign', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketing Campaigns & Referral Engine</h1>
          <p className="page-desc">
            Automated WhatsApp broadcast sequences, festive promotions, lead attribution, and customer referral payouts.
          </p>
        </div>
        <button
          onClick={() => setIsCampaignModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Launch Campaign
        </button>
      </div>

      <div className="grid-3">
        <StatCard
          title="Active WhatsApp Campaigns"
          value={`${campaigns.length} Campaigns`}
          sub="0 delivered • 0% response rate"
          icon={<MessageSquare size={18} />}
          accentColor="violet"
        />
        <StatCard
          title="Customer Referrals Generated"
          value={`${referrals.length} Referrals`}
          sub="₹0 total customer referral rewards"
          icon={<Share2 size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Top Lead Channel"
          value="Direct & Digital"
          sub="Lead enquiry attribution channel"
          icon={<Target size={18} />}
          accentColor="blue"
        />
      </div>

      {/* Campaigns Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Promotional Campaigns</h2>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>No Active Marketing Campaigns</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 16px' }}>
              WhatsApp broadcast sequences and promotional campaigns will be managed here.
            </p>
            <button onClick={() => setIsCampaignModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Launch First Campaign
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Channel</th>
                  <th>Audience Segment</th>
                  <th>Sent Count</th>
                  <th>Delivered</th>
                  <th>Responses</th>
                  <th>Budget</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: 'var(--color-violet)' }}>{c.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-violet" style={{ textTransform: 'uppercase' }}>
                        {c.campaignType}
                      </span>
                    </td>
                    <td>{c.targetAudience?.segment || 'Broad Audience'}</td>
                    <td>{c.sentCount}</td>
                    <td>{c.deliveredCount}</td>
                    <td>
                      <strong style={{ color: 'var(--color-green)' }}>{c.responseCount} leads</strong>
                    </td>
                    <td>₹{c.budget?.toLocaleString() || '0'}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Referrals Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Customer Referral Program Tracking</h2>
        </div>
        {referrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>No Customer Referrals Yet</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
              Customer referral vouchers, advocate rewards, and lead conversions will be logged here.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referral Code</th>
                  <th>Advocate Customer</th>
                  <th>Referred Prospect</th>
                  <th>Reward Amount</th>
                  <th>Conversion Stage</th>
                  <th>Reward Disbursed</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--color-indigo)' }}>{r.code}</strong>
                    </td>
                    <td>
                      <strong>{r.referrer}</strong>
                    </td>
                    <td>{r.referredCustomer}</td>
                    <td>
                      <strong>₹{r.reward.toLocaleString()}</strong>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      {r.rewardPaid ? (
                        <span className="badge badge-green">Paid</span>
                      ) : (
                        <span className="badge badge-orange">Pending Delivery</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Launch Campaign Modal */}
      <Modal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        title="Launch Multi-Channel Dealership Campaign"
      >
        <form
          onSubmit={handleLaunchCampaign}
          className="inspo-form-wrapper"
        >
          <div className="form-group">
            <label className="form-label">Campaign Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter campaign title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Broadcast Channel</label>
              <select
                className="form-select"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              >
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="sms">Transactional SMS (DLT Approved)</option>
                <option value="email">Rich Email HTML Newsletter</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Audience Segment</label>
              <select
                className="form-select"
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
              >
                <option value="leads">Unconverted Enquiries (Last 60 Days)</option>
                <option value="owners">Existing Owners 3+ Years Old (Upgrade)</option>
                <option value="all">Entire Dealership Database</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Message Template</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Enter campaign message template..."
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              required
            />
          </div>
          <div className="unique-modal-footer-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsCampaignModalOpen(false)}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button type="submit" className="unique-lead-submit-btn">
              <span className="btn-text">Launch Campaign</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            border: `1.5px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
            color: toast.type === 'error' ? '#991B1B' : '#166534',
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
          ) : (
            <CheckCircle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: toast.type === 'error' ? '#991B1B' : '#166534',
              padding: '2px',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
