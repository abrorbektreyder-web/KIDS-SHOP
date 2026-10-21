# MULTI-TENANT E-COMMERCE SAAS PLATFORM
## MAHSULOTNING TO‘LIQ PRD (PRODUCT REQUIREMENTS DOCUMENT) VA TEXNIK VAZIFASI (TZ)

> **Hujjat holati:** AMALDA (LIVING DOCUMENT)  
> **Joriy versiya:** 1.1.0-TRACKER  
> **Muallif:** Senior Software Architect & Full-Stack Engineer  
> **Loyiha nomi:** Universal Multi-Tenant E-Commerce SaaS Platform (Web + Telegram Mini App + Bot)  
> **Maqsad:** Loyihani bosqichma-bosqich, adashmasdan, har bir qadamni belgilab borish orqali to‘liq SaaS holatiga keltirish.

---

## 📌 JORIY HOLAT VA BAJARILGAN ISHLAR STATISTIKASI

```
[==========================================================] 100% TO'LIQ BAJARILDI
Umumiy vazifalar: 29 ta | Bajarildi: 29 ta | Qoldi: 0 ta (Loyihaning barcha bosqichlari to'liq yakunlandi!)
```

| Faza / Yo‘nalish | Holati | Mas’ul |
|---|---|---|
| **0-Faza: Audit va Vitrina tuzatishlari** | ✅ **BAJARILDI (100%)** | Fullstack Dev |
| **1-Faza: Ma’lumotlar bazasi va Multi-Tenant poydevor** | ✅ **BAJARILDI (100%)** | Database & Backend |
| **2-Faza: Super Admin Panel (SaaS egasi uchun)** | ✅ **BAJARILDI (100%)** | Frontend & Backend |
| **3-Faza: Tadbirkor Shaxsiy Kabineti (Merchant Dashboard)** | ✅ **BAJARILDI (100%)** | Frontend & Backend |
| **4-Faza: Telegram Webhook va Interaktiv Tugmalar** | ✅ **BAJARILDI (100%)** | Telegram & Backend |
| **5-Faza: Mustaqillik Testlari va Production Launch** | ✅ **BAJARILDI (100%)** | QA & DevOps |

---

## ✅ NAZORAT RO‘YXATI (LIVING TASK TRACKER)

Har bir vazifa bajarilgach, ushbu ro‘yxatda `[ ]` belgisi `[x]` ga o‘zgartirib boriladi. Bu adashib ketishning oldini oladi.

### 0-FAZA: Dastlabki Audit va Vitrina yaxshilanishlari (TAYYOR)
- [x] **TASK-001:** Tizimning to‘liq professional texnik auditi (kod, xavfsizlik, hosting, ma’lumotlar bazasi tahlili).
- [x] **TASK-002:** Vitrina mahsulot kartasi va draweriga ranglar palitrasini (`colors`) ulash.
- [x] **TASK-003:** Ranglarni tanlash (Color picker) va tanlangan rang nomini o‘zbekcha/ruscha chiqarish.
- [x] **TASK-004:** O‘lchamlarni faqat yosh emas, balki standart bo‘y/o‘lcham bilan birga ko‘rsatish (`92–98 sm · 2–3 yosh`).
- [x] **TASK-005:** Tanlangan rang va o‘lchamni savatda, buyurtmada va Telegram hisobotiga to‘g‘ri uzatish.

---

