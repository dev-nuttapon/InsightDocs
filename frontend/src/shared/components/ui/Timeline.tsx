import React from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  time: string;
  body: React.ReactNode;
  status?: 'success' | 'danger' | 'warning' | 'info';
  comment?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="timeline">
      {items.map((item) => (
        <div key={item.id} className="timeline-item">
          <div className={`timeline-marker ${item.status ? `timeline-marker--${item.status}` : ''}`} />
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-title">{item.title}</span>
              <span className="timeline-time">{item.time}</span>
            </div>
            <div className="timeline-body">{item.body}</div>
            {item.comment && (
              <div className="timeline-comment">
                {item.comment}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
