import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accentColor?: 'blue' | 'green' | 'red' | 'orange' | 'violet' | 'teal' | 'indigo' | 'amber';
}

export function StatCard({
  title,
  value,
  sub,
  icon,
  accentColor = 'blue',
}: StatCardProps) {
  const colorMap = {
    blue: { bg: 'var(--color-blue-bg)', text: 'var(--color-blue)', border: 'var(--color-blue-border)' },
    green: { bg: 'var(--color-green-bg)', text: 'var(--color-green)', border: 'var(--color-green-border)' },
    red: { bg: 'var(--color-red-bg)', text: 'var(--color-red)', border: 'var(--color-red-border)' },
    orange: { bg: 'var(--color-orange-bg)', text: 'var(--color-orange)', border: 'var(--color-orange-border)' },
    violet: { bg: 'var(--color-violet-bg)', text: 'var(--color-violet)', border: 'var(--color-violet-border)' },
    teal: { bg: 'var(--color-teal-bg)', text: 'var(--color-teal)', border: 'var(--color-teal-border)' },
    indigo: { bg: 'var(--color-indigo-bg)', text: 'var(--color-indigo)', border: 'var(--color-indigo-border)' },
    amber: { bg: 'var(--color-amber-bg)', text: 'var(--color-amber)', border: 'var(--color-amber-border)' },
  };

  const scheme = colorMap[accentColor] || colorMap.blue;

  return (
    <div className="stat-card">
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
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
