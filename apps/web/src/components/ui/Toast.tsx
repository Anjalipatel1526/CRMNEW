'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastState {
  message: string;
  variant: 'success' | 'error';
}

export function useToast(durationMs = 3500) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: 'success' | 'error' = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, variant });
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast, dismissToast };
}

export function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastState | null;
  onDismiss?: () => void;
}) {
  if (!toast) return null;
  const isError = toast.variant === 'error';

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        borderRadius: '14px',
        backgroundColor: isError ? '#FEF2F2' : '#0F172A',
        color: isError ? '#991B1B' : '#FFFFFF',
        border: isError ? '1px solid #FCA5A5' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 16px 36px -8px rgba(15, 23, 42, 0.35)',
        fontSize: '0.84rem',
        fontWeight: 700,
        maxWidth: '420px',
      }}
    >
      {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} style={{ color: '#4ADE80' }} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

