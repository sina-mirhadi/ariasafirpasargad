const express = require("express");
const session = require("express-session");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const isProd = process.env.NODE_ENV === "production";
if (isProd && !process.env.SESSION_SECRET) {
  console.error("در Production باید متغیر SESSION_SECRET تنظیم شود.");
  process.exit(1);
}

const db = require("./database");
const { router } = require("./routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

// در حالت توسعه Vite درخواست‌ها را proxy می‌کند؛ CORS فقط در صورت تعریف دامنه فعال می‌شود.
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}

app.use(express.json({ limit: "100kb" }));

app.use(
  "/api/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "تعداد تلاش‌های ورود زیاد است. کمی بعد دوباره تلاش کنید." }
  })
);

app.use(
  session({
    name: "aria.sid",
    secret: process.env.SESSION_SECRET || "dev-only-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 8 * 60 * 60 * 1000
    }
  })
);

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));
app.use("/api", router);
app.use("/api", (req, res) => res.status(404).json({ success: false, message: "مسیر یافت نشد." }));

const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => res.sendFile(path.join(distPath, "index.html")));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
    return res.status(400).json({ success: false, message: "داده ارسالی نامعتبر است." });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "خطای داخلی سرور." });
});

const server = app.listen(PORT, () => console.log(`Aria Safir backend running on http://localhost:${PORT}`));

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
