import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>آریا سفیر پاسارگاد</h3>
          <p>مجموعه‌ای سازمان‌یافته در حوزه بیمه با تمرکز بر توسعه شبکه نمایندگان، آموزش و ارائه خدمات حرفه‌ای.</p>
        </div>
        <div>
          <h4>دسترسی سریع</h4>
          <Link to="/">خانه</Link>
          <Link to="/about">درباره ما</Link>
          <Link to="/agency">نمایندگی</Link>
          <Link to="/login">سامانه</Link>
        </div>
        <div>
          <h4>اطلاعات تماس</h4>
          <p>نیشابور، دفتر آریا سفیر پاسارگاد</p>
          <p>تلفن: ۰۵۱-۴۲۲۲xxxx</p>
          <p>ایمیل: info@aria-safir.ir</p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© {new Date().getFullYear()} آریا سفیر پاسارگاد - تمامی حقوق محفوظ است.</div>
      </div>
    </footer>
  );
}
