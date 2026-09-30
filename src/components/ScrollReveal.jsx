import { useEffect } from "react";

// عناصر زیر با ورود به صفحه‌نمایش، به‌صورت سه‌بعدی ظاهر می‌شوند.
const TARGETS = [
  ".hero-grid > div:first-child", ".page-heading .container", ".intro-grid > *", ".section-head",
  ".stat", ".service", ".achievement-grid > div:first-child", ".achievement-list > div",
  ".manager-grid > *", ".cta-box", ".news-card", ".contact-box", ".about-content > *",
  ".value-grid article", ".manager-about > *", ".agency-grid article", ".process > div",
  ".process li", ".agency-note", ".login-card",
  ".panel-box", ".admin-stats > div", ".rep-stats > div", ".table-box"
].join(",");

export default function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    const scan = () => {
      document.querySelectorAll(TARGETS).forEach((el) => {
        if (el.dataset.rv) return;
        el.dataset.rv = "1";
        el.classList.add("reveal");
        const index = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.setProperty("--d", `${Math.min(index, 5) * 0.09}s`);
        io.observe(el);
      });
    };

    scan();
    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mo.observe(document.getElementById("root"), { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
