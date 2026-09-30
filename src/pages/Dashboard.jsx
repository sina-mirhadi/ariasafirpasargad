import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { STATUS_LABELS, formatMoney, formatNumber } from "../format";
import "./Panel.css";
import "./Dashboard.css";

const PAYMENT_PERIODS = ["ماهانه", "سه‌ماهه", "شش‌ماهه", "سالانه"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({});
  const [insurance, setInsurance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const me = await api("/api/me");
    if (!me.data.authenticated) return navigate("/login", { replace: true });
    if (me.data.user.role !== "REPRESENTATIVE") return navigate("/panel", { replace: true });
    setUser(me.data.user);

    const [s, i, n] = await Promise.all([api("/api/dashboard/summary"), api("/api/insurance"), api("/api/notifications")]);
    if ([s, i, n].some((r) => r.status === 401)) return navigate("/login", { replace: true });
    if (![s, i, n].every((r) => r.ok)) setError("بخشی از اطلاعات دریافت نشد. صفحه را دوباره بارگذاری کنید.");
    setSummary(s.data || {});
    setInsurance(i.data.items || []);
    setNotifications(n.data.items || []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const r = await api("/api/insurance", { body });
    if (!r.ok) return setError(r.data.message || "ثبت بیمه‌نامه انجام نشد.");
    form.reset();
    load();
  }

  async function logout() {
    await api("/api/logout", { method: "POST" });
    navigate("/login");
  }

  if (loading) return <main className="panel-loading">در حال دریافت اطلاعات...</main>;

  return (
    <main className="dashboard-page">
      <div className="container rep-layout">
        <div className="rep-head">
          <div><span className="section-label">REPRESENTATIVE</span><h1>سلام، {user.name}</h1></div>
          <button className="small-btn" onClick={logout}>خروج</button>
        </div>

        <div className="rep-stats">
          {[
            ["بیمه‌نامه‌ها", formatNumber(summary.insurance)],
            ["تأییدشده", formatNumber(summary.approved)],
            ["در انتظار", formatNumber(summary.pending)],
            ["کمیسیون", formatMoney(summary.commission)],
            ["تسویه‌شده", formatMoney(summary.settled)],
            ["باقی‌مانده", formatMoney(summary.remaining)]
          ].map(([a, b]) => <div key={a}><span>{a}</span><strong>{b}</strong></div>)}
        </div>

        <div className="rep-grid">
          <section className="panel-box">
            <h2>ثبت بیمه‌نامه</h2>
            {error && <div className="form-error">{error}</div>}
            <form className="stack-form" onSubmit={submit}>
              <input name="insuredName" placeholder="نام بیمه‌شده" required maxLength={150} />
              <input name="insuranceType" placeholder="نوع بیمه" required maxLength={100} />
              <input name="duration" placeholder="مدت بیمه" required maxLength={100} />
              <input name="amount" type="number" min="1" step="1" placeholder="مبلغ پرداخت" required />
              <select name="paymentPeriod" required defaultValue="">
                <option value="" disabled>دوره پرداخت</option>
                {PAYMENT_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button className="btn btn-primary">ثبت بیمه‌نامه</button>
            </form>
          </section>
          <section className="panel-box">
            <h2>اطلاعیه‌ها</h2>
            {notifications.map((n) => <article className="notice" key={n.id}><strong>{n.title}</strong><p>{n.body}</p></article>)}
          </section>
        </div>

        <section className="panel-box">
          <h2>بیمه‌نامه‌های من</h2>
          <div className="table-box">
            <table>
              <thead><tr><th>شماره</th><th>بیمه‌شده</th><th>نوع</th><th>مبلغ</th><th>وضعیت</th><th>کمیسیون</th></tr></thead>
              <tbody>
                {insurance.map((x) => (
                  <tr key={x.id}>
                    <td>{x.policy_number}</td>
                    <td>{x.insured_name}</td>
                    <td>{x.insurance_type}</td>
                    <td>{formatNumber(x.amount)}</td>
                    <td>
                      {STATUS_LABELS[x.status]}
                      {x.status === "NEEDS_REVISION" && x.revision_reason && <small className="revision-note">{x.revision_reason}</small>}
                    </td>
                    <td>{formatNumber(x.commission_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
