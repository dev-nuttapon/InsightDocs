import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { getProtectedMessage } from '../../auth/api/authApi';
import { useAuth } from '../../auth/context/useAuth';

export function DashboardPage() {
  const { accessToken, user } = useAuth();
  const [protectedMessage, setProtectedMessage] = useState<string>('Loading protected API status...');
  const roles = user?.roles ?? [];
  const isAdmin = roles.some((role) => ['Admin', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role));
  const canManageDocuments = roles.some((role) => ['Admin', 'DocumentController', 'Manager', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role));

  const quickActions = [
    {
      to: '/documents',
      label: canManageDocuments ? 'Open Document Registry' : 'Browse Documents',
      description: canManageDocuments
        ? 'Create records, inspect current versions, and continue controlled document work.'
        : 'Open the registry and review currently controlled documents.',
    },
    ...(isAdmin
      ? [
          {
            to: '/users',
            label: 'Review Users & Roles',
            description: 'Open application-level profiles and role mappings stored in PostgreSQL.',
          },
          {
            to: '/admin/password-reset-requests',
            label: 'Process Password Resets',
            description: 'Approve or reject pending password reset requests from the admin queue.',
          },
        ]
      : []),
  ];

  useEffect(() => {
    let ignore = false;

    async function loadProtectedMessage() {
      if (!accessToken) {
        setProtectedMessage('No access token available.');
        return;
      }

      try {
        const response = await getProtectedMessage(accessToken);

        if (!ignore) {
          setProtectedMessage(response.message);
        }
      } catch (error) {
        if (!ignore) {
          setProtectedMessage(error instanceof Error ? error.message : 'Unable to reach protected endpoint.');
        }
      }
    }

    void loadProtectedMessage();

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  return (
    <section className="panel stack">
      <div className="dashboard-hero">
        <div>
          <span className="sidebar__eyebrow">Workspace Home</span>
          <h2>Welcome back{user?.username ? `, ${user.username}` : ''}</h2>
          <p className="muted dashboard-hero__lead">
            This is the first workspace page after successful sign-in. Use it to confirm your session, check access scope, and jump directly into the next document-control task.
          </p>
        </div>
        <div className="dashboard-badges">
          <span className="status-pill">Session active</span>
          <span className="status-pill status-pill--subtle">{roles.length > 0 ? `${roles.length} mapped roles` : 'No mapped roles'}</span>
        </div>
      </div>

      <div className="hero-grid">
        {quickActions.map((action) => (
          <article key={action.to} className="card card--interactive">
            <span className="card__label">Quick Action</span>
            <h3>{action.label}</h3>
            <p className="muted">{action.description}</p>
            <div className="actions">
              <Link className="button" to={action.to}>Open</Link>
            </div>
          </article>
        ))}
      </div>

      <div className="hero-grid">
        <article className="card">
          <span className="card__label">Current Session</span>
          <div className="stack">
            <div>Subject: {user?.subject ?? 'Unavailable'}</div>
            <div>Username: {user?.username ?? 'Unavailable'}</div>
            <div>Email: {user?.email ?? 'Unavailable'}</div>
            <div>Roles: {user && user.roles.length > 0 ? user.roles.join(', ') : 'No mapped roles'}</div>
          </div>
        </article>

        <article className="card">
          <span className="card__label">Protected API Check</span>
          <div className="stack">
            <div>{protectedMessage}</div>
            <div>JWT bearer validation via Keycloak realm metadata</div>
            <div>Role claims resolved from Keycloak token content</div>
          </div>
        </article>
      </div>

      <article className="card">
        <span className="card__label">Suggested Next Step</span>
        <p className="muted">
          {canManageDocuments
            ? 'Start from the document registry to create or inspect controlled documents.'
            : 'Open the document registry to review the latest controlled documents available to your role.'}
        </p>
      </article>
    </section>
  );
}
