# Do‘kon Hisob — AI agentlar uchun doimiy qoidalar

Loyiha: o‘zbek tilidagi ko‘p do‘konli savdo va ombor veb-ilovasi. To‘liq talablar `SPEC.md` faylida. Ziddiyat bo‘lsa, `SPEC.md` ichidagi «0. Yangilangan qarorlar» bo‘limi ustun turadi.

## Stek
- Next.js (App Router), TypeScript `strict`
- Supabase: Auth + PostgreSQL. Migratsiyalar `supabase/migrations/` ichida, lokal ishga tushirish `supabase start` bilan.
- Pul va miqdor: Postgres’da `numeric`, JS’da decimal kutubxona (`decimal.js`). `float` / `Number` bilan pul hisoblash taqiqlanadi.
- Testlar: Vitest (unit), pgTAP yoki SQL testlar (RLS va DB funksiyalari), Playwright (asosiy oqimlar).

## Qat’iy qoidalar
1. Har bir biznes jadvalida `shop_id` bo‘ladi, RLS yoqiladi va har bir siyosat uchun test yoziladi.
2. Qoldiq, pul yoki tannarxni o‘zgartiradigan har bir amal faqat Postgres funksiyasi (RPC) ichida, bitta tranzaksiyada bajariladi. Brauzerdan bu jadvallarga to‘g‘ridan-to‘g‘ri yozilmaydi.
3. Sotuv, kirim, qaytim, hisobdan chiqarish va inventarizatsiya `idempotency_key` bilan ishlaydi. Qayta yuborilgan so‘rov avvalgi natijani qaytaradi.
4. Tasdiqlangan hujjat o‘zgartirilmaydi va o‘chirilmaydi. O‘zgarish faqat sababli tuzatish harakati orqali kiritiladi.
5. Kassir uchun tannarx va foyda server javobida umuman bo‘lmaydi. UI’da yashirish yetarli emas.
6. `SUPABASE_SERVICE_ROLE_KEY` faqat serverda ishlatiladi, `NEXT_PUBLIC_` o‘zgaruvchilariga hech qachon qo‘yilmaydi.
7. UI matnlari o‘zbek lotin yozuvida. `o‘` va `g‘` uchun bitta belgini (`‘`, U+2018) izchil ishlat. Pul `125 000 so‘m` ko‘rinishida. Vaqt hisobi do‘kon vaqt mintaqasida (standart `Asia/Tashkent`).
8. Demo ma’lumot faqat seed orqali qo‘shiladi va «Demo» deb belgilangan alohida do‘konlarda turadi.
9. Dizayn: fon `#F5F6F3`, matn `#17251F`, asosiy amal `#205D47`, qizil faqat xato va kam qoldiq uchun. Shrift Inter. Raqamlar `tabular-nums` bilan, o‘ngga tekislangan. Gradient, shisha effekt, emoji va bezak kartochkalari ishlatilmaydi.

## Ish tartibi
- Faqat so‘ralgan bosqichni bajar. Keyingi bosqichga o‘zboshimchalik bilan o‘tma.
- Bosqich boshida mavjud kodni o‘qi va ishlaydigan qismlarni buzma.
- Bosqich oxirida `npm run lint`, `npm run typecheck`, `npm test` va DB testlarini ishga tushirib, natijani ko‘rsat.
- Har bir ishlaydigan qadamdan keyin tushunarli xabar bilan git commit qil.
- Ishonching komil bo‘lmagan biznes qarorini o‘zing to‘qib chiqarma: so‘ra yoki hisobotda «Ochiq savol» deb belgila.

## Bosqich hisoboti (har bosqich oxirida, shu tartibda)
1. Nima qilindi (qisqa)
2. Yangi yoki o‘zgargan migratsiyalar
3. Test natijalari (o‘tgan / o‘tmagan soni)
4. Qanday ishga tushirib, qo‘lda sinab ko‘rish mumkin (3–5 qadam)
5. Tekshirilmagan qismlar va ochiq savollar
