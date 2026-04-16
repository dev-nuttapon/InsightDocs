import React from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hero' | 'outline';
}

export function SectionCard({ title, subtitle, children, actions, className = '', variant = 'default' }: SectionCardProps) {
  return (
    <section className={`section-card section-card--${variant} ${className}`}>
      {(title || actions) && (
        <header className="section-card__header">
          <div className="section-card__title-group">
            {title && <h3 className="section-card__title">{title}</h3>}
            {subtitle && <p className="section-card__subtitle muted">{subtitle}</p>}
          </div>
          {actions && <div className="section-card__actions">{actions}</div>}
        </header>
      )}
      <div className="section-card__body">
        {children}
      </div>
    </section>
  );
}
