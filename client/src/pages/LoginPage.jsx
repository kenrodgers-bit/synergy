import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SynergyMark from "../components/SynergyMark";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: "superadmin@synergy.co.ke",
    password: "Synergy123!"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/app", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <SynergyMark />
        <div>
          <p className="eyebrow">Internal Access</p>
          <h1>Sign in to the Synergy dashboard</h1>
          <p>Use one of the seeded staff accounts after you run the backend seed command.</p>
        </div>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
          <ArrowRight size={18} />
        </button>

        {error ? <p className="form-message error">{error}</p> : null}

        <div className="demo-credentials">
          <strong>Seeded demo logins</strong>
          <span>superadmin@synergy.co.ke</span>
          <span>admin@synergy.co.ke</span>
          <span>agent@synergy.co.ke</span>
          <span>Password: Synergy123!</span>
        </div>
      </form>
    </div>
  );
}

