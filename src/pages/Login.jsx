import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api("/api/me").then(({ data }) => {
      if (data.authenticated) navigate(data.user.role === "ADMIN" ? "/panel" : "/dashboard", { replace: true });
    });
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.password) {
      setError("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }
    setLoading(true);
    const { ok, data } = await api("/api/login", { body: form });
    setLoading(false);
    if (!ok || !data.success) {
      setError(data.message || "ورود انجام نشد.");
      return;
    }
    navigate(data.user.role === "ADMIN" ? "/panel" : "/dashboard", { replace: true });
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <span className="section-label">سامانه سازمانی</span>
        <h1>ورود به سامانه</h1>
        <p>برای دسترسی به پنل اختصاصی خود وارد شوید.</p>
        <form onSubmit={submit}>
          <label>
            نام کاربری
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" />
          </label>
          <label>
            رمز عبور
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary login-button" disabled={loading}>{loading ? "در حال بررسی..." : "ورود"}</button>
        </form>
      </div>
    </main>
  );
}
