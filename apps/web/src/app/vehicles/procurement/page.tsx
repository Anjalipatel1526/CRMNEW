'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import {
  Truck,
  Plus,
  ClipboardCheck,
  RefreshCw,
  Building,
  CheckCircle,
  Clock,
  Car,
} from 'lucide-react';

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'tradeins' | 'inspections'>('orders');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);

  // Mock initial procurement data
  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 'po-01',
      orderNumber: 'PO-2024-001',
      supplierName: 'Tata Motors Authorized Central Depot',
      vehicleDescription: 'Tata Safari Dark Edition 2.0L Kryotec AT (2 units)',
      expectedCost: 4400000,
      status: 'approved',
      expectedDate: '2026-10-28',
    },
    {
      id: 'po-02',
      orderNumber: 'PO-2024-002',
      supplierName: 'Mahindra Logistics Auto Pool',
      vehicleDescription: 'Mahindra Scorpio-N Z8L 4x4 Diesel AT (1 unit)',
      expectedCost: 2150000,
      status: 'pending_approval',
      expectedDate: '2026-11-02',
    },
  ]);

  const [tradeIns, setTradeIns] = useState([
    {
      id: 'ti-01',
      customerName: 'Rajesh Sharma',
      vehicle: '2019 Hyundai Creta SX (O) Manual',
      odometerKm: 48000,
      estimatedLow: 850000,
      estimatedHigh: 920000,
      offeredPrice: 880000,
      status: 'appraised',
      dealId: 'DL-2024-001',
    },
  ]);

  const [inspections] = useState([
    {
      id: 'insp-01',
      vehicle: '2022 Toyota Fortuner 4x4 (MH03CP1002)',
      type: 'intake',
      inspector: 'Suresh Patil (Senior Mechanic)',
      grade: 'Grade A-',
      repairEstimate: 18000,
      status: 'passed',
      completedAt: '2026-10-20',
    },
  ]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement, Trade-In & Intake Inspections</h1>
          <p className="page-desc">
            Supplier purchase orders, customer exchange vehicle appraisals, and showroom intake grading.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setIsTradeInModalOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={15} /> New Trade-In Appraisal
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-3">
        <StatCard
          title="Active Purchase Orders"
          value="₹65.5 Lakh"
          sub="3 incoming vehicle shipments"
          icon={<Truck size={18} />}
          accentColor="teal"
        />
        <StatCard
          title="Pending Trade-In Value"
          value="₹8.80 Lakh"
          sub="Exchange credit allocated to deals"
          icon={<RefreshCw size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Intake Inspection Pass Rate"
          value="94.2%"
          sub="Rigorous 140-point technical checklist"
          icon={<ClipboardCheck size={18} />}
          accentColor="green"
        />
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'tradeins' ? 'active' : ''}`}
          onClick={() => setActiveTab('tradeins')}
        >
          Trade-In Appraisals ({tradeIns.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'inspections' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspections')}
        >
          Intake Inspections ({inspections.length})
        </button>
      </div>

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Supplier</th>
                  <th>Vehicle Details</th>
                  <th>Expected Cost</th>
                  <th>Delivery Expected</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <strong style={{ color: 'var(--color-teal)' }}>{po.orderNumber}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{po.supplierName}</div>
                    </td>
                    <td>{po.vehicleDescription}</td>
                    <td>
                      <strong>₹{(po.expectedCost / 100000).toFixed(2)} Lakh</strong>
                    </td>
                    <td>{po.expectedDate}</td>
                    <td>
                      <StatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade-Ins Tab */}
      {activeTab === 'tradeins' && (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Customer Vehicle</th>
                  <th>Odometer</th>
                  <th>Valuation Range</th>
                  <th>Offered Exchange Value</th>
                  <th>Linked Deal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tradeIns.map((ti) => (
                  <tr key={ti.id}>
                    <td>
                      <strong>{ti.customerName}</strong>
                    </td>
                    <td>{ti.vehicle}</td>
                    <td>{ti.odometerKm.toLocaleString()} km</td>
                    <td>₹{(ti.estimatedLow / 100000).toFixed(2)}L - ₹{(ti.estimatedHigh / 100000).toFixed(2)}L</td>
                    <td>
                      <strong style={{ color: 'var(--color-green)' }}>
                        ₹{(ti.offeredPrice / 100000).toFixed(2)} Lakh
                      </strong>
                    </td>
                    <td>
                      <span className="badge badge-indigo">{ti.dealId}</span>
                    </td>
                    <td>
                      <StatusBadge status={ti.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspections Tab */}
      {activeTab === 'inspections' && (
        <div className="card">
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle Inspected</th>
                  <th>Type</th>
                  <th>Inspector</th>
                  <th>Technical Grade</th>
                  <th>Repair Estimate</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp) => (
                  <tr key={insp.id}>
                    <td>
                      <strong>{insp.vehicle}</strong>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                        {insp.type}
                      </span>
                    </td>
                    <td>{insp.inspector}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-teal)' }}>{insp.grade}</span>
                    </td>
                    <td>₹{insp.repairEstimate.toLocaleString()}</td>
                    <td>
                      <StatusBadge status={insp.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Manufacturer / Supplier Purchase Order"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Purchase Order submitted for manager approval!');
            setIsOrderModalOpen(false);
          }}
        >
          <div className="form-group">
            <label className="form-label">Authorized Supplier</label>
            <input
              type="text"
              className="form-input"
              defaultValue="Hyundai Motor India Central Depot"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle Description & Quantities</label>
            <textarea
              className="form-textarea"
              rows={3}
              defaultValue="Hyundai Creta SX (O) 1.5 Turbo DCT - Abyss Black (1 unit)"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Expected Net Cost (₹)</label>
            <input
              type="number"
              className="form-input"
              defaultValue="1780000"
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsOrderModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* New Trade-In Modal */}
      <Modal
        isOpen={isTradeInModalOpen}
        onClose={() => setIsTradeInModalOpen(false)}
        title="New Customer Trade-In Appraisal"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Trade-in appraisal calculated and logged!');
            setIsTradeInModalOpen(false);
          }}
        >
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input type="text" className="form-input" defaultValue="Priya Nair" required />
          </div>
          <div className="form-group">
            <label className="form-label">Existing Vehicle (Make, Model, Year, Variant)</label>
            <input type="text" className="form-input" defaultValue="2018 Maruti Baleno Alpha 1.2" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Odometer (km)</label>
              <input type="number" className="form-input" defaultValue="54000" required />
            </div>
            <div className="form-group">
              <label className="form-label">Offered Exchange Value (₹)</label>
              <input type="number" className="form-input" defaultValue="525000" required />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsTradeInModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Appraisal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
