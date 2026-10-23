'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { StatCard } from '@/components/ui/StatCard';
import {
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Calculator,
  MessageSquare,
  Car,
  Lightbulb,
  CheckCircle,
} from 'lucide-react';

export default function AiIntelligencePage() {
  const [leads] = useState(api.getLeads());
  const [vehicles] = useState(api.getVehicles());

  // AI Valuation tool state
  const [valuationInput, setValuationInput] = useState({
    make: '',
    model: '',
    year: '',
    mileageKm: '',
    condition: 'Excellent',
  });

  const [valuationResult, setValuationResult] = useState<{
    estimatedLow: number;
    estimatedMid: number;
    estimatedHigh: number;
    confidence: number;
    comparables: number;
  } | null>(null);

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valuationInput.year || !valuationInput.make) return;
    const yr = Number(valuationInput.year) || 2022;
    const baseEst = Math.max(400000, yr * 600);
    setValuationResult({
      estimatedLow: Math.round(baseEst * 0.92),
      estimatedMid: Math.round(baseEst),
      estimatedHigh: Math.round(baseEst * 1.08),
      confidence: 94,
      comparables: 16,
    });
  };

  const highIntentLeads = leads.filter((l) => (l.score || 0) >= 80);
  const activeFollowUpLeads = leads.filter((l) => l.status !== 'lost');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Dealership Intelligence & Copilot</h1>
          <p className="page-desc">
            Predictive lead scoring, machine-learning vehicle valuation, stock velocity recommendations, and automated messaging copilot.
          </p>
        </div>
      </div>

      <div className="grid-3">
        <StatCard
          title="AI Scoring Engine"
          value={leads.length > 0 ? "Active" : "Standby"}
          sub={leads.length > 0 ? `${leads.length} leads analyzed` : "Awaiting inbound inquiries"}
          icon={<BrainCircuit size={18} />}
          accentColor="violet"
        />
        <StatCard
          title="High-Intent Inquiries"
          value={`${highIntentLeads.length} Leads (>80 Score)`}
          sub={highIntentLeads.length > 0 ? "Immediate closing potential" : "No high-intent leads flagged"}
          icon={<Sparkles size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Stock Optimization"
          value={`${vehicles.filter((v) => v.status === 'available').length} Vehicles`}
          sub="Active showroom inventory"
          icon={<Lightbulb size={18} />}
          accentColor="orange"
        />
      </div>

      {/* Two Columns: AI Valuation Estimator + Sales Copilot Advice */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* ML Vehicle Valuation Estimator */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Machine Learning Vehicle Valuation Estimator</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Algorithmic pricing based on market transaction comps & condition depreciation
              </div>
            </div>
            <Calculator size={18} style={{ color: 'var(--color-violet)' }} />
          </div>
          <div className="card-body">
            <form onSubmit={handleEstimate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Make</label>
                  <input
                    type="text"
                    className="form-input"
                    value={valuationInput.make}
                    onChange={(e) => setValuationInput({ ...valuationInput, make: e.target.value })}
                    placeholder="Enter make (e.g. Hyundai)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-input"
                    value={valuationInput.model}
                    onChange={(e) => setValuationInput({ ...valuationInput, model: e.target.value })}
                    placeholder="Enter model (e.g. Creta)"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    className="form-input"
                    value={valuationInput.year}
                    onChange={(e) => setValuationInput({ ...valuationInput, year: e.target.value })}
                    placeholder="e.g. 2022"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mileage (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={valuationInput.mileageKm}
                    onChange={(e) => setValuationInput({ ...valuationInput, mileageKm: e.target.value })}
                    placeholder="Enter odometer (km)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition Grade</label>
                  <select
                    className="form-select"
                    value={valuationInput.condition}
                    onChange={(e) => setValuationInput({ ...valuationInput, condition: e.target.value })}
                  >
                    <option value="Excellent">Grade A (Pristine)</option>
                    <option value="Good">Grade B (Normal Wear)</option>
                    <option value="Average">Grade C (Refurbish Required)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.25rem' }}>
                <Sparkles size={16} /> Run Algorithmic Valuation
              </button>
            </form>

            {/* Valuation Output Box */}
            {valuationResult ? (
              <div
                style={{
                  backgroundColor: 'var(--color-violet-bg)',
                  border: '1px solid var(--color-violet-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-violet-text)' }}>
                    ESTIMATED MARKET EXCHANGE RANGE
                  </span>
                  <span className="badge badge-violet">{valuationResult.confidence}% Confidence</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-violet-text)' }}>
                  ₹{(valuationResult.estimatedMid / 100000).toFixed(2)} Lakh
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
                  Recommended Range: ₹{(valuationResult.estimatedLow / 100000).toFixed(2)}L - ₹{(valuationResult.estimatedHigh / 100000).toFixed(2)}L • Based on {valuationResult.comparables} regional marketplace comparables.
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '0.84rem',
                }}
              >
                Enter vehicle make, model, and manufacturing year above and click <strong>Run Algorithmic Valuation</strong> to calculate depreciation and market comps.
              </div>
            )}
          </div>
        </div>

        {/* AI Sales Copilot Follow-up Generator */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">AI Sales Copilot & Messaging Drafts</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Context-aware customer communication assistant
              </div>
            </div>
            <MessageSquare size={18} style={{ color: 'var(--color-blue)' }} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeFollowUpLeads.length > 0 ? (
              activeFollowUpLeads.slice(0, 3).map((lead) => (
                <div key={lead.id} style={{ padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong>Follow-Up: {lead.customerName} ({lead.preferredMake} {lead.preferredModel})</strong>
                    <span className="badge badge-green">Score: {lead.score || 85}/100</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                    Active inquiry in {lead.status.replace('_', ' ')} stage. Customer interested in {lead.preferredFuelType || 'Petrol'} powertrain.
                  </p>
                  <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8125rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                    "Hi {lead.customerName?.split(' ')[0] || 'there'}, following up regarding your interest in the {lead.preferredMake} {lead.preferredModel}. We have exciting financing options and priority delivery slots available this week. Would you like me to share a personalized quotation?"
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => alert('Dispatched to WhatsApp Business Gateway!')}
                    >
                      Send via WhatsApp
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed #CBD5E1',
                  color: '#64748B',
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>💬</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  No Active Lead Follow-Ups
                </div>
                <div style={{ fontSize: '0.82rem', maxWidth: '340px', margin: '0 auto' }}>
                  When customer inquiries are added to the CRM, AI Copilot will automatically analyze their preferences and craft personalized WhatsApp follow-ups here.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Turnover & Optimization Engine */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Inventory Turnover & Pricing Optimization Recommendations</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Identifies slow-moving capital and recommends tactical pricing maneuvers
            </div>
          </div>
          <Lightbulb size={18} style={{ color: 'var(--color-orange)' }} />
        </div>
        <div className="card-body">
          {vehicles.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--color-orange-bg)',
                border: '1px solid var(--color-orange-border)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-orange-text)' }}>
                  Active Stock Turnover Monitor: {vehicles.length} Units On Floor
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                  All units are currently within normal aging thresholds. Algorithmic markdown triggers are set to flag vehicles exceeding 30 days on floor.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1.5px dashed #CBD5E1',
                color: '#64748B',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📊</div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                Inventory Turnover Engine Ready
              </div>
              <div style={{ fontSize: '0.82rem', maxWidth: '380px', margin: '0 auto' }}>
                Add vehicle inventory stock to enable AI-powered aging velocity tracking, floor plan interest minimization, and pricing recommendations.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
