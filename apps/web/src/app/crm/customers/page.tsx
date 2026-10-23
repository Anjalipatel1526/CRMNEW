'use client';

import React, { useState, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Customer } from '@crm/shared-types';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Building2,
  User,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Search,
  X,
  Edit3,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Car,
  Tag,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

// Distinctive color palettes matching Lead Management themes
const CUSTOMER_CARD_PALETTES = [
  {
    accent: '#0284C7',
    lightBg: '#F0F9FF',
    border: 'rgba(2, 132, 199, 0.28)',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    glow: 'rgba(2, 132, 199, 0.18)',
    themeName: 'Sky Blue',
  },
  {
    accent: '#4F46E5',
    lightBg: '#EEF2FF',
    border: 'rgba(79, 70, 229, 0.28)',
    badgeBg: '#EEF2FF',
    badgeText: '#4338CA',
    glow: 'rgba(79, 70, 229, 0.18)',
    themeName: 'Royal Indigo',
  },
  {
    accent: '#16A34A',
    lightBg: '#F0FDF4',
    border: 'rgba(22, 163, 74, 0.28)',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    glow: 'rgba(22, 163, 74, 0.18)',
    themeName: 'Emerald Pearl',
  },
  {
    accent: '#7C3AED',
    lightBg: '#F5F3FF',
    border: 'rgba(124, 58, 237, 0.28)',
    badgeBg: '#F5F3FF',
    badgeText: '#6D28D9',
    glow: 'rgba(124, 58, 237, 0.18)',
    themeName: 'Imperial Violet',
  },
  {
    accent: '#0D9488',
    lightBg: '#F0FDFA',
    border: 'rgba(13, 148, 136, 0.28)',
    badgeBg: '#CCFBF1',
    badgeText: '#0F766E',
    glow: 'rgba(13, 148, 136, 0.18)',
    themeName: 'Oceanic Teal',
  },
  {
    accent: '#D97706',
    lightBg: '#FFFBEB',
    border: 'rgba(217, 119, 6, 0.28)',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    glow: 'rgba(217, 119, 6, 0.18)',
    themeName: 'Warm Amber',
  },
  {
    accent: '#E11D48',
    lightBg: '#FFF1F2',
    border: 'rgba(225, 29, 72, 0.28)',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
    glow: 'rgba(225, 29, 72, 0.18)',
    themeName: 'Crimson Rose',
  },
];

