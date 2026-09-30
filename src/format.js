export const STATUS_LABELS = {
  PENDING: "در انتظار بررسی",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
  NEEDS_REVISION: "نیازمند اصلاح"
};

export const formatNumber = (n) => Number(n || 0).toLocaleString("fa-IR");
export const formatMoney = (n) => `${formatNumber(n)} تومان`;

// SQLite تاریخ را به وقت UTC و بدون Z ذخیره می‌کند.
export function formatDate(value) {
  if (!value) return "";
  const d = new Date(`${String(value).replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
}
