import { Link } from "react-router-dom";
import "./Agency.css";

export default function Agency() {
  return (
    <main className="inner-page">
      <section className="page-heading"><div className="container"><span className="section-label">نمایندگی</span><h1>همکاری با آریا سفیر پاسارگاد</h1><p>مسیر همکاری حرفه‌ای، از آموزش تا توسعه شبکه.</p></div></section>
      <section className="section"><div className="container"><div className="agency-grid">
        {[
          ["پشتیبانی سازمانی","در مسیر فعالیت، ارتباط با ساختار سازمانی و پشتیبانی مستمر در دسترس است."],
          ["آموزش","یادگیری مستمر برای شناخت محصولات، فرآیندها و مهارت‌های فروش."],
          ["مسیر رشد","عملکرد حرفه‌ای و منظم، زمینه رشد و توسعه فعالیت را فراهم می‌کند."]
        ].map(([t,p],i)=><article key={t}><span>{["۰۱","۰۲","۰۳"][i]}</span><h3>{t}</h3><p>{p}</p></article>)}
      </div></div></section>
      <section className="section section-muted"><div className="container process"><div><span className="section-label">مراحل همکاری</span><h2>یک مسیر روشن برای شروع</h2></div><ol><li>ارتباط و دریافت اطلاعات اولیه</li><li>بررسی شرایط و جلسه آشنایی</li><li>آموزش و آماده‌سازی</li><li>شروع فعالیت و پشتیبانی مستمر</li></ol></div></section>
      <section className="section"><div className="container agency-note"><h2>شرایط همکاری</h2><p>شرایط نهایی همکاری بر اساس ضوابط شرکت بیمه، شرایط قانونی و فرآیند داخلی سازمان بررسی می‌شود. برای دریافت اطلاعات دقیق، از طریق سازمان ارتباط بگیرید.</p><Link className="btn btn-primary" to="/login">ورود به سامانه</Link></div></section>
    </main>
  );
}
