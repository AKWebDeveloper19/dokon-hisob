# 4-bosqich: Kassa va sotuv

`CLAUDE.md` va `SPEC.md`ni o‘qi (2-bo‘limdagi kassa dizayni, 4-bo‘lim skaner, 6-bo‘lim sotuv oqimi, 7-bo‘lim). 1–3-bosqichlar tayyor. Qaytimni hali **qilma**.

## Qilinadigan ishlar
1. **Migratsiyalar:**
   - `sales`: do‘kon ichida ketma-ket raqam, kassir (PIN bilan kirgan xodim), qurilma, vaqt, jami, chegirma, `idempotency_key`
   - `sale_lines`: variant, miqdor, o‘sha paytdagi birlik narxi, qatorga taqsimlangan chegirma, o‘sha paytdagi birlik tannarxi, yakuniy qator summasi
   - `payments`: turi (`cash` / `card` / `transfer`), summa. Bir sotuvda bir nechta to‘lov turi bo‘lishi mumkin, ularning yig‘indisi jamiga teng bo‘lishi shart.
2. **`complete_sale` RPC** (bitta tranzaksiya, idempotent):
   - Kirish ma’lumoti: qatorlar (variant, miqdor, kassir ko‘rgan narx), savat chegirmasi, to‘lovlar, `idempotency_key`
   - Narxlarni serverda qayta oladi. Kassir ko‘rgan narx joriy narxdan farq qilsa, sotuvni yozmaydi va yangi narxlarni qaytaradi.
   - Chegirmani faqat `can_discount` ruxsati bo‘lsa qabul qiladi. Savat chegirmasini qatorlarga proporsional taqsimlaydi, yaxlitlash qoldig‘i oxirgi qatorga yoziladi va yig‘indi aniq mos keladi.
   - Qoldiqni DB darajasida tekshirib kamaytiradi (qatorni qulflash yoki `UPDATE … WHERE qty >= n`). Yetmasa, hech narsa yozilmaydi va qaysi mahsulotda qancha bor ekani qaytariladi.
   - Har qatorga joriy o‘rtacha tannarxni yozadi va `sale` harakatlarini yaratadi.
   - Xuddi shu `idempotency_key` bilan qayta yuborilsa, avvalgi sotuvni qaytaradi.
3. **Kassa ekrani:**
   - Desktop va planshetda ikki ustun: chapda skaner maydoni, qidiruv va natijalar; o‘ngda doim ko‘rinadigan savat, jami va «Sotuvni yakunlash» tugmasi.
   - Telefonda jami va tugma pastda mahkam turadi, savat ochiladigan panelda ko‘rinadi.
   - Sensor uchun katta tugmalar (kamida 44 px).
4. **Skaner** (klaviatura kabi ishlaydigan, `Enter` bilan tugaydigan):
   - Ko‘rinadigan skaner maydoni bo‘ladi va savatga qo‘shilgandan keyin unga fokus qaytadi.
   - Dialog ochiq bo‘lsa yoki foydalanuvchi boshqa maydonda yozayotgan bo‘lsa, skaner kiritishi o‘sha amalni buzmasin.
   - Ma’lum kod mahsulotni savatga qo‘shadi. Xuddi shu kod yana skanerlansa, miqdor bittaga oshadi. `kg` va `l` mahsulotlarda miqdor so‘raladi.
   - Noma’lum kodda kodning o‘zi va «Qidiruvda izlash» amali chiqadi. Yangi mahsulot formasi avtomatik ochilmaydi.
   - Qo‘lda kod kiritish har doim ishlaydi.
5. **Miqdor tekshiruvi:** savatda qoldiqdan ko‘p bo‘lsa aniq matn chiqadi, masalan: «Omborda 3 dona bor. Savatda 5 dona.»
6. **Narx o‘zgarishi:** server yangi narx qaytarsa, o‘zgargan qatorlar ajratib ko‘rsatiladi va kassir qayta tasdiqlaydi.
7. **Yakunlash:** to‘lov turi yoki turlari tanlanadi, naqdda olingan summa va qaytim hisoblanadi. «Sotuv yakunlandi» xabari **faqat server tasdig‘idan keyin** chiqadi, kutish vaqtida «Yuborilmoqda…» ko‘rinadi. Tugma ikki marta bosilsa ham bitta sotuv yoziladi.
8. **Savdo hujjati:** sotuv raqami, sana, kassir, qatorlar, chegirma, to‘lov turi va jami. Oddiy chop etish ko‘rinishi (80 mm va A4) va PDF bo‘ladi, tannarx chiqmaydi.
9. **Sotuvlar sahifasi:** ro‘yxat (sana, kassir, to‘lov turi filtrlari, do‘kon vaqt mintaqasida) va sotuv tafsiloti. Tannarx va foyda faqat egasiga ko‘rinadi.

## Testlar (majburiy)
- **1-ssenariy:** 10 dona 8 000 dan kirim, narxi 12 000. 3 dona sotiladi → qoldiq 7, tushum 36 000, yalpi foyda 12 000. Keyin 7 dona 10 000 dan kirim → o‘rtacha 9 000, avvalgi sotuv foydasi 12 000 bo‘lib qoladi.
- **3-ssenariy:** oxirgi 1 donani ikki parallel ulanishdan bir vaqtda sotishga urinish (haqiqiy parallel DB testi) → faqat bittasi o‘tadi. Bir xil `idempotency_key` bilan qayta yuborilsa, qoldiq ikkinchi marta kamaymaydi.
- **4-ssenariy:** kod ikki marta skanerlanadi → savatda miqdor 2. Narx o‘zgargandan keyin eski kod yangi narxni topadi. Noma’lum kod tushunarli holat ko‘rsatadi.
- Bir qatori qoldiqsiz bo‘lgan ko‘p qatorli sotuvda hech narsa yozilmaydi va javobda muammoli mahsulot ko‘rsatiladi.
- Chegirma taqsimoti: qatorlar yig‘indisi savat jamiga so‘mma-so‘m teng (bir nechta tasodifiy holatda).
- Ruxsatsiz kassirning chegirmasi rad etiladi.
- Kassir uchun sotuv API javoblarida tannarx va foyda yo‘q.
- E2E (Playwright): skanerni klaviatura kiritishi bilan simulyatsiya qilib, kod → savat → to‘lov → yakunlash oqimini tekshir.