### 1-FAZA: Ma’lumotlar bazasi va Multi-Tenant Poydevor (Sprint 1)
- [x] **TASK-101:** Supabase PostgreSQL’da `public.stores` (do‘konlar) jadvalini yaratish (ID/slug, nom, telefon, parol, Telegram chat ID, muddat).
- [x] **TASK-102:** `public.products`, `public.orders`, `public.order_items`, `public.subscribers` jadvallariga `store_id` ustunini va Foreign Key bog‘lanishlarini qo‘shish.
- [x] **TASK-103:** Tranzaksion `place_order` SQL funksiyasini `store_id` bo‘yicha tovar zaxirasini tekshiradigan va buyurtmani tegishli do‘konga yozadigan qilib yangilash.
- [x] **TASK-104:** 1000+ do‘konda qotmasligi uchun bazada `store_id` ustunlariga B-Tree indekslarini o‘rnatish.
- [x] **TASK-105:** `vercel.json`dagi `X-Frame-Options: DENY`ni olib tashlab, Telegram Mini App uchun to‘g‘ri CSP (`frame-ancestors`) o‘rnatish.
- [x] **TASK-106:** `GET /api/products` API sini `?store=...` so‘rovi bo‘yicha faqat o‘sha do‘kon tovarlarini filtrlaydigan qilish.
- [x] **TASK-107:** `POST /api/orders` API sini kelgan `store_id` orqali bazadan o‘sha do‘konning `telegram_chat_id` sini olib, buyurtmani aynan o‘sha guruhga yo‘naltiradigan qilish.

---

### 2-FAZA: Super Admin Panel (Platforma Egasi Boshqaruvi - Sprint 2)
- [x] **TASK-201:** Super Admin uchun maxsus xavfsiz autentifikatsiya tizimi (`/api/super-admin/auth`).
- [x] **TASK-202:** Super Admin interfeys sahifasini yaratish (`/public/super-admin/index.html`).
- [x] **TASK-203:** **"+ Yangi do‘kon ochish"** modali va API si (Nom, slug, tadbirkor telefoni, boshlang‘ich parol, Telegram guruh ID).
- [x] **TASK-204:** Yangi do‘kon yaratilganda tizim avtomatik unga 3 ta havolani generatsiya qilishi:
  - 🌐 Sayt havolasi: `safari.platforma.uz`
  - 📱 Telegram Mini App: `t.me/Platform_Bot?startapp=safari`
  - 🔐 Do‘kon admini: `safari.platforma.uz/admin`
- [x] **TASK-205:** Barcha do‘konlar ro‘yxati jadvali (Nomi, subdomeni, buyurtmalar soni, egasi telefoni, obuna muddati, holati).
- [x] **TASK-206:** Do‘konni bitta tugma bilan bloklash / faollashtirish (to‘lov qilmaganlar uchun vitrinani yopish).
- [x] **TASK-207:** Obuna muddatini uzaytirish tugmasi (+30 kun, +90 kun, +365 kun).
- [x] **TASK-208:** Global dashboard analitikasi (Jami do‘konlar, jami buyurtmalar, oylik kutilayotgan tushum MRR).

---

### 3-FAZA: Tadbirkor Shaxsiy Kabineti (Merchant Dashboard - Sprint 3)
- [x] **TASK-301:** Har bir tadbirkor uchun o‘z subdomenida (`/admin/`) shaxsiy login/parol tizimi.
- [x] **TASK-302:** Do‘kon egasi faqat o‘z tovarlarini ko‘rishi va yangi tovar qo‘shishi/tahrirlashi/o‘chirishi (CRUD).
- [x] **TASK-303:** Tovar qo‘shishda Ranglar palitrasi va Razmerlarni qulay checkboxlar orqali belgilash interfeysi.
- [x] **TASK-304:** Mahsulot rasmini yuklashda brauzerda avtomatik WebP ga siqish va Supabase Storage’ga yuklash.
- [x] **TASK-305:** Do‘konning shaxsiy buyurtmalar ro‘yxati va holatlarni yangilash (Yangi -> Tasdiqlandi -> Jo‘natildi -> Yetkazildi).
- [x] **TASK-306:** Telegram integratsiyasi sozlamalari (Guruh ID sini kiritish va "Sinov xabari yuborish" tugmasi).
- [x] **TASK-307:** Kassa va tushum hisoboti (Kunlik, haftalik, oylik tushum va Top sotilgan tovarlar).
- [x] **TASK-308:** Vitrina va brendingni moslashtirish (Dynamic Storefront Customization): Bosh banner sarlavhasi (Hero Title), tavsifi (Hero Subtitle), banner rasmi, tugma matni, e'lonlar satri (Ticker), aloqa telefoni, telegram, Telegram Mini App deep linkini nusxalash (`t.me/Bot?startapp=slug`) va maxsus tovar kategoriyalari (Custom Categories CRUD).

