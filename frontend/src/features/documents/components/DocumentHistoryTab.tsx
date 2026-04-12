import { DocumentApprovalHistoryItem, DocumentDetail } from '../types';
import { Timeline, TimelineItem } from '../../../shared/components/ui/Timeline';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { useTranslation } from '../../../i18n/useTranslation';

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
  const { t } = useTranslation();
  const timelineItems: TimelineItem[] = history.map((entry) => ({
    id: entry.id,
    title: `${entry.action}: ${entry.fromStatus} → ${entry.toStatus}`,
    time: new Date(entry.performedAt).toLocaleString(),
    status: mapActionToStatus(entry.action),
    body: (
      <div>
        {t('documents.performedBy', { value: entry.performedBy })}
      </div>
    ),
    comment: entry.comments.length > 0 ? entry.comments[0].commentText : undefined,
  }));

  return (
    <div className="stack stack--xl">
      {canSubmitReview && (document.status === 'Draft' || document.status === 'Rejected') && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">{t('documents.submitReviewTitle')}</h3>
          <p className="muted">{t('documents.submitReviewDescription')}</p>
          <div className="stack stack--compact">
            <textarea
              className="input textarea"
              placeholder={t('documents.submitReviewPlaceholder')}
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
                {t('documents.submitReview')}
              </button>
            </div>
          </div>
        </section>
      )}

      <div>
        <h3 className="form-section__title document-history__title">{t('documents.approvalHistoryTitle')}</h3>
        {timelineItems.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <EmptyState 
            title={t('documents.noHistoryTitle')} 
            description={t('documents.noHistoryDescription')} 
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
