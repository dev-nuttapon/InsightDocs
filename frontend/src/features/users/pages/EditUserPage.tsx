import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { getUser, updateUser } from '../api/usersApi';
import { AVAILABLE_PROJECT_ROLES, formatBusinessRole, formatBusinessRoleDescription, type AppUser, type UpdateUserInput } from '../types';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useTranslation } from '../../../i18n/useTranslation';

type EditUserFormState = UpdateUserInput & {
  confirmPassword: string;
};

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<EditUserFormState>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    roles: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!id || !accessToken) {
        return;
      }

      try {
        const payload = await getUser(id, accessToken);
        if (!ignore) {
          setUser(payload);
          setForm({
            username: payload.email,
            email: payload.email,
            firstName: payload.firstName ?? '',
            lastName: payload.lastName ?? '',
            password: '',
            confirmPassword: '',
            roles: payload.roles,
          });
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : t('users.loadOneError'));
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, id, t]);

  const resolvedName = useMemo(() => (user ? formatUserName(user) : t('users.title')), [user, t]);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id || !accessToken) {
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      setError(t('users.passwordMismatch'));
      return;
    }

    if (form.roles.length === 0) {
      setError(t('users.roleRequired'));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const payload = {
        username: form.email.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password?.trim() ? form.password : undefined,
        roles: form.roles,
      };
      await updateUser(id, payload, accessToken);
      navigate('/users', {
        replace: true,
        state: {
          notice: t('users.editSuccess'),
        },
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('users.updateError'));
    } finally {
      setIsSaving(false);
    }
  }

  if (!user || !accessToken || !id) {
    return (
      <section className="panel">
        <p className="muted">{error ?? t('users.loadingOne')}</p>
        <ErrorModal message={error} onClose={() => setError(null)} />
      </section>
    );
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('users.editTitle', { name: resolvedName })}
        eyebrow={t('users.eyebrow')}
        description={t('users.editDescription')}
        actions={<Link className="button button--secondary" to="/users">{t('users.backToUsers')}</Link>}
      />

      <section className="panel stack">
        <div className="stack user-form-panel">
          <form className="stack stack--xl" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="stack" htmlFor="edit-user-email">
                <span className="card__label">{t('users.signInEmail')}</span>
                <input
                  id="edit-user-email"
                  className="input"
                  placeholder={t('users.emailPlaceholder')}
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    const email = event.target.value;
                    setForm((current) => ({ ...current, email, username: email }));
                  }}
                />
              </label>

              <div className="grid-2">
                <label className="stack" htmlFor="edit-user-first-name">
                  <span className="card__label">{t('users.firstName')}</span>
                  <input
                    id="edit-user-first-name"
                    className="input"
                    placeholder={t('users.firstNamePlaceholder')}
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  />
                </label>
                <label className="stack" htmlFor="edit-user-last-name">
                  <span className="card__label">{t('users.lastName')}</span>
                  <input
                    id="edit-user-last-name"
                    className="input"
                    placeholder={t('users.lastNamePlaceholder')}
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  />
                </label>
              </div>

              <div className="grid-2">
                <label className="stack" htmlFor="edit-user-password">
                  <span className="card__label">{t('users.newPassword')}</span>
                  <input
                    id="edit-user-password"
                    className="input"
                    placeholder={t('users.leaveBlank')}
                    type="password"
                    value={form.password ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>
                <label className="stack" htmlFor="edit-user-confirm-password">
                  <span className="card__label">{t('users.confirmNewPassword')}</span>
                  <input
                    id="edit-user-confirm-password"
                    className="input"
                    placeholder={t('users.confirmNewPassword')}
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  />
                </label>
              </div>
            </div>

            <fieldset className="stack role-group">
              <span className="card__label users-form__section-label">{t('users.rolePermissions')}</span>
              <div className="table-wrap role-table-wrap">
                <table className="table role-table table--premium">
                  <thead>
                    <tr>
                      <th className="users-form__checkbox-col">{t('users.selectColumn')}</th>
                      <th>{t('users.roleColumn')}</th>
                      <th>{t('users.capabilityColumn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AVAILABLE_PROJECT_ROLES.map((role) => (
                      <tr key={role} onClick={() => {
                        const isChecked = form.roles.includes(role);
                        setForm((current) => ({
                          ...current,
                          roles: !isChecked
                            ? [...current.roles, role]
                            : current.roles.filter((value) => value !== role),
                        }));
                      }} className="table__row--interactive">
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={form.roles.includes(role)}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                roles: event.target.checked
                                  ? [...current.roles, role]
                                  : current.roles.filter((value) => value !== role),
                              }))
                            }
                          />
                        </td>
                        <td className="users-form__role-name">{formatBusinessRole(role, language)}</td>
                        <td className="muted users-form__role-description">{formatBusinessRoleDescription(role, language)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </fieldset>

            <div className="actions users-form__actions">
              <button className="button users-form__submit" disabled={isSaving} type="submit">
                {isSaving ? t('users.savingEdit') : t('users.saveEdit')}
              </button>
              <Link className="button button--secondary" to="/users">{t('users.cancel')}</Link>
            </div>
          </form>
        </div>

        <ErrorModal message={error} onClose={() => setError(null)} />
      </section>
    </div>
  );
}

function formatUserName(user: AppUser) {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  return fullName || user.displayName || user.username;
}
