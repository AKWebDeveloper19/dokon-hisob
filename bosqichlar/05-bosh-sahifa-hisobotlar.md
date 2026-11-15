# 5-bosqich: Bosh sahifa va hisobotlar

`CLAUDE.md` va `SPEC.md`ni o‘qi (2-bo‘limdagi dashboard, 6-bo‘limdagi hisob qoidalari va hisobotlar). 1–4-bosqichlar tayyor.

## Qilinadigan ishlar
1. **Yagona hisob manbai:** ko‘rsatkichlarni hisoblaydigan SQL funksiyalar yoki view’lar yarat. Dashboard ham, hisobot jadvali ham, CSV ham **aynan shu manbadan** foydalanadi.
   - Tushum = sotuv summasi − chegirma − qaytimlar
   - Sotilgan tovar tannarxi = sotuv qatorlaridagi saqlangan tannarx (qaytimlarni hisobga olgan holda)
   - Yalpi foyda = sof tushum − sotilgan tovar tannarxi
   - Hisobdan chiqarish qiymati alohida ko‘rsatkich (hozircha 0 bo‘lishi mumkin, 6-bosqichda to‘ladi)
   - «Sof foyda» ko‘rsatkichi **chiqarilmaydi**.
   - Qaytim va hisobdan chiqarish ustunlari hozirdan bo‘lsin, 6-bosqichda faqat ma’lumot qo‘shiladi.
2. **Vaqt:** barcha sana filtrlari do‘kon vaqt mintaqasida ishlaydi. «Bugun» Toshkent vaqti bo‘yicha 00:00–23:59 degani.
3. **Bosh sahifa** (faqat egasi; kassir kirsa, Kassaga yo‘naltiriladi):
   - Sarlavha ostida sana filtri (bugun, kecha, 7 kun, 30 kun, oraliq)
   - Bir qatorda **Tushum**, **Yalpi foyda**, **Sotuvlar** (soni), **Kam qolgan tovarlar** (soni)
   - Pastda real ma’lumotga asoslangan bitta savdo grafigi (kunlik tushum) va kam qoldiqli tovarlar ro‘yxati (nom, qoldiq, minimal qoldiq, «Kirim qilish» amali)
   - Har ko‘rsatkich bosilganda tegishli filtrlangan sahifaga o‘tadi (masalan, Kam qolganlar → Mahsulotlar, «kam» filtri bilan)
4. **Hisobotlar sahifasi** (faqat egasi):
   - Filtrlar: sana oralig‘i, kategoriya, mahsulot, to‘lov turi
   - Jadval: mahsulot yoki kun kesimida tushum, qaytim, tannarx, yalpi foyda, hisobdan chiqarish
   - Jami qatori
   - **CSV yuklab olish:** UTF-8 (Excel to‘g‘ri ochishi uchun BOM bilan), filtrlangan natija, serverda yaratiladi, faqat egasiga ruxsat
5. **Holatlar:** ma’lumot yo‘q davr, loading va xato holatlari.

## Testlar (majburiy)
- Bir xil filtr bilan dashboard, hisobot jadvali va CSV raqamlari to‘liq bir xil.
- 1-ssenariy ma’lumotida tushum 36 000, yalpi foyda 12 000.
- Vaqt chegarasi: Toshkent vaqti bilan 23:30 dagi sotuv o‘sha kunga, 00:10 dagisi keyingi kunga tushadi (UTC bo‘yicha boshqa kun bo‘lsa ham).
- Kassir hisobot sahifasi, hisobot API’si va CSV’ni ololmaydi (403).
- Boshqa do‘kon ma’lumoti hisobotga aralashmaydi.
- CSV’da o‘zbekcha harflar (`o‘`, `g‘`) buzilmasdan chiqadi.
