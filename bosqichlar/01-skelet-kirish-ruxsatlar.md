# 1-bosqich: Loyiha skeleti, ko‘p do‘kon, login + PIN, ruxsatlar

`CLAUDE.md` va `SPEC.md`ni o‘qi (ayniqsa 0-bo‘lim va 7-bo‘lim). Bu loyihaning 1-bosqichi. Mahsulot, ombor va sotuv qismlarini hali **qilma**.

## Maqsad
Ko‘p do‘kon ro‘yxatdan o‘tib, har biri o‘z admin panelida ishlay oladigan, egasi va kassirlari login + PIN bilan kiradigan, ma’lumotlari bir-biridan ajratilgan asos.

## Qilinadigan ishlar
1. **Loyiha:** Next.js + TypeScript + Supabase, `.env.example`, `README.md` (lokal ishga tushirish: `supabase start`, migratsiya, seed, `npm run dev`). Skriptlar: `lint`, `typecheck`, `test`, `test:db`, `test:e2e`.
2. **Migratsiyalar** (faqat shu bosqichga keraklari):
   - `shops`: nom, vaqt mintaqasi (standart `Asia/Tashkent`), valyuta (`UZS`), `status` (`active` / `suspended`), `is_demo`
   - `profiles`: foydalanuvchi profili
   - `memberships`: user ↔ shop, rol (`owner` / `cashier`), ruxsatlar (`can_discount`, `can_refund`, `can_write_off`), faol/nofaol
   - `staff_credentials`: xodim logini, PIN hash, xato urinishlar soni, blok tugash vaqti
   - `pos_devices`: bog‘langan kassa qurilmalari (do‘kon, nom, qurilma tokeni hash, kim bog‘lagani, uzilgan vaqt)
   - `audit_log`: kim, qaysi do‘kon, nima, qachon, qaysi yozuv
3. **Ro‘yxatdan o‘tish:** egasi email + parol bilan ro‘yxatdan o‘tadi, so‘ng do‘kon yaratadi. Do‘kon va owner a’zoligi bitta tranzaksiyada yaratilsin.
4. **Kirish:**
   - Egasi: email + parol
   - Xodim: login + parol (istalgan qurilmada)
   - Bir nechta do‘kon a’zoligi bo‘lsa, do‘kon tanlash ekrani chiqadi. Faol do‘kon nomi sarlavhada doim ko‘rinadi.
5. **Kassa qurilmasi va PIN** (`SPEC.md` 0.2 ga to‘liq amal qil):
   - Egasi joriy brauzerni kassa qurilmasi sifatida bog‘laydi yoki uzadi.
   - Bog‘langan qurilmada «Xodimni tanlang → PIN» ekrani bo‘ladi. PIN server tomonda tekshiriladi va o‘sha xodim sessiyasi xavfsiz ochiladi.
   - 5 ta xatodan keyin 5 daqiqa blok, urinishlar audit’ga yoziladi.
   - Harakatsizlik qulfi (standart 5 daqiqa, sozlamada o‘zgartiriladi)
   - Xodim o‘chirilsa yoki PIN almashtirilsa, uning sessiyalari bekor bo‘ladi.
6. **Sozlamalar → Xodimlar** (faqat egasi): xodim qo‘shish, login/parol berish, PIN o‘rnatish yoki almashtirish, ruxsatlarni yoqish va o‘chirish, nofaol qilish.
7. **Sozlamalar → Do‘kon:** nom, vaqt mintaqasi, qulf vaqti, bog‘langan qurilmalar ro‘yxati.
8. **Layout:** menyu (Bosh sahifa, Kassa, Mahsulotlar, Ombor, Sotuvlar, Hisobotlar, Sozlamalar), rolga qarab ko‘rinadi. Hali tayyor bo‘lmagan bo‘limlar oddiy bo‘sh holat ko‘rsatsin. Dizayn tokenlari `CLAUDE.md` 9-banddagi kabi. Fokus va faol holatlar aniq ko‘rinsin.
9. **Server himoyasi:** har server action va API’da faol do‘kon a’zoligini va rolni tekshiradigan bitta umumiy yordamchi funksiya bo‘lsin.
10. **Seed:** «Demo» deb belgilangan 2 ta do‘kon, har birida 1 ta egasi va 2 ta kassir. Loginlar README’da yozilsin.

## Testlar (majburiy)
- A do‘kon foydalanuvchisi B do‘kon yozuvini ID’si bilan o‘qiy, o‘zgartira yoki o‘chira olmaydi (har bir jadval uchun).
- Kassir owner’ga tegishli ma’lumotni (xodimlar, qurilmalar, audit) API orqali ololmaydi.
- PIN: to‘g‘ri PIN ishlaydi, xato PIN rad etiladi, 5 xatodan keyin blok bo‘ladi, bog‘lanmagan qurilmada PIN ishlamaydi, o‘chirilgan xodim kira olmaydi.
- `suspended` do‘konda yozish amallari rad etiladi.
- E2E: ro‘yxatdan o‘tish → do‘kon yaratish → kassir qo‘shish → qurilmani bog‘lash → PIN bilan kirish.

## Tayyor bo‘lish mezoni
Lokal muhitda ishga tushadi, barcha testlar o‘tadi, hisobot `CLAUDE.md`dagi formatda yozilgan.
