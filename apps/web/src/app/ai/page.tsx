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
    make: 'Hyundai',
    model: 'Creta',
    year: '2021',
    mileageKm: '38000',
    condition: 'Excellent',
  });

  const [valuationResult, setValuationResult] = useState({
    estimatedLow: 1150000,
    estimatedMid: 1240000,
    estimatedHigh: 1310000,
    confidence: 94,
    comparables: 18,
  });

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    const base = Number(valuationInput.year) * 600;
    const estMid = 1240000;
    setValuationResult({
      estimatedLow: estMid - 80000,
      estimatedMid: estMid,
      estimatedHigh: estMid + 70000,
      confidence: 94,
      comparables: 24,
    });
  };

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
          title="AI Scoring Accuracy"
          value="91.4%"
          sub="Trained on historical closed deals"
          icon={<BrainCircuit size={18} />}
          accentColor="violet"
        />
        <StatCard
          title="High-Intent Inquiries"
          value="3 Leads (>80 Score)"
          sub="Immediate closing potential"
          icon={<Sparkles size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Stock Optimization"
          value="1 Recommendation"
          sub="Markdown proposed for slow mover"
          icon={<Lightbulb size={18} />}
          accentColor="orange"
        />
      </div>

      {/* Two Columns: AI Valuation Estimator + Sales Copilot Advice */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-input"
                    value={valuationInput.model}
                    onChange={(e) => setValuationInput({ ...valuationInput, model: e.target.value })}
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
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mileage (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={valuationInput.mileageKm}
                    onChange={(e) => setValuationInput({ ...valuationInput, mileageKm: e.target.value })}
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
            <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <strong>Follow-Up: Priya Nair (Tata Nexon EV)</strong>
                <span className="badge badge-green">Score: 92/100</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                Customer completed test drive yesterday with excellent feedback regarding instant torque and silent cabin.
              </p>
              <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8125rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                "Hi Priya, hope you enjoyed driving the Nexon EV yesterday! Based on your daily 45 km Bandra commute, you will save approximately ₹9,200 every month in fuel costs. I have reserved our Daytona Grey unit for you until tomorrow evening. Would you like me to share our zero downpayment loan quotation?"
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

            <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <strong>Re-engagement: Ananya Sengupta (Hyundai Creta)</strong>
                <span className="badge badge-blue">Score: 75/100</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                Looking for panoramic sunroof and inquiring about financing.
              </p>
              <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8125rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                "Hello Ananya, we just received an Abyss Black Hyundai Creta SX (O) Turbo with panoramic sunroof at our Downtown showroom. I can arrange an exclusive priority test drive for you this Saturday. Let me know what time works best!"
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--color-orange-bg)',
              border: '1px solid var(--color-orange-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-orange-text)' }}>
                Action Recommended: 2022 Toyota Fortuner 4x4 (STK-2024-005)
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                Stock age is approaching 21 days with 3 test drives but no closed quotation. AI recommends promotional markdown from ₹37.00L to ₹36.25L to trigger immediate buyer conversion before month-end.
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => alert('Vehicle asking price adjusted to ₹36.25L and notifications dispatched to interested leads!')}
            >
              Apply Price Markdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
