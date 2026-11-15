# 1-bosqich hisoboti

## 1. Nima qilindi
- Next.js 16 + TypeScript + Supabase loyiha skeleti, dizayn tokenlari (Inter, `#F5F6F3` / `#17251F` / `#205D47`).
- Ro‘yxatdan o‘tish (egasi), do‘kon yaratish, do‘kon tanlash. Bir foydalanuvchi bir nechta do‘konga ega bo‘lishi mumkin.
- Kirish: egasi email + parol bilan, xodim login + parol bilan kiradi.
- Kassa qurilmasini bog‘lash va uzish, qurilmada PIN bilan kirish.
- PIN blokirovkasi (5 xato → 5 daqiqa), harakatsizlik qulfi (server cookie’sida saqlanadi, sahifani yangilash ochmaydi).
- Sozlamalar: do‘kon (nom, vaqt mintaqasi, qulf vaqti); xodimlar (qo‘shish, ruxsatlar, PIN, yangi parol, nofaol qilish, sessiyalarni yopish); qurilmalar.
- Rolga qarab menyu. Kassir Bosh sahifa, Ombor, Hisobotlar va Sozlamalarga kira olmaydi.
- Bo‘limlar (Kassa, Mahsulotlar, Ombor, Sotuvlar, Hisobotlar) hozircha bo‘sh holatda.
- Demo seed skripti, README, `.env.example`, E2E test.

## 2. Migratsiyalar
- `supabase/migrations/20261115000100_asos_dokon_azolik.sql`
  - Jadvallar: `shops`, `profiles`, `memberships`, `staff_logins`, `membership_pins`, `pos_devices`, `audit_log` (hammasida RLS yoqilgan).
  - Funksiyalar: `create_shop`, `get_shop_context`, `update_shop_settings`, `add_staff_member`, `update_staff_member`,
    `set_staff_active`, `revoke_staff_sessions`, `staff_user_for_password_reset`, `set_member_pin`, `list_shop_members`,
    `register_device`, `revoke_device`.
  - Faqat serverga ochiq funksiyalar: `device_lookup`, `device_staff_list`, `pin_check`.

## 3. Test natijalari

| Tekshiruv | Natija |
| --- | --- |
| `npm run lint` | toza |
| `npm run typecheck` | toza |
| `npm test` (unit) | 8 / 8 o‘tdi |
| `npm run test:db` (RLS, PIN, sessiyalar) | 30 / 30 o‘tdi |
| `npm run build` | muvaffaqiyatli |
| Server kaliti brauzer fayllarida | yo‘q (build natijasidan qidirildi) |
| `npm run test:e2e` | **ishga tushirilmadi** (pastga qarang) |

Testlarning o‘zi ham tekshirildi: RLS siyosati va token tekshiruvi ataylab buzilganda 4 ta test darhol yiqildi.

DB testlari nimalarni qamraydi:
- Boshqa do‘kon ma’lumotini ID orqali o‘qish, o‘zgartirish, xodim yoki qurilma qo‘shish mumkin emas.
- Anonim foydalanuvchi hech narsa o‘qiy olmaydi. Jadvallarga to‘g‘ridan-to‘g‘ri yozish taqiqlangan.
- Kassir qurilmalar, audit, boshqa xodimlar va egasi funksiyalariga kira olmaydi.
- PIN hash va qurilma token hash’i hech kimga qaytmaydi.
- PIN qoidalari, 5 xatodan keyin blok, blok tugashi, uzilgan yoki boshqa do‘kon qurilmasi.
- PIN almashganda yoki xodim nofaol qilinganda eski token ishlamaydi va auth sessiyalari o‘chadi.
- To‘xtatilgan do‘konda o‘qish ishlaydi, yozish rad etiladi.
- Barcha jadvallarda RLS yoqilgan.

## 4. Qo‘lda sinash
README’ning 4-bo‘limiga qarang (6 qadam).

## 5. Tekshirilmagan qismlar va ochiq savollar

**Tekshirilmagan:**
- **Haqiqiy Supabase bilan to‘liq oqim.** Ish muhitida Docker Hub va GitHub release’lari yopiq edi, shuning uchun Supabase Auth serverini ishga tushirib bo‘lmadi.
  - DB qismi oddiy PostgreSQL 16’da, Supabase auth sxemasini taqlid qiluvchi muhitda sinaldi.
  - Ilova sahifalari soxta Supabase javoblari bilan ochildi va 390 / 820 / 1024 / 1366 px kengliklarda ko‘zdan kechirildi (gorizontal toshib ketish yo‘q).
  - Ro‘yxatdan o‘tish, xodim yaratish va PIN bilan sessiya ochish haqiqiy Supabase’da hali ishlatib ko‘rilmagan. `tests/e2e/01-kirish-pin.spec.ts` aynan shu oqimni tekshiradi.
- **Hosted Supabase’da `auth.sessions` jadvalidan o‘chirish.** Sessiyalarni bekor qilish uchun funksiya shu jadvaldan yozuv o‘chiradi. Agar Supabase `postgres` roliga buni taqiqlasa, xodimni nofaol qilish xato beradi. Birinchi real sinovda tekshirish kerak.

**Ochiq savollar:**
1. Xodim bir nechta do‘konda ishlashi kerakmi? Hozir bitta xodim logini faqat bitta do‘konga biriktiriladi.
2. Ikkinchi egasi (sherik) kerakmi? Hozir har do‘konda bitta egasi bor, qo‘shiladiganlar faqat kassir.
3. Xodimning PIN’i yoki paroli almashtirilsa, u barcha qurilmalardan chiqariladi. Bu to‘g‘rimi?
4. Do‘konni to‘xtatish (`suspended`) hozir faqat SQL orqali qilinadi. Platforma admin paneli keyinroq kerak bo‘ladi.
