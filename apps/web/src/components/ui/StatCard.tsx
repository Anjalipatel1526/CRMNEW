import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accentColor?: 'blue' | 'green' | 'red' | 'orange' | 'violet' | 'teal' | 'indigo' | 'amber';
  className?: string;
  style?: React.CSSProperties;
}

const STAT_PALETTES = {
  blue: {
    accent: '#0284C7',
    bg: '#F0F9FF',
    text: '#0284C7',
    border: 'rgba(2, 132, 199, 0.22)',
  },
  green: {
    accent: '#16A34A',
    bg: '#F0FDF4',
    text: '#16A34A',
    border: 'rgba(22, 163, 74, 0.22)',
  },
  red: {
    accent: '#E11D48',
    bg: '#FFF1F2',
    text: '#E11D48',
    border: 'rgba(225, 29, 72, 0.22)',
  },
  orange: {
    accent: '#EA580C',
    bg: '#FFF7ED',
    text: '#EA580C',
    border: 'rgba(234, 88, 12, 0.22)',
  },
  violet: {
    accent: '#7C3AED',
    bg: '#F5F3FF',
    text: '#7C3AED',
    border: 'rgba(124, 58, 237, 0.22)',
  },
  teal: {
    accent: '#0D9488',
    bg: '#F0FDFA',
    text: '#0D9488',
    border: 'rgba(13, 148, 136, 0.22)',
  },
  indigo: {
    accent: '#4F46E5',
    bg: '#EEF2FF',
    text: '#4F46E5',
    border: 'rgba(79, 70, 229, 0.22)',
  },
  amber: {
    accent: '#D97706',
    bg: '#FFFBEB',
    text: '#D97706',
    border: 'rgba(217, 119, 6, 0.22)',
  },
};

export function StatCard({
  title,
  value,
  sub,
  icon,
  accentColor = 'blue',
  className = '',
  style,
}: StatCardProps) {
  const scheme = STAT_PALETTES[accentColor] || STAT_PALETTES.blue;

  return (
    <div
      className={`stat-card ${className}`.trim()}
      style={{
        borderLeft: `4px solid ${scheme.accent}`,
        ...style,
      }}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && (
          <div
            className="stat-card-icon"
            style={{
              backgroundColor: scheme.bg,
              color: scheme.text,
              border: `1px solid ${scheme.border}`,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  );
}
