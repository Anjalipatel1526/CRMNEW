'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { APP_CARD_PALETTES } from '@/lib/theme-palettes';
import {
  getDocuments,
  fetchDocuments,
  addDocument,
  updateDocumentStatus,
  deleteDocument,
  initDocumentsRealtime,
  VaultDocument,
} from '@/lib/document-store';
import {
  ShieldCheck,
  UploadCloud,
  FileCheck,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  Plus,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Trash2,
  Download,
  FileUp,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // New Document Upload State
  const [uploadForm, setUploadForm] = useState({
    type: 'kyc',
    title: '',
    entityName: '',
    fileName: '',
    fileSizeBytes: 0,
    mimeType: 'application/pdf',
    fileDataUrl: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // 1. Initial local load
    setDocuments(getDocuments());

    // 2. Fetch authoritative documents from backend Supabase table
    fetchDocuments()
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments([...data]);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 3. Initialize Supabase Realtime so deletes in Supabase Table Editor delete live on the frontend
    initDocumentsRealtime();

    // 4. Listen for store updates across windows/actions
    const handleChanged = () => setDocuments(getDocuments());
    window.addEventListener('crm-documents-changed', handleChanged);
    return () => window.removeEventListener('crm-documents-changed', handleChanged);
  }, []);

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      if (activeFilter === 'verified' && doc.status !== 'verified') return false;
      if (activeFilter === 'under_review' && doc.status !== 'under_review') return false;
      if (
        activeFilter !== 'all' &&
        activeFilter !== 'verified' &&
        activeFilter !== 'under_review' &&
        doc.type !== activeFilter
      )
        return false;
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
      under_review: documents.filter((d) => d.status === 'under_review' || d.status === 'uploaded').length,
      kyc: documents.filter((d) => d.type === 'kyc').length,
    };
  }, [documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds 15MB limit. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const capitalizedTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      setUploadForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        fileDataUrl: dataUrl,
        title: prev.title || capitalizedTitle,
      }));
      showToast(`Selected "${file.name}" (${formatBytes(file.size)})`);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileName) {
      showToast('Please attach a document file (PDF, PNG, JPG).');
      return;
    }
    if (!uploadForm.title.trim()) {
      showToast('Please enter a document title.');
      return;
    }

    setIsUploading(true);
    try {
      const newDoc = await addDocument({
        title: uploadForm.title.trim(),
        type: uploadForm.type,
        entityName: uploadForm.entityName.trim() || 'Customer KYC / Compliance',
        fileName: uploadForm.fileName,
        fileSizeBytes: uploadForm.fileSizeBytes,
        mimeType: uploadForm.mimeType,
        fileDataUrl: uploadForm.fileDataUrl,
        status: 'under_review',
      });

      setIsUploadModalOpen(false);
      setUploadForm({
        type: 'kyc',
        title: '',
        entityName: '',
        fileName: '',
        fileSizeBytes: 0,
        mimeType: 'application/pdf',
        fileDataUrl: '',
      });

      setDocuments(getDocuments());
      showToast(`Document "${newDoc.title}" uploaded & synced to backend vault!`);

      // Refetch to guarantee synced state
      fetchDocuments().then((fresh) => {
        if (Array.isArray(fresh)) setDocuments([...fresh]);
      });
    } catch (err: any) {
      console.error('[DocumentsPage] Upload submission error:', err);
      showToast('Error uploading document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproveDoc = async (id: string) => {
    await updateDocumentStatus(id, 'verified');
    setDocuments(getDocuments());
    if (selectedDoc && selectedDoc.id === id) {
      setSelectedDoc({
        ...selectedDoc,
        status: 'verified',
        verifiedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      });
    }
    showToast('Document approved and verified successfully!');
  };

  const handleRejectDoc = async (id: string) => {
    await updateDocumentStatus(id, 'rejected');
    setDocuments(getDocuments());
    if (selectedDoc && selectedDoc.id === id) {
      setSelectedDoc({
        ...selectedDoc,
        status: 'rejected',
      });
    }
    showToast('Document rejected and flagged for compliance correction.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this document from the vault?')) return;
    await deleteDocument(id);
    setDocuments(getDocuments());
    setSelectedDoc(null);
    showToast('Document removed from vault and backend database.');
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '0.86rem',
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #334155',
          }}
        >
          <CheckCircle size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <WordFadeIn text="Document Verification & Compliance Vault" />
          </h1>
          <p className="page-desc">
            <WordFadeIn
              text="Centralized KYC identity verification, RTO statutory forms, insurance certificates, and PDI checklists synced with backend database."
              baseDelay={0.22}
              staggerDelay={0.035}
            />
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              fetchDocuments().then((fresh) => {
                setDocuments(fresh);
                setIsLoading(false);
                showToast('Refreshed documents from Supabase backend!');
              });
            }}
            className="btn btn-secondary btn-sm"
            style={{
              borderRadius: '999px',
              padding: '0.45rem 1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title="Fetch latest data from Supabase backend"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{
              borderRadius: '999px',
              padding: '0.45rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <UploadCloud size={16} /> Upload New Document
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Verified Documents"
          value={`${counts.verified} Documents`}
          sub="Compliant with dealership audit rules"
          icon={<ShieldCheck size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Pending Verification"
          value={`${counts.under_review} Documents`}
          sub="Statutory compliance review queue"
          icon={<AlertTriangle size={18} />}
          accentColor="orange"
        />
        <StatCard
          title="Customer KYC Vault"
          value={`${counts.kyc} KYC Files`}
          sub="PAN, Aadhaar, Passport & address proofs"
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
            <button
              type="button"
              onClick={() => setActiveFilter('kyc')}
              className={`search-filter-pill ${activeFilter === 'kyc' ? 'is-active' : ''}`}
            >
              <span>KYC Dossiers</span>
              <span className="pill-count">{counts.kyc}</span>
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
            style={{ ['--grid-cols' as any]: '2.2fr 1.5fr 1.4fr 1.6fr 1fr 130px 105px' }}
          >
            <div>Document Title</div>
            <div>Classification</div>
            <div>Associated Entity</div>
            <div>Filename & Size</div>
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
                    ['--grid-cols' as any]: '2.2fr 1.5fr 1.4fr 1.6fr 1fr 130px 105px',
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
                      <span className="app-row-subtitle">
                        {doc.status === 'verified' ? 'Security Hash: Verified' : 'Awaiting Compliance Stamp'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="badge badge-neutral">{doc.classificationLabel || doc.type}</span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.entityName}
                  </div>

                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.fileName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {formatBytes(doc.fileSizeBytes)}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {doc.uploadedAt}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={doc.status} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="app-action-btn"
                      onClick={() => setSelectedDoc(doc)}
                      title="Inspect document preview to review and approve"
                      style={{ whiteSpace: 'nowrap' }}
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
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            {documents.length === 0 ? 'No compliance documents in vault' : 'No matching compliance documents found'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', maxWidth: '380px' }}>
            {documents.length === 0
              ? 'Upload customer KYC identity cards, Form 20 RTO copies, or loan sanction letters to begin. Data is persisted to the backend database.'
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

      {/* Document Review Modal with Live Preview and Verification */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Document Verification: ${selectedDoc.title}`}
          maxWidth="720px"
          headerActions={
            <div className="modal-header-actions">
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
            {/* Header summary badge */}
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
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
                  {selectedDoc.fileName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>
                  Associated to: <strong>{selectedDoc.entityName}</strong> • {formatBytes(selectedDoc.fileSizeBytes)}
                </div>
                {selectedDoc.verifiedAt && (
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, marginTop: '3px' }}>
                    ✓ Officially Verified on {selectedDoc.verifiedAt}
                  </div>
                )}
              </div>
              <StatusBadge status={selectedDoc.status} />
            </div>

            {/* Document Preview Area */}
            {selectedDoc.fileDataUrl && selectedDoc.mimeType.startsWith('image/') ? (
              <div
                style={{
                  maxHeight: '380px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1.5px solid #E2E8F0',
                  backgroundColor: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={selectedDoc.fileDataUrl}
                  alt={selectedDoc.title}
                  style={{ maxHeight: '380px', width: 'auto', objectFit: 'contain' }}
                />
              </div>
            ) : selectedDoc.fileDataUrl && selectedDoc.mimeType === 'application/pdf' ? (
              <div
                style={{
                  height: '340px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1.5px solid #E2E8F0',
                }}
              >
                <iframe
                  src={selectedDoc.fileDataUrl}
                  title={selectedDoc.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            ) : (
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
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                  Secure Document Record Stored in Supabase Database
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
                  Storage Key: {selectedDoc.storageKey} • SHA-256 Checksum Verified
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  color: '#DC2626',
                  borderColor: '#FECACA',
                  padding: '0.45rem 1rem',
                  fontSize: '0.8rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => handleDelete(selectedDoc.id)}
              >
                <Trash2 size={14} />
                <span>Delete Document</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedDoc.fileDataUrl && (
                  <a
                    href={selectedDoc.fileDataUrl}
                    download={selectedDoc.fileName}
                    className="btn btn-secondary"
                    style={{
                      borderRadius: '999px',
                      padding: '0.45rem 1.15rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <Download size={14} /> Download
                  </a>
                )}
                {selectedDoc.status !== 'verified' ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '0.45rem 1.15rem',
                        borderRadius: '999px',
                        border: '1.5px solid #FECACA',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => handleRejectDoc(selectedDoc.id)}
                    >
                      <XCircle size={15} />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      style={{
                        borderRadius: '999px',
                        padding: '0.45rem 1.45rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleApproveDoc(selectedDoc.id)}
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '5px 14px',
                      borderRadius: '999px',
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: '1px solid #A7F3D0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Approved & Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Document Modal with Live File Attachment */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Compliance / KYC Document"
        maxWidth="680px"
      >
        <form onSubmit={handleUploadSubmit} className="inspo-form-wrapper">
          <div className="form-group">
            <label className="form-label">
              Document Classification <span className="req-star">*</span>
            </label>
            <select
              className="form-select"
              value={uploadForm.type}
              onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
              required
            >
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
            <input
              type="text"
              className="form-input"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="e.g. Vikram Singhania - Aadhaar Card Verification"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Associated Entity / Customer Name
            </label>
            <input
              type="text"
              className="form-input"
              value={uploadForm.entityName}
              onChange={(e) => setUploadForm({ ...uploadForm, entityName: e.target.value })}
              placeholder="e.g. Vikram Singhania / Mercedes-Benz E200"
            />
          </div>

          {/* File Picker Area */}
          <div className="form-group">
            <label className="form-label">
              Attach File (PDF, PNG, JPG up to 15MB) <span className="req-star">*</span>
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                borderRadius: '14px',
                border: uploadForm.fileName ? '1.5px solid #10B981' : '1.5px dashed #CBD5E1',
                backgroundColor: uploadForm.fileName ? '#ECFDF5' : '#F8FAFC',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <FileUp
                size={28}
                style={{ color: uploadForm.fileName ? '#059669' : '#64748B', marginBottom: '8px' }}
              />
              {uploadForm.fileName ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#065F46', fontSize: '0.9rem' }}>
                    {uploadForm.fileName}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: '2px' }}>
                    {formatBytes(uploadForm.fileSizeBytes)} • Click to replace file
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem' }}>
                    Click to choose file or drag and drop
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                    Supported: PDF, PNG, JPG, WEBP (Max 15MB)
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Modern Inspo Footer Bar */}
          <div
            className="unique-modal-footer-bar"
            style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}
          >
            <button
              type="button"
              className="unique-btn-cancel"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
            >
              <ChevronLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="unique-lead-submit-btn"
              disabled={isUploading || !uploadForm.fileName}
              style={{
                opacity: isUploading || !uploadForm.fileName ? 0.6 : 1,
                cursor: isUploading || !uploadForm.fileName ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="btn-text">
                {isUploading ? 'Uploading to Vault...' : 'Upload & Sync Document'}
              </span>
              <ChevronRight size={15} className="btn-arrow-icon" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
