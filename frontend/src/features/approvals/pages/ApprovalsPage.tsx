import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { DemoScenarioPanel } from '../../../shared/components/mock/DemoScenarioPanel';
import { DemoDocumentSpotlight } from '../../../shared/components/mock/DemoDocumentSpotlight';
import { DemoWorkflowContext } from '../../../shared/components/mock/DemoWorkflowContext';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  demoApproveDocument,
  demoRejectDocument,
  getDemoPendingApprovals,
  getDemoScenarioState,
} from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';

import { useAuth } from '../../auth/context/useAuth';
import { approveDocument, getPendingApprovals, rejectDocument } from '../../documents/api/documentsApi';
import type { PendingApproval } from '../../documents/types';

export function ApprovalsPage() {
  const { accessToken } = useAuth();
  const { language, t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scenarioState = getDemoScenarioState('demo-policy-014', language);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (demoMode) {
        if (!ignore) {
          setItems(getDemoPendingApprovals(language));
          setError(null);
        }
        return;
      }

      if (!accessToken) {
        return;
      }

      try {
        const payload = await getPendingApprovals(accessToken);
        if (!ignore) {
          setItems(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : t('approvals.loadError'));
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, demoMode, language, t]);

  async function runDecision(documentId: string, action: 'approve' | 'reject') {
    if (demoMode) {
      if (action === 'approve') {
        demoApproveDocument(documentId, comments[documentId] ?? '', null);
      } else {
        demoRejectDocument(documentId, comments[documentId] ?? '', null);
      }

      setItems(getDemoPendingApprovals(language));
      setNotice(action === 'approve' ? t('approvals.approvedNotice') : t('approvals.rejectedNotice'));
      setError(null);
      return;
    }

    if (!accessToken) {
      return;
    }

    try {
      if (action === 'approve') {
        await approveDocument(documentId, { comment: comments[documentId] }, accessToken);
      } else {
        await rejectDocument(documentId, { comment: comments[documentId] }, accessToken);
      }

      const payload = await getPendingApprovals(accessToken);
      setItems(payload);
      setNotice(action === 'approve' ? t('approvals.approvedLiveNotice') : t('approvals.rejectedLiveNotice'));
      setError(null);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : t('approvals.actionFailed'));
      setNotice(null);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('approvals.title')}
        eyebrow={t('approvals.eyebrow')}
        description={t('approvals.description')}
      />

      <ModuleMockup
        eyebrow={t('approvals.mockupEyebrow')}
        title={t('approvals.mockupTitle')}
        description={t('approvals.mockupDescription')}
        highlights={t('approvals.mockupHighlights').split('|||')}
        steps={t('approvals.mockupSteps').split('|||')}
        metrics={[
          { label: t('approvals.queueStatus'), value: t('approvals.queueItems', { count: items.length }) },
          { label: t('approvals.flowType'), value: t('approvals.managerFlow') },
        ]}
      />

      <DemoScenarioPanel
        compact
        state={scenarioState}
        secondaryAction={{ label: t('approvals.openPendingDocument'), to: '/documents/demo-policy-014' }}
      />

      {demoMode ? (
        <DemoDocumentSpotlight
          documentId="demo-policy-014"
          eyebrow={t('approvals.decisionContext')}
          title={t('approvals.decisionTitle')}
          description={t('approvals.decisionDescription')}
          primaryActionLabel={t('approvals.openForDecision')}
        />
      ) : null}

      {demoMode ? (
        <DemoWorkflowContext
          eyebrow={t('approvals.contextEyebrow')}
          title={t('approvals.contextTitle')}
          description={t('approvals.contextDescription')}
          documentId="demo-policy-014"
          primaryActionLabel={t('approvals.openForDecision')}
          primaryActionTo="/documents/demo-policy-014"
          secondaryActionLabel={t('approvals.openQueue')}
          secondaryActionTo="/approvals"
          stats={[
            {
              label: t('approvals.contextVersionLabel'),
              value: items[0]?.currentVersionNumber ? `v${items[0].currentVersionNumber}` : 'v2',
              detail: t('approvals.contextVersionDetail'),
            },
            {
              label: t('approvals.contextDecisionLabel'),
              value: t('approvals.contextDecisionValue'),
              detail: t('approvals.contextDecisionDetail'),
            },
            {
              label: t('approvals.contextNextStepLabel'),
              value: t('approvals.contextNextStepValue'),
              detail: t('approvals.contextNextStepDetail'),
            },
          ]}
        />
      ) : null}

      <div className="dashboard-summary-grid">
        <StatCard label={t('approvals.totalPending')} value={items.length} />
        <StatCard label={t('approvals.dueToday')} value={items.filter((item) => isToday(item.submittedAt)).length} />
        <StatCard label={t('approvals.withComment')} value={items.filter((item) => Boolean(item.latestComment)).length} />
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">{t('approvals.queueEyebrow')}</span>
          <h3>{t('approvals.queueTitle')}</h3>
        </div>

        {items.length === 0 ? (
          <EmptyState 
            title={t('approvals.emptyTitle')} 
            description={t('approvals.emptyDescription')} 
          />
        ) : (
          <div className="registry-list">
            {items.map((item) => (
              <article key={item.documentId} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <Link className="registry-item__title" to={`/documents/${item.documentId}`}>
                        {item.documentTitle}
                      </Link>
                      <p className="muted">
                        {t('approvals.submittedBy', { name: item.submittedBy, value: new Date(item.submittedAt).toLocaleString() })}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="registry-meta">
                    <span>{t('approvals.version', { value: item.currentVersionNumber ?? 1 })}</span>
                    <span>{isToday(item.submittedAt) ? t('approvals.submittedToday') : t('approvals.submittedOn', { value: new Date(item.submittedAt).toLocaleDateString() })}</span>
                  </div>

                  {item.latestComment ? (
                    <div className="callout">
                      <strong>{t('approvals.latestComment')}</strong>
                      <div className="muted">{item.latestComment}</div>
                    </div>
                  ) : null}

                  <label className="stack">
                    <span className="card__label">{t('approvals.commentLabel')}</span>
                    <textarea
                      className="input textarea textarea--compact"
                      placeholder={t('approvals.commentPlaceholder')}
                      value={comments[item.documentId] ?? ''}
                      onChange={(event) => setComments((current) => ({ ...current, [item.documentId]: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="registry-item__actions registry-item__actions--stack">
                  <Link className="button button--secondary" to={`/documents/${item.documentId}`}>
                    {t('documents.openDocument')}
                  </Link>
                  <button className="button" type="button" onClick={() => void runDecision(item.documentId, 'approve')}>
                    {t('approvals.approve')}
                  </button>
                  <button className="button button--secondary" type="button" onClick={() => void runDecision(item.documentId, 'reject')}>
                    {t('approvals.reject')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function isToday(value: string) {
  const target = new Date(value);
  const now = new Date();

  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate();
}
