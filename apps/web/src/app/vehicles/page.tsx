'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { Vehicle, VehicleStatus } from '@crm/shared-types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import {
  Car,
  Plus,
  Filter,
  DollarSign,
  Fuel,
  Gauge,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(api.getVehicles());
  const [branches] = useState(api.getBranches());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState({
    branchId: branches[0]?.id || '',
    vin: '',
    registrationNumber: '',
    make: 'Hyundai',
    model: 'Creta',
    variant: 'SX (O) 1.5 Turbo',
    year: '2024',
    color: 'Abyss Black',
    mileageKm: '3500',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    acquisitionCost: '1750000',
    askingPrice: '1950000',
    minimumPrice: '1900000',
    status: 'available' as VehicleStatus,
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    api.addVehicle(formData);
    setVehicles([...api.getVehicles()]);
    setIsAddModalOpen(false);
  };

  const filtered = vehicles.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    return true;
  });

  const totalValue = vehicles.reduce((sum, v) => sum + v.askingPrice, 0);
  const availableCount = vehicles.filter((v) => v.status === 'available').length;
  const reservedCount = vehicles.filter((v) => v.status === 'reserved').length;
  const soldCount = vehicles.filter((v) => v.status === 'sold').length;

  const columns: Column<Vehicle>[] = [
    {
      header: 'Stock & VIN',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-teal)' }}>{row.stockNumber}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            {row.vin}
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle Model',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {row.year} {row.make} {row.model}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {row.variant} • {row.color}
          </div>
        </div>
      ),
    },
    {
      header: 'Fuel & Trans',
      cell: (row) => (
        <div>
          <div style={{ fontSize: '0.8125rem' }}>
            {row.fuelType} • {row.transmission}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {row.mileageKm.toLocaleString()} km
          </div>
        </div>
      ),
    },
    {
      header: 'Asking Price',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            ₹{(row.askingPrice / 100000).toFixed(2)} Lakh
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Cost: ₹{(row.acquisitionCost / 100000).toFixed(2)}L
          </div>
        </div>
      ),
    },
    {
      header: 'Branch Location',
      cell: (row) => (
        <div>
          <div style={{ fontSize: '0.8125rem' }}>{row.branchName}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            {row.ownershipMode}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedVehicle(row)}
        >
          Inspect Stock
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Vehicle Inventory & Stockyard" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Physical stock allocation, VIN verification, cost management, valuation margins, and status workflow."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Add Physical Vehicle
        </button>
      </div>

      {/* Stock Summary Widgets */}
      <div className="grid-4">
        <StatCard
          title="Total Stock Value"
          value={`₹${(totalValue / 10000000).toFixed(2)} Cr`}
          sub={`${vehicles.length} total vehicles in fleet`}
          icon={<DollarSign size={18} />}
          accentColor="teal"
        />
        <StatCard
          title="Available for Sale"
          value={availableCount}
          sub="Ready for customer test drive"
          icon={<Car size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Reserved Units"
          value={reservedCount}
          sub="Customer booking deposit placed"
          icon={<Clock size={18} />}
          accentColor="amber"
        />
        <StatCard
          title="Sold This Month"
          value={soldCount}
          sub="Delivered or awaiting handover"
          icon={<CheckCircle2 size={18} />}
          accentColor="indigo"
        />
      </div>

      {/* Filter Tabs */}
      <div className="tabs-header">
        {['all', 'available', 'reserved', 'inspection', 'sold'].map((st) => (
          <button
            key={st}
            className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st === 'all' ? 'All Stock' : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <DataTable
            data={filtered}
            columns={columns}
            searchPlaceholder="Search by make, model, stock number, VIN..."
          />
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Vehicle to Showroom Stock"
        maxWidth="720px"
      >
        <form onSubmit={handleAddVehicle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Branch Stockyard</label>
              <select
                className="form-select"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">VIN / Chassis Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                placeholder="MALC851CLPM..."
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Make</label>
              <input
                type="text"
                className="form-input"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-input"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Variant</label>
              <input
                type="text"
                className="form-input"
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Model Year</label>
              <input
                type="number"
                className="form-input"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Exterior Color</label>
              <input
                type="text"
                className="form-input"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Odometer (km)</label>
              <input
                type="number"
                className="form-input"
                value={formData.mileageKm}
                onChange={(e) => setFormData({ ...formData, mileageKm: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <select
                className="form-select"
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transmission</label>
              <select
                className="form-select"
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Acquisition Cost (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.acquisitionCost}
                onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Asking Price (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.askingPrice}
                onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Floor Minimum Price (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.minimumPrice}
                onChange={(e) => setFormData({ ...formData, minimumPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          title={`Vehicle Record: ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Stock Number</span>
                <div style={{ fontWeight: 700, color: 'var(--color-teal)' }}>{selectedVehicle.stockNumber}</div>
              </div>
              <StatusBadge status={selectedVehicle.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>VIN / Chassis:</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedVehicle.vin}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Registration #:</span>
                <div style={{ fontWeight: 600 }}>{selectedVehicle.registrationNumber || 'Not Registered'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Location:</span>
                <div style={{ fontWeight: 600 }}>{selectedVehicle.branchName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Engine / Fuel:</span>
                <div style={{ fontWeight: 600 }}>{selectedVehicle.fuelType} • {selectedVehicle.transmission}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Color & Mileage:</span>
                <div style={{ fontWeight: 600 }}>{selectedVehicle.color} • {selectedVehicle.mileageKm.toLocaleString()} km</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Ownership:</span>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedVehicle.ownershipMode}</div>
              </div>
            </div>

            {/* Financial Margins */}
            <div className="card" style={{ backgroundColor: 'var(--color-teal-bg)', border: '1px solid var(--color-teal-border)' }}>
              <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-teal-text)' }}>Asking Showroom Price:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{(selectedVehicle.askingPrice / 100000).toFixed(2)} Lakh</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-teal-text)' }}>Acquisition Cost:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>₹{(selectedVehicle.acquisitionCost / 100000).toFixed(2)} Lakh</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-teal-text)' }}>Gross Margin Buffer:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-green)' }}>
                    +₹{((selectedVehicle.askingPrice - selectedVehicle.acquisitionCost) / 100000).toFixed(2)} Lakh
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedVehicle(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
