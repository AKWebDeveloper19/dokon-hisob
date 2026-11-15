# 8-bosqich: Internet uzilishi, moslashuvchan interfeys va topshirish

`CLAUDE.md` va `SPEC.md`ni o‘qi (1-bo‘limdagi internet uzilishi, 2-bo‘lim, 8-bo‘lim). 1–7-bosqichlar tayyor. Bu yakuniy bosqich: yangi katta funksiya qo‘shma, mavjudlarini mustahkamla.

## Qilinadigan ishlar
1. **Internet uzilishi:**
   - Kassada aloqa holati ko‘rsatkichi bo‘ladi (Onlayn / Aloqa yo‘q / Yuborilmoqda).
   - Ochiq savat do‘kon, qurilma va kassir kesimida IndexedDB’da saqlanadi va sahifa yangilansa ham, PIN qulfidan keyin ham tiklanadi.
   - Aloqa yo‘qligida «Sotuvni yakunlash» bosilsa, sotuv bajarilmaydi: «Internet yo‘q. Savat saqlandi.» xabari chiqadi. Oflayn sotuv **qilinmaydi**.
   - Yuborish vaqtida aloqa uzilsa, aloqa qaytgach aynan o‘sha `idempotency_key` bilan qayta yuboriladi va natija aniq ko‘rsatiladi. Takroriy sotuv bo‘lmaydi.
2. **Moslashuvchan interfeys:** kassa, mahsulot formasi, kirim, mahsulotlar jadvali, qaytim va hisobotlarni desktop (1280+), planshet (768–1024) va telefon (375) kengliklarida tekshir va tuzat. Jadvallar telefonda gorizontal suriladi yoki ixcham ko‘rinishga o‘tadi.
3. **Klaviatura va sensor:** barcha asosiy amallar klaviaturada bajariladi, fokus aniq ko‘rinadi, sensor tugmalari kamida 44 px. Kassada qulay tugmalar bo‘lsin (masalan `F2` skaner maydoni, `F9` yakunlash), ular ekranda ko‘rsatilsin.
4. **Holatlar tekshiruvi:** har sahifada loading, bo‘sh holat, topilmadi, ruxsat yo‘q va tarmoq xatosi holatlari bor. Matnlar aniq va o‘zbekcha bo‘lsin, `o‘` va `g‘` belgilari izchil yozilsin.
5. **To‘liq E2E oqim:** mahsulot yaratish → kirim → yorliq PDF → skanerlash → sotuv → bosh sahifada foyda va mahsulot tarixida harakatlar.
6. **Joylashtirish yo‘riqnomasi** (`DEPLOY.md`): Supabase Cloud loyihasi, migratsiyalarni qo‘llash, Vercel, muhit o‘zgaruvchilari ro‘yxati (qaysi biri faqat server uchun ekani bilan), domen, zaxira nusxa (backup), demo do‘konlarni production’ga **qo‘shmaslik**.
7. **Foydalanuvchi uchun qisqa yo‘riqnoma** (`QOLLANMA.md`): kompyuter va telefonda ochish, kassa qurilmasini bog‘lash, xodim va PIN qo‘shish, skanerni ulash va tekshirish, yorliq chop etish.
8. **Xavfsizlik tekshiruvi:** service role kaliti brauzer bundle’ida yo‘qligini tekshir (build natijasidan qidir), barcha jadvallarda RLS yoqilganini tasdiqlovchi test yoz, kassir rolida barcha API’larni aylanib tannarx yoki foyda qaytmasligini tekshir.

## Testlar
- **7-ssenariy:** uch kenglikda kassa, forma va jadval uchun Playwright testi (skrinshotlar bilan).
- Aloqa uzilishini simulyatsiya qilish: savat saqlanadi, takroriy sotuv yo‘q, aloqa qaytgach to‘g‘ri yakunlanadi.
- `SPEC.md` 8-bo‘limidagi 1–7 ssenariylarning barchasini qayta ishga tushir.

## Yakuniy hisobot
`CLAUDE.md`dagi formatda yoz, qo‘shimcha ravishda:
- 8-bo‘limdagi har ssenariy: avtomatik test / qo‘lda tekshirilgan / tekshirilmagan
- Jismoniy USB yoki Bluetooth skaner va fizik termal printer talab qiladigan tekshiruvlar ro‘yxati (ular hali qilinmagan)
- Ma’lum cheklovlar va keyingi versiyaga qoldirilganlar (Xray Print, obuna tizimi, filiallar)