---

### 4-FAZA: Telegram Bot Webhook va Interaktiv Tugmalar (Sprint 4)
- [x] **TASK-401:** Do‘kon guruhiga boruvchi buyurtma xabari ostiga Inline tugmalar ulash: `[ ✅ Qabul qilish ]`, `[ 🚚 Yetkazildi ]`, `[ ❌ Bekor qilish ]` hamda `telegram_message_id` saqlash.
- [x] **TASK-402:** Serverda `/api/telegram-webhook.js` xizmatini yaratish va `?setup=1` orqali bir marta bosishda ro‘yxatdan o‘tkazish mexanizmi.
- [x] **TASK-403:** Operator Telegramdagi "Qabul qilish" tugmasini bosganda, bazada statusni `confirmed` qilish va xabar matnini `"✅ Qabul qildi: @operator"` deb yangilash (`editMessageText`).
- [x] **TASK-404:** Telegram Mini App deep-linking (`startapp=slug`) va `/start {slug}` mexanizmini to‘liq tekshirish va ishga tushirish.

---

### 5-FAZA: Sinovlar, Xavfsizlik va Production Launch (Sprint 5)
- [x] **TASK-501:** Do‘kon A va Do‘kon B ni ochib, to‘liq mustaqillikni amaliy tekshirish (tests/sprint5_security_isolation.test.js orqali verifikatsiya qilindi):
  - Do‘kon A buyurtmasi Do‘kon B guruhiga aslo tushmasligi;
  - Do‘kon A admini Do‘kon B tovarlarini ko‘ra olmasligi.
- [x] **TASK-502:** Telegram Mini App’ni Telegram Web, Desktop, Android va iOS ilovalarida test qilish (CSP frame-ancestors, startapp deep linking).
- [x] **TASK-503:** Xavfsizlik va IDOR testlari (begona ID bilan tovar yoki buyurtmaga kirishni sinab ko‘rish va bloklash).
- [x] **TASK-504:** Asosiy `main` branchga merge qilish va Vercel production deploy (`https://kids-shop-six.vercel.app`).

---

## 1. LOYIHA KONSEPSIYASI VA BIZNES TALABLARI

### 1.1. Asosiy maqsad
O‘zbekistondagi kiyim-kechak, poyabzal, o‘yinchoq va boshqa tovarlar sotuvchi kichik tadbirkorlarga bir necha daqiqa ichida o‘zlarining shaxsiy brendiga ega bo‘lgan quyidagi 4 ta vositani bitta tizimda taqdim etish:
1. **Mustaqil Veb-sayt:** Bepul subdomen (`dokon.platforma.uz`) yoki shaxsiy domen (`dokon.uz`) orqali ishlovchi zamonaviy internet-do‘kon.
2. **Telegram Mini App:** Xuddi shu do‘konning Telegram ichida bir zumda ochiluvchi mobil ilovasi.
3. **Telegram Buyurtma Xabarnomasi:** Sayt yoki Mini App’dan tushgan buyurtmalarni tadbirkorning o‘z Telegram kanali yoki operatorlar guruhiga interaktiv hisobot sifatida yetkazish.
4. **Shaxsiy Boshqaruv Kabineti (Merchant Dashboard):** Tovarlar, narxlar, ranglar, razmerlar, buyurtma holatlari va savdo tushumini mustaqil boshqarish.

---

## 2. ARXITEKTURA VA TIZIM DIZAYNI

### 2.1. Tizimning umumiy arxitekturasi (Decoupled & Multi-Tenant)

