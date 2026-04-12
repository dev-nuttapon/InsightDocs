import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { DemoScenarioPanel } from '../../../shared/components/mock/DemoScenarioPanel';
import { DemoDocumentSpotlight } from '../../../shared/components/mock/DemoDocumentSpotlight';
import { useTranslation } from '../../../i18n/useTranslation';
import { buildAccessProfile } from '../../../shared/auth/authorization';
import {
  resetDemoScenario,
  getDemoDashboardSummary,
  getDemoRecentDashboardActivities,
  getDemoRecentDashboardDocuments,
  getDemoScenarioState,
} from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';
import { useAuth } from '../../auth/context/useAuth';
import {
  getDashboardSummary,
  getRecentDashboardActivities,
  getRecentDashboardDocuments,
} from '../api/dashboardApi';
import type {
  DashboardSummary,
  RecentDashboardActivity,
  RecentDashboardDocument,
} from '../types';

export function DashboardPage() {
  const { accessToken, user } = useAuth();
  const { language, t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<RecentDashboardDocument[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentDashboardActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles ?? [];
  const access = buildAccessProfile(roles);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      if (demoMode) {
        if (!ignore) {
          setSummary(getDemoDashboardSummary());
          setRecentDocuments(getDemoRecentDashboardDocuments(language));
          setRecentActivities(getDemoRecentDashboardActivities());
          setError(null);
        }
        return;
      }

      if (!accessToken) {
        return;
      }

      try {
        const [summaryPayload, documentsPayload, activitiesPayload] = await Promise.all([
          getDashboardSummary(accessToken),
          getRecentDashboardDocuments(accessToken),
          getRecentDashboardActivities(accessToken),
        ]);

        if (!ignore) {
          setSummary(summaryPayload);
          setRecentDocuments(documentsPayload);
          setRecentActivities(activitiesPayload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [accessToken, demoMode, language]);

  const quickActions = useMemo(() => {
    const actions = [];

    if (access.canManageDocuments) {
      actions.push({
        to: '/documents',
        label: t('dashboard.manageDocuments'),
        description: t('dashboard.manageDocumentsDescription'),
      });
    } else {
      actions.push({
        to: '/documents',
        label: t('dashboard.openDocuments'),
        description: t('dashboard.openDocumentsDescription'),
      });
    }

    actions.push({
      to: '/search',
      label: t('dashboard.searchDocuments'),
      description: t('dashboard.searchDocumentsDescription'),
    });

    if (access.canReviewDocuments) {
      actions.push({
        to: '/approvals',
        label: t('dashboard.reviewApprovals'),
        description: t('dashboard.reviewApprovalsDescription'),
      });
    }

    if (access.canSignDocuments) {
      actions.push({
        to: '/signatures',
        label: t('dashboard.reviewSignatures'),
        description: t('dashboard.reviewSignaturesDescription'),
      });
    }

    if (access.isAdmin) {
      actions.push(
        {
          to: '/users',
          label: t('dashboard.manageUsers'),
          description: t('dashboard.manageUsersDescription'),
        },
        {
          to: '/audit-logs',
          label: t('dashboard.reviewAudit'),
          description: t('dashboard.reviewAuditDescription'),
        },
      );
    }

    return actions.slice(0, 4);
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments, access.isAdmin, t]);

  const summaryCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    const cards = [];

    if (access.canReviewDocuments) {
      cards.push({ label: t('dashboard.pendingApprovalsCard'), value: summary.pendingApprovals });
    }

    if (access.canSignDocuments) {
      cards.push({ label: t('dashboard.pendingSignaturesCard'), value: summary.pendingSignatures });
    }

    cards.push({ label: t('dashboard.totalDocuments'), value: summary.totalDocuments });
    cards.push({ label: t('dashboard.approvedDocuments'), value: summary.approvedDocuments });

    if (access.canManageDocuments || access.isAdmin) {
      cards.push({ label: t('dashboard.archivedDocuments'), value: summary.archivedDocuments });
    }

    return cards.slice(0, 4);
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments, access.isAdmin, summary, t]);

  const primaryHeading = useMemo(() => {
    if (access.canReviewDocuments) {
      return {
        title: t('dashboard.approvalsTitle'),
        description: t('dashboard.approvalsDescription'),
      };
    }

    if (access.canSignDocuments) {
      return {
        title: t('dashboard.signaturesTitle'),
        description: t('dashboard.signaturesDescription'),
      };
    }

    if (access.canManageDocuments) {
      return {
        title: t('dashboard.documentsTitle'),
        description: t('dashboard.documentsDescription'),
      };
    }

    return {
      title: t('dashboard.overviewTitle'),
      description: t('dashboard.overviewDescription'),
    };
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments, t]);

  const displayedRecentDocuments = useMemo(() => {
    return recentDocuments;
  }, [recentDocuments]);

  const displayedRecentActivities = useMemo(() => {
    return recentActivities;
  }, [recentActivities]);

  const scenarioState = getDemoScenarioState(undefined, language);

  function handleResetDemo() {
    resetDemoScenario();
    window.location.assign('/dashboard');
  }

  if (!summary && !error) {
    return <StatePanel eyebrow={t('dashboard.eyebrow')} title={t('common.loadingDashboardTitle')} description={t('common.loadingDashboardDescription')} busy />;
  }

  return (
    <section className="stack stack--xl">
      <PageHeader
        title={primaryHeading.title}
        eyebrow={t('dashboard.eyebrow')}
        description={primaryHeading.description}
      />

      <section className="dashboard-flagship">
        <div className="dashboard-flagship__hero">
          <div className="dashboard-flagship__copy">
            <span className="sidebar__eyebrow">{t('dashboard.flagshipEyebrow')}</span>
            <h2>{t('dashboard.flagshipTitle')}</h2>
            <p className="dashboard-hero__lead muted">
              {t('dashboard.flagshipDescription')}
            </p>
            <div className="dashboard-flagship__cta">
              <Link className="button" to="/documents/demo-contract-001">{t('dashboard.openPrimaryDemo')}</Link>
              <Link className="button button--secondary" to="/documents">{t('dashboard.openRegistry')}</Link>
              {demoMode ? (
                <button className="button button--secondary" type="button" onClick={handleResetDemo}>{t('dashboard.resetDemo')}</button>
              ) : null}
            </div>
          </div>

          <div className="dashboard-flagship__signal">
            <div className="dashboard-flagship__signal-card">
              <span className="dashboard-flagship__signal-label">{t('dashboard.focusLabel')}</span>
              <strong>{t('dashboard.focusTitle')}</strong>
              <span className="muted">{t('dashboard.focusDescription')}</span>
            </div>
            <div className="dashboard-flagship__signal-grid">
              {summaryCards.map((card) => (
                <StatCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </div>
        </div>

        <DemoScenarioPanel
          state={scenarioState}
          secondaryAction={{ label: t('dashboard.openRegistry'), to: '/documents' }}
        />
      </section>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <ModuleMockup
        eyebrow={t('dashboard.narrativeEyebrow')}
        title={t('dashboard.narrativeTitle')}
        description={t('dashboard.narrativeDescription')}
        highlights={t('dashboard.narrativeHighlights').split('|||')}
        steps={t('dashboard.narrativeSteps').split('|||')}
        metrics={[
          { label: t('language.label'), value: language.toUpperCase() },
          { label: t('dashboard.focusNow'), value: access.canReviewDocuments ? t('dashboard.focusApprovals') : access.canSignDocuments ? t('dashboard.focusSignatures') : t('dashboard.focusOperations') },
        ]}
      />

      {demoMode ? (
        <section className="dashboard-launch-grid">
          <DemoDocumentSpotlight
            documentId="demo-contract-001"
            eyebrow={t('dashboard.primaryStoryEyebrow')}
            title={t('dashboard.primaryStoryTitle')}
            description={t('dashboard.primaryStoryDescription')}
            primaryActionLabel={t('dashboard.startFromPrimary')}
          />
          <DemoDocumentSpotlight
            documentId="demo-policy-014"
            eyebrow={t('dashboard.managerStoryEyebrow')}
            title={t('dashboard.managerStoryTitle')}
            description={t('dashboard.managerStoryDescription')}
            primaryActionLabel={t('dashboard.startFromApproval')}
          />
        </section>
      ) : null}

      <div className="split-layout">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">{t('dashboard.quickActions')}</span>
            <h3>{t('dashboard.quickActions')}</h3>
          </div>
          <div className="action-list">
            {quickActions.map((action) => (
              <div key={action.to} className="action-row">
                <div className="action-row__copy">
                  <strong>{action.label}</strong>
                  <span className="muted">{action.description}</span>
                </div>
                <Link className="button" to={action.to}>{t('common.open')}</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">{t('dashboard.focusNow')}</span>
            <h3>{t('dashboard.focusNow')}</h3>
          </div>
          <div className="action-list">
            {access.canReviewDocuments ? (
              <div className="action-row">
                <div className="action-row__copy">
                  <strong>{t('dashboard.pendingApprovalsLabel')}</strong>
                  <span className="muted">{t('dashboard.pendingApprovalsDescription', { count: summary?.pendingApprovals ?? 0 })}</span>
                </div>
                <Link className="button button--secondary" to="/approvals">{t('common.open')}</Link>
              </div>
            ) : null}
            {access.canSignDocuments ? (
              <div className="action-row">
                <div className="action-row__copy">
                  <strong>{t('dashboard.pendingSignaturesLabel')}</strong>
                  <span className="muted">{t('dashboard.pendingSignaturesDescription', { count: summary?.pendingSignatures ?? 0 })}</span>
                </div>
                <Link className="button button--secondary" to="/signatures">{t('common.open')}</Link>
              </div>
            ) : null}
            <div className="action-row">
              <div className="action-row__copy">
                <strong>{t('dashboard.searchDocuments')}</strong>
                <span className="muted">{t('dashboard.searchDocumentsDescription')}</span>
              </div>
              <Link className="button button--secondary" to="/search">{t('common.open')}</Link>
            </div>
            {access.isAdmin ? (
              <div className="action-row">
                <div className="action-row__copy">
                  <strong>{t('dashboard.manageUsers')}</strong>
                  <span className="muted">{t('dashboard.manageUsersDescription')}</span>
                </div>
                <Link className="button button--secondary" to="/users">{t('common.open')}</Link>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="split-layout split-layout--wide">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">{t('dashboard.recentDocuments')}</span>
            <h3>{t('dashboard.recentDocuments')}</h3>
          </div>
          <div className="table-wrap">
            <table className="table table--premium">
              <thead>
                <tr>
                  <th>{t('shell.documents')}</th>
                  <th>{t('documents.statusLabel')}</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecentDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <Link to={`/documents/${document.id}`} style={{ fontWeight: 700 }}>{document.title}</Link>
                      <div className="muted" style={{ fontSize: '11px' }}>{document.category ?? '-'}</div>
                    </td>
                    <td>
                      <StatusBadge status={document.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>v{document.currentVersionNumber || '1'}</div>
                      <div className="muted" style={{ fontSize: '11px' }}>{new Date(document.lastActivityAt).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
                {displayedRecentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState 
                        title={t('dashboard.noDocuments')} 
                        description={t('dashboard.noDocumentsDescription')} 
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">{t('dashboard.recentActivities')}</span>
            <h3>{t('dashboard.recentActivities')}</h3>
          </div>
          {displayedRecentActivities.length === 0 ? (
            <EmptyState 
              title={t('dashboard.noActivity')} 
              description={t('dashboard.noActivityDescription')} 
            />
          ) : (
            <div className="timeline" style={{ padding: '8px' }}>
              {displayedRecentActivities.map((activity) => (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-item__dot" />
                  <div className="timeline-item__content">
                    <div className="timeline-item__time">{new Date(activity.timestamp).toLocaleTimeString()}</div>
                    <div className="timeline-item__label">{activity.action}</div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {activity.relatedDocumentId ? (
                        <Link to={`/documents/${activity.relatedDocumentId}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          {activity.relatedDocumentTitle ?? t('demo.openDocument')}
                        </Link>
                      ) : (
                        activity.entityType
                      )}
                      {" • "}
                      {activity.actorDisplayName ?? activity.actorUsername ?? t('common.currentUser')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
