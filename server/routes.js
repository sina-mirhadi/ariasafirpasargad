const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("./database");

const router = express.Router();

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "NEEDS_REVISION"];
const PAYMENT_PERIODS = ["ماهانه", "سه‌ماهه", "شش‌ماهه", "سالانه"];
const COMMISSION_PERCENT = 10;
const MAX_AMOUNT = 1_000_000_000_000;
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

/* ---------- کمکی‌ها ---------- */

const fail = (res, status, message) => res.status(status).json({ success: false, message });

function text(value, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function positiveInt(value, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= max ? n : null;
}

function safeUser(user) {
  return { id: user.id, username: user.username, role: user.role, name: user.name, active: !!user.active };
}

function getActiveUser(id) {
  return db.prepare("SELECT * FROM users WHERE id=? AND active=1").get(id);
}

function requireAuth(req, res, next) {
  if (!req.session.userId) return fail(res, 401, "برای این بخش باید وارد سامانه شوید.");
  const user = getActiveUser(req.session.userId);
  if (!user) {
    return req.session.destroy(() => fail(res, 401, "نشست شما معتبر نیست."));
  }
  req.user = user;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return fail(res, 403, "شما اجازه دسترسی به این بخش را ندارید.");
    next();
  };
}

const admin = [requireAuth, requireRole("ADMIN")];
const representative = [requireAuth, requireRole("REPRESENTATIVE")];

/* ---------- احراز هویت ---------- */

router.post("/login", async (req, res) => {
  const username = text(req.body?.username, 100);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!username || !password) return fail(res, 400, "نام کاربری و رمز عبور را وارد کنید.");

  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  // مقایسه همیشه انجام می‌شود تا زمان پاسخ وجود یا عدم وجود کاربر را لو ندهد.
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !user.active || !valid) return fail(res, 401, "نام کاربری یا رمز عبور اشتباه است");

  req.session.regenerate((err) => {
    if (err) return fail(res, 500, "ورود انجام نشد.");
    req.session.userId = user.id;
    req.session.save((saveErr) => {
      if (saveErr) return fail(res, 500, "ورود انجام نشد.");
      res.json({ success: true, user: safeUser(user) });
    });
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("aria.sid");
    res.json({ success: true });
  });
});

router.get("/me", (req, res) => {
  const user = req.session.userId ? getActiveUser(req.session.userId) : null;
  if (!user) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: safeUser(user) });
});

/* ---------- محتوای عمومی و اطلاعیه‌ها ---------- */

router.get("/public/news", (req, res) => {
  const items = db.prepare("SELECT id,title,body,created_at FROM news WHERE published=1 ORDER BY id DESC LIMIT 6").all();
  res.json({ success: true, items });
});

router.get("/notifications", requireAuth, (req, res) => {
  res.json({ success: true, items: db.prepare("SELECT * FROM notifications WHERE published=1 ORDER BY id DESC").all() });
});

router.post("/notifications", ...admin, (req, res) => {
  const title = text(req.body?.title, 200);
  const body = text(req.body?.body, 5000);
  if (!title || !body) return fail(res, 400, "عنوان و متن اطلاعیه الزامی است.");
  const info = db.prepare("INSERT INTO notifications (title,body) VALUES (?,?)").run(title, body);
  res.status(201).json({ success: true, id: info.lastInsertRowid });
});

/* ---------- خلاصه‌ها ---------- */

router.get("/admin/summary", ...admin, (req, res) => {
  const count = (sql) => db.prepare(sql).get().c;
  res.json({
    success: true,
    representatives: count("SELECT COUNT(*) c FROM users WHERE role='REPRESENTATIVE'"),
    insurance: count("SELECT COUNT(*) c FROM insurance"),
    pending: count("SELECT COUNT(*) c FROM insurance WHERE status='PENDING'"),
    settled: count("SELECT COALESCE(SUM(amount),0) c FROM settlements")
  });
});

router.get("/dashboard/summary", ...representative, (req, res) => {
  const s = db
    .prepare(
      `SELECT COUNT(*) insurance,
              COALESCE(SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END),0) approved,
              COALESCE(SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END),0) pending
       FROM insurance WHERE representative_id=?`
    )
    .get(req.user.id);
  const c = db
    .prepare("SELECT COALESCE(SUM(amount),0) commission, COALESCE(SUM(settled_amount),0) settled FROM commissions WHERE representative_id=?")
    .get(req.user.id);
  res.json({ success: true, ...s, commission: c.commission, settled: c.settled, remaining: c.commission - c.settled });
});

