# 7-bosqich: Yorliqlar (PDF + brauzer orqali chop etish)

`CLAUDE.md` va `SPEC.md`ni o‘qi (5-bo‘lim va 0.3). 1–6-bosqichlar tayyor.

**Muhim:** Xray Print yoki boshqa printerga xos integratsiya **qilinmaydi**. SDK, TSPL, ZPL va dialogsiz chop etish ham yo‘q. Faqat aniq fizik o‘lchamli PDF va OS printer drayveri orqali brauzerning chop etish oynasi ishlatiladi. Yorliq chizish qismi alohida modul bo‘lsin, shunda keyin printer adapteri qo‘shilishi mumkin bo‘ladi.

## Qilinadigan ishlar
1. **Yorliq moduli:** kirish ma’lumoti (nom, variant, narx, kod, o‘lcham, siljish) asosida vektor PDF chiqaradi. Code 128 uchun sinalgan kutubxona ishlatiladi (masalan `bwip-js` yoki `JsBarcode` SVG, PDF uchun `pdf-lib` yoki `pdfkit`). Barcode rastr rasm emas, vektor bo‘ladi.
2. **Yorliq tarkibi:** oq fon, qora yozuv. Yuqorida nom va variant (uzun nom ikki qatorgacha sig‘adi, keyin `…`), o‘rtada yirik sotuv narxi, pastda barcode va uning ostida o‘qiladigan kod. Tannarx hech qachon chiqmaydi. Ikki tomondagi bo‘sh zona (kamida 10 × modul kengligi) va minimal modul kengligi saqlanadi. Kod sig‘masa, «Kod bu o‘lchamga sig‘maydi, kattaroq format tanlang» xabari chiqadi va PDF yaratilmaydi.
3. **O‘lchamlar:** 40 × 30, 50 × 30, 58 × 40 mm va qo‘lda kiritiladigan o‘lcham. PDF’da har yorliq o‘z fizik o‘lchamidagi alohida sahifa bo‘ladi. Print CSS ham aynan shu o‘lchamni ishlatadi (`@page { size: 50mm 30mm; margin: 0 }`).
4. **Yorliq oynasi:** mahsulot yoki variant, nusxalar soni, o‘lcham, oldindan ko‘rish. Navbatga bir nechta turli mahsulotni qo‘shib, bitta PDF qilib chiqarish mumkin.
5. **Kirish nuqtalari:**
   - Mahsulot yaratilgandan keyin: «Yorliq chiqarish»
   - Mahsulot tafsiloti
   - Kirim yakunlangach: qabul qilingan miqdor bo‘yicha taklif qilingan son (3-bosqichda saqlangan), tahrirlash mumkin
   - Narx o‘zgargandan keyin: «Yorliqdagi narx eskirdi, yangi yorliq chiqarasizmi?» (2-bosqichdagi belgi asosida). Chiqarilgach belgi olib tashlanadi.
6. **Sozlamalar → Yorliqlar:** standart o‘lcham, X/Y siljish (mm), «Sinov yorlig‘i», chop etilgan yorliqlar tarixi va «Qayta chop etish».
7. **Holat matni:** «Chop etish» bosilgandan keyin «Chop etish oynasi ochildi» deb yoziladi, «Chop etildi» deb **yozilmaydi**. Ilova printer qog‘oz chiqarganini bilmaydi.
8. **Printer yo‘riqnomasi** (Sozlamalarda va `README`da): drayverda aynan shu qog‘oz o‘lchamini tanlash, masshtabni `Actual size / 100%` qilish, sarlavha va pastki yozuvlarni (headers/footers) o‘chirish, avval bitta yorliqni chiqarib, skaner bilan tekshirish.

## Testlar (majburiy)
- **5-ssenariy:** 50 × 30 mm formatda 3 nusxa → PDF’da aynan 3 sahifa, har biri 141,73 × 85,04 pt (±0,1).
- Juda uzun nom va katta narxda (masalan 12 500 000 so‘m) matn va barcode chegaralari ustma-ust tushmaydi (koordinatalar bo‘yicha tekshiruv).
- PDF rasterlanib, barcode mustaqil dekoder bilan o‘qiladi (masalan `zxing`) va kod aynan mos keladi. Bu barcha 3 o‘lcham uchun tekshiriladi.
- Tor o‘lchamga sig‘maydigan kodda xato xabari chiqadi.
- Kassir yorliq oynasida tannarxni ko‘rmaydi.
- Hisobotda «Fizik printerda sinalmagan» deb alohida belgila.
