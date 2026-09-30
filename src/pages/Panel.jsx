import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { STATUS_LABELS, formatDate, formatMoney, formatNumber } from "../format";
import "./Panel.css";

const TABS = [
  ["overview", "نمای کلی"],
  ["representatives", "نمایندگان"],
  ["insurance", "بیمه‌نامه‌ها"],
  ["settlements", "تسویه‌ها"],
  ["notifications", "اطلاعیه‌ها"]
];

const EMPTY = { summary: {}, reps: [], insurance: [], commissions: [], settlements: [], notifications: [] };

export default function Panel() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(EMPTY);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const me = await api("/api/me");
    if (!me.data.authenticated) return navigate("/login", { replace: true });
    if (me.data.user.role !== "ADMIN") return navigate("/dashboard", { replace: true });
    setUser(me.data.user);

    const results = await Promise.all([
      api("/api/admin/summary"),
      api("/api/representatives"),
      api("/api/insurance"),
      api("/api/commissions"),
      api("/api/settlements"),
      api("/api/notifications")
    ]);
    if (results.some((r) => r.status === 401)) return navigate("/login", { replace: true });
    if (results.some((r) => !r.ok)) setError("بخشی از اطلاعات دریافت نشد. صفحه را دوباره بارگذاری کنید.");

    const [summary, reps, insurance, commissions, settlements, notifications] = results;
    setData({
      summary: summary.data || {},
      reps: reps.data.items || [],
      insurance: insurance.data.items || [],
      commissions: commissions.data.items || [],
      settlements: settlements.data.items || [],
      notifications: notifications.data.items || []
    });
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  function changeTab(id) {
    setError("");
    setTab(id);
  }

  // ارسال فرم: قبل از await مقدار فرم گرفته می‌شود چون e.currentTarget بعد از await دیگر در دسترس نیست.
  async function submitForm(e, url) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const r = await api(url, { body });
    if (!r.ok) return setError(r.data.message || "عملیات انجام نشد.");
    form.reset();
    load();
  }

  async function patch(url, body) {
    setError("");
    const r = await api(url, { method: "PATCH", body });
    if (!r.ok) setError(r.data.message || "عملیات انجام نشد.");
    load();
  }

  async function logout() {
    await api("/api/logout", { method: "POST" });
    navigate("/login");
  }

  if (!user) return <main className="panel-loading">در حال بررسی دسترسی...</main>;

  const { summary } = data;
  const openCommissions = data.commissions.filter((c) => c.amount - c.settled_amount > 0);

  return (
    <main className="dashboard-page">
      <div className="container panel-layout">
        <aside className="side-panel">
          <div className="side-brand">
            <span>ASP</span>
            <div><strong>پنل مدیریت</strong><small>{user.name}</small></div>
          </div>
          {TABS.map(([id, label]) => (
            <button className={tab === id ? "active" : ""} onClick={() => changeTab(id)} key={id}>{label}</button>
          ))}
          <button onClick={logout}>خروج</button>
        </aside>

        <section className="panel-main">
          <div className="panel-top">
            <div><span className="section-label">ADMIN</span><h1>پنل مدیریت</h1></div>
            <span>{new Date().toLocaleDateString("fa-IR")}</span>
          </div>
          {error && <div className="form-error">{error}</div>}

          {tab === "overview" && (
            <>
              <div className="admin-stats">
                {[
                  ["نمایندگان", formatNumber(summary.representatives)],
                  ["بیمه‌نامه‌ها", formatNumber(summary.insurance)],
                  ["در انتظار", formatNumber(summary.pending)],
                  ["تسویه‌شده", formatMoney(summary.settled)]
                ].map(([a, b]) => <div key={a}><span>{a}</span><strong>{b}</strong></div>)}
              </div>
              <div className="panel-box">
                <h2>آخرین وضعیت</h2>
                <p>از منوی سمت راست برای مدیریت نمایندگان، بیمه‌نامه‌ها، تسویه‌ها و اطلاعیه‌ها استفاده کنید.</p>
              </div>
            </>
          )}

          {tab === "representatives" && (
            <>
              <div className="panel-box">
                <h2>ایجاد نماینده</h2>
                <form className="inline-form" onSubmit={(e) => submitForm(e, "/api/representatives")}>
                  <input name="name" placeholder="نام نماینده" required maxLength={100} />
                  <input name="username" placeholder="نام کاربری (انگلیسی)" required minLength={3} maxLength={50} autoComplete="off" />
                  <input name="password" type="password" placeholder="رمز عبور (حداقل ۸ کاراکتر)" required minLength={8} maxLength={72} autoComplete="new-password" />
                  <button className="btn btn-primary">ایجاد</button>
                </form>
              </div>
              <div className="table-box">
                <table>
                  <thead><tr><th>نام</th><th>نام کاربری</th><th>وضعیت</th><th>عملیات</th></tr></thead>
                  <tbody>
                    {data.reps.map((x) => (
                      <tr key={x.id}>
                        <td>{x.name}</td>
                        <td>{x.username}</td>
                        <td>{x.active ? "فعال" : "غیرفعال"}</td>
                        <td><button className="small-btn" onClick={() => patch(`/api/representatives/${x.id}`, { active: x.active ? 0 : 1 })}>{x.active ? "غیرفعال کردن" : "فعال کردن"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "insurance" && (
            <div className="table-box">
              <table>
                <thead><tr><th>شماره</th><th>نماینده</th><th>بیمه‌شده</th><th>مبلغ</th><th>وضعیت</th><th>تغییر وضعیت</th></tr></thead>
                <tbody>
                  {data.insurance.map((x) => (
                    <tr key={x.id}>
                      <td>{x.policy_number}</td>
                      <td>{x.rep_name}</td>
                      <td>{x.insured_name}</td>
                      <td>{formatNumber(x.amount)}</td>
                      <td>{STATUS_LABELS[x.status]}</td>
                      <td>
                        <select value={x.status} onChange={(e) => patch(`/api/insurance/${x.id}`, { status: e.target.value })}>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "settlements" && (
            <>
              <div className="panel-box">
                <h2>ثبت تسویه</h2>
                <form className="inline-form" onSubmit={(e) => submitForm(e, "/api/settlements")}>
                  <select name="commissionId" required>
                    <option value="">کمیسیون را انتخاب کنید</option>
                    {openCommissions.map((c) => (
                      <option key={c.id} value={c.id}>{c.policy_number} - {c.rep_name} - باقی‌مانده: {formatNumber(c.amount - c.settled_amount)}</option>
                    ))}
                  </select>
                  <input name="amount" type="number" min="1" step="1" placeholder="مبلغ تسویه" required />
                  <input name="note" placeholder="توضیح" maxLength={500} />
                  <button className="btn btn-primary">ثبت تسویه</button>
                </form>
              </div>
              <div className="table-box">
                <table>
                  <thead><tr><th>شماره بیمه‌نامه</th><th>نماینده</th><th>مبلغ</th><th>تاریخ</th></tr></thead>
                  <tbody>
                    {data.settlements.map((x) => (
                      <tr key={x.id}>
                        <td>{x.policy_number}</td>
                        <td>{x.rep_name}</td>
                        <td>{formatNumber(x.amount)}</td>
                        <td>{formatDate(x.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "notifications" && (
            <>
              <div className="panel-box">
                <h2>اطلاعیه جدید</h2>
                <form className="stack-form" onSubmit={(e) => submitForm(e, "/api/notifications")}>
                  <input name="title" placeholder="عنوان" required maxLength={200} />
                  <textarea name="body" placeholder="متن اطلاعیه" required maxLength={5000} />
                  <button className="btn btn-primary">انتشار اطلاعیه</button>
                </form>
              </div>
              <div className="table-box">
                <table>
                  <thead><tr><th>عنوان</th><th>متن</th><th>تاریخ</th></tr></thead>
                  <tbody>
                    {data.notifications.map((x) => (
                      <tr key={x.id}><td>{x.title}</td><td>{x.body}</td><td>{formatDate(x.created_at)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
