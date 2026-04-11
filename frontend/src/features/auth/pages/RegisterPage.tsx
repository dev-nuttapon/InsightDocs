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
    <div className="auth-view">
      <div className="auth-card stack">
        <div className="auth-header">
          <div className="auth-brand">ID</div>
          <h2 className="auth-title">Create Account</h2>
          <p className="muted">Submit your information for Admin approval to join the InsightDocs workspace.</p>
        </div>

        {error ? <div className="callout callout--danger">{error}</div> : null}
        {notice ? <div className="callout">{notice}</div> : null}

        <form
          className="stack"
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
          <div className="stack">
            <span className="card__label">Sign-in Email</span>
            <input
              id="register-email"
              className="input input--large"
              placeholder="name@organization.com"
              type="email"
              value={form.email}
              onChange={(event) => {
                const email = event.target.value;
                setForm((current) => ({ ...current, email, username: email }));
              }}
              required
            />
          </div>

          <div className="stack">
            <span className="card__label">Display Name</span>
            <input 
              className="input input--large" 
              placeholder="Your full name" 
              value={form.displayName} 
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} 
              required
            />
          </div>

          <div className="stack">
            <span className="card__label">Proposed Password</span>
            <input 
              className="input input--large" 
              placeholder="••••••••" 
              type="password" 
              value={form.password} 
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} 
              required
            />
          </div>

          <button className="button button--large" disabled={isSubmitting} type="submit" style={{ marginTop: '12px' }}>
            {isSubmitting ? 'Submitting Registration...' : 'Request Access'}
          </button>
        </form>

        <div className="actions" style={{ justifyContent: 'center', marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
          <Link className="button button--secondary" to="/login">Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
}