```mermaid
flowchart TD
    subgraph Clients ["Mijozlar va Do'konlar"]
        ClientWeb["Mijoz Saytda (dokon1.platforma.uz yoki custom.uz)"]
        ClientTMA["Mijoz Telegram Mini App'da (t.me/bot?startapp=dokon1)"]
        MerchantAdmin["Tadbirkor Kabineti (/admin)"]
        SuperAdmin["SaaS Egasi (Super Admin /super-admin)"]
    end

    subgraph EdgeRouting ["Vercel Edge & Multi-Tenant Resolver"]
        Router["Tenant Resolver (Domain / Subdomain / Slug)"]
    end

    subgraph BackendAPI ["Serverless API Layer (Node.js)"]
        CatalogAPI["/api/products?store=..."]
        OrderAPI["/api/orders (Tranzaksiya & Qabul)"]
        TGWebhook["/api/telegram-webhook (Callback buttons)"]
        MerchantAPI["/api/merchant/* (Auth: JWT / Session)"]
        SuperAdminAPI["/api/super-admin/* (Auth: Super Admin Secret)"]
    end

    subgraph DataStore ["Supabase PostgreSQL (Multi-Tenant RLS)"]
        StoresTable[("stores (Do'konlar, sozlamalar, guruh ID)")]
        ProductsTable[("products (store_id indekslangan)")]
        OrdersTable[("orders (store_id, holat, tushum)")]
        OrderItemsTable[("order_items (razmer, rang, narx)")]
    end

    subgraph TelegramCloud ["Telegram Bot Ecosystem"]
        CentralBot["Central SaaS Bot (@Platform_Bot)"]
        MerchantGroup["Tadbirkor Kanali / Guruxi"]
    end

    ClientWeb --> Router
    ClientTMA --> Router
    Router --> CatalogAPI
    Router --> OrderAPI

    MerchantAdmin --> MerchantAPI
    SuperAdmin --> SuperAdminAPI

    CatalogAPI --> ProductsTable
    OrderAPI --> OrdersTable
    OrderAPI --> OrderItemsTable
    OrderAPI --> CentralBot

    CentralBot -->|sendMessage| MerchantGroup
    MerchantGroup -->|Qabul qilish tugmasi| CentralBot
    CentralBot -->|Webhook| TGWebhook
    TGWebhook --> OrdersTable
```

### 2.2. Frontendni istalgan paytda almashtirish imkoniyati (Decoupled / Headless Kafolati)

> [!IMPORTANT]
> **Arxitekturaviy Tamoyil (Decoupled Architecture):**
> Backend (Baza, API, Telegram mantiqi) va Frontend (Dizayn, UI/UX) bir-biridan to‘liq ajratilgan holda ishlaydi.
> - **Natija:** Siz frontend dizaynini bugun Vanilla JS/CSS’da qoldirib, keyinchalik xohlagan paytingizda Next.js, React, Tailwind yoki tayyor shablonlarga almashtirishingiz mumkin.
> - Yangi dizayn o‘rnatilganda backend yoki bazaga 1 qator ham o‘zgartirish kiritish shart bo‘lmaydi. Frontend faqat JSON API (`/api/products`, `/api/orders`) bilan ishlaydi.

---

## 3. FOYDALANUVCHI ROLLARI VA HUQUQLARI (RBAC)

| Rol | Kirish manzili | Huquqlar va Mas’uliyat |
|---|---|---|
| **Super Admin (SaaS Egasi)** | `/super-admin/` | Platformani to‘liq nazorat qilish, yangi do‘kon ochish, subdomen berish, obuna muddatini uzaytirish, do‘konlarni bloklash, umumiy moliyaviy tushumni (MRR) ko‘rish. |
| **Store Owner (Do‘kon Egasi)** | `/admin/` (o‘z subdomenida) | Faqat o‘z do‘konini boshqarish: tovar qo‘shish/tahrirlash, rasmlar yuklash, narx/rang/razmer belgilash, buyurtmalarni ko‘rish, kassa hisobotlarini olish, o‘z Telegram guruhini ulash. |
| **Operator (Do‘kon Xodimi)** | `/admin/` (cheklangan) | Faqat kelgan buyurtmalarni ko‘rish, mijozga qo‘ng‘iroq qilish va buyurtma holatini "Yetkazildi" yoki "Bekor qilindi"ga o‘tkazish. Tovar narxlarini o‘zgartira olmaydi. |
| **Customer (Xaridor)** | Vitrina / Mini App | Ro‘yxatdan o‘tmasdan katalog ko‘rish, rang/o‘lcham tanlash, savat yig‘ish va buyurtma berish. |