type FilterCategory = 'all' | 'individual' | 'business' | 'kyc_verified' | 'kyc_pending';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(api.getCustomers());
  const [leads] = useState(api.getLeads());
  const [deals] = useState(api.getDeals());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const emptyCustomerForm = {
    firstName: '',
    lastName: '',
    type: 'individual' as 'individual' | 'business',
    companyName: '',
    email: '',
    phone: '',
    panNumber: '',
    city: '',
    preferredVehicle: '',
    budget: '',
  };

  const [formData, setFormData] = useState(emptyCustomerForm);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const getCustomerCarPreference = (c: Customer) => {
    // 1. Check if customer has an active deal (matches deals in api-client)
    const deal = deals.find(
      (d) =>
        d.customerId === c.id ||
        (d.customerName &&
          `${c.firstName} ${c.lastName}`.toLowerCase().trim() ===
            d.customerName.toLowerCase().trim())
    );

    if (deal) {
      return {
        car: deal.vehicleName || 'Vehicle Selected',
        fuelOrVariant: `${deal.stage.replace('_', ' ')} · ${deal.financeType ? deal.financeType.toUpperCase() : 'Active Deal'}`,
        price: `₹${(deal.grandTotal / 100000).toFixed(2)} Lakh`,
        priceLabel: 'Closing Value',
      };
    }

    // 2. Check if customer has direct preferred vehicle override
    if ((c as any).preferredVehicle && (c as any).budget) {
      const b = String((c as any).budget).trim();
      const numMatch = b.replace(/[^0-9.]/g, '');
      const formattedPrice = b.includes('Lakh') || b.includes('L')
        ? (b.startsWith('₹') ? b : `₹${b}`)
        : numMatch
        ? `₹${numMatch} Lakh`
        : b.startsWith('₹') ? b : `₹${b}`;
      return {
        car: (c as any).preferredVehicle,
        fuelOrVariant: (c as any).fuelType || 'Customer Selected',
        price: formattedPrice,
        priceLabel: 'Closing Value',
      };
    }

    // 3. Check matching lead
    const lead = leads.find(
      (l) =>
        l.customerId === c.id ||
        (l.customerName &&
          `${c.firstName} ${c.lastName}`.toLowerCase().trim() ===
            l.customerName.toLowerCase().trim())
    );

    if (lead) {
      const exactAmount = lead.budgetMax || lead.budgetMin || 2480000;
      return {
        car: `${lead.preferredMake} ${lead.preferredModel}`.trim(),
        fuelOrVariant: `${lead.preferredFuelType || 'Fuel'} · ${lead.status.replace('_', ' ')}`,
        price: `₹${(exactAmount / 100000).toFixed(2)} Lakh`,
        priceLabel: 'Closing Value',
      };
    }

    return {
      car: (c as any).preferredVehicle || 'Mahindra XUV700 AX7L',
      fuelOrVariant: 'New Inquiry',
      price: '₹24.80 Lakh',
      priceLabel: 'Closing Value',
    };
  };

  const handleStartEditCustomer = (customer: Customer) => {
    const carPref = getCustomerCarPreference(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      type: customer.type,
      companyName: customer.companyName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      panNumber: customer.panNumber || '',
      city: customer.address?.city || '',
      preferredVehicle: (customer as any).preferredVehicle || carPref.car,
      budget: (customer as any).budget || carPref.price,
    });
    setEditingCustomerId(customer.id);
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomerId) {
      api.updateCustomer(editingCustomerId, {
        ...formData,
        address: { city: formData.city },
        preferredVehicle: formData.preferredVehicle,
        budget: formData.budget,
      } as any);
      setEditingCustomerId(null);
    } else {
      api.addCustomer({
        ...formData,
        address: { city: formData.city },
        preferredVehicle: formData.preferredVehicle,
        budget: formData.budget,
      } as any);
    }
    setCustomers([...api.getCustomers()]);
    setIsModalOpen(false);
    setFormData(emptyCustomerForm);
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      // Category filter
      if (activeFilter === 'individual' && c.type !== 'individual') return false;
      if (activeFilter === 'business' && c.type !== 'business') return false;
      if (activeFilter === 'kyc_verified' && !c.panNumber && !c.gstin) return false;
      if (activeFilter === 'kyc_pending' && (c.panNumber || c.gstin)) return false;

      // Text query match
      if (!q) return true;
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const pan = (c.panNumber || '').toLowerCase();
      const company = (c.companyName || '').toLowerCase();
      const city = (c.address?.city || '').toLowerCase();
      const carPref = getCustomerCarPreference(c);
      const carName = carPref.car.toLowerCase();
      const carPrice = carPref.price.toLowerCase();

      return (
        fullName.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        pan.includes(q) ||
        company.includes(q) ||
        city.includes(q) ||
        carName.includes(q) ||
        carPrice.includes(q)
      );
    });
  }, [customers, searchQuery, activeFilter, leads, deals]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: customers.length,
      individual: customers.filter((c) => c.type === 'individual').length,
      business: customers.filter((c) => c.type === 'business').length,
      kyc_verified: customers.filter((c) => c.panNumber || c.gstin).length,
      kyc_pending: customers.filter((c) => !c.panNumber && !c.gstin).length,
    };
  }, [customers]);

  const getInitials = (firstName: string, lastName?: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return `${first}${last}`.toUpperCase() || 'CU';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Customer Management" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Complete relationship lifecycle, purchase history, consent preferences, and KYC records."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomerId(null);
            setFormData(emptyCustomerForm);
            setIsModalOpen(true);
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
          <Plus size={16} /> Add Customer
        </button>
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
            placeholder="Search customers by name, phone (+91), email, or PAN / Tax ID..."
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

        {/* Filter Pills and Counter */}
        <div className="search-controls-row">
          <div className="search-filter-pills">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`search-filter-pill ${activeFilter === 'all' ? 'is-active' : ''}`}
            >
              <span>All Customers</span>
              <span className="pill-count">{counts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('individual')}
              className={`search-filter-pill ${activeFilter === 'individual' ? 'is-active' : ''}`}
            >
              <User size={13} />
              <span>Individual</span>
              <span className="pill-count">{counts.individual}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('business')}
              className={`search-filter-pill ${activeFilter === 'business' ? 'is-active' : ''}`}
            >
              <Building2 size={13} />
              <span>Corporate Fleet</span>
              <span className="pill-count">{counts.business}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('kyc_verified')}
              className={`search-filter-pill ${activeFilter === 'kyc_verified' ? 'is-active' : ''}`}
            >
              <ShieldCheck size={13} style={{ color: '#16A34A' }} />
              <span>KYC Verified</span>
              <span className="pill-count">{counts.kyc_verified}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('kyc_pending')}
              className={`search-filter-pill ${activeFilter === 'kyc_pending' ? 'is-active' : ''}`}
            >
              <AlertCircle size={13} style={{ color: '#D97706' }} />
              <span>Pending KYC</span>
              <span className="pill-count">{counts.kyc_pending}</span>
            </button>
          </div>

          <div className="search-results-info">
            <span>
              Showing <strong>{filteredCustomers.length}</strong> of {customers.length} Customers
            </span>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table-Wise Card Rows (Customer details as card with different colors) */}
      {filteredCustomers.length > 0 ? (
        <div>
          {/* Table Header */}
          <div className="customer-table-header">
            <div>Customer Profile</div>
            <div>Contact Info</div>
            <div>Category</div>
            <div>Car Preference</div>
            <div>Closing Value</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* Table-Wise Cards Stack */}
          <div className="customer-cards-list">
            {filteredCustomers.map((customer, index) => {
              const palette = CUSTOMER_CARD_PALETTES[index % CUSTOMER_CARD_PALETTES.length];
              const isBusiness = customer.type === 'business';
              const hasKyc = Boolean(customer.panNumber || customer.gstin);
              const initials = getInitials(customer.firstName, customer.lastName);
              const carPref = getCustomerCarPreference(customer);

              return (
                <div
                  key={customer.id}
                  className="customer-row-card"
                  style={{
                    ['--theme-accent' as any]: palette.accent,
                    ['--theme-light-bg' as any]: palette.lightBg,
                    ['--theme-border' as any]: palette.border,
                    ['--theme-badge-bg' as any]: palette.badgeBg,
                    ['--theme-badge-text' as any]: palette.badgeText,
                    ['--theme-glow' as any]: palette.glow,
                  }}
                >
                  {/* Column 1: Customer Profile */}
                  <div className="customer-row-cell-profile">
                    <div className="customer-row-name-wrap">
                      <span className="customer-row-name">
                        {customer.firstName} {customer.lastName}
                      </span>
                      <span className="customer-row-subtext">
                        {customer.companyName ? `🏢 ${customer.companyName}` : 'Individual Retail Client'}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Contact Info */}
                  <div className="customer-row-cell-contact">
                    <a
                      href={`tel:${customer.phone}`}
                      className="customer-row-contact-phone"
                      title="Call customer"
                    >
                      <Phone size={13} style={{ color: palette.accent }} />
                      <span>{customer.phone}</span>
                    </a>
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className="customer-row-contact-email"
                        title="Send email"
                      >
                        <Mail size={12} />
                        <span>{customer.email}</span>
                      </a>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.73rem', color: '#94A3B8' }}>
                      <MapPin size={11} />
                      <span>
                        {customer.address?.city || 'Mumbai'}
                        {customer.address?.pincode ? `, ${customer.address.pincode}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Category */}
                  <div>
                    <span className="customer-category-pill">
                      {isBusiness ? <Building2 size={11} /> : <User size={11} />}
                      {isBusiness ? 'Corporate Fleet' : 'Individual'}
                    </span>
                  </div>

                  {/* Column 4: Car Preference */}
                  <div className="customer-row-cell-car">
                    <div className="customer-car-info">
                      <span className="customer-car-title" title={carPref.car}>
                        {carPref.car}
                      </span>
                      <span className="customer-car-subtitle" title={carPref.fuelOrVariant}>
                        {carPref.fuelOrVariant}
                      </span>
                    </div>
                  </div>

                  {/* Column 5: Exact Price of Closing Value */}
                  <div className="customer-row-cell-price">
                    <span className="customer-price-badge">
                      <Tag size={12} />
                      {carPref.price}
                    </span>
                    <span className="customer-price-label">
                      {carPref.priceLabel}
                    </span>
                  </div>

                  {/* Column 6: Actions */}
                  <div className="customer-row-cell-actions">
                    <button
                      type="button"
                      className="customer-action-btn"
                      onClick={() => setSelectedCustomer(customer)}
                      title="View customer profile"
                    >
                      <span>Details</span>
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
            background: '#FFFFFF',
            border: '1.5px dashed #CBD5E1',
            borderRadius: '20px',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {customers.length === 0 ? (
            <>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(30,68,59,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1E443B',
                  fontSize: '1.5rem',
                }}
              >
                👥
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                No Customers Added Yet
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '400px' }}>
                Your customer directory is empty. Add individual retail buyers or corporate fleet clients to manage deals, quotations, and communications.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsModalOpen(true);
                }}
                style={{ marginTop: '6px' }}
              >
                <Plus size={16} /> Add First Customer
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                }}
              >
                <Search size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                No matching customers found
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '380px' }}>
                We couldn&apos;t find any customers matching &ldquo;{searchQuery}&rdquo;. Try adjusting your search query or reset the filters.
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
            </>
          )}
        </div>
      )}

      {/* Add / Edit Customer Modal with Modern Form UI */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomerId(null);
          setFormData(emptyCustomerForm);
        }}
        title={editingCustomerId ? 'Edit Customer Profile' : 'Register New Customer'}
        maxWidth="680px"
      >
        <form onSubmit={handleCreateCustomer} className="inspo-form-wrapper">
          <div className="form-group">
            <label className="form-label">
              Customer Classification <span className="req-star">*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'individual' })}
                style={{
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid',
                  borderColor: formData.type === 'individual' ? '#2563EB' : '#CBD5E1',
                  backgroundColor: formData.type === 'individual' ? '#EFF6FF' : '#FFFFFF',
                  color: formData.type === 'individual' ? '#1D4ED8' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <User size={16} /> Individual Retail
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'business' })}
                style={{
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid',
                  borderColor: formData.type === 'business' ? '#4F46E5' : '#CBD5E1',
                  backgroundColor: formData.type === 'business' ? '#EEF2FF' : '#FFFFFF',
                  color: formData.type === 'business' ? '#4338CA' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Building2 size={16} /> Corporate Fleet
              </button>
            </div>
          </div>

          {formData.type === 'business' && (
            <div className="form-group">
              <label className="form-label">
                Company / Organization Name <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                required
              />
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                First Name / Contact Person <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Phone Number <span className="req-star">*</span>
              </label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
              <div className="form-helper">WhatsApp messaging will be enabled by default.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">PAN Card / Tax ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="Enter PAN number"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registered City</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Car Preference / Desired Model</label>
              <input
                type="text"
                className="form-input"
                value={formData.preferredVehicle}
                onChange={(e) => setFormData({ ...formData, preferredVehicle: e.target.value })}
                placeholder="e.g. Mahindra XUV700 AX7L or Tata Nexon EV"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Price / Budget (₹)</label>
              <input
                type="text"
                className="form-input"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. ₹22.0L - ₹26.0L"
              />
            </div>
          </div>

          <div className="unique-modal-footer-bar" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsModalOpen(false)}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
            >
              <span className="btn-text">{editingCustomerId ? 'Save Customer Changes' : 'Register Customer'}</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Dossier Modal with Top Edit and Close Buttons */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Profile: ${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
          maxWidth="760px"
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => handleStartEditCustomer(selectedCustomer)}
                title="Edit customer details"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedCustomer(null)}
                title="Close customer profile"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Profile Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.2rem',
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    border: '1.5px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                  }}
                >
                  {selectedCustomer.type === 'business' ? (
                    <Building2 size={22} />
                  ) : (
                    getInitials(selectedCustomer.firstName, selectedCustomer.lastName)
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
                    {selectedCustomer.companyName
                      ? `Corporate Account: ${selectedCustomer.companyName}`
                      : 'Individual Retail Buyer'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedCustomer.phone}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {selectedCustomer.email || 'No email provided'}
                </div>
              </div>
            </div>

            {/* Vehicle Preference & Target Budget Section */}
            {(() => {
              const pref = getCustomerCarPreference(selectedCustomer);
              return (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px solid #E2E8F0',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Car size={22} />
                    </div>
                    <div>
                      <span
                        style={{
                          color: '#64748B',
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontWeight: 600,
                          display: 'block',
                        }}
                      >
                        Car Preference
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                        {pref.car}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
                        {pref.fuelOrVariant}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        color: '#64748B',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {pref.priceLabel}
                    </span>
                    <span className="customer-price-badge" style={{ fontSize: '0.92rem', padding: '5px 12px' }}>
                      <Tag size={13} />
                      {pref.price}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* KYC & Identity Section */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Compliance & KYC Records
                </h4>
                {selectedCustomer.panNumber || selectedCustomer.gstin ? (
                  <span className="kyc-badge-verified">
                    <ShieldCheck size={13} /> Verified
                  </span>
                ) : (
                  <span className="kyc-badge-pending">
                    <AlertCircle size={13} /> Pending Verification
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>
                    PAN / Tax ID:
                  </span>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedCustomer.panNumber || selectedCustomer.gstin || 'ABCPS1234M'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>
                    Aadhaar Status:
                  </span>
                  <div style={{ fontWeight: 700, color: '#16A34A' }}>Linked (Masked)</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>
                    Registered City:
                  </span>
                  <div style={{ fontWeight: 700 }}>{selectedCustomer.address?.city || 'Mumbai'}</div>
                </div>
              </div>
            </div>

            {/* Lifetime Engagement History */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1.5px solid #E2E8F0',
                padding: '16px 18px',
              }}
            >
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', margin: '0 0 14px 0' }}>
                Automotive Lifetime Timeline
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#2563EB',
                      marginTop: '5px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                      Deal Initialized — Mahindra XUV700 AX7L
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      Quotation #Q-2024-001 accepted, deposit of ₹1,00,000 paid.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#0D9488',
                      marginTop: '5px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                      Test Drive Completed
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      45 min drive route on Western Express Highway. Rating: 5/5 stars.
                    </div>
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
