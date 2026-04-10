import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { buildAccessProfile, formatRoleLabel } from '../../../shared/auth/authorization';
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
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<RecentDashboardDocument[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentDashboardActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles ?? [];
  const access = buildAccessProfile(roles);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
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
  }, [accessToken]);

  const quickActions = useMemo(() => {
    const actions = [
      {
        to: '/documents',
        label: access.canManageDocuments ? 'Upload or manage documents' : 'Open document registry',
        description: access.canManageDocuments
          ? 'Continue controlled upload, metadata maintenance, versioning, and archive work.'
          : 'Review current controlled documents and their latest statuses.',
      },
      {
        to: '/search',
        label: 'Search documents',
        description: 'Run metadata and full-text search with enterprise filters.',
      },
    ];

    if (access.canReviewDocuments) {
      actions.push({
        to: '/approvals',
        label: 'Open approvals queue',
        description: 'Review pending submissions and complete approval decisions quickly.',
      });
    }

    if (access.canSignDocuments) {
      actions.push({
        to: '/signatures',
        label: 'Open signatures queue',
        description: 'Inspect pending signer work and complete sequential signing steps.',
      });
    }

    if (access.isAdmin) {
      actions.push(
        {
          to: '/users',
          label: 'Review users and roles',
          description: 'Manage business roles and application profiles from the admin workspace.',
        },
        {
          to: '/audit-logs',
          label: 'Review audit logs',
          description: 'Inspect append-only operational and compliance events across the system.',
        },
      );
    }

    return actions;
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments, access.isAdmin]);

  const summaryCards = [
    { label: 'Total Documents', value: summary?.totalDocuments ?? 0 },
    { label: 'Pending Approvals', value: summary?.pendingApprovals ?? 0 },
    { label: 'Pending Signatures', value: summary?.pendingSignatures ?? 0 },
    { label: 'Approved Documents', value: summary?.approvedDocuments ?? 0 },
    { label: 'Archived Documents', value: summary?.archivedDocuments ?? 0 },
  ];

  if (!summary && !error) {
    return <StatePanel eyebrow="Dashboard" title="Loading dashboard" description="Collecting current metrics, recent documents, and operational activity." busy />;
  }

  return (
    <section className="stack stack--xl">
      <div className="panel panel--hero stack">
        <div className="dashboard-hero">
          <div>
            <span className="sidebar__eyebrow">Operational Dashboard</span>
            <h2>Enterprise document operations</h2>
            <p className="muted dashboard-hero__lead">
              Monitor controlled document activity, route yourself to the next queue, and present the current operational state without hunting across modules.
            </p>
          </div>
          <div className="dashboard-badges">
            <span className="status-pill">Active workspace</span>
            <span className="status-pill status-pill--subtle">{user?.username ?? 'Authenticated user'}</span>
          </div>
        </div>

        {error ? <div className="callout callout--danger">{error}</div> : null}

        <div className="dashboard-summary-grid dashboard-summary-grid--hero">
          {summaryCards.map((card) => (
            <article key={card.label} className="metric-panel">
              <span className="card__label">{card.label}</span>
              <strong className="metric-value">{card.value}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="split-layout">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Quick Actions</span>
            <h3>Continue the next operational step</h3>
          </div>
          <div className="action-list">
            {quickActions.map((action) => (
              <div key={action.to} className="action-row">
                <div className="action-row__copy">
                  <strong>{action.label}</strong>
                  <span className="muted">{action.description}</span>
                </div>
                <Link className="button" to={action.to}>Open</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Current Session</span>
            <h3>Identity and access snapshot</h3>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Username</dt>
              <dd>{user?.username ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{access.normalizedRoles.length > 0 ? access.normalizedRoles.map(formatRoleLabel).join(', ') : 'No mapped roles'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="split-layout split-layout--wide">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Recent Documents</span>
            <h3>Latest governed content</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Owner</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <Link to={`/documents/${document.id}`}>{document.title}</Link>
                      <div className="muted">{document.category ?? 'Uncategorized'}</div>
                    </td>
                    <td>{document.status}</td>
                    <td>{document.currentVersionNumber ? `v${document.currentVersionNumber}` : 'None'}</td>
                    <td>{document.ownerDisplayName ?? document.controllerDisplayName ?? 'Unassigned'}</td>
                    <td>{new Date(document.lastActivityAt).toLocaleString()}</td>
                  </tr>
                ))}
                {recentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">No recent documents available.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Recent Activities</span>
            <h3>Latest operational events</h3>
          </div>
          {recentActivities.length === 0 ? (
            <p className="muted">No recent activities available.</p>
          ) : (
            <div className="timeline-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="timeline-item">
                  <strong>{activity.action}</strong>
                  <div className="muted">
                    {activity.actorDisplayName ?? activity.actorUsername ?? 'System'} • {new Date(activity.timestamp).toLocaleString()}
                  </div>
                  <div className="muted">
                    {activity.relatedDocumentId ? (
                      <Link to={`/documents/${activity.relatedDocumentId}`}>
                        {activity.relatedDocumentTitle ?? 'Open related document'}
                      </Link>
                    ) : (
                      activity.entityType
                    )}
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
