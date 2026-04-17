import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral' | 'warning';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, trendType, icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {icon && <div className="stat-card__icon">{icon}</div>}
      </div>
      <div className="stat-card__content">
        <span className="stat-card__value">{value}</span>
        {trend && (
          <span className={`stat-card__trend stat-card__trend--${trendType ?? 'neutral'}`}>
            {trend}
          </span>
        )}
      </div>
    </article>
  );
}
