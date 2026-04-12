import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { createUser } from '../api/usersApi';
import { AVAILABLE_PROJECT_ROLES, formatBusinessRole, formatBusinessRoleDescription, type CreateUserInput } from '../types';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { FeatureHeroPanel } from '../../../shared/components/mock/FeatureHeroPanel';
import { useTranslation } from '../../../i18n/useTranslation';

type CreateUserFormState = CreateUserInput & {
  confirmPassword: string;
};

const initialForm: CreateUserFormState = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  roles: [],
};

export function CreateUserPage() {
  const { accessToken } = useAuth();
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateUserFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedRolesCount = form.roles.length;

  function toggleRole(role: string) {
    setForm((current) => {
      const isChecked = current.roles.includes(role);

      return {
        ...current,
        roles: isChecked
          ? current.roles.filter((value) => value !== role)
          : [...current.roles, role],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t('users.passwordMismatch'));
      return;
    }

    if (form.roles.length === 0) {
      setError(t('users.roleRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        username: form.email.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        roles: form.roles,
      };
      const created = await createUser(payload, accessToken);
      navigate('/users', {
        replace: true,
        state: {
          notice: t('users.createdNotice', { name: created.displayName || created.username }),
        },
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('users.createError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('users.createTitle')}
        eyebrow={t('users.eyebrow')}
        description={t('users.createDescription')}
        actions={<Link className="button button--secondary" to="/users">{t('users.backToUsers')}</Link>}
      />

      <ModuleMockup
        eyebrow={t('users.inviteMockupEyebrow')}
        title={t('users.inviteMockupTitle')}
        description={t('users.inviteMockupDescription')}
        highlights={t('users.inviteMockupHighlights').split('|||')}
        steps={t('users.inviteMockupSteps').split('|||')}
        metrics={[
          { label: t('users.selectedRoles'), value: t('users.selectedRoleCount', { count: selectedRolesCount }) },
          { label: t('users.accountDestination'), value: t('users.destinationValue') },
        ]}
      />

      <FeatureHeroPanel
        eyebrow={t('users.provisionedAccess')}
        title={t('users.createWorkspaceTitle')}
        description={t('users.createWorkspaceDescription')}
        actions={[
          { label: t('users.backToUsers'), to: '/users', tone: 'secondary' },
        ]}
        stats={[
          {
            label: t('users.selectedRoles'),
            value: t('users.selectedRoleCount', { count: selectedRolesCount }),
            detail: t('users.createWorkspaceRolesDetail'),
          },
          {
            label: t('users.accountDestination'),
            value: t('users.destinationValue'),
            detail: t('users.createWorkspaceProvisionDetail'),
          },
          {
            label: t('users.passwordPolicyLabel'),
            value: t('users.passwordMin'),
            detail: t('users.createWorkspacePasswordDetail'),
          },
        ]}
      />

      <section className="panel panel--full stack">
        <div className="workspace-layout workspace-layout--form">
          <div className="workspace-layout__main stack stack--xl">
            <div className="grid-2 create-user-intro-grid">
              <div className="callout create-user-callout">
                <strong>{t('users.whatHappensTitle')}</strong>
                <div className="muted">{t('users.whatHappensDescription')}</div>
              </div>
              <div className="callout create-user-callout">
                <strong>{t('users.prepareTitle')}</strong>
                <div className="muted">{t('users.prepareDescription')}</div>
              </div>
            </div>

            <div className="user-form-panel stack stack--xl">
              <form className="stack stack--xl" onSubmit={handleSubmit}>
                <section className="stack stack--lg">
                  <div className="section-heading">
                    <span className="sidebar__eyebrow">{t('users.identityEyebrow')}</span>
                    <h3>{t('users.identityTitle')}</h3>
                  </div>

                  <div className="form-grid">
                    <label className="stack" htmlFor="create-user-email">
                      <span className="card__label">{t('users.signInEmail')}</span>
                      <input
                        id="create-user-email"
                        className="input"
                        placeholder={t('users.emailPlaceholder')}
                        type="email"
                        value={form.email}
                        onChange={(event) => {
                          const email = event.target.value;
                          setForm((current) => ({ ...current, email, username: email }));
                        }}
                        required
                      />
                    </label>

                    <div className="grid-2">
                      <label className="stack" htmlFor="create-user-first-name">
                        <span className="card__label">{t('users.firstName')}</span>
                        <input
                          id="create-user-first-name"
                          className="input"
                          placeholder={t('users.firstNamePlaceholder')}
                          value={form.firstName}
                          onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                          required
                        />
                      </label>
                      <label className="stack" htmlFor="create-user-last-name">
                        <span className="card__label">{t('users.lastName')}</span>
                        <input
                          id="create-user-last-name"
                          className="input"
                          placeholder={t('users.lastNamePlaceholder')}
                          value={form.lastName}
                          onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                          required
                        />
                      </label>
                    </div>

                    <div className="grid-2">
                      <label className="stack" htmlFor="create-user-password">
                        <span className="card__label">{t('users.initialPassword')}</span>
                        <input
                          id="create-user-password"
                          className="input"
                          placeholder={t('users.passwordMin')}
                          type="password"
                          value={form.password}
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                          required
                        />
                      </label>
                      <label className="stack" htmlFor="create-user-confirm-password">
                        <span className="card__label">{t('users.initialPasswordConfirm')}</span>
                        <input
                          id="create-user-confirm-password"
                          className="input"
                          placeholder={t('users.passwordConfirmPlaceholder')}
                          type="password"
                          value={form.confirmPassword}
                          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                          required
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <fieldset className="stack role-group">
                  <div className="section-heading">
                    <span className="sidebar__eyebrow">{t('users.accessEyebrow')}</span>
                    <h3>{t('users.accessTitle')}</h3>
                  </div>
                  <p className="muted">{t('users.selectAtLeastOne')}</p>
                  <div className="registry-toolbar">
                    <span className="muted">{t('users.selectedRoleCount', { count: selectedRolesCount })}</span>
                    {selectedRolesCount > 0 ? (
                      <div className="tag-list">
                        {form.roles.map((role) => (
                          <span key={role} className="tag">
                            {formatBusinessRole(role, language)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="selection-grid">
                    {AVAILABLE_PROJECT_ROLES.map((role) => {
                      const isSelected = form.roles.includes(role);

                      return (
                        <button
                          key={role}
                          className={`selection-card${isSelected ? ' selection-card--selected' : ''}`}
                          type="button"
                          onClick={() => toggleRole(role)}
                        >
                          <span className="selection-card__check" aria-hidden="true">
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className="selection-card__title">{formatBusinessRole(role, language)}</span>
                          <span className="selection-card__description">{formatBusinessRoleDescription(role, language)}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="actions create-user-actions">
                  <button className="button create-user-submit" disabled={isSubmitting} type="submit">
                    {isSubmitting ? t('users.creating') : t('users.createSubmit')}
                  </button>
                  <Link className="button button--secondary" to="/users">{t('users.cancel')}</Link>
                </div>
              </form>
            </div>
          </div>

          <aside className="workspace-layout__side workspace-rail">
            <section className="workspace-rail__panel">
              <span className="sidebar__eyebrow">{t('users.reviewTitle')}</span>
              <h3>{t('users.reviewTitle')}</h3>
              <p className="muted">
                {t('users.reviewDescription', {
                  email: form.email || '-',
                  name: [form.firstName, form.lastName].filter(Boolean).join(' ') || '-',
                  roles: selectedRolesCount > 0 ? t('users.selectedRoleCount', { count: selectedRolesCount }) : t('users.noneSelected'),
                })}
              </p>
            </section>

            <section className="workspace-rail__panel">
              <span className="card__label">{t('users.selectedRoles')}</span>
              {selectedRolesCount > 0 ? (
                <div className="tag-list">
                  {form.roles.map((role) => (
                    <span key={`rail-${role}`} className="tag">
                      {formatBusinessRole(role, language)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">{t('users.noneSelected')}</p>
              )}
            </section>

            <section className="workspace-rail__panel">
              <span className="card__label">{t('users.accountDestination')}</span>
              <strong>{t('users.destinationValue')}</strong>
              <p className="muted">{t('users.createWorkspaceProvisionDetail')}</p>
            </section>
          </aside>
        </div>

        <ErrorModal message={error} onClose={() => setError(null)} />
      </section>
    </div>
  );
}
