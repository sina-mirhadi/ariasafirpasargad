import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // وضعیت ورود با هر تغییر مسیر دوباره بررسی می‌شود (مثلاً بعد از ورود یا خروج).
  useEffect(() => {
    let cancelled = false;
    api("/api/me").then(({ data }) => {
      if (!cancelled) setUser(data.authenticated ? data.user : null);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const close = () => setOpen(false);

  async function handleLogout() {
    await api("/api/logout", { method: "POST" });
    setUser(null);
    close();
    navigate("/login");
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">ASP</span>
          <span>
            <strong>آریا سفیر پاسارگاد</strong>
            <small>شبکه سازمانی بیمه</small>
          </span>
        </Link>

        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="منو" aria-expanded={open}>
          ☰
        </button>

        <nav className={`main-nav ${open ? "open" : ""}`}>
          <NavLink to="/" end onClick={close}>خانه</NavLink>
          <NavLink to="/about" onClick={close}>درباره ما</NavLink>
          <NavLink to="/agency" onClick={close}>نمایندگی</NavLink>
          <a href="#contact" onClick={close}>ارتباط با ما</a>
          {user ? (
            <>
              <Link className="header-login" to={user.role === "ADMIN" ? "/panel" : "/dashboard"} onClick={close}>پنل من</Link>
              <button className="header-logout" onClick={handleLogout}>خروج</button>
            </>
          ) : (
            <Link className="header-login" to="/login" onClick={close}>ورود به سامانه</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
