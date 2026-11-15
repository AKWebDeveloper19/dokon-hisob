# Do‘kon Hisob

O‘zbek tilidagi ko‘p do‘konli savdo va ombor veb-ilovasi. Next.js + Supabase (Auth + PostgreSQL).

- To‘liq talablar: [`SPEC.md`](SPEC.md)
- AI agentlar uchun qoidalar: [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md)
- Bosqichlar: [`bosqichlar/`](bosqichlar)

**Holat:** 1-bosqich tayyor (ro‘yxatdan o‘tish, do‘kon, login + PIN, xodimlar, kassa qurilmalari, ruxsatlar).
Mahsulot, kassa va hisobot bo‘limlari hozircha bo‘sh.

---

## 1. Supabase loyihasini tayyorlash (bir marta)

1. [supabase.com](https://supabase.com) → **New project** (region: Frankfurt).
2. **SQL Editor** → **New query** → `supabase/migrations/` ichidagi har bir `.sql` faylni **nomi bo‘yicha tartib bilan**
   to‘liq nusxalab qo‘ying → **Run**. («Success. No rows returned» chiqishi kerak.)
3. **Authentication → Sign In / Providers → Email**:
   - Sinov paytida **Confirm email** ni o‘chirib qo‘yish qulay (aks holda egasi emailni tasdiqlashi kerak bo‘ladi).
4. **Project Settings → API Keys** dan quyidagilarni oling:
   - Project URL
   - `anon` (yoki `publishable`) kalit — brauzer uchun, ochiq bo‘lishi xavfsiz
   - `service_role` (yoki `secret`) kalit — **maxfiy**. Hech kimga, hech qayerga (chat, GitHub) yozmang.

> Kelajakda Supabase CLI bilan: `npx supabase@latest link` va `npx supabase@latest db push`.

## 2. Kompyuterda ishga tushirish

Kerak: Node.js 20.11 yoki yangiroq.

```bash
npm install
cp .env.example .env.local   # so‘ng .env.local ichini to‘ldiring
npm run dev
```

Brauzerda: <http://localhost:3000>

### Muhit o‘zgaruvchilari

| Nomi | Qayerda ishlatiladi | Maxfiymi |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | brauzer + server | yo‘q |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | brauzer + server | yo‘q (RLS himoya qiladi) |
| `SUPABASE_SERVICE_ROLE_KEY` | **faqat server** (xodim yaratish, PIN tekshiruvi) | **ha** |
| `TEST_DATABASE_ADMIN_URL` | faqat DB testlari | — |
| `ALLOW_DEMO_SEED` | faqat demo seed (`ha`) | — |

## 3. Demo ma’lumot (ixtiyoriy, faqat sinov loyihasida)

```bash
ALLOW_DEMO_SEED=ha npm run seed:demo
```

«Demo» belgili 2 ta do‘kon yaratiladi. Barcha parollar: `Demo12345`.

| Do‘kon | Kim | Kirish | PIN |
| --- | --- | --- | --- |
| Demo: Oziq-ovqat do‘koni | Egasi | `ega.demo1@example.com` | 2580 |
| | Kassir (chegirma) | login `demo1.kassa1` | 1357 |
| | Kassir (qaytim) | login `demo1.kassa2` | 2468 |
| Demo: Kiyim do‘koni | Egasi | `ega.demo2@example.com` | 3690 |
| | Kassir | login `demo2.kassa1` | 1593 |
| | Kassir (kirim) | login `demo2.kassa2` | 7531 |

Production loyihasida seed’ni **ishga tushirmang**.

## 4. Qo‘lda sinab ko‘rish (1-bosqich)

1. `/royxatdan-otish` → egasi sifatida ro‘yxatdan o‘ting → do‘kon nomini kiriting.
2. **Sozlamalar → Xodimlar** → kassir qo‘shing (login, parol, PIN).
3. **Sozlamalar → Kassa qurilmalari** → «Shu brauzerni kassa sifatida bog‘lash» → «Kassa rejimiga o‘tish».
4. PIN ekranida kassirni tanlang. Avval xato PIN kiriting (urinishlar soni chiqadi), keyin to‘g‘risini.
   Kassir menyusida Sozlamalar, Bosh sahifa, Ombor, Hisobotlar bo‘lmasligi kerak.
5. Sozlamalardagi qulf vaqtini 1 daqiqa qiling va kutib turing: ekran PIN bilan qulflanadi.
   Sahifani yangilash qulfni ochmasligi kerak.
6. Ikkinchi brauzerda (yoki inkognito) boshqa email bilan ikkinchi do‘kon oching: birinchi do‘kon ma’lumotlari ko‘rinmasligi kerak.

## 5. Testlar

```bash
npm run lint
npm run typecheck
npm test            # unit testlar
npm run test:db     # DB / RLS testlari (oddiy PostgreSQL 16 yetarli)
npm run test:e2e    # brauzer testi — haqiqiy Supabase va `npm run build` kerak
```

`test:db` har safar vaqtinchalik baza yaratadi, Supabase’ning auth qismini taqlid qiladi
(`tests/db/supabase-shim.sql`), barcha migratsiyalarni qo‘llaydi va oxirida bazani o‘chiradi.
Lokal Supabase bilan: `TEST_DATABASE_ADMIN_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres`.

## 6. Xavfsizlik qanday ishlaydi (qisqacha)

- Har bir jadvalda RLS yoqilgan. Do‘kon ma’lumotiga faqat o‘sha do‘kon a’zosi kira oladi.
  Bu brauzerda emas, ma’lumotlar bazasida tekshiriladi.
- O‘zgartirish amallari faqat DB funksiyalari orqali bajariladi. Jadvallarga to‘g‘ridan-to‘g‘ri yozish taqiqlangan.
- PIN faqat bcrypt hash ko‘rinishida saqlanadi. 5 ta xatodan keyin 5 daqiqaga bloklanadi va hamma urinish audit’ga yoziladi.
- PIN faqat egasi bog‘lagan kassa qurilmasida ishlaydi. Qurilma tokeni httpOnly cookie’da, DB’da esa uning hash’i saqlanadi.
- Xodim nofaol qilinsa, PIN’i yoki paroli almashtirilsa, uning eski tokenlari darhol kuchini yo‘qotadi.
  Bu JWT `iat` vaqti va `sessions_valid_after` taqqoslanishi orqali ishlaydi.
- `service_role` kaliti faqat serverda ishlatiladi va brauzer fayllariga tushmaydi (build’da tekshirilgan).
