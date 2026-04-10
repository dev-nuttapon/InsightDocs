import { useState } from 'react';
import { Link } from 'react-router-dom';

import { registerUser, type RegisterUserInput } from '../api/authApi';

const initialState: RegisterUserInput = {
  username: '',
  email: '',
  displayName: '',
  password: '',
};

export function RegisterPage() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">Registration</span>
        <h2>Request an account</h2>
        <p className="muted">Your request creates a Keycloak user and an application profile with status Pending. The account uses your email as the username for sign in, and an Admin must approve it before access is enabled.</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <form
        className="form-grid"
        onSubmit={async (event) => {
          event.preventDefault();
          setIsSubmitting(true);
          try {
            await registerUser(form);
            setNotice('Registration submitted. Wait for Admin approval before signing in.');
            setError(null);
            setForm(initialState);
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Registration failed.');
            setNotice(null);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <label className="stack" htmlFor="register-email">
          <span>Username = Email</span>
          <input
            id="register-email"
            className="input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => {
              const email = event.target.value;
              setForm((current) => ({ ...current, email, username: email }));
            }}
          />
        </label>
        <input className="input" placeholder="Username" value={form.username} disabled readOnly />
        <input className="input" placeholder="Display Name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
        <button className="button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Submitting...' : 'Submit Registration'}</button>
      </form>

      <div className="actions">
        <Link className="button button--secondary" to="/login">Back to sign in</Link>
      </div>
    </section>
  );
}
