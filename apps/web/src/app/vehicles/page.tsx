'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Vehicle, VehicleStatus } from '@crm/shared-types';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  Car,
  Plus,
  DollarSign,
  Fuel,
  Gauge,
  Calendar,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Edit3,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(api.getVehicles());
  const [branches] = useState(api.getBranches());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const emptyFormData = {
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
  };

  const [formData, setFormData] = useState(emptyFormData);

  const handleStartEdit = (v: Vehicle) => {
    setFormData({
      branchId: v.branchId,
      vin: v.vin,
      registrationNumber: v.registrationNumber || '',
      make: v.make,
      model: v.model,
      variant: v.variant,
      year: String(v.year),
      color: v.color,
      mileageKm: String(v.mileageKm),
      fuelType: v.fuelType,
      transmission: v.transmission,
      acquisitionCost: String(v.acquisitionCost),
      askingPrice: String(v.askingPrice),
      minimumPrice: String(v.minimumPrice),
      status: v.status,
    });
    setEditingVehicleId(v.id);
    setSelectedVehicle(null);
    setIsAddModalOpen(true);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicleId) {
      const existing = vehicles.find((v) => v.id === editingVehicleId);
      if (existing) {
        Object.assign(existing, {
          ...formData,
          year: Number(formData.year) || existing.year,
          mileageKm: Number(formData.mileageKm) || existing.mileageKm,
          acquisitionCost: Number(formData.acquisitionCost) || existing.acquisitionCost,
          askingPrice: Number(formData.askingPrice) || existing.askingPrice,
          minimumPrice: Number(formData.minimumPrice) || existing.minimumPrice,
        });
      }
      setEditingVehicleId(null);
    } else {
      api.addVehicle(formData);
    }
    setVehicles([...api.getVehicles()]);
    setIsAddModalOpen(false);
    setFormData(emptyFormData);
  };

  const totalValue = vehicles.reduce((sum, v) => sum + v.askingPrice, 0);
  const availableCount = vehicles.filter((v) => v.status === 'available').length;
  const reservedCount = vehicles.filter((v) => v.status === 'reserved').length;
  const soldCount = vehicles.filter((v) => v.status === 'sold').length;

  // Filtered List
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter((v) => {
      if (activeFilter !== 'all' && v.status !== activeFilter) return false;
      if (!q) return true;
      const makeModel = `${v.year} ${v.make} ${v.model} ${v.variant}`.toLowerCase();
      const vin = (v.vin || '').toLowerCase();
      const stock = (v.stockNumber || '').toLowerCase();
      const branch = (v.branchName || '').toLowerCase();
      const reg = (v.registrationNumber || '').toLowerCase();
      return makeModel.includes(q) || vin.includes(q) || stock.includes(q) || branch.includes(q) || reg.includes(q);
    });
  }, [vehicles, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: vehicles.length,
      available: vehicles.filter((v) => v.status === 'available').length,
      reserved: vehicles.filter((v) => v.status === 'reserved').length,
      sold: vehicles.filter((v) => v.status === 'sold').length,
      in_transit: vehicles.filter((v) => v.status === 'in_transit').length,
    };
  }, [vehicles]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Vehicle Inventory & Dealership Stock" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Centralized multi-branch vehicle repository, VIN lifecycle, floor pricing, and stock turnaround metrics."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVehicleId(null);
            setFormData(emptyFormData);
            setIsAddModalOpen(true);
          }}
          className="btn btn-primary btn-sm"
          style={{
            borderRadius: '999px',
            padding: '0.45rem 1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Total Stock Value"
          value={`₹${(totalValue / 10000000).toFixed(2)} Cr`}
          sub={`${vehicles.length} vehicles on dealership floor`}
          icon={<DollarSign size={18} />}
          accentColor="indigo"
        />
        <StatCard
          title="Ready for Sale"
          value={`${availableCount} Units`}
          sub="Available for test drives & delivery"
          icon={<CheckCircle2 size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Reserved Deals"
          value={`${reservedCount} Units`}
          sub="Token advance received & allocated"
          icon={<Clock size={18} />}
          accentColor="orange"
        />
        <StatCard
          title="Sold This Month"
          value={`${soldCount} Units`}
          sub="Delivered to retail & fleet buyers"
          icon={<Car size={18} />}
          accentColor="teal"
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
            placeholder="Search stock by Make, Model, VIN, Stock #, Branch, or Reg #..."
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
              onClick={() => setActiveFilter('all')}
              className={`search-filter-pill ${activeFilter === 'all' ? 'is-active' : ''}`}
            >
              <span>All Stock</span>
              <span className="pill-count">{counts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('available')}
              className={`search-filter-pill ${activeFilter === 'available' ? 'is-active' : ''}`}
            >
              <span>Available</span>
              <span className="pill-count">{counts.available}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('reserved')}
              className={`search-filter-pill ${activeFilter === 'reserved' ? 'is-active' : ''}`}
            >
              <span>Reserved</span>
              <span className="pill-count">{counts.reserved}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('sold')}
              className={`search-filter-pill ${activeFilter === 'sold' ? 'is-active' : ''}`}
            >
              <span>Sold</span>
              <span className="pill-count">{counts.sold}</span>
            </button>
            {counts.in_transit > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('in_transit')}
                className={`search-filter-pill ${activeFilter === 'in_transit' ? 'is-active' : ''}`}
              >
                <span>In Transit</span>
                <span className="pill-count">{counts.in_transit}</span>
              </button>
            )}
          </div>

          <div className="search-results-counter">
            Showing <strong>{filteredVehicles.length}</strong> of {vehicles.length} Vehicles
          </div>
        </div>
      </div>

      {/* Table-Wise Row Cards List */}
      {filteredVehicles.length > 0 ? (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '1.8fr 2.2fr 1.6fr 1.6fr 1.4fr 1.1fr 130px' }}
          >
            <div>Stock & VIN</div>
            <div>Vehicle Model</div>
            <div>Specs & Mileage</div>
            <div>Asking Price</div>
            <div>Location</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          <div className="app-cards-list">
            {filteredVehicles.map((v, index) => {
              const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];

              return (
                <div
                  key={v.id}
                  className="app-row-card"
                  style={{
                    ['--grid-cols' as any]: '1.8fr 2.2fr 1.6fr 1.6fr 1.4fr 1.1fr 130px',
                    ['--theme-accent' as any]: palette.accent,
                    ['--theme-border' as any]: palette.border,
                    ['--theme-glow' as any]: palette.glow,
                    ['--theme-badge-bg' as any]: palette.badgeBg,
                    ['--theme-badge-text' as any]: palette.badgeText,
                  }}
                >
                  {/* Stock & VIN */}
                  <div className="app-row-cell-main">
                    <div className="app-row-avatar">
                      <Car size={18} />
                    </div>
                    <div className="app-row-title-wrap">
                      <span className="app-row-title" style={{ color: palette.accent }}>{v.stockNumber}</span>
                      <span className="app-row-subtitle" style={{ fontFamily: 'monospace' }}>
                        {v.vin}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Model */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                      {v.year} {v.make} {v.model}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {v.variant} • {v.color}
                    </div>
                  </div>

                  {/* Specs & Mileage */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      {v.fuelType} • {v.transmission}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      {v.mileageKm.toLocaleString()} km
                    </div>
                  </div>

                  {/* Asking Price & Cost */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
                      ₹{(v.askingPrice / 100000).toFixed(2)} Lakh
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      Cost: ₹{(v.acquisitionCost / 100000).toFixed(2)}L
                    </div>
                  </div>

                  {/* Location & Branch */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>{v.branchName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'capitalize' }}>
                      {v.ownershipMode}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={v.status} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="app-action-btn"
                      onClick={() => setSelectedVehicle(v)}
                      title="Inspect stock details"
                    >
                      <span>Inspect</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            padding: '3.5rem 1rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px dashed #CBD5E1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
            }}
          >
            <Car size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            No matching inventory vehicles found
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '380px' }}>
            We couldn&apos;t find any vehicles matching &ldquo;{searchQuery}&rdquo;. Try adjusting your search query or reset the filters.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            style={{ marginTop: '6px' }}
          >
            Clear Search & Filters
          </button>
        </div>
      )}

      {/* Add / Edit Vehicle Modal (Inspo Form UI Image 2) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVehicleId(null);
          setFormData(emptyFormData);
        }}
        title={editingVehicleId ? 'Edit Vehicle Stock Record' : 'Add New Inventory Stock'}
        maxWidth="740px"
      >
        <form onSubmit={handleAddVehicle} className="inspo-form-wrapper">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Assigned Dealership Branch <span className="req-star">*</span>
              </label>
              <select
                className="form-select"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                VIN / Chassis Number <span className="req-star">*</span>
              </label>
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

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">
                Make <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Model <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Variant <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">
                Model Year <span className="req-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Exterior Color <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Odometer (km) <span className="req-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.mileageKm}
                onChange={(e) => setFormData({ ...formData, mileageKm: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
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

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">
                Acquisition Cost (₹) <span className="req-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.acquisitionCost}
                onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Asking Price (₹) <span className="req-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.askingPrice}
                onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Floor Minimum Price (₹) <span className="req-star">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.minimumPrice}
                onChange={(e) => setFormData({ ...formData, minimumPrice: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Modern Inspo Footer Bar */}
          <div className="unique-modal-footer-bar" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingVehicleId(null);
                setFormData(emptyFormData);
              }}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
            >
              <span className="btn-text">{editingVehicleId ? 'Save Vehicle Record' : 'Add Vehicle to Stock'}</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Detail Modal with Top Edit and Close Buttons */}
      {selectedVehicle && (
        <Modal
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          title={`Vehicle Record: ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
          maxWidth="720px"
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => handleStartEdit(selectedVehicle)}
                title="Edit vehicle details"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedVehicle(null)}
                title="Close modal"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.2rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Stock Number</span>
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#0284C7' }}>{selectedVehicle.stockNumber}</div>
              </div>
              <StatusBadge status={selectedVehicle.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>VIN / Chassis:</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0F172A', marginTop: '2px' }}>{selectedVehicle.vin}</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>Registration #:</span>
                <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{selectedVehicle.registrationNumber || 'Not Registered'}</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>Location:</span>
                <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{selectedVehicle.branchName}</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>Engine & Fuel:</span>
                <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{selectedVehicle.fuelType} • {selectedVehicle.transmission}</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>Color & Mileage:</span>
                <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{selectedVehicle.color} • {selectedVehicle.mileageKm.toLocaleString()} km</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600 }}>Ownership:</span>
                <div style={{ fontWeight: 600, textTransform: 'capitalize', color: '#0F172A', marginTop: '2px' }}>{selectedVehicle.ownershipMode}</div>
              </div>
            </div>

            {/* Financial Margins Card */}
            <div style={{ padding: '1.2rem', borderRadius: '16px', backgroundColor: '#F0FDFA', border: '1.5px solid #99F6E4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#0F766E', fontWeight: 600, textTransform: 'uppercase' }}>Asking Showroom Price:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F766E' }}>₹{(selectedVehicle.askingPrice / 100000).toFixed(2)} Lakh</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#0F766E', fontWeight: 600, textTransform: 'uppercase' }}>Acquisition Cost:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>₹{(selectedVehicle.acquisitionCost / 100000).toFixed(2)} Lakh</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#0F766E', fontWeight: 600, textTransform: 'uppercase' }}>Gross Margin Buffer:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#16A34A' }}>
                    +₹{((selectedVehicle.askingPrice - selectedVehicle.acquisitionCost) / 100000).toFixed(2)} Lakh
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
