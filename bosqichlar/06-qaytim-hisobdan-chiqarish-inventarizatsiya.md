# 6-bosqich: Qaytim, hisobdan chiqarish va inventarizatsiya

`CLAUDE.md` va `SPEC.md`ni o‘qi (3-bo‘limdagi ombor harakatlari, 6-bo‘limdagi qaytim oqimi va hisob qoidalari). 1–5-bosqichlar tayyor.

## Qilinadigan ishlar
1. **Migratsiyalar:** `returns`, `return_lines` (asl sotuv qatoriga bog‘langan, miqdor, sabab, tovar holati: `sellable` / `damaged`), `write_offs` va `write_off_lines`, `stock_counts` va `stock_count_lines` (tizim qoldig‘i, sanalgan miqdor, farq).
2. **`create_return` RPC** (bitta tranzaksiya, idempotent, `can_refund` ruxsati talab qilinadi):
   - Asl sotuv qatorlarini qulflaydi. Shu qator bo‘yicha barcha qaytimlar yig‘indisi sotilgan miqdordan oshmaydi.
   - Qaytariladigan pul asl qatordagi yakuniy summadan (taqsimlangan chegirma bilan) proporsional hisoblanadi. Oxirgi qaytimda qoldiq summa olinadi, shunda barcha qisman qaytimlar yig‘indisi asl summaga so‘mma-so‘m teng bo‘ladi.
   - Tannarx asl sotuv qatoridagi birlik tannarxidan olinadi.
   - **Sotishga yaroqli:** qoldiq oshadi, o‘rtacha tannarx asl birlik tannarxi bilan qayta hisoblanadi, `sale_return` harakati yoziladi.
   - **Yaroqsiz:** sotiladigan qoldiq oshmaydi. Qaytim va unga bog‘langan yo‘qotish yozuvi yaratiladi. Hisobotda tannarx bir marta hisoblanadi: sotilgan tovar tannarxidan chiqib, yo‘qotishga o‘tadi, ikki marta ayirilmaydi.
   - Pul qaytarish turi (naqd, karta yoki o‘tkazma) yoziladi.
3. **Qaytim ekrani** (Sotuvlar → sotuv tafsiloti → «Qaytim»; sotuv raqami yoki savdo hujjatidagi kod orqali qidiruv): mahsulot va miqdor (qolgan qaytariladigan miqdor ko‘rsatiladi), sabab, tovar holati, qaytariladigan summa, tasdiqlash. Qaytim hujjatini chop etish mumkin.
4. **Hisobdan chiqarish** (`can_write_off` ruxsati bilan): mahsulot, miqdor, sabab majburiy (shikastlangan, yo‘qolgan, muddati o‘tgan yoki boshqa + izoh). Joriy o‘rtacha tannarx bo‘yicha yo‘qotish qiymati yoziladi. RPC, tranzaksiya va idempotency qo‘llanadi.
5. **Inventarizatsiya** (faqat egasi):
   - Hujjat ochiladi, mahsulotlar skaner yoki qidiruv orqali sanaladi.
   - Har qatorda tizim qoldig‘i, sanalgan miqdor va farq yonma-yon turadi.
   - Tasdiqlashda farq **tasdiqlash paytidagi** joriy qoldiqqa nisbatan hisoblanadi. Sanash davomida qoldiq o‘zgargan qatorlar ogohlantirish bilan ko‘rsatiladi.
   - Har farq uchun `adjustment` harakati yaratiladi. Kamomad yo‘qotish sifatida hisobotga tushadi.
6. **Hisobotlar:** qaytim va hisobdan chiqarish ustunlarini to‘ldir. Ombor yo‘qotishlari alohida ko‘rsatkich bo‘ladi. Dashboard yangi qiymatlar bilan mos kelishi kerak.

## Testlar (majburiy)
- **2-ssenariy:** 1-ssenariydagi sotuvdan 1 ta yaroqli dona qaytariladi → qoldiq +1, qaytarilgan summa 12 000, qaytimdagi birlik tannarxi 8 000.
- O‘sha sotuv qatoriga ketma-ket va parallel ravishda ko‘p qaytim so‘rovi yuboriladi → jami qaytim 3 donadan oshmaydi. Bir xil `idempotency_key` takroriy qaytim yaratmaydi.
- Chegirmali sotuvda 3 ta qisman qaytim yig‘indisi asl qator summasiga so‘mma-so‘m teng.
- Yaroqsiz qaytim: sotiladigan qoldiq o‘zgarmaydi, yo‘qotish bir marta yoziladi, yalpi foyda va yo‘qotish hisobotda to‘g‘ri chiqadi.
- Sababsiz hisobdan chiqarish rad etiladi. Ruxsatsiz kassirga qaytim va hisobdan chiqarish rad etiladi.
- Inventarizatsiya: tizimda 10, sanalgan 8 → −2 tuzatish va yo‘qotish yoziladi. Sanash paytida sotuv bo‘lsa, farq to‘g‘ri hisoblanadi.