---

## 4. MA’LUMOTLAR BAZASI SXEMASI (SUPABASE POSTGRESQL DDL)

```sql
-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 2. STORES (TENANTS) JADVALI
create table if not exists public.stores (
  id text primary key,                        -- Masalan: 'safari-kids', 'ali-toys' (slug)
  name text not null,                         -- Do'kon nomi: "Safari Kids Wear"
  owner_phone text not null,                  -- Tadbirkor telefoni
  owner_password_hash text not null,          -- Parol heshi
  custom_domain text unique,                  -- Ixtiyoriy shaxsiy domen: "safarikids.uz"
  logo_url text default '/images/look-safari.webp',
  theme_color text default '#285ae8',         -- Do'konning asosiy rangi
  currency text default 'UZS',
  telegram_chat_id text not null,             -- Do'kon buyurtmalari boradigan Telegram Group/Channel ID
  telegram_bot_token text,                    -- Ixtiyoriy: agar do'kon o'z botini ulamoqchi bo'lsa
  plan text not null default 'basic' check (plan in ('trial', 'basic', 'pro')),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  plan_expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PRODUCTS (TOVARLAR) JADVALI (store_id qo'shilgan)
create table if not exists public.products (
  id text not null,
  store_id text not null references public.stores(id) on delete cascade,
  name_uz text not null,
  name_ru text not null,
  category text not null,
  type text not null default 'general',
  price integer not null check (price >= 0),
  old_price integer check (old_price is null or old_price >= price),
  age text not null default '',
  colors text[] not null default '{}',
  image_url text not null default '/images/look-safari.webp',
  badge text not null default '',
  tagline_uz text not null default '',
  tagline_ru text not null default '',
  sizes text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id, id)
);

-- 4. ORDERS (BUYURTMALAR) JADVALI (store_id qo'shilgan)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  order_number bigint generated always as identity,
  customer_name text not null,
  phone text not null,
  region text not null,
  district text not null,
  address text not null,
  comment text not null default '',
  payment text not null default 'cod' check (payment in ('cod', 'card')),
  language text not null default 'uz' check (language in ('uz', 'ru')),
  total integer not null check (total >= 0),
  status text not null default 'new' check (status in ('new', 'confirmed', 'packing', 'sent', 'completed', 'cancelled')),
  telegram_message_id text,                   -- Telegram guruhidagi post ID si
  accepted_by text,                           -- Qabul qilgan operator
  created_at timestamptz not null default now()
);

-- 5. ORDER_ITEMS (BUYURTMA TARKIBI - RANG VA RAZMER BILAN)
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  size text not null,
  color text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0)
);

-- 6. SUBSCRIBERS (NEWSLETTER - HAR BIR DO'KONGA ALOHIDA)
create table if not exists public.subscribers (
  store_id text not null references public.stores(id) on delete cascade,
  phone text not null,
  language text not null default 'uz',
  created_at timestamptz not null default now(),
  primary key (store_id, phone)
);

-- 7. INDEKSLAR (1000 TA DO'KON UCHUN MAKSIMAL TEZLIK)
create index if not exists idx_stores_status on public.stores (status);
create index if not exists idx_products_store_active on public.products (store_id, active, created_at desc);
create index if not exists idx_orders_store_status on public.orders (store_id, status, created_at desc);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

-- 8. ROW LEVEL SECURITY (RLS)
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscribers enable row level security;

revoke all on public.stores, public.products, public.orders, public.order_items, public.subscribers from public, anon, authenticated;
grant all on public.stores, public.products, public.orders, public.order_items, public.subscribers to service_role;
```

---

## 5. SUPER ADMIN PANEL FUNKSIONAL TALABLARI (PLATFORMA EGASI UCHUN)

Super Admin panel — platforma egasining boshqaruv markazidir.

