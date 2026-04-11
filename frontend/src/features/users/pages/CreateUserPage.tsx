import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { createUser } from '../api/usersApi';
import { AVAILABLE_PROJECT_ROLES, formatBusinessRole, formatBusinessRoleDescription, type CreateUserInput } from '../types';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';

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
      setError('รหัสผ่านและยืนยันรหัสผ่านต้องตรงกัน');
      return;
    }

    if (form.roles.length === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 role');
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
          notice: `สร้างผู้ใช้งาน ${created.displayName || created.username} สำเร็จ และส่งข้อมูลไปยัง Keycloak แล้ว`,
        },
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="สร้างผู้ใช้งานใหม่"
        eyebrow="Users & Access"
        description="กำหนดข้อมูลบัญชี บทบาทเริ่มต้น และรหัสผ่านเริ่มต้นของผู้ใช้งานใหม่ จากนั้นระบบจะสร้างบัญชีเดียวกันใน InsightDocs และ Keycloak ให้อัตโนมัติ"
        actions={<Link className="button button--secondary" to="/users">กลับไปรายการผู้ใช้</Link>}
      />

      <ModuleMockup
        eyebrow="Invite Mockup"
        title="หน้าสร้างบัญชีผู้ใช้งานจากระบบ InsightDocs"
        description="ใช้หน้านี้ในการสร้างบัญชีใหม่ กำหนดบทบาทตั้งต้น และ provision บัญชีเดียวกันไปยัง Keycloak โดยไม่ต้องออกไปจัดการหลายระบบ"
        highlights={['Account Setup', 'Role Assignment', 'Initial Password', 'Keycloak Provisioning']}
        steps={[
          'กรอกข้อมูลบัญชีพื้นฐานและรหัสผ่านเริ่มต้น',
          'เลือกบทบาทเริ่มต้นให้ตรงกับหน้าที่ของผู้ใช้งาน',
          'บันทึกเพื่อสร้างบัญชีใน InsightDocs และ Keycloak พร้อมกัน',
        ]}
        metrics={[
          { label: 'บทบาทที่เลือก', value: `${selectedRolesCount} บทบาท` },
          { label: 'ปลายทางบัญชี', value: 'InsightDocs + Keycloak' },
        ]}
      />

      <section className="panel panel--full stack">
        <div className="grid-2 create-user-intro-grid">
          <div className="callout create-user-callout">
            <strong>สิ่งที่จะเกิดขึ้นหลังบันทึก</strong>
            <div className="muted">ระบบจะสร้างบัญชีผู้ใช้ใน InsightDocs และสร้างบัญชีเดียวกันใน Keycloak พร้อมบทบาทเริ่มต้นที่คุณกำหนดไว้</div>
          </div>
          <div className="callout create-user-callout">
            <strong>ข้อมูลที่ควรเตรียมก่อนสร้าง</strong>
            <div className="muted">ใช้อีเมลสำหรับเข้าสู่ระบบ ชื่อผู้ใช้จริง และกำหนดบทบาทให้สอดคล้องกับหน้าที่ของผู้ใช้งานในองค์กร</div>
          </div>
        </div>

        <div className="user-form-panel stack stack--xl">
          <form className="stack stack--xl" onSubmit={handleSubmit}>
            <section className="stack stack--lg">
              <div className="section-heading">
                <span className="sidebar__eyebrow">Identity</span>
                <h3>ข้อมูลบัญชีผู้ใช้</h3>
              </div>

              <div className="form-grid">
                <label className="stack" htmlFor="create-user-email">
                  <span className="card__label">อีเมลสำหรับเข้าสู่ระบบ</span>
                  <input
                    id="create-user-email"
                    className="input"
                    placeholder="name@organization.com"
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
                    <span className="card__label">ชื่อ</span>
                    <input
                      id="create-user-first-name"
                      className="input"
                      placeholder="ชื่อ"
                      value={form.firstName}
                      onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="stack" htmlFor="create-user-last-name">
                    <span className="card__label">นามสกุล</span>
                    <input
                      id="create-user-last-name"
                      className="input"
                      placeholder="นามสกุล"
                      value={form.lastName}
                      onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                      required
                    />
                  </label>
                </div>

                <div className="grid-2">
                  <label className="stack" htmlFor="create-user-password">
                    <span className="card__label">รหัสผ่านเริ่มต้น</span>
                    <input
                      id="create-user-password"
                      className="input"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="stack" htmlFor="create-user-confirm-password">
                    <span className="card__label">ยืนยันรหัสผ่านเริ่มต้น</span>
                    <input
                      id="create-user-confirm-password"
                      className="input"
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
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
                <span className="sidebar__eyebrow">Access</span>
                <h3>กำหนดบทบาทเริ่มต้น</h3>
              </div>
              <p className="muted">เลือกอย่างน้อย 1 บทบาทสำหรับกำหนดสิทธิ์การใช้งานเริ่มต้นในระบบ</p>
              <div className="registry-toolbar">
                <span className="muted">เลือกแล้ว {selectedRolesCount} บทบาท</span>
                {selectedRolesCount > 0 ? (
                  <div className="tag-list">
                    {form.roles.map((role) => (
                      <span key={role} className="tag">
                        {formatBusinessRole(role)}
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
                      <span className="selection-card__title">{formatBusinessRole(role)}</span>
                      <span className="selection-card__description">{formatBusinessRoleDescription(role)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <section className="callout create-user-review">
              <strong>สรุปก่อนบันทึก</strong>
              <div className="muted">
                บัญชีนี้จะถูกสร้างด้วยอีเมล <strong>{form.email || '-'}</strong> สำหรับผู้ใช้{' '}
                <strong>{[form.firstName, form.lastName].filter(Boolean).join(' ') || '-'}</strong> และเริ่มต้นด้วยบทบาท{' '}
                <strong>{selectedRolesCount > 0 ? `${selectedRolesCount} รายการ` : 'ยังไม่ได้เลือก'}</strong>
              </div>
            </section>

            <div className="actions create-user-actions">
              <button className="button create-user-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
              </button>
              <Link className="button button--secondary" to="/users">ยกเลิก</Link>
            </div>
          </form>
        </div>

        <ErrorModal message={error} onClose={() => setError(null)} />
      </section>
    </div>
  );
}
