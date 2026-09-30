# آریا سفیر پاسارگاد

وب‌سایت سازمانی + سامانه ساده مدیریت نمایندگان، بیمه‌نامه‌ها، کمیسیون و تسویه.

## تکنولوژی

- React + Vite
- React Router DOM
- CSS معمولی (تم آبی و زرد انبه‌ای با افکت سه‌بعدی در `src/theme.css`)
- Fetch API
- Node.js + Express
- SQLite با better-sqlite3
- Session Authentication
- bcryptjs برای Hash رمز عبور

## نصب

Node.js نسخه 20.19 یا بالاتر لازم است (نیاز Vite 7 و better-sqlite3).

```bash
npm install
```

## اجرا در حالت توسعه

```bash
npm run dev
```

Frontend:
http://localhost:5173

Backend:
http://localhost:3001

## اجرای جداگانه

```bash
npm run server
```

و در ترمینال دوم:

```bash
npm run client
```

## Build

```bash
npm run build
```

اگر `dist` ساخته شده باشد، Backend آن را نیز سرو می‌کند:

```bash
npm start
```

## حساب‌های تست

Admin:
- username: `admin`
- password: `Admin@12345`

Representative:
- username: `rep1`
- password: `Rep@12345`

Seed فقط زمانی اجرا می‌شود که جدول کاربران خالی باشد.

## مسیرها

- `/` صفحه اصلی
- `/about` درباره ما
- `/agency` نمایندگی
- `/login` ورود
- `/panel` پنل مدیریت
- `/dashboard` داشبورد نماینده

## منطق کمیسیون و تسویه

- نماینده بیمه‌نامه را ثبت می‌کند؛ وضعیت اولیه `PENDING` است و **هنوز کمیسیونی ندارد**.
- با تأیید بیمه‌نامه توسط مدیر (`APPROVED`) کمیسیون (۱۰٪ مبلغ) ساخته می‌شود.
- اگر وضعیت از `APPROVED` به حالت دیگری برگردد و هنوز تسویه‌ای ثبت نشده باشد، کمیسیون حذف می‌شود؛ اگر تسویه ثبت شده باشد، تغییر وضعیت مجاز نیست.
- تسویه فقط روی کمیسیون موجود و تا سقف مبلغ باقی‌مانده ثبت می‌شود (کنترل در Backend و با `CHECK` در دیتابیس).

## APIهای اصلی

- POST `/api/login`
- POST `/api/logout`
- GET `/api/me`
- GET `/api/public/news`
- GET `/api/representatives`
- POST `/api/representatives`
- PATCH `/api/representatives/:id`
- GET `/api/insurance`
- POST `/api/insurance`
- PATCH `/api/insurance/:id`
- GET `/api/commissions`
- GET `/api/settlements`
- POST `/api/settlements`
- GET `/api/dashboard/summary`
- GET `/api/admin/summary`
- GET `/api/notifications`
- POST `/api/notifications`
- DELETE `/api/notifications/:id`
- GET `/api/admin/content`
- POST/PATCH/DELETE `/api/news...`
- POST/DELETE `/api/achievements...`
- POST/DELETE `/api/testimonials...`
- POST/DELETE `/api/team...`
- GET/PUT `/api/settings`

## متغیرهای محیطی

| متغیر | توضیح |
|---|---|
| `NODE_ENV=production` | فعال‌سازی حالت Production (cookie امن، الزام `SESSION_SECRET`) |
| `SESSION_SECRET` | الزامی در Production |
| `ADMIN_PASSWORD` | الزامی در اولین اجرای Production (رمز کاربر `admin`) |
| `PORT` | پیش‌فرض `3001` |
| `DB_PATH` | مسیر فایل دیتابیس (پیش‌فرض `server/data/aria-safir.db`) |
| `CORS_ORIGIN` | فقط اگر فرانت روی دامنه‌ای جدا از Backend است |

مثال:

```bash
npm run build
NODE_ENV=production SESSION_SECRET=یک-مقدار-تصادفی-طولانی ADMIN_PASSWORD=رمز-قوی npm start
```

توجه: در Production حساب `rep1` ساخته نمی‌شود و رمز پیش‌فرض `Admin@12345` هم استفاده نمی‌شود.
اگر قبلاً نسخه قدیمی را اجرا کرده‌اید، پوشه `server/data` (فقط داده آزمایشی) را پاک کنید تا دیتابیس با ساختار جدید ساخته شود.

## نکات امنیتی

- رمزها Hash شده‌اند و Plain Text در SQLite ذخیره نمی‌شوند.
- Queryهای SQLite پارامتری هستند.
- Session با Cookie `httpOnly` مدیریت می‌شود.
- Login Rate Limit دارد (فقط تلاش‌های ناموفق شمرده می‌شوند) و بعد از ورود، Session جدید ساخته می‌شود.
- Role در Backend بررسی می‌شود.
- Representative فقط رکوردهای متعلق به خودش را دریافت می‌کند.
- تسویه در یک Transaction انجام می‌شود و بیشتر از باقی‌مانده مجاز نیست.
- شماره بیمه‌نامه در Backend به‌صورت تصادفی ساخته و با UNIQUE در دیتابیس کنترل می‌شود.
- مبلغ‌ها، وضعیت‌ها و رابطه کمیسیون/تسویه علاوه بر Backend با `CHECK` و Foreign Key در دیتابیس هم محافظت می‌شوند.

## برای Production

قبل از انتشار واقعی:
1. `SESSION_SECRET` را به یک مقدار تصادفی قوی تغییر دهید.
2. HTTPS فعال کنید.
3. `secure` cookie را در Production فعال نگه دارید.
4. CORS فقط در صورت نیاز و با `CORS_ORIGIN` روی دامنه واقعی فعال شود.
5. اطلاعات تماس و متن‌های نمونه را با اطلاعات واقعی جایگزین کنید.
6. Session در حافظه سرور نگه‌داری می‌شود و با ری‌استارت سرور، کاربران باید دوباره وارد شوند؛ برای مقیاس بالاتر از Session Store پایدار استفاده کنید.
7. از فایل دیتابیس (`server/data`) به‌صورت منظم نسخه پشتیبان بگیرید.

## افکت‌های ظاهری

- `src/components/ScrollScene.jsx`: پس‌زمینه‌ی سه‌بعدی (تونل و ستاره‌ها) که فقط به موقعیت اسکرول وابسته است؛ اسکرول به پایین یعنی حرکت رو به جلو و اسکرول به بالا یعنی حرکت به عقب.
- `src/components/ScrollReveal.jsx`: ظاهر شدن سه‌بعدی بخش‌ها هنگام رسیدن به صفحه‌نمایش.
- `src/theme.css`: رنگ‌ها (متغیرهای `--navy`، `--mango` و …) و استایل کارت‌ها؛ برای تغییر رنگ‌ها فقط بالای همین فایل را ویرایش کنید.
- اگر سیستم کاربر «کاهش حرکت» را فعال کرده باشد، انیمیشن‌ها غیرفعال می‌شوند.
