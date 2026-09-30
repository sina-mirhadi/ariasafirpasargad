// یک لایه ساده روی fetch: همیشه { ok, status, data } برمی‌گرداند و هرگز throw نمی‌کند.
export async function api(url, { method, body } = {}) {
  const init = { method: method || (body !== undefined ? "POST" : "GET"), credentials: "same-origin" };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(url, init);
    let data = {};
    try {
      data = await res.json();
    } catch {
      /* پاسخ بدون JSON */
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: "ارتباط با سرور برقرار نشد." } };
  }
}