### 5.1. Dashboard & Analitika oynasi
- **Asosiy Metrikalar Kartalari:**
  - Jami do‘konlar soni (jami, faol, to‘xtatilgan).
  - Jami oylik tushum (MRR - Monthly Recurring Revenue).
  - Bugungi va joriy oydagi barcha do‘konlar bo‘yicha umumiy buyurtmalar soni va savdo hajmi.
- **Obunasi tugayotgan do‘konlar:**
  - Keyingi 3–5 kunda to‘lov muddati tugaydigan do‘konlar ro‘yxati (ogohlantirish uchun telefon raqamlari bilan).

### 5.2. Do‘konlarni boshqarish (Stores Management)
- **Yangi do‘kon qo‘shish modal oynasi (`+ Yangi do‘kon`):**
  - Do‘kon nomi (*masalan: "Ali Poyabzal"*).
  - Do‘kon ID / Subdomen (*masalan: "alishoes" -> `alishoes.platforma.uz`*).
  - Tadbirkorning telefon raqami va boshlang‘ich paroli.
  - Telegram Chat ID (*operatorlar guruhi ID raqami*).
  - Boshlang‘ich tarif (*Trial 14 kun, Basic $5, Pro $10*).
- **Do‘konlar jadvali:**
  - ID / Nomi | Subdomen | Egasi telefoni | Buyurtmalar soni | Obuna tugash sanasi | Holati (Faol / Bloklangan) | Amallar.
- **Amallar (Actions):**
  - **Bloklash / Faollashtirish:** Bitta tugma bilan do‘kon vitrinasini vaqtinchalik to‘xtatib qo‘yish (to‘lov qilmaganlar uchun).
  - **Obunani uzaytirish:** +30 kun, +90 kun, +365 kun qo‘shish.
  - **Tahrirlash:** Telegram guruh ID sini yoki tarifini o‘zgartirish.

---

## 6. TADBIRKOR ADMIN PANELI FUNKSIONAL TALABLARI (MERCHANT DASHBOARD)

Har bir do‘kon egasi faqat o‘z do‘konini boshqaradi (`/admin/`).

### 6.1. Buyurtmalar bo‘limi (Orders Management)
- Yangi tushgan buyurtmalar audio-signal (bildirishnoma) bilan ko‘rinadi.
- Filtrlash: Yangi, Tasdiqlandi, Yo‘lda, Yetkazildi, Bekor qilindi.
- Har bir buyurtma kartasida:
  - Mijoz ismi, telefon raqami (bitta bosishda qo‘ng‘iroq qilish `tel:` tugmasi).
  - Yetkazib berish manzili va xaridor izohi.
  - Tovar nomi, tanlangan **o‘lchami (sm va yosh)** hamda **rangi**.
  - Jami summa va to‘lov usuli.
  - Statusni o‘zgartirish dropdown selektori.

### 6.2. Mahsulotlar katalogi bo‘limi (Products Management)
- **Tovar qo‘shish / tahrirlash:**
  - Tovar nomi (O‘zbekcha va Ruscha).
  - Narxi va Eski chegirma narxi.
  - Kategoriya va Turi.
  - Rasm yuklash: Brauzerda avtomatik 1600px gacha siqiladi va WebP formatda Supabase Storage’ga yuklanadi.
  - **Ranglar palitrasi tanlash:** Ranglar ro‘yxatidan checkboxlar yoki HEX kiritish orqali tovarning mavjud ranglarini belgilash.
  - **O‘lchamlar tanlash:** Standart o‘lchamlar (92–98 sm, 98–104 sm, S, M, L va h.k.) ro‘yxatidan tanlash.
  - Zaxiradagi soni (dona).
  - Saytda ko‘rsatish / Yashirish tugmasi.

### 6.3. Do‘kon sozlamalari va Telegram integratsiyasi
- Do‘kon nomi, logosi va asosiy rangi (`theme_color`).
- **Telegram sozlamalari:**
  - Botni guruhga ulash bo‘yicha 3 qadamli vizual qo‘llanma.
  - Guruh ID raqamini kiritish maydoni.
  - **"Sinov xabari yuborish"** tugmasi (Telegram guruh to‘g‘ri ulanganini tekshirish uchun).

