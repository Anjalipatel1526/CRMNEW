'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceDocumentGenerator } from '@/components/invoices/InvoiceDocumentGenerator';
import { addDocument } from '@/lib/document-store';

export default function NewDocumentPage() {
  const router = useRouter();

  const handleSaveDocument = async (inv: any) => {
    try {
      await addDocument({
        title: `Official Invoice ${inv.invoiceNumber || 'INV'}`,
        type: 'insurance',
        entityName: inv.customerName || 'Valued Customer',
        fileName: `${inv.invoiceNumber || 'invoice'}.pdf`,
        fileSizeBytes: 24500,
        mimeType: 'application/pdf',
        status: 'verified',
      });
    } catch (err) {
      console.warn('[NewDocumentPage] Error saving generated document:', err);
    }
    router.push('/documents');
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '16px 0' }}>
      <InvoiceDocumentGenerator
        isModal={false}
        onClose={() => router.push('/finance')}
        onSave={handleSaveDocument}
      />
    </div>
  );
}
