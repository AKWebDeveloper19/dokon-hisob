# 2-bosqich: Mahsulotlar, variantlar va shtrix-kodlar

`CLAUDE.md` va `SPEC.md`ni o‘qi (3- va 4-bo‘limlar). 1-bosqich tayyor. Kirim, ombor harakatlari va sotuvni hali **qilma**.

## Qilinadigan ishlar
1. **Migratsiyalar:**
   - `categories`, `suppliers`
   - `products`: nom, kategoriya, birlik (`dona` / `kg` / `l`), yetkazib beruvchi (ixtiyoriy), minimal qoldiq, SKU (ixtiyoriy, do‘kon ichida noyob), arxiv holati
   - `variants`: har bir sotiladigan birlik, ya’ni rang yoki o‘lcham (o‘z narxi bilan). Variantsiz mahsulot uchun avtomatik bitta standart variant yaratiladi.
   - `barcodes`: kod (`text`), turi (`internal` / `ean13` / `ean8` / `upca`), variant. Noyoblik `UNIQUE (shop_id, code)` bilan kafolatlanadi. Arxivlangan kodlar ham jadvalda qoladi.
   - `stock_levels`: variant bo‘yicha qoldiq va o‘rtacha tannarx (hozircha 0; to‘ldirish 3-bosqichda)
   - `price_history`: eski narx, yangi narx, kim o‘zgartirgan, qachon
2. **Ichki Code 128 kod:** variant yaratilganda server o‘sha tranzaksiya ichida do‘kon bo‘yicha ketma-ket raqamdan ixcham va barqaror kod hosil qiladi (masalan `DH000123`). Kod hech qachon qayta ishlatilmaydi. UI’da u GS1 yoki EAN deb ko‘rsatilmaydi.
3. **Zavod kodi (EAN-13, EAN-8, UPC-A):** uzunlik va nazorat raqami tekshiriladi, boshidagi nollar saqlanadi. Kod boshqa mahsulotga biriktirilgan bo‘lsa, xato xabarida aynan qaysi mahsulot ekani yoziladi.
4. **Kod bo‘yicha qidirish uchun RPC:** `find_by_code(code)` ichki yoki zavod kodi bo‘yicha joriy nom, variant, sotuv narxi va qoldiqni qaytaradi. Tannarx faqat egasiga qaytadi. Bu funksiya kassada ham, omborda ham ishlatiladi.
5. **Yangi mahsulot formasi:** nom, kategoriya, birlik, sotuv narxi, yetkazib beruvchi, minimal qoldiq, SKU va variantlar. Boshlang‘ich qoldiq maydonini **hali qo‘shma** (u 3-bosqichda keladi). Muvaffaqiyatdan keyin «Yana mahsulot qo‘shish» va «Mahsulotni ochish» amallari chiqadi (Kirim va Yorliq amallari keyingi bosqichlarda qo‘shiladi).
6. **Mahsulotlar jadvali:** nom, variant, SKU/kod, qoldiq, sotuv narxi va faqat egasi uchun tannarx. Nom, kod va SKU bo‘yicha qidirish, kategoriya hamda qoldiq holati (bor / kam / yo‘q) filtrlari, saralash va server tomonda sahifalash. Kam qoldiqda rangdan tashqari «Kam qoldi» matni ham chiqadi.
7. **Mahsulot tafsiloti:** variantlar, kodlar (zavod kodini qo‘shish yoki uzish), narx tarixi. Harakatlar bo‘limi uchun joy qoldir (3-bosqichda to‘ldiriladi).
8. **Narx tahriri:** `price_history`ga yoziladi va variantga «yorliqdagi narx eskirgan» belgisi qo‘yiladi (7-bosqichda ishlatiladi).
9. **Arxivlash:** mahsulot o‘chirilmaydi, arxivlanadi. Uning kodlari boshqa mahsulotga berilmaydi.
10. **Holatlar:** loading, bo‘sh jadval, natija topilmadi, ruxsat yo‘q, tarmoq xatosi.
11. **Seed:** demo do‘konlarga variantli va variantsiz, `kg` va `l` birlikli mahsulotlar.

## Testlar (majburiy)
- Ikkita variantga ikki xil noyob ichki kod beriladi.
- Bir vaqtda parallel yaratilgan 20 ta mahsulotda kodlar takrorlanmaydi.
- Boshida nolli zavod kodi (masalan to‘g‘ri nazorat raqamli UPC-A `036000291452` va boshida nolli EAN-13) aynan saqlanadi va topiladi.
- Noto‘g‘ri nazorat raqamli EAN rad etiladi. Band kod xatosida mahsulot nomi chiqadi.
- Arxivlangan mahsulot kodi boshqa mahsulotga biriktirilmaydi.
- Narx o‘zgargandan keyin eski kod yangi narxni qaytaradi.
- Kassir uchun `find_by_code` va mahsulotlar API javobida tannarx maydoni yo‘q.
- Boshqa do‘kon mahsulotiga ID orqali kirib bo‘lmaydi.
