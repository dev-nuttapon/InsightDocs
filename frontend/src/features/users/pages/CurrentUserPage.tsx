import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile } from '../../../shared/auth/authorization';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { StatCard } from '../../../shared/components/ui/StatCard';

export function CurrentUserPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const access = buildAccessProfile(roles);

  const initials = (user?.displayName ?? user?.username ?? user?.email ?? 'ID')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="My Profile"
        eyebrow="User Identity"
        description="Review your authenticated session, identity claims, and active permissions within the InsightDocs workspace."
      />

      <div className="profile-grid">
        <aside className="profile-card panel stack">
          <div className="profile-header">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-meta">
              <div className="profile-name">{user?.displayName ?? user?.username}</div>
              <div className="muted">{user?.email}</div>
            </div>
          </div>

          <div className="stack" style={{ marginTop: '24px' }}>
            <span className="card__label">Session Context</span>
            <div className="detail-list">
              <div>
                <dt>Subject ID</dt>
                <dd className="muted" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{user?.subject}</dd>
              </div>
              <div>
                <dt>Auth Method</dt>
                <dd>Keycloak OIDC</dd>
              </div>
            </div>
          </div>

          <div className="actions" style={{ flexDirection: 'column', gap: '8px' }}>
            <Link className="button button--secondary button--wide" to="/logout">Sign Out</Link>
          </div>
        </aside>

        <section className="profile-info stack">
          <div className="dashboard-summary-grid">
            <StatCard 
              label="Administrative" 
              value={access.isAdmin ? 'Full' : 'None'} 
              trend={access.isAdmin ? 'Active' : undefined}
              trendType={access.isAdmin ? 'up' : 'down'}
            />
            <StatCard 
              label="Signing Capacity" 
              value={access.canSignDocuments ? 'Enabled' : 'Restricted'} 
              trend={access.canSignDocuments ? 'Verified' : undefined}
              trendType={access.canSignDocuments ? 'up' : 'down'}
            />
          </div>

          <div className="panel stack">
            <h3 className="form-section__title">Assigned Roles & Capabilities</h3>
            <div className="tag-list" style={{ gap: '10px' }}>
              {roles.map(role => (
                <StatusBadge key={role} status={role.includes('admin') ? 'Approved' : 'Pending'} />
              ))}
              {roles.length === 0 && <span className="muted">No explicit roles assigned to this session.</span>}
            </div>

            <div className="grid-2" style={{ marginTop: '32px' }}>
              <article className="card stack">
                <span className="card__label">Documents</span>
                <h4>Workspace Registry</h4>
                <p className="muted">Access the governed document collection to manage versions and control workflows.</p>
                <Link className="button button--secondary" to="/documents">Open Documents</Link>
              </article>

              <article className="card stack">
                <span className="card__label">History</span>
                <h4>Activity Logs</h4>
                <p className="muted">Review system-wide compliance events and your individual contribution history.</p>
                <Link className="button button--secondary" to="/audit-logs">View Logs</Link>
              </article>
            </div>
          </div>

          {access.canReviewDocuments && (
            <div className="panel panel--hero stack">
              <div className="section-heading">
                <span className="sidebar__eyebrow">Operational Action</span>
                <h3>Approval Queue</h3>
              </div>
              <p className="muted">You have document controller or manager permissions. There may be pending approvals waiting for your decision.</p>
              <div className="actions">
                <Link className="button" to="/approvals">Go to Approvals</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
