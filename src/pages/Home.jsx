import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const fallbackNews = [
  { id: 1, title: "برگزاری دوره آموزشی نمایندگان جدیدالورود", body: "دوره‌های آموزشی با هدف ارتقای دانش تخصصی شبکه نمایندگان برگزار می‌شود." },
  { id: 2, title: "توسعه شبکه و خدمات سازمانی", body: "آریا سفیر پاسارگاد بر توسعه منظم شبکه و بهبود تجربه نمایندگان تمرکز دارد." },
  { id: 3, title: "قدردانی از نمایندگان برتر", body: "عملکرد نمایندگان و دستاوردهای شبکه در برنامه‌های سازمانی مورد تقدیر قرار می‌گیرد." }
];

export default function Home() {
  const [news, setNews] = useState(fallbackNews);

  useEffect(() => {
    fetch("/api/public/news")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data?.items?.length && setNews(data.items))
      .catch(() => {});
  }, []);

  return (
    <main>
      <section className="home-hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">آریا سفیر پاسارگاد</span>
            <h1>ساختن یک شبکه حرفه‌ای، با نظم و اعتماد.</h1>
            <p>یک سازمان بیمه‌ای منسجم برای توسعه نمایندگان، آموزش مستمر و ارائه خدمات قابل اتکا.</p>
            <div className="hero-actions">
              <Link to="/agency" className="btn btn-primary">شروع همکاری</Link>
              <Link to="/about" className="btn btn-light">شناخت سازمان</Link>
            </div>
          </div>
          <div className="hero-panel">
            <span>مدیریت ارشد</span>
            <strong>سید محسن میرهادی</strong>
            <p>مدیریت و توسعه شبکه نمایندگان آریا سفیر پاسارگاد</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container intro-grid">
          <div>
            <span className="section-label">معرفی سازمان</span>
            <h2>سازمانی برای رشد پایدار شبکه بیمه</h2>
          </div>
          <p>آریا سفیر پاسارگاد با تمرکز بر آموزش، پشتیبانی، توسعه شبکه و نظم سازمانی تلاش می‌کند مسیر فعالیت حرفه‌ای نمایندگان را روشن‌تر و قابل اندازه‌گیری‌تر کند.</p>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-head"><div><span className="section-label">در یک نگاه</span><h2>آمار سازمان</h2></div></div>
          <div className="stats-grid">
            {[
              ["+120", "نماینده فعال"],
              ["+4,800", "بیمه‌نامه"],
              ["+10", "سال فعالیت"],
              ["24/7", "پشتیبانی سازمانی"]
            ].map(([value, label]) => <div className="stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><div><span className="section-label">خدمات</span><h2>آنچه در شبکه دنبال می‌کنیم</h2></div></div>
          <div className="service-grid">
            {[
              ["۰۱", "آموزش و توانمندسازی", "برگزاری آموزش‌های کاربردی و مستمر برای ارتقای دانش نمایندگان."],
              ["۰۲", "پشتیبانی نمایندگان", "فرآیندهای مشخص برای پیگیری امور و پشتیبانی روزمره شبکه."],
              ["۰۳", "توسعه بازار", "تمرکز بر توسعه حرفه‌ای شبکه و ایجاد فرصت‌های پایدار برای نمایندگان."]
            ].map(([n, title, text]) => <article className="service" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container achievement-grid">
          <div><span className="section-label">دستاوردها</span><h2>رشد وقتی ارزش دارد که قابل اندازه‌گیری باشد.</h2><p>دستاوردهای سازمان، نتیجه کار مستمر شبکه، آموزش و مدیریت منظم است.</p></div>
          <div className="achievement-list"><div><strong>رشد شبکه</strong><span>توسعه مستمر نمایندگان</span></div><div><strong>آموزش</strong><span>برنامه‌های آموزشی منظم</span></div><div><strong>نظم سازمانی</strong><span>فرآیندهای قابل پیگیری</span></div></div>
        </div>
      </section>

      <section className="section">
        <div className="container manager-grid">
          <div className="manager-box"><span>مدیریت ارشد</span><strong>جناب آقای سید محسن میرهادی</strong><p>هدایت و توسعه ساختار سازمانی و شبکه نمایندگان.</p></div>
          <div><span className="section-label">مدیریت</span><h2>توسعه با نگاه بلندمدت</h2><p>هدف مدیریت، ایجاد ساختاری منظم، آموزش‌محور و قابل توسعه برای نمایندگان و همکاران است.</p></div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-head"><div><span className="section-label">همکاری</span><h2>به شبکه ما بپیوندید</h2></div><Link to="/agency" className="text-link">اطلاعات نمایندگی ←</Link></div>
          <div className="cta-box"><div><h3>مسیر همکاری را حرفه‌ای شروع کنید.</h3><p>شرایط و مراحل همکاری با سازمان را ببینید و برای شروع ارتباط اقدام کنید.</p></div><Link to="/agency" className="btn btn-primary">مشاهده شرایط همکاری</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><div><span className="section-label">اخبار</span><h2>آخرین اخبار سازمان</h2></div></div>
          <div className="news-grid">{news.map(item => <article className="news-card" key={item.id}><span>اخبار سازمان</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
        </div>
      </section>

      <section className="section home-contact">
        <div className="container contact-box"><div><span className="section-label">ارتباط با ما</span><h2>برای همکاری و دریافت اطلاعات، با سازمان در ارتباط باشید.</h2></div><div><p>دفتر آریا سفیر پاسارگاد</p><p>نیشابور</p><p>تلفن: ۰۵۱-۴۲۲۲xxxx</p></div></div>
      </section>
    </main>
  );
}