/* ---------- نمایندگان ---------- */

router.get("/representatives", ...admin, (req, res) => {
  const items = db.prepare("SELECT id,username,name,active,created_at FROM users WHERE role='REPRESENTATIVE' ORDER BY id DESC").all();
  res.json({ success: true, items });
});

router.post("/representatives", ...admin, async (req, res) => {
  const name = text(req.body?.name, 100);
  const username = text(req.body?.username, 50);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!name || !username || password.length < 8 || password.length > 72) {
    return fail(res, 400, "نام، نام کاربری و رمز عبور (۸ تا ۷۲ کاراکتر) لازم است.");
  }
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
    return fail(res, 400, "نام کاربری باید ۳ تا ۵۰ کاراکتر و فقط شامل حروف انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.");
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const info = db.prepare("INSERT INTO users (name,username,password,role) VALUES (?,?,?,'REPRESENTATIVE')").run(name, username, hash);
    res.status(201).json({ success: true, id: info.lastInsertRowid });
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") return fail(res, 409, "این نام کاربری قبلاً استفاده شده است.");
    console.error(e);
    fail(res, 500, "ایجاد نماینده انجام نشد.");
  }
});

router.patch("/representatives/:id", ...admin, (req, res) => {
  const id = positiveInt(req.params.id);
  if (!id) return fail(res, 400, "شناسه نامعتبر است.");
  const active = req.body?.active === true || req.body?.active === 1 || req.body?.active === "1" ? 1 : 0;
  const info = db.prepare("UPDATE users SET active=? WHERE id=? AND role='REPRESENTATIVE'").run(active, id);
  if (!info.changes) return fail(res, 404, "نماینده پیدا نشد.");
  res.json({ success: true });
});

/* ---------- بیمه‌نامه‌ها ---------- */

router.get("/insurance", requireAuth, (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const items = db
    .prepare(
      `SELECT i.*, u.name rep_name, c.id commission_id, c.amount commission_amount, c.commission_percent, c.settled_amount
       FROM insurance i
       JOIN users u ON u.id=i.representative_id
       LEFT JOIN commissions c ON c.insurance_id=i.id
       ${isAdmin ? "" : "WHERE i.representative_id=?"}
       ORDER BY i.id DESC`
    )
    .all(...(isAdmin ? [] : [req.user.id]));
  res.json({ success: true, items });
});

