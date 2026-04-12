import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { DemoScenarioPanel } from '../../../shared/components/mock/DemoScenarioPanel';
import { DemoDocumentSpotlight } from '../../../shared/components/mock/DemoDocumentSpotlight';
import { DemoWorkflowContext } from '../../../shared/components/mock/DemoWorkflowContext';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  demoRejectSignature,
  demoSignSignature,
  getDemoPendingSignatures,
  getDemoScenarioState,
} from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';

import { useAuth } from '../../auth/context/useAuth';
import { getPendingSignatures, rejectDocumentSignature, signDocumentSignature } from '../../documents/api/documentsApi';
import type { PendingSignature } from '../../documents/types';

export function SignaturesPage() {
  const { accessToken } = useAuth();
  const { language, t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [items, setItems] = useState<PendingSignature[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scenarioState = getDemoScenarioState('demo-contract-001', language);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (demoMode) {
        if (!ignore) {
          setItems(getDemoPendingSignatures(language));
          setError(null);
        }
        return;
      }

      if (!accessToken) {
        return;
      }

      try {
        const payload = await getPendingSignatures(accessToken);
        if (!ignore) {
          setItems(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : t('signatures.loadError'));
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, demoMode, language, t]);

  async function refresh() {
    if (demoMode) {
      setItems(getDemoPendingSignatures(language));
      return;
    }

    if (!accessToken) {
      return;
    }

    const payload = await getPendingSignatures(accessToken);
    setItems(payload);
  }

  async function runAction(item: PendingSignature, action: 'sign' | 'reject') {
    if (demoMode) {
      if (action === 'sign') {
        demoSignSignature(item.documentId, item.signatureRequestId, comments[item.signatureRequestId] ?? '', null);
      } else {
        demoRejectSignature(item.documentId, item.signatureRequestId, comments[item.signatureRequestId] ?? '', null);
      }

      setItems(getDemoPendingSignatures(language));
      setNotice(action === 'sign' ? t('signatures.signedNotice') : t('signatures.rejectedNotice'));
      setError(null);
      return;
    }

    if (!accessToken) {
      return;
    }

    try {
      if (action === 'sign') {
        await signDocumentSignature(item.documentId, item.signatureRequestId, { comment: comments[item.signatureRequestId] }, accessToken);
      } else {
        await rejectDocumentSignature(item.documentId, item.signatureRequestId, { comment: comments[item.signatureRequestId] }, accessToken);
      }

      await refresh();
      setNotice(action === 'sign' ? t('signatures.signedLiveNotice') : t('signatures.rejectedLiveNotice'));
      setError(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('signatures.actionFailed'));
      setNotice(null);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('signatures.title')}
        eyebrow={t('signatures.eyebrow')}
        description={t('signatures.description')}
      />

      <ModuleMockup
        eyebrow={t('signatures.mockupEyebrow')}
        title={t('signatures.mockupTitle')}
        description={t('signatures.mockupDescription')}
        highlights={t('signatures.mockupHighlights').split('|||')}
        steps={t('signatures.mockupSteps').split('|||')}
        metrics={[
          { label: t('signatures.pendingWork'), value: t('approvals.queueItems', { count: items.length }) },
          { label: t('signatures.demoMode'), value: t('signatures.hybridDemo') },
        ]}
      />

      <DemoScenarioPanel
        compact
        state={scenarioState}
        secondaryAction={{ label: t('signatures.openPrimaryDocument'), to: '/documents/demo-contract-001' }}
      />

      {demoMode ? (
        <DemoDocumentSpotlight
          documentId="demo-contract-001"
          eyebrow={t('signatures.signingContext')}
          title={t('signatures.signingTitle')}
          description={t('signatures.signingDescription')}
          primaryActionLabel={t('signatures.openBeforeSigning')}
        />
      ) : null}

      {demoMode ? (
        <DemoWorkflowContext
          eyebrow={t('signatures.contextEyebrow')}
          title={t('signatures.contextTitle')}
          description={t('signatures.contextDescription')}
          documentId="demo-contract-001"
          primaryActionLabel={t('signatures.openBeforeSigning')}
          primaryActionTo="/documents/demo-contract-001"
          secondaryActionLabel={t('signatures.openQueue')}
          secondaryActionTo="/signatures"
          stats={[
            {
              label: t('signatures.contextVersionLabel'),
              value: items[0]?.versionNumber ? `v${items[0].versionNumber}` : 'v3',
              detail: t('signatures.contextVersionDetail'),
            },
            {
              label: t('signatures.contextOrderLabel'),
              value: items[0]?.signingOrder ?? 2,
              detail: t('signatures.contextOrderDetail'),
            },
            {
              label: t('signatures.contextPlacementLabel'),
              value: items[0] ? `P${items[0].pageNumber}` : 'P1',
              detail: t('signatures.contextPlacementDetail'),
            },
          ]}
        />
      ) : null}

      <div className="dashboard-summary-grid">
        <StatCard label={t('signatures.totalPending')} value={items.length} />
        <StatCard label={t('signatures.firstOrder')} value={items.filter((item) => item.signingOrder === 1).length} />
        <StatCard label={t('signatures.withComment')} value={items.filter((item) => Boolean(item.comment)).length} />
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="callout">
        <strong>{t('signatures.signatureModeTitle')}</strong>
        <div className="muted">{t('signatures.signatureModeDescription')}</div>
      </div>

      <section className="signature-evidence-grid">
        <div className="signature-evidence-card">
          <span className="sidebar__eyebrow">{t('signatures.evidence')}</span>
          <strong>{t('signatures.evidenceTitle')}</strong>
          <p className="muted">{t('signatures.evidenceDescription')}</p>
        </div>
        <div className="signature-evidence-card">
          <span className="sidebar__eyebrow">{t('signatures.sequence')}</span>
          <strong>{t('signatures.sequenceTitle')}</strong>
          <p className="muted">{t('signatures.sequenceDescription')}</p>
        </div>
      </section>

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">{t('signatures.queueEyebrow')}</span>
          <h3>{t('signatures.queueTitle')}</h3>
        </div>

        {items.length === 0 ? (
          <EmptyState 
            title={t('signatures.emptyTitle')} 
            description={t('signatures.emptyDescription')} 
          />
        ) : (
          <div className="registry-list">
            {items.map((item) => (
              <article key={item.signatureRequestId} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <Link className="registry-item__title" to={`/documents/${item.documentId}`}>
                        {item.documentTitle}
                      </Link>
                      <p className="muted">
                        {t('signatures.versionOrder', { version: item.versionNumber, order: item.signingOrder })}
                      </p>
                    </div>
                    <span className="status-pill status-pill--subtle">{t('signatures.orderLabel', { order: item.signingOrder })}</span>
                  </div>

                  <div className="registry-meta">
                    <span>{t('signatures.page', { value: item.pageNumber })}</span>
                    <span>{t('signatures.position', { x: item.positionX, y: item.positionY })}</span>
                    <span>{t('signatures.size', { width: item.width, height: item.height })}</span>
                    <span>{t('signatures.hybridLabel')}</span>
                  </div>

                  <div className="signature-preview-panel signature-preview-panel--inline">
                    <div className="signature-preview signature-preview--hybrid">
                      <div className="signature-preview__stamp">{t('signatures.digitalStamp')}</div>
                      <div className="signature-preview__identity">
                        <div className="signature-preview__avatar">SG</div>
                        <div className="stack stack--compact">
                          <strong>{t('signatures.visibleBox')}</strong>
                          <span className="muted">{t('signatures.visibleBoxDescription')}</span>
                        </div>
                      </div>
                      <div className="signature-preview__image">
                        <span className="signature-preview__scribble">{t('signatures.signatureWord')}</span>
                      </div>
                    </div>
                  </div>

                  {item.comment ? (
                    <div className="callout">
                      <strong>{t('signatures.preSignComment')}</strong>
                      <div className="muted">{item.comment}</div>
                    </div>
                  ) : null}

                  <label className="stack">
                    <span className="card__label">{t('signatures.commentLabel')}</span>
                    <textarea
                      className="input textarea textarea--compact"
                      placeholder={t('signatures.commentPlaceholder')}
                      value={comments[item.signatureRequestId] ?? ''}
                      onChange={(event) => setComments((current) => ({ ...current, [item.signatureRequestId]: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="registry-item__actions registry-item__actions--stack">
                  <Link className="button button--secondary" to={`/documents/${item.documentId}`}>
                    {t('documents.openDocument')}
                  </Link>
                  <button className="button" type="button" onClick={() => void runAction(item, 'sign')}>
                    {t('signatures.sign')}
                  </button>
                  <button className="button button--secondary" type="button" onClick={() => void runAction(item, 'reject')}>
                    {t('signatures.reject')}
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
