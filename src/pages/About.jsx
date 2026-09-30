import "./About.css";

export default function About() {
  return (
    <main className="inner-page">
      <section className="page-heading"><div className="container"><span className="section-label">درباره ما</span><h1>آریا سفیر پاسارگاد</h1><p>ساختاری سازمان‌یافته برای توسعه حرفه‌ای شبکه بیمه.</p></div></section>
      <section className="section"><div className="container about-content">
        <div><span className="section-label">معرفی</span><h2>نگاه ما به فعالیت سازمانی</h2><p>آریا سفیر پاسارگاد با هدف ایجاد یک شبکه منسجم و آموزش‌محور فعالیت می‌کند. تمرکز سازمان بر توسعه نمایندگان، پشتیبانی، آموزش و ایجاد فرآیندهای قابل پیگیری است.</p><p>در این ساختار، رشد فردی نمایندگان و رشد سازمان دو مسیر جدا نیستند و در کنار یکدیگر تعریف می‌شوند.</p></div>
        <div className="about-fact"><strong>هدف</strong><span>ایجاد یک شبکه حرفه‌ای، منظم و قابل توسعه</span></div>
      </div></section>
      <section className="section section-muted"><div className="container"><div className="value-grid">
        {[
          ["تاریخچه","رشد سازمان بر پایه توسعه تدریجی شبکه و تجربه عملی در حوزه بیمه."],
          ["اهداف","افزایش کیفیت آموزش، پشتیبانی بهتر و توسعه پایدار نمایندگان."],
          ["ارزش‌ها","نظم، پاسخگویی، یادگیری مستمر، صداقت و کار تیمی."],
          ["چشم‌انداز","ساختن یک شبکه حرفه‌ای و ماندگار با فرآیندهای روشن."]
        ].map(([title,text])=><article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </div></div></section>
      <section className="section"><div className="container manager-about"><div><span className="section-label">مدیریت ارشد</span><h2>جناب آقای سید محسن میرهادی</h2><p>مدیریت ارشد با تمرکز بر توسعه شبکه، آموزش و نظم سازمانی.</p></div><div className="signature">ARIA<br/>SAFIR<br/><small>PASARGAD</small></div></div></section>
    </main>
  );
}
