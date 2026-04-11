import React from 'react';

/**
 * Normalized status types for Documents and Users.
 */
export type StatusType = 
  | 'Draft' 
  | 'InReview' 
  | 'Approved' 
  | 'Rejected' 
  | 'Signed' 
  | 'Archived' 
  | 'Active' 
  | 'Disabled' 
  | 'Pending';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusString = String(status ?? '');
  const normalizedStatus = statusString.replace(/\s+/g, '');
  const variant = getVariant(normalizedStatus);
  
  return (
    <span className={`status-badge status-badge--${variant}`}>
      {status}
    </span>
  );
}

function getVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'active':
    case 'signed':
      return 'success';
    case 'rejected':
    case 'disabled':
      return 'danger';
    case 'inreview':
    case 'pending':
      return 'warning';
    case 'draft':
      return 'info';
    case 'archived':
      return 'neutral';
    default:
      return 'neutral';
  }
}
