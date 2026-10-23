'use client';

import React, { useState, useMemo } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  ShieldCheck,
  UploadCloud,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Eye,
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Edit3,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      if (activeFilter === 'verified' && doc.status !== 'verified') return false;
      if (activeFilter === 'under_review' && doc.status !== 'under_review') return false;
      if (activeFilter !== 'all' && activeFilter !== 'verified' && activeFilter !== 'under_review' && doc.type !== activeFilter) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.entityName.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q)
      );
    });
  }, [documents, searchQuery, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: documents.length,
      verified: documents.filter((d) => d.status === 'verified').length,
      under_review: documents.filter((d) => d.status === 'under_review').length,
      kyc: documents.filter((d) => d.type.includes('KYC') || d.type.includes('Address')).length,
    };
  }, [documents]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Document Verification & Compliance Vault" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Centralized KYC identity verification, RTO statutory forms, insurance certificates, and PDI checklists."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary btn-sm"
          style={{
            borderRadius: '999px',
            padding: '0.45rem 1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <UploadCloud size={16} /> Upload New Document
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Verified Documents"
          value={`${documents.filter((d) => d.status === 'verified').length} Documents`}
          sub="Compliant with dealership audit rules"
          icon={<ShieldCheck size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Pending Verification"
          value={`${documents.filter((d) => d.status === 'under_review').length} Documents`}
          sub="Statutory compliance review queue"
          icon={<AlertTriangle size={18} />}
          accentColor="orange"
        />
        <StatCard
          title="PDI Inspection Status"
          value={documents.some((d) => d.type?.includes('PDI')) ? "100% Passed" : "0 Files"}
          sub="Pre-Delivery Inspection vault"
          icon={<FileCheck size={18} />}
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
            placeholder="Search documents by title, customer, associated entity, or filename..."
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
              <span>All Documents</span>
              <span className="pill-count">{counts.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('verified')}
              className={`search-filter-pill ${activeFilter === 'verified' ? 'is-active' : ''}`}
            >
              <span>Verified Audit</span>
              <span className="pill-count">{counts.verified}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('under_review')}
              className={`search-filter-pill ${activeFilter === 'under_review' ? 'is-active' : ''}`}
            >
              <span>Under Review</span>
              <span className="pill-count">{counts.under_review}</span>
            </button>
          </div>

          <div className="search-results-counter">
            Showing <strong>{filteredDocuments.length}</strong> of {documents.length} Documents
          </div>
        </div>
      </div>

      {/* Table-Wise Row Cards List */}
      {filteredDocuments.length > 0 ? (
        <div>
          <div
            className="app-table-header"
            style={{ ['--grid-cols' as any]: '2.4fr 1.6fr 2fr 1.8fr 1.3fr 1.1fr 130px' }}
          >
            <div>Document Title</div>
            <div>Classification</div>
            <div>Associated Entity</div>
            <div>Filename</div>
            <div>Upload Date</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          <div className="app-cards-list">
            {filteredDocuments.map((doc, index) => {
              const palette = APP_CARD_PALETTES[index % APP_CARD_PALETTES.length];

              return (
                <div
                  key={doc.id}
                  className="app-row-card"
                  style={{
                    ['--grid-cols' as any]: '2.4fr 1.6fr 2fr 1.8fr 1.3fr 1.1fr 130px',
                    ['--theme-accent' as any]: palette.accent,
                    ['--theme-border' as any]: palette.border,
                    ['--theme-glow' as any]: palette.glow,
                    ['--theme-badge-bg' as any]: palette.badgeBg,
                    ['--theme-badge-text' as any]: palette.badgeText,
                  }}
                >
                  <div className="app-row-cell-main">
                    <div className="app-row-avatar">
                      <FileText size={18} />
                    </div>
                    <div className="app-row-title-wrap">
                      <span className="app-row-title">{doc.title}</span>
                      <span className="app-row-subtitle">Security Hash: Verified</span>
                    </div>
                  </div>

                  <div>
                    <span className="badge badge-neutral">{doc.type}</span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#1E293B' }}>
                    {doc.entityName}
                  </div>

                  <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#64748B' }}>
                    {doc.fileName}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    {doc.uploadedAt}
                  </div>

                  <div>
                    <StatusBadge status={doc.status} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="app-action-btn"
                      onClick={() => setSelectedDoc(doc)}
                      title="Inspect document preview"
                    >
                      <Eye size={13} />
                      <span>Review</span>
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
            <FileText size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            {documents.length === 0 ? 'No compliance documents in vault' : 'No matching compliance documents found'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '380px' }}>
            {documents.length === 0
              ? 'Upload customer KYC identity cards, Form 20 RTO copies, or loan sanction letters to begin.'
              : `We couldn't find any documents matching "${searchQuery}". Try adjusting your search query or reset the filters.`}
          </p>
          {documents.length === 0 ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsUploadModalOpen(true)}
              style={{ marginTop: '6px' }}
            >
              <UploadCloud size={14} /> Upload First Document
            </button>
          ) : (
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
          )}
        </div>
      )}

      {/* Document Review Modal with Top Edit and Close Buttons */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Document Verification: ${selectedDoc.title}`}
          maxWidth="680px"
          headerActions={
            <div className="modal-header-actions">
              <button
                type="button"
                className="modal-header-btn-edit"
                onClick={() => {
                  alert('Editing document metadata for ' + selectedDoc.title);
                }}
                title="Edit document details"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="modal-header-btn-close"
                onClick={() => setSelectedDoc(null)}
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
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>{selectedDoc.fileName}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>Associated to: {selectedDoc.entityName}</div>
              </div>
              <StatusBadge status={selectedDoc.status} />
            </div>

            <div
              style={{
                height: '190px',
                border: '1.5px dashed #CBD5E1',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F8FAFC',
              }}
            >
              <FileText size={42} style={{ color: '#0284C7', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>Secure Document Preview Stored in Object Storage</div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>SHA-256 Checksum Verified • Tamper-proof Audit Recorded</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="button"
                className="btn btn-success"
                style={{
                  borderRadius: '999px',
                  padding: '0.45rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => {
                  alert('Document status marked as Officially Verified!');
                  setSelectedDoc(null);
                }}
              >
                <CheckCircle size={15} /> Mark Verified
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Document Modal (Inspo Form UI Image 2) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Compliance / KYC Document"
        maxWidth="680px"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Document uploaded and queued for KYC audit!');
            setIsUploadModalOpen(false);
          }}
          className="inspo-form-wrapper"
        >
          <div className="form-group">
            <label className="form-label">
              Document Classification <span className="req-star">*</span>
            </label>
            <select className="form-select">
              <option value="">Select Document Classification...</option>
              <option value="kyc">Customer KYC (PAN / Aadhaar / Passport)</option>
              <option value="rc">Vehicle RC / Fitness Certificate</option>
              <option value="insurance">Insurance Policy Certificate</option>
              <option value="pdi">PDI Technical Checklist</option>
              <option value="gate_pass">Delivery Gate Pass & Handover Certificate</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Document Label / Title <span className="req-star">*</span>
            </label>
            <input type="text" className="form-input" placeholder="Enter document title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Attach File (PDF, PNG, JPG up to 10MB)</label>
            <input type="file" className="form-input" />
          </div>

          {/* Modern Inspo Footer Bar */}
          <div className="unique-modal-footer-bar" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsUploadModalOpen(false)}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
            >
              <span className="btn-text">Upload Document</span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
