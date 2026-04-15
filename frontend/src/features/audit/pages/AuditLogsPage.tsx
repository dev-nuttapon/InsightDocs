import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuth } from '../../auth/context/useAuth';
import { getAuditLog, getAuditLogs } from '../api/auditApi';
import type { AuditLogDetail, AuditLogFilters, AuditLogListResponse } from '../types';

import { StatCard } from '../../../shared/components/ui/StatCard';
import { Timeline, TimelineItem } from '../../../shared/components/ui/Timeline';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { DemoScenarioPanel } from '../../../shared/components/mock/DemoScenarioPanel';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { DemoDocumentSpotlight } from '../../../shared/components/mock/DemoDocumentSpotlight';
import { DemoWorkflowContext } from '../../../shared/components/mock/DemoWorkflowContext';
import { FeatureHeroPanel } from '../../../shared/components/mock/FeatureHeroPanel';
import { getDemoAuditLog, getDemoAuditLogs, getDemoScenarioState } from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';
import { useTranslation } from '../../../i18n/useTranslation';

const defaultFilters: AuditLogFilters = {
  actor: '',
  action: '',
  documentId: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
};

export function AuditLogsPage() {
  const { accessToken } = useAuth();
  const { language, t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<AuditLogFilters>({
    actor: searchParams.get('actor') ?? '',
    action: searchParams.get('action') ?? '',
    documentId: searchParams.get('documentId') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
    page: Number(searchParams.get('page') ?? defaultFilters.page),
    pageSize: Number(searchParams.get('pageSize') ?? defaultFilters.pageSize),
  });
  const [results, setResults] = useState<AuditLogListResponse | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scenarioState = getDemoScenarioState('demo-contract-001', language);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (demoMode) {
        if (!ignore) {
          const payload = getDemoAuditLogs(filters, language);
          setResults(payload);
          setSelectedLog(payload.items.length > 0 ? getDemoAuditLog(payload.items[0].id, language) : null);
          setError(null);
        }
        return;
      }

      if (!accessToken) {
        return;
      }

      try {
        const payload = await getAuditLogs(accessToken, filters);
        if (!ignore) {
          setResults(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : t('audit.loadError'));
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, demoMode, filters, language, t]);

  async function handleSelectAuditLog(id: string) {
    if (demoMode) {
      setSelectedLog(getDemoAuditLog(id, language));
      setError(null);
      return;
    }

    if (!accessToken) {
      return;
    }

    try {
      const detail = await getAuditLog(id, accessToken);
      setSelectedLog(detail);
      setError(null);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : t('audit.detailError'));
    }
  }

  function updateFilters(patch: Partial<AuditLogFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params, { replace: true });
  }

  const totalPages = useMemo(
    () => results ? Math.max(1, Math.ceil(results.totalCount / results.pageSize)) : 1,
    [results],
  );
  const formattedMetadata = useMemo(() => {
    if (!selectedLog?.metadataJson) {
      return t('audit.noMetadata');
    }

    try {
      return JSON.stringify(JSON.parse(selectedLog.metadataJson), null, 2);
    } catch {
      return selectedLog.metadataJson;
    }
  }, [selectedLog]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!selectedLog) return [];
    return [
      {
        id: 'actor',
        title: t('audit.actorValue'),
        time: selectedLog.actorDisplayName ?? selectedLog.actorUsername ?? t('audit.system'),
        body: <div className="muted">{selectedLog.actorUserId ? t('audit.userIdLabel', { value: selectedLog.actorUserId }) : t('audit.internalEvent')}</div>,
        status: 'info',
      },
      {
        id: 'action',
        title: t('audit.eventLabel'),
        time: selectedLog.action,
        body: <div className="muted">{t('audit.targetLabel', { type: selectedLog.entityType, id: selectedLog.entityId ?? '-' })}</div>,
        status: selectedLog.action.toLowerCase().includes('reject') || selectedLog.action.toLowerCase().includes('delete') ? 'danger' : 'success',
      },
      {
        id: 'document',
        title: t('documents.title'),
        time: selectedLog.relatedDocumentId ? t('audit.linked') : t('audit.none'),
        body: selectedLog.relatedDocumentId ? (
          <Link to={`/documents/${selectedLog.relatedDocumentId}`} className="button button--secondary audit-linked-button">
            {t('audit.viewDocument')}
          </Link>
        ) : null,
        status: 'info',
      },
    ];
  }, [selectedLog, t]);

  const eventLabelMap: Record<string, string> = {
    'document.version.created': t('audit.eventVersionCreated'),
    'document.approval.submitted': t('audit.eventApprovalSubmitted'),
    'document.approval.approved': t('audit.eventApprovalApproved'),
    'document.signature.signed': t('audit.eventSignatureSigned'),
  };
  const followUpLinks = useMemo(() => {
    if (!selectedLog?.relatedDocumentId) {
      return [{ to: '/dashboard', label: t('search.backToDashboard') }];
    }

    const action = selectedLog.action.toLowerCase();

    if (action.includes('signature')) {
      return [
        { to: `/documents/${selectedLog.relatedDocumentId}`, label: t('audit.openDemoDocument') },
        { to: '/signatures', label: t('shell.signatures') },
      ];
    }

    if (action.includes('approval')) {
      return [
        { to: `/documents/${selectedLog.relatedDocumentId}`, label: t('audit.openDemoDocument') },
        { to: '/approvals', label: t('shell.approvals') },
      ];
    }

    return [
      { to: `/documents/${selectedLog.relatedDocumentId}`, label: t('audit.openDemoDocument') },
      { to: '/dashboard', label: t('search.backToDashboard') },
    ];
  }, [selectedLog, t]);

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('audit.title')}
        eyebrow={t('audit.eyebrow')}
        description={t('audit.description')}
      />

      <ModuleMockup
        eyebrow={t('audit.mockupEyebrow')}
        title={t('audit.mockupTitle')}
        description={t('audit.mockupDescription')}
        highlights={t('audit.mockupHighlights').split('|||')}
        steps={t('audit.mockupSteps').split('|||')}
        metrics={[
          { label: t('audit.totalItems'), value: t('approvals.queueItems', { count: results?.totalCount ?? 0 }) },
          { label: t('audit.operationalView'), value: t('audit.traceability') },
        ]}
      />

      <DemoScenarioPanel
        compact
        state={{
          ...scenarioState,
          badge: t('audit.trailBadge'),
          headline: t('audit.trailHeadline'),
          nextStep: t('audit.trailNextStep'),
          primaryAction: { label: t('audit.openDemoDocument'), to: '/documents/demo-contract-001' },
        }}
        secondaryAction={{ label: t('search.backToDashboard'), to: '/dashboard' }}
      />

      {demoMode ? (
        <DemoDocumentSpotlight
          documentId="demo-contract-001"
          eyebrow={t('audit.trailEyebrow')}
          title={t('audit.trailTitle')}
          description={t('audit.trailDescription')}
          primaryActionLabel={t('audit.openDemoDocument')}
        />
      ) : null}

      {demoMode ? (
        <DemoWorkflowContext
          eyebrow={t('audit.contextEyebrow')}
          title={t('audit.contextTitle')}
          description={t('audit.contextDescription')}
          documentId="demo-contract-001"
          primaryActionLabel={t('audit.openDemoDocument')}
          primaryActionTo="/documents/demo-contract-001"
          secondaryActionLabel={t('audit.openAuditList')}
          secondaryActionTo="/audit-logs"
          stats={[
            {
              label: t('audit.contextEventLabel'),
              value: results?.items.length ?? 0,
              detail: t('audit.contextEventDetail'),
            },
            {
              label: t('audit.contextActorLabel'),
              value: selectedLog?.actorDisplayName ?? selectedLog?.actorUsername ?? t('audit.system'),
              detail: t('audit.contextActorDetail'),
            },
            {
              label: t('audit.contextTraceLabel'),
              value: selectedLog?.relatedDocumentId ? t('audit.linked') : t('audit.none'),
              detail: t('audit.contextTraceDetail'),
            },
          ]}
        />
      ) : null}

      <div className="dashboard-summary-grid">
        <StatCard label={t('audit.totalActivities')} value={results?.totalCount ?? 0} />
        <StatCard label={t('audit.recentEvents')} value={results?.items.length ?? 0} />
        <StatCard label={t('audit.activeFilters')} value={Object.values(filters).filter(v => typeof v === 'string' && v.trim() !== '' && v !== '1' && v !== '20').length} />
      </div>

      {demoMode ? (
        <FeatureHeroPanel
          eyebrow={t('audit.resultEyebrow')}
          title={t('audit.resultTitle')}
          description={t('audit.resultDescription')}
          actions={[
            { label: t('audit.openDemoDocument'), to: '/documents/demo-contract-001' },
            { label: t('search.backToDashboard'), to: '/dashboard', tone: 'secondary' as const },
          ]}
          stats={[
            {
              label: t('audit.contextEventLabel'),
              value: results?.totalCount ?? 0,
              detail: t('audit.resultEventDetail'),
            },
            {
              label: t('audit.contextActorLabel'),
              value: selectedLog?.actorDisplayName ?? selectedLog?.actorUsername ?? t('audit.system'),
              detail: t('audit.resultActorDetail'),
            },
            {
              label: t('audit.contextTraceLabel'),
              value: selectedLog?.relatedDocumentId ? t('audit.linked') : t('audit.none'),
              detail: t('audit.resultTraceDetail'),
            },
          ]}
        />
      ) : null}

      <section className="panel panel--full stack">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-bar__label">{t('audit.actorLabel')}</span>
            <input className="input" placeholder={t('audit.actorPlaceholder')} value={filters.actor ?? ''} onChange={(event) => updateFilters({ actor: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">{t('audit.actionLabel')}</span>
            <input className="input" placeholder={t('audit.actionPlaceholder')} value={filters.action ?? ''} onChange={(event) => updateFilters({ action: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">{t('audit.documentIdLabel')}</span>
            <input className="input" placeholder={t('audit.documentIdPlaceholder')} value={filters.documentId ?? ''} onChange={(event) => updateFilters({ documentId: event.target.value, page: 1 })} />
          </div>
          <button
            className="button button--secondary filter-action-button"
            type="button"
            onClick={() => updateFilters(defaultFilters)}
            disabled={Object.entries(filters).every(([k, v]) => k === 'page' || k === 'pageSize' || v === '')}
          >
            {t('audit.reset')}
          </button>
        </div>

        <div className="filter-chip-list">
          {filters.from && <span className="filter-chip"><span className="filter-chip__label">{t('audit.fromChip')}</span> {filters.from} <button className="filter-chip__remove" onClick={() => updateFilters({ from: '' })}>×</button></span>}
          {filters.to && <span className="filter-chip"><span className="filter-chip__label">{t('audit.toChip')}</span> {filters.to} <button className="filter-chip__remove" onClick={() => updateFilters({ to: '' })}>×</button></span>}
        </div>

        {error ? <div className="callout callout--danger">{error}</div> : null}

        <div className="split-layout split-layout--wide">
          <section className="stack">
            <div className="section-heading">
              <span className="sidebar__eyebrow">{t('audit.listEyebrow')}</span>
              <h3>{t('audit.listTitle')}</h3>
              <p className="section-heading__description muted">{t('audit.listDescription')}</p>
            </div>
            <div className="registry-toolbar">
              <span className="muted">
                {t('audit.showingCount', { count: results?.items.length ?? 0, total: results?.totalCount ?? 0 })}
              </span>
            </div>

            {(results?.items.length ?? 0) === 0 ? (
              <EmptyState title={t('audit.emptyTitle')} description={t('audit.emptyDescription')} />
            ) : (
              <div className="registry-list">
                {results?.items.map((item) => (
                  <article
                    key={item.id}
                    className={`registry-item ${selectedLog?.id === item.id ? 'registry-item--selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleSelectAuditLog(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void handleSelectAuditLog(item.id);
                      }
                    }}
                  >
                    <div className="registry-item__main">
                      <div className="registry-item__header">
                        <div className="stack stack--compact">
                          <div className="registry-item__title">{eventLabelMap[item.action] ?? item.action}</div>
                          <p className="muted">
                            {item.actorDisplayName ?? item.actorUsername ?? t('audit.system')} • {item.entityType}
                          </p>
                        </div>
                        <StatusBadge status={mapAuditStatus(item.action)} />
                      </div>

                      <div className="registry-meta">
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span>{t('audit.entityIdValue', { value: item.entityId ?? '-' })}</span>
                      </div>

                      <div className="registry-meta">
                        <span>{t('audit.actorIdValue', { value: item.actorUserId ?? '-' })}</span>
                        <span>{t('audit.documentValue', { value: item.relatedDocumentId ?? '-' })}</span>
                      </div>
                    </div>

                    <div className="registry-item__actions">
                      <button className="button button--secondary" type="button">
                        {t('audit.detailButton')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="stack">
            <div className="panel stack audit-detail-panel">
              <div className="section-heading">
                <span className="sidebar__eyebrow">{t('audit.detailEyebrow')}</span>
                <h3 className="form-section__title">{t('audit.detailTitle')}</h3>
                <p className="section-heading__description muted">{t('audit.detailDescription')}</p>
              </div>
              {selectedLog ? (
                <div className="stack">
                  <dl className="detail-list">
                    <div>
                      <dt>{t('audit.eventLabel')}</dt>
                      <dd>{eventLabelMap[selectedLog.action] ?? selectedLog.action}</dd>
                    </div>
                    <div>
                      <dt>{t('audit.actorValue')}</dt>
                      <dd>{selectedLog.actorDisplayName ?? selectedLog.actorUsername ?? t('audit.system')}</dd>
                    </div>
                    <div>
                      <dt>{t('audit.timeLabel')}</dt>
                      <dd>{new Date(selectedLog.timestamp).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>{t('audit.entityLabel')}</dt>
                      <dd>{selectedLog.entityType} ({selectedLog.entityId ?? '-'})</dd>
                    </div>
                  </dl>

                  {demoMode ? (
                    <section className="audit-closeout">
                      <span className="sidebar__eyebrow">{t('audit.resultEyebrow')}</span>
                      <strong>{eventLabelMap[selectedLog.action] ?? selectedLog.action}</strong>
                      <p className="muted">
                        {selectedLog.relatedDocumentId
                          ? t('audit.resultTraceDetail')
                          : t('audit.resultDescription')}
                      </p>
                      <div className="audit-closeout__actions">
                        {followUpLinks.map((link) => (
                          <Link key={`${link.to}-${link.label}`} className="button button--secondary" to={link.to}>
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <Timeline items={timelineItems} />
                  <div className="audit-meta-viewer">
                    <div className="muted audit-meta-heading">{t('audit.structuredMetadata')}</div>
                    <pre>{formattedMetadata}</pre>
                  </div>
                </div>
              ) : (
                <EmptyState 
                  title={t('audit.noSelectionTitle')} 
                  description={t('audit.noSelectionDescription')} 
                />
              )}
            </div>
          </aside>
        </div>

        <div className="actions">
          <button className="button button--secondary" disabled={filters.page <= 1} type="button" onClick={() => updateFilters({ page: filters.page - 1 })}>
          {t('audit.previous')}
        </button>
        <span className="muted">{t('audit.pageOf', { page: filters.page, total: totalPages })}</span>
        <button className="button button--secondary" disabled={filters.page >= totalPages} type="button" onClick={() => updateFilters({ page: filters.page + 1 })}>
          {t('audit.next')}
        </button>
        </div>
      </section>
    </div>
  );
}

function mapAuditStatus(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes('reject') || normalized.includes('delete')) {
    return 'Rejected';
  }

  if (normalized.includes('approve') || normalized.includes('complete') || normalized.includes('sign')) {
    return 'Approved';
  }

  return 'Pending';
}
