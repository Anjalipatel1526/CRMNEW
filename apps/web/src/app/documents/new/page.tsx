'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceDocumentGenerator } from '@/components/invoices/InvoiceDocumentGenerator';

export default function NewDocumentPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '16px 0' }}>
      <InvoiceDocumentGenerator
        isModal={false}
        onClose={() => router.push('/finance')}
        onSave={() => router.push('/finance')}
      />
    </div>
  );
}
