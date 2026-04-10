import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, trendType, icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
        {trend && (
          <span className={`stat-card__trend stat-card__trend--${trendType ?? 'neutral'}`}>
            {trend}
          </span>
        )}
      </div>
      {icon && <div className="stat-card__icon">{icon}</div>}
    </article>
  );
}
