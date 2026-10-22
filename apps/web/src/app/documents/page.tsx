'use client';

import React, { useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldCheck,
  UploadCloud,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Eye,
  Plus,
} from 'lucide-react';
import { WordFadeIn } from '@/components/ui/WordFadeIn';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([
    {
      id: 'doc-01',
      title: 'Customer PAN Card',
      entityName: 'Rajesh Sharma',
      type: 'KYC Identity',
      fileName: 'pan_rajesh_sharma.pdf',
      status: 'verified',
      uploadedAt: '2026-10-18',
    },
    {
      id: 'doc-02',
      title: 'Aadhaar Card Copy',
      entityName: 'Rajesh Sharma',
      type: 'Address Proof',
      fileName: 'aadhaar_rajesh_masked.pdf',
      status: 'verified',
      uploadedAt: '2026-10-18',
    },
    {
      id: 'doc-03',
      title: 'HDFC Bank Loan Sanction Letter',
      entityName: 'Deal DL-2024-001',
      type: 'Finance Approval',
      fileName: 'hdfc_loan_sanction_xuv.pdf',
      status: 'verified',
      uploadedAt: '2026-10-19',
    },
    {
      id: 'doc-04',
      title: '140-Point PDI Technical Sign-off',
      entityName: 'Mahindra XUV700 (MALC851CLPM...)',
      type: 'PDI Clearance',
      fileName: 'pdi_report_approved.pdf',
      status: 'verified',
      uploadedAt: '2026-10-20',
    },
    {
      id: 'doc-05',
      title: 'Form 20 Registration Application',
      entityName: 'RTO Andheri (MH-02)',
      type: 'Statutory RTO',
      fileName: 'form_20_signed.pdf',
      status: 'under_review',
      uploadedAt: '2026-10-20',
    },
  ]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  return (
    <div>
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
        >
          <UploadCloud size={16} /> Upload New Document
        </button>
      </div>

      <div className="grid-3">
        <StatCard
          title="Verified Documents"
          value="4 Documents"
          sub="Compliant with dealership audit rules"
          icon={<ShieldCheck size={18} />}
          accentColor="green"
        />
        <StatCard
          title="Pending Verification"
          value="1 Document"
          sub="RTO Form 20 awaiting RTO clerk review"
          icon={<AlertTriangle size={18} />}
          accentColor="orange"
        />
        <StatCard
          title="PDI Inspection Status"
          value="100% Passed"
          sub="Pre-Delivery Inspection cleared for delivery"
          icon={<FileCheck size={18} />}
          accentColor="teal"
        />
      </div>

      {/* Documents Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Compliance Document Registry</h2>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Classification</th>
                <th>Associated Entity</th>
                <th>Filename</th>
                <th>Upload Date</th>
                <th>Verification Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.title}</strong>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{doc.type}</span>
                  </td>
                  <td>{doc.entityName}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{doc.fileName}</td>
                  <td>{doc.uploadedAt}</td>
                  <td>
                    <StatusBadge status={doc.status} />
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <Eye size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Document Verification: ${selectedDoc.title}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{selectedDoc.fileName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Associated to: {selectedDoc.entityName}</div>
              </div>
              <StatusBadge status={selectedDoc.status} />
            </div>

            <div style={{ height: '180px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' }}>
              <FileText size={40} style={{ color: 'var(--color-orange)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Secure Document Preview Stored in Object Storage</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>SHA-256 Checksum Verified • Tamper-proof Audit Recorded</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedDoc(null)}>
                Close
              </button>
              <button
                className="btn btn-success"
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

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Compliance / KYC Document"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Document uploaded and queued for KYC audit!');
            setIsUploadModalOpen(false);
          }}
        >
          <div className="form-group">
            <label className="form-label">Document Classification</label>
            <select className="form-select">
              <option value="kyc">Customer KYC (PAN / Aadhaar / Passport)</option>
              <option value="rc">Vehicle RC / Fitness Certificate</option>
              <option value="insurance">Insurance Policy Certificate</option>
              <option value="pdi">PDI Technical Checklist</option>
              <option value="gate_pass">Delivery Gate Pass & Handover Certificate</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Document Label / Title</label>
            <input type="text" className="form-input" defaultValue="Customer Address Proof" required />
          </div>
          <div className="form-group">
            <label className="form-label">Attach File (PDF, PNG, JPG up to 10MB)</label>
            <input type="file" className="form-input" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Upload Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
