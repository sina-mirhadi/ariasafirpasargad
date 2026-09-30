const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const isProd = process.env.NODE_ENV === "production";
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(process.env.DB_PATH || path.join(dataDir, "aria-safir.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN','REPRESENTATIVE')),
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS insurance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_number TEXT NOT NULL UNIQUE,
  representative_id INTEGER NOT NULL,
  insured_name TEXT NOT NULL,
  insurance_type TEXT NOT NULL,
  duration TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  payment_period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','NEEDS_REVISION')),
  revision_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(representative_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insurance_id INTEGER NOT NULL UNIQUE,
  representative_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK(amount >= 0),
  commission_percent REAL NOT NULL,
  settled_amount INTEGER NOT NULL DEFAULT 0 CHECK(settled_amount >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(settled_amount <= amount),
  FOREIGN KEY(insurance_id) REFERENCES insurance(id),
  FOREIGN KEY(representative_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commission_id INTEGER NOT NULL,
  representative_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(commission_id) REFERENCES commissions(id),
  FOREIGN KEY(representative_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS team (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_insurance_rep ON insurance(representative_id);
CREATE INDEX IF NOT EXISTS idx_insurance_status ON insurance(status);
CREATE INDEX IF NOT EXISTS idx_commissions_rep ON commissions(representative_id);
CREATE INDEX IF NOT EXISTS idx_settlements_commission ON settlements(commission_id);
CREATE INDEX IF NOT EXISTS idx_settlements_rep ON settlements(representative_id);
`);

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) return;

  // در Production رمز پیش‌فرض شناخته‌شده نباید ساخته شود.
  const adminPassword = process.env.ADMIN_PASSWORD || (isProd ? null : "Admin@12345");
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("برای اولین اجرا در Production متغیر ADMIN_PASSWORD (حداقل ۸ کاراکتر) را تنظیم کنید.");
  }

  const insertUser = db.prepare("INSERT INTO users (username,password,role,name) VALUES (?,?,?,?)");
  const seedTx = db.transaction(() => {
    insertUser.run("admin", bcrypt.hashSync(adminPassword, 12), "ADMIN", "مدیر سامانه");
    if (!isProd) {
      insertUser.run("rep1", bcrypt.hashSync("Rep@12345", 12), "REPRESENTATIVE", "نماینده آزمایشی");
    }
    db.prepare("INSERT INTO notifications (title,body) VALUES (?,?)").run("اطلاعیه نمونه", "به سامانه آریا سفیر پاسارگاد خوش آمدید.");
    db.prepare("INSERT INTO news (title,body) VALUES (?,?)").run("آغاز فعالیت سامانه سازمانی", "سامانه برای مدیریت ساده‌تر فرآیندهای سازمانی آماده شده است.");
    db.prepare("INSERT INTO achievements (title,body) VALUES (?,?)").run("توسعه شبکه", "توسعه مستمر شبکه نمایندگان.");
    db.prepare("INSERT INTO testimonials (name,body) VALUES (?,?)").run("نماینده نمونه", "فرآیندهای آموزشی و پشتیبانی منظم‌تر شده است.");
    db.prepare("INSERT INTO team (name,role,bio) VALUES (?,?,?)").run("سید محسن میرهادی", "مدیریت ارشد", "مدیریت و توسعه شبکه سازمان.");
    db.prepare("INSERT INTO settings (key,value) VALUES (?,?)").run("organization_name", "آریا سفیر پاسارگاد");
  });
  seedTx();
}

seed();

module.exports = db;
