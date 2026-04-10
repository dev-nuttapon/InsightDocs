import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon ?? '📁'}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description muted">{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