### 6.4. Savdo va Tushum hisoboti (Analytics)
- Bugungi, haftalik va oylik sof savdo tushumi (so‘mda).
- Eng ko‘p sotilgan tovarlar reytingi (Top 5).
- Muvaffaqiyatli yetkazilgan buyurtmalar foizi.

---

## 7. TELEGRAM MINI APP VA BOT INTEGRATSIYA TALABLARI

### 7.1. Deep-Linking va Marshrutizatsiya
- Platformaning yagona boti bo‘ladi: `@Platform_Bot`.
- Har bir do‘kon uchun Mini App havolasi avtomatik quyidagicha generatsiya qilinadi:  
  `https://t.me/Platform_Bot?startapp={store_id}`
- Mini App ochilganda, Telegram yuborgan `startapp` parametri orqali vitrina darhol aynan o‘sha do‘konning logosi va tovarlari bilan ochiladi.

### 7.2. Buyurtmani Telegram guruhga formatlab yuborish
Xaridor saytdan yoki Mini App’dan buyurtma bersa, tadbirkorning guruhiga quyidagi formatda boy xabar boradi:

```html
🛍 <b>YANGI BUYURTMA · #1084</b>
🏪 Do‘kon: <b>Safari Kids</b>
━━━━━━━━━━━━━━━━━━━━
👤 Xaridor: <b>Azizbek Rahimov</b>
📞 Telefon: <a href="tel:+998901234567">+998 90 123 45 67</a>
📍 Manzil: Toshkent sh., Chilonzor tumani, 9-mavze, 12-uy
💬 Izoh: Eshik oldida qo‘ng‘iroq qiling

📦 <b>Buyurtma tarkibi:</b>
• Safari mini ko‘ylak — 92–98 sm (2–3 yosh) [Rang: Zaytunrang] × 1 dona: 219 000 so‘m
• Adventure kundalik set — 98–104 sm [Rang: To‘q ko‘k] × 1 dona: 289 000 so‘m

💰 <b>JAMI TO‘LOV: 508 000 so‘m</b>
💳 To‘lov turi: Yetkazilganda to‘lov (Naqd/Karta)
```

### 7.3. Interaktiv Inline tugmalar va Webhook
Xabarning ostida Telegram tugmalari bo‘ladi:
- `[ ✅ Qabul qilish ]` — Operator tugmani bossa, backend statusni `confirmed`ga o‘tkazadi va xabar matnini quyidagicha yangilaydi:  
  `✅ Qabul qildi: @operator_username`
- `[ 🚚 Yetkazildi ]` — Yetkazib berilgach yopiladi.
- `[ ❌ Bekor qilish ]` — Zaxiraga qaytariladi.

---

## 8. XAVFSIZLIK VA ISHONCHLILIK TALABLARI (NON-FUNCTIONAL)

1. **Tenant Isolation (IDOR himoyasi):**  
   Har qanday API so‘rovida sessiyadagi `store_id` bilan so‘ralayotgan obyektning `store_id`si mos kelishi qat’iy tekshiriladi. Bitta do‘kon ikkinchisining ma’lumotini aslo ololmaydi.
2. **Iframe & CSP Security:**  
   `vercel.json`dagi `X-Frame-Options: DENY` o‘rniga zamonaviy xavfsizlik standarti o‘rnatiladi:
   ```json
   {
     "key": "Content-Security-Policy",
     "value": "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org;"
   }
   ```
3. **Tranzaksion inventarizatsiya:**  
   Bir vaqtda bir nechta buyurtma tushganda tovar soni minusga ketmasligi uchun PostgreSQL `FOR UPDATE` qulflash mexanizmi to‘liq saqlanadi.
4. **Retry Queue (Telegram nosozligiga qarshi):**  
   Agar Telegram API vaqtincha javob bermasa, buyurtma bazada `telegram_status = 'pending'` bo‘lib saqlanadi va fon xizmati orqali 3 marta qayta jo‘natiladi.
