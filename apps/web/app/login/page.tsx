import { loginAction } from "../actions";

export default function LoginPage() {
  return (
    <div className="page-stack">
      <section className="panel auth-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Session</p>
            <h2>Sign in</h2>
          </div>
        </div>
        <form action={loginAction} className="record-form login-form">
          <label>
            Tenant
            <input name="tenantSlug" autoComplete="organization" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit">Sign in</button>
        </form>
      </section>
    </div>
  );
}
