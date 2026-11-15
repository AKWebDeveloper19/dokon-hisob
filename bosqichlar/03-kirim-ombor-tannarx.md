# 3-bosqich: Kirim, ombor harakatlari va o‘rtacha tannarx

`CLAUDE.md` va `SPEC.md`ni o‘qi (3-bo‘lim va 6-bo‘limdagi «Hisob qoidalari»). 1–2-bosqichlar tayyor. Sotuvni hali **qilma**.

## Qilinadigan ishlar
1. **Migratsiyalar:**
   - `receipts` (kirim hujjati): raqam, yetkazib beruvchi, hujjat raqami, izoh, holat (`draft` / `confirmed`), kim va qachon tasdiqlagani, `idempotency_key`
   - `receipt_lines`: variant, miqdor, birlik tannarxi
   - `stock_movements`: turi (`receipt`, `sale`, `sale_return`, `write_off`, `adjustment`, `correction`), variant, miqdor (±), birlik tannarxi, harakatdan keyingi qoldiq va o‘rtacha tannarx, bog‘langan hujjat, foydalanuvchi, vaqt, sabab
2. **`confirm_receipt` RPC** (bitta tranzaksiya, idempotent):
   - `stock_levels` qatorlarini qulflaydi (`SELECT … FOR UPDATE`)
   - Vaznli o‘rtacha tannarxni hisoblaydi: `(eski qoldiq × eski o‘rtacha + yangi miqdor × kirim tannarxi) / yangi qoldiq`. Eski qoldiq 0 bo‘lsa, kirim tannarxi olinadi.
   - Har bir qator uchun harakat yozadi va qoldiqni yangilaydi
   - Xuddi shu `idempotency_key` bilan qayta yuborilsa, ikkinchi marta yozmaydi va avvalgi natijani qaytaradi
3. **Aniqlik:** miqdor `numeric(14,3)`, tannarx `numeric(18,4)`, pul so‘mda butun songa yaxlitlanadi. Yaxlitlash qoidasi bitta SQL funksiyada va unga mos bitta TS funksiyada bo‘ladi.
4. **Kirim sahifasi** (Ombor → Yangi kirim, shuningdek mahsulot sahifasidan «Kirim qilish»): mahsulotni nom yoki shtrix-kod (skaner maydoni) orqali qo‘shish, har qatorda miqdor va birlik tannarxi, yetkazib beruvchi, hujjat raqami va izoh. Tasdiqlashdan oldin jami miqdor va jami kirim qiymati ko‘rsatiladi. Noma’lum kod skanerlansa, kodning o‘zi ko‘rsatiladi va «Shu kod bilan mahsulot yaratish» amali taklif qilinadi.
5. **Boshlang‘ich qoldiq:** yangi mahsulot formasiga ixtiyoriy «Boshlang‘ich qoldiq» maydonini qo‘sh. Qoldiq kiritilsa, birlik tannarxi majburiy bo‘ladi va mahsulot bilan boshlang‘ich kirim bitta tranzaksiyada yaratiladi. Muvaffaqiyat ekraniga «Kirim qilish» amalini qo‘sh.
6. **Kirimdan keyin:** qabul qilingan miqdor asosida yorliq sonini saqlab qo‘y (7-bosqichda yorliq oynasi shu sonni taklif qiladi).
7. **Tasdiqlangan kirimni tuzatish:** eski yozuv o‘zgarmaydi. Sabab majburiy bo‘lgan `correction` harakati yaratiladi va o‘rtacha tannarx qayta hisoblanadi.
8. **Ombor sahifasi:** harakatlar jadvali (tur, mahsulot, sana, foydalanuvchi bo‘yicha filtrlar, do‘kon vaqt mintaqasida) va kirim hujjatlari ro‘yxati. Mahsulot tafsilotida o‘sha mahsulot harakatlari ko‘rinadi.
9. Tannarx va kirim qiymati faqat egasiga ko‘rinadi. Kassir kirim qila oladimi, buni egasi ruxsat orqali belgilaydi (`can_receive` ruxsatini qo‘sh, standart o‘chiq).

## Testlar (majburiy)
- 10 dona 8 000 so‘mdan kirim qilinadi → qoldiq 10, o‘rtacha 8 000.
- Qoldiq 7 bo‘lganda (testda `adjustment` orqali tayyorlanadi) 7 dona 10 000 so‘mdan kirim → qoldiq 14, o‘rtacha 9 000.
- Qoldiq 0 bo‘lganda kirim → o‘rtacha kirim tannarxiga teng.
- Kasr miqdorli `kg` mahsulotda (masalan 2,5 kg) hisob aniq chiqadi.
- Bir xil `idempotency_key` bilan ikki marta (ketma-ket va parallel) yuborilsa, qoldiq faqat bir marta oshadi.
- Bir nechta qatorli kirimda bitta qator xato bo‘lsa, hech bir qator yozilmaydi.
- Kassir API orqali tannarxni ololmaydi.
