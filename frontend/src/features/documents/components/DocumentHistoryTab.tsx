import { DocumentApprovalHistoryItem, DocumentDetail } from '../types';
import { Timeline, TimelineItem } from '../../../shared/components/ui/Timeline';
import { EmptyState } from '../../../shared/components/ui/EmptyState';

interface DocumentHistoryTabProps {
  document: DocumentDetail;
  history: DocumentApprovalHistoryItem[];
  canSubmitReview: boolean;
  reviewComment: string;
  onReviewCommentChange: (val: string) => void;
  onSubmitReview: () => void;
  hasCurrentVersion: boolean;
}

export function DocumentHistoryTab({
  document,
  history,
  canSubmitReview,
  reviewComment,
  onReviewCommentChange,
  onSubmitReview,
  hasCurrentVersion,
}: DocumentHistoryTabProps) {
  const timelineItems: TimelineItem[] = history.map((entry) => ({
    id: entry.id,
    title: `${entry.action}: ${entry.fromStatus} → ${entry.toStatus}`,
    time: new Date(entry.performedAt).toLocaleString(),
    status: mapActionToStatus(entry.action),
    body: (
      <div>
        Performed by <strong>{entry.performedBy}</strong>
      </div>
    ),
    comment: entry.comments.length > 0 ? entry.comments[0].commentText : undefined,
  }));

  return (
    <div className="stack stack--xl">
      {canSubmitReview && (document.status === 'Draft' || document.status === 'Rejected') && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">ส่งเอกสารเข้าพิจารณา</h3>
          <p className="muted">ใช้ขั้นตอนนี้เพื่อส่งเวอร์ชันปัจจุบันเข้าสู่คิวอนุมัติ โดยสามารถระบุหมายเหตุให้ผู้จัดการเห็นบริบทก่อนตัดสินใจได้ทันที</p>
          <div className="stack stack--compact">
            <textarea
              className="input textarea"
              placeholder="ระบุข้อความหรือเงื่อนไขที่ผู้อนุมัติควรรู้ก่อนตัดสินใจ"
              value={reviewComment}
              onChange={(e) => onReviewCommentChange(e.target.value)}
            />
            <div className="actions">
              <button
                className="button"
                disabled={!hasCurrentVersion}
                type="button"
                onClick={onSubmitReview}
              >
                ส่งเข้าพิจารณา
              </button>
            </div>
          </div>
        </section>
      )}

      <div>
        <h3 className="form-section__title" style={{ marginBottom: '24px' }}>ประวัติการอนุมัติและเหตุการณ์สำคัญ</h3>
        {timelineItems.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <EmptyState 
            title="No history" 
            description="Operational lifecycle events will be recorded here once the document leaves Draft status." 
          />
        )}
      </div>
    </div>
  );
}

function mapActionToStatus(action: string): 'success' | 'danger' | 'warning' | 'info' {
  switch (action.toLowerCase()) {
    case 'approve':
    case 'signed':
      return 'success';
    case 'reject':
      return 'danger';
    case 'submitforreview':
      return 'warning';
    default:
      return 'info';
  }
}
