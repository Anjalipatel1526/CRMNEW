'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
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
} from 'lucide-react';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(api.getCampaigns());
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const referrals = [
    {
      code: 'REF-RAJESH-10',
      referrer: 'Rajesh Sharma',
      referredCustomer: 'Amit Deshmukh',
      reward: 10000,
      status: 'converted',
      rewardPaid: true,
    },
    {
      code: 'REF-PRIYA-05',
      referrer: 'Priya Nair',
      referredCustomer: 'Sneha Patel',
      reward: 7500,
      status: 'contacted',
      rewardPaid: false,
    },
  ];

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
          value="1 Campaign"
          sub="420 delivered • 16.2% response rate"
          icon={<MessageSquare size={18} />}
          accentColor="violet"
        />
        <StatCard
          title="Customer Referrals Generated"
          value="2 Referrals"
          sub="₹17,500 total customer referral rewards"
          icon={<Share2 size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Top Lead Channel"
          value="Walk-in & Google"
          sub="Highest conversion velocity to test drive"
          icon={<Target size={18} />}
          accentColor="blue"
        />
      </div>

      {/* Campaigns Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Promotional Campaigns</h2>
        </div>
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
      </div>

      {/* Referrals Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Customer Referral Program Tracking</h2>
        </div>
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
      </div>

      {/* Launch Campaign Modal */}
      <Modal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        title="Launch Multi-Channel Dealership Campaign"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Campaign launched across WhatsApp & SMS gateway!');
            setIsCampaignModalOpen(false);
          }}
          className="inspo-form-wrapper"
        >
          <div className="form-group">
            <label className="form-label">Campaign Title</label>
            <input type="text" className="form-input" placeholder="Enter campaign title" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Broadcast Channel</label>
              <select className="form-select">
                <option value="">Select Broadcast Channel...</option>
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="sms">Transactional SMS (DLT Approved)</option>
                <option value="email">Rich Email HTML Newsletter</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Audience Segment</label>
              <select className="form-select">
                <option value="">Select Target Segment...</option>
                <option value="leads">Unconverted Inquiries (Last 60 Days)</option>
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
    </div>
  );
}