function newPolicyNumber() {
  return `ASP-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

router.post("/insurance", ...representative, (req, res) => {
  const b = req.body || {};
  const insuredName = text(b.insuredName, 150);
  const insuranceType = text(b.insuranceType, 100);
  const duration = text(b.duration, 100);
  const paymentPeriod = text(b.paymentPeriod, 30);
  const amount = positiveInt(b.amount, MAX_AMOUNT);

  if (!insuredName || !insuranceType || !duration || !amount || !PAYMENT_PERIODS.includes(paymentPeriod)) {
    return fail(res, 400, "اطلاعات بیمه‌نامه را کامل و صحیح وارد کنید.");
  }

  const insert = db.prepare(
    "INSERT INTO insurance (policy_number,representative_id,insured_name,insurance_type,duration,amount,payment_period) VALUES (?,?,?,?,?,?,?)"
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    const policyNumber = newPolicyNumber();
    try {
      insert.run(policyNumber, req.user.id, insuredName, insuranceType, duration, amount, paymentPeriod);
      return res.status(201).json({ success: true, policyNumber });
    } catch (e) {
      if (e.code !== "SQLITE_CONSTRAINT_UNIQUE") throw e;
    }
  }
  fail(res, 500, "ساخت شماره بیمه‌نامه انجام نشد. دوباره تلاش کنید.");
});

// کمیسیون فقط برای بیمه‌نامه تأییدشده وجود دارد و همراه تغییر وضعیت، در یک Transaction ساخته یا حذف می‌شود.
const changeStatus = db.transaction((id, status, reason) => {
  const ins = db.prepare("SELECT * FROM insurance WHERE id=?").get(id);
  if (!ins) return { code: 404 };
  const commission = db.prepare("SELECT * FROM commissions WHERE insurance_id=?").get(id);

  if (status === "APPROVED") {
    if (!commission) {
      db.prepare("INSERT INTO commissions (insurance_id,representative_id,amount,commission_percent) VALUES (?,?,?,?)").run(
        ins.id,
        ins.representative_id,
        Math.floor((ins.amount * COMMISSION_PERCENT) / 100),
        COMMISSION_PERCENT
      );
    }
  } else if (commission) {
    if (commission.settled_amount > 0) return { code: 409 };
    db.prepare("DELETE FROM commissions WHERE id=?").run(commission.id);
  }

  db.prepare("UPDATE insurance SET status=?, revision_reason=? WHERE id=?").run(status, reason, id);
  return { code: 200 };
});

router.patch("/insurance/:id", ...admin, (req, res) => {
  const id = positiveInt(req.params.id);
  const status = req.body?.status;
  if (!id || !STATUSES.includes(status)) return fail(res, 400, "وضعیت نامعتبر است.");
  const reason = status === "NEEDS_REVISION" ? text(req.body?.revisionReason, 500) || "نیاز به اصلاح" : null;

  const result = changeStatus(id, status, reason);
  if (result.code === 404) return fail(res, 404, "بیمه‌نامه پیدا نشد.");
  if (result.code === 409) return fail(res, 409, "برای کمیسیون این بیمه‌نامه تسویه ثبت شده و وضعیت آن قابل تغییر نیست.");
  res.json({ success: true });
});

/* ---------- کمیسیون و تسویه ---------- */

router.get("/commissions", requireAuth, (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const sql = isAdmin
    ? `SELECT c.*, u.name rep_name, i.policy_number FROM commissions c
       JOIN users u ON u.id=c.representative_id JOIN insurance i ON i.id=c.insurance_id ORDER BY c.id DESC`
    : `SELECT c.*, i.policy_number FROM commissions c
       JOIN insurance i ON i.id=c.insurance_id WHERE c.representative_id=? ORDER BY c.id DESC`;
  res.json({ success: true, items: db.prepare(sql).all(...(isAdmin ? [] : [req.user.id])) });
});

router.get("/settlements", ...admin, (req, res) => {
  const items = db
    .prepare(
      `SELECT s.*, i.policy_number, u.name rep_name FROM settlements s
       JOIN commissions c ON c.id=s.commission_id
       JOIN insurance i ON i.id=c.insurance_id
       JOIN users u ON u.id=s.representative_id
       ORDER BY s.id DESC`
    )
    .all();
  res.json({ success: true, items });
});

const settle = db.transaction((commissionId, amount, note) => {
  const c = db.prepare("SELECT * FROM commissions WHERE id=?").get(commissionId);
  if (!c) return { code: 404 };
  // شرط باقی‌مانده داخل خود UPDATE بررسی می‌شود تا هیچ حالتی از تسویه بیش از حد ممکن نباشد.
  const updated = db.prepare("UPDATE commissions SET settled_amount=settled_amount+? WHERE id=? AND settled_amount+?<=amount").run(amount, c.id, amount);
  if (!updated.changes) return { code: 400 };
  db.prepare("INSERT INTO settlements (commission_id,representative_id,amount,note) VALUES (?,?,?,?)").run(c.id, c.representative_id, amount, note);
  return { code: 201 };
});

router.post("/settlements", ...admin, (req, res) => {
  const commissionId = positiveInt(req.body?.commissionId);
  const amount = positiveInt(req.body?.amount, MAX_AMOUNT);
  if (!commissionId || !amount) return fail(res, 400, "کمیسیون و مبلغ تسویه را وارد کنید.");

  const result = settle(commissionId, amount, text(req.body?.note, 500));
  if (result.code === 404) return fail(res, 404, "کمیسیون پیدا نشد.");
  if (result.code === 400) return fail(res, 400, "مبلغ تسویه بیشتر از مبلغ باقی‌مانده است.");
  res.status(201).json({ success: true });
});

/* ---------- مدیریت محتوای عمومی ---------- */

function deleteById(table) {
  const stmt = db.prepare(`DELETE FROM ${table} WHERE id=?`);
  return (req, res) => {
    const id = positiveInt(req.params.id);
    if (!id) return fail(res, 400, "شناسه نامعتبر است.");
    if (!stmt.run(id).changes) return fail(res, 404, "مورد پیدا نشد.");
    res.json({ success: true });
  };
}

router.delete("/notifications/:id", ...admin, deleteById("notifications"));

router.get("/admin/content", ...admin, (req, res) => {
  res.json({
    success: true,
    news: db.prepare("SELECT * FROM news ORDER BY id DESC").all(),
    achievements: db.prepare("SELECT * FROM achievements ORDER BY id DESC").all(),
    testimonials: db.prepare("SELECT * FROM testimonials ORDER BY id DESC").all(),
    team: db.prepare("SELECT * FROM team ORDER BY id DESC").all(),
    settings: db.prepare("SELECT * FROM settings ORDER BY key").all()
  });
});

router.post("/news", ...admin, (req, res) => {
  const title = text(req.body?.title, 200);
  const body = text(req.body?.body, 5000);
  if (!title || !body) return fail(res, 400, "عنوان و متن خبر الزامی است.");
  const info = db.prepare("INSERT INTO news (title,body,published) VALUES (?,?,1)").run(title, body);
  res.status(201).json({ success: true, id: info.lastInsertRowid });
});

router.patch("/news/:id", ...admin, (req, res) => {
  const id = positiveInt(req.params.id);
  const title = text(req.body?.title, 200);
  const body = text(req.body?.body, 5000);
  if (!id || !title || !body) return fail(res, 400, "اطلاعات خبر نامعتبر است.");
  if (!db.prepare("UPDATE news SET title=?,body=? WHERE id=?").run(title, body, id).changes) return fail(res, 404, "خبر پیدا نشد.");
  res.json({ success: true });
});
router.delete("/news/:id", ...admin, deleteById("news"));

router.post("/achievements", ...admin, (req, res) => {
  const title = text(req.body?.title, 200);
  const body = text(req.body?.body, 5000);
  if (!title || !body) return fail(res, 400, "عنوان و متن دستاورد الزامی است.");
  const info = db.prepare("INSERT INTO achievements (title,body) VALUES (?,?)").run(title, body);
  res.status(201).json({ success: true, id: info.lastInsertRowid });
});
router.delete("/achievements/:id", ...admin, deleteById("achievements"));

router.post("/testimonials", ...admin, (req, res) => {
  const name = text(req.body?.name, 100);
  const body = text(req.body?.body, 5000);
  if (!name || !body) return fail(res, 400, "نام و متن نظر الزامی است.");
  const info = db.prepare("INSERT INTO testimonials (name,body,published) VALUES (?,?,1)").run(name, body);
  res.status(201).json({ success: true, id: info.lastInsertRowid });
});
router.delete("/testimonials/:id", ...admin, deleteById("testimonials"));

router.post("/team", ...admin, (req, res) => {
  const name = text(req.body?.name, 100);
  const role = text(req.body?.role, 100);
  const bio = text(req.body?.bio, 1000);
  if (!name || !role) return fail(res, 400, "نام و سمت عضو تیم الزامی است.");
  const info = db.prepare("INSERT INTO team (name,role,bio) VALUES (?,?,?)").run(name, role, bio);
  res.status(201).json({ success: true, id: info.lastInsertRowid });
});
router.delete("/team/:id", ...admin, deleteById("team"));

/* ---------- تنظیمات ---------- */

router.get("/settings", ...admin, (req, res) => {
  res.json({ success: true, items: db.prepare("SELECT * FROM settings ORDER BY key").all() });
});

const saveSettings = db.transaction((entries) => {
  const stmt = db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
  entries.forEach(([key, value]) => stmt.run(key, value));
});

router.put("/settings", ...admin, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail(res, 400, "تنظیمات نامعتبر است.");
  const entries = Object.entries(body);
  const valid =
    entries.length > 0 &&
    entries.length <= 50 &&
    entries.every(([k, v]) => k.length > 0 && k.length <= 64 && ["string", "number", "boolean"].includes(typeof v) && String(v).length <= 1000);
  if (!valid) return fail(res, 400, "تنظیمات نامعتبر است.");
  saveSettings(entries.map(([k, v]) => [k, String(v)]));
  res.json({ success: true });
});

module.exports = { router, requireAuth, requireRole };
