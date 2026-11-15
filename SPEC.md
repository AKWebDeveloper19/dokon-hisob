# Do‘kon Hisob — to‘liq spetsifikatsiya

## 0. Yangilangan qarorlar (asl matndan ustun turadi)

Quyidagi qarorlar pastdagi asl matnga zid kelsa, shu bo‘lim amal qiladi.

### 0.1. Ko‘p do‘konli tizim (SaaS)
- Istalgan do‘kon egasi ro‘yxatdan o‘tib, o‘z do‘konini ochadi va faqat o‘z admin panelida ishlaydi.
- Do‘konlar ma’lumoti to‘liq ajratilgan. Har biznes yozuvida `shop_id`, RLS va har so‘rovda server tomonida a’zolik va rol tekshiruvi bo‘ladi.
- Bir foydalanuvchi bir nechta do‘kon a’zosi bo‘lishi mumkin. Bunday holatda kirgandan keyin do‘kon tanlanadi va faol do‘kon ekranda doim ko‘rinadi.
- Birinchi versiyada har do‘konda bitta savdo nuqtasi va bitta ombor bo‘ladi.
- Obuna va to‘lov tizimi v1’da yo‘q. Lekin `shops` jadvalida `status` (`active` / `suspended`) maydoni bo‘lsin. To‘xtatilgan do‘kon ma’lumotni faqat o‘qiy oladi.

### 0.2. Kirish: login + PIN
- **Egasi:** email + parol (Supabase Auth).
- **Xodim (kassir):** egasi qo‘shadi. Xodimda login (foydalanuvchi nomi yoki telefon), parol va 4–6 xonali PIN bo‘ladi.
- **Kassa qurilmasi:** egasi brauzerni «kassa qurilmasi» sifatida bog‘laydi. Bog‘langan qurilmada xodimlar PIN bilan tez almashadi. Bog‘lanmagan qurilmada PIN bilan kirib bo‘lmaydi, u yerda faqat login + parol ishlaydi. Egasi qurilmani istalgan vaqtda uzib qo‘ya oladi.
- PIN serverda faqat hash holida (argon2 yoki bcrypt) saqlanadi. Bir xodimga 5 marta xato kiritilsa, 5 daqiqaga bloklanadi. Barcha urinishlar audit’ga yoziladi.
- Kassa ekrani harakatsizlikdan keyin PIN qulfiga tushadi (sozlamada, standart 5 daqiqa). Qulf vaqtida ochiq savat saqlanib qoladi.
- Har sotuv, qaytim va ombor harakatida PIN bilan kirgan aniq xodim yoziladi.
- Xodim o‘chirilsa yoki PIN’i almashtirilsa, uning faol sessiyalari bekor qilinadi.
- Supabase service role kaliti faqat serverda ishlatiladi.

### 0.3. Printer
- Xray Print va boshqa printerga xos integratsiyalar **keyinga qoldirildi**.
- Yorliqlar hozircha faqat aniq fizik o‘lchamli PDF va brauzerning chop etish oynasi orqali chiqadi (5-bo‘lim, printerga xos qismlarsiz). Kelajakda printer adapteri qo‘shilishi uchun yorliq chizish qismi alohida modul bo‘lsin.

---

## Asl spetsifikatsiya

Sen senior full-stack muhandis va mahsulot dizayneri sifatida **Do‘kon Hisob** nomli o‘zbek tilidagi savdo va ombor veb-ilovasini qur. U kichik do‘kon egasi va sotuvchi har kuni ishlata oladigan tizim bo‘lsin. Egasi qancha tovar kelgani, qancha sotilgani, omborda nima qolgani va savdodan qancha yalpi foyda chiqqanini ko‘radi. Sotuvchi shtrix-kodni skanerlab, narxni ko‘radi va sotuvni rasmiylashtiradi.

Ishlaydigan full-stack ilova, ma’lumotlar bazasi migratsiyalari, sinov ma’lumotlari va ishga tushirish yo‘riqnomasini tayyorla. Agar mavjud repozitoriy berilgan bo‘lsa, avval uni tekshir va ishlaydigan qismlaridan foydalan. Yangi repo bo‘lsa, Next.js, TypeScript va PostgreSQL’dan foydalan. Supabase Auth va PostgreSQL mos tushsa, ularni tanla. Ulanish ma’lumotlari hali berilmagan bo‘lsa, konfiguratsiya namunasini va mahalliy ishga tushirish yo‘lini ber. Muhit faqat brauzer demosini ko‘tara olsa, uni aniq «Demo» deb belgilab, real backend uchun zarur fayllarni ham tayyorla. Demo ma’lumotlarini haqiqiy ombor bilan aralashtirma.

### 1. Mahsulotning asosiy chegarasi

- Birinchi versiya bitta do‘kon va bitta ombor bilan boshlanadi. Bir nechta sotuvchi bir vaqtning o‘zida ishlashi mumkin. Bir nechta mustaqil do‘kon tizimda ochilsa, ularning ma’lumotlari bir-biridan ajratilsin.
- Interfeys o‘zbek lotin yozuvida bo‘lsin. Standart valyuta UZS, ekranda `125 000 so‘m` ko‘rinishida. Vaznli mahsulotlar uchun `kg`, suyuqlik uchun `l`, sanaladigan mahsulotlar uchun `dona`. Sana filtrlari do‘konning vaqt mintaqasiga tayansin. Standart vaqt mintaqasi `Asia/Tashkent`.
- Internet uzilganda ochiq savat saqlansin va ekranda aloqa holati ko‘rinsin. Server tasdig‘idan keyin sotuv yakunlanganini ko‘rsat. Qayta yuborish takroriy sotuv hosil qilmasin.
- Naqd, karta va o‘tkazma to‘lov turlari qayd qilinsin. Oddiy savdo hujjatini chiqarish mumkin. Bank terminali, fiskal kassa, filiallararo transfer va yetkazib berish integratsiyalarini birinchi versiyaga qo‘shma.

### 2. Sahifalar va dizayn

Menyu ixcham bo‘lsin. **Bosh sahifa**, **Kassa**, **Mahsulotlar**, **Ombor**, **Sotuvlar**, **Hisobotlar**, **Sozlamalar**. Yorliq chiqarish va kirim qilish tegishli mahsulot sahifasidan ham ochilsin.

Vizual yo‘nalish — o‘zbek tilidagi jiddiy, sokin savdo dasturi. Uni do‘kon peshtaxtasidagi kompyuterda kun bo‘yi ishlatish qulay bo‘lsin.

- Fon uchun iliq kulrang `#F5F6F3`, matn uchun `#17251F`, asosiy amal uchun to‘q yashil `#205D47`. Qizilni xato va yetarli bo‘lmagan qoldiq kabi holatlarda ishlat. Tovar qoldig‘i kam bo‘lsa, rangga qo‘shimcha ravishda matnli holat ham ber.
- **Inter** yoki **Instrument Sans** ishlat. Narx va miqdorlar ustunlarda o‘ngga tekislansin. Raqamlar jadvalda bir xil enli ko‘rinsin. Jadval sarlavhalari ixcham, qatorlar ajratilgan, faol tugma va klaviatura fokusi aniq ko‘rinsin.
- Dashboard sarlavhasi ostida sana filtri, so‘ng bir qatorda **Tushum**, **Yalpi foyda**, **Sotuvlar**, **Kam qolgan tovarlar**. Pastda haqiqiy ma’lumotga tayangan bitta savdo grafigi va egasi amal qilishi mumkin bo‘lgan kam qoldiq ro‘yxati. Klik foydalanuvchini tegishli filtrlangan sahifaga olib borsin.
- Pul va ombor harakati jadvallariga ekran joyini ber. Ulkan sarlavha, bezak uchun kartochka yoki raqam, gradient, shisha effekt, stock surat, emoji va marketing iboralarini ishlatma.
- Kassada desktop va planshet uchun ikki ustun ishlat. Chapda skanerlash, qidiruv va mahsulot natijalari. O‘ngda doim ko‘rinadigan savat, jami va **Sotuvni yakunlash** tugmasi. Telefonda jami pastda mahkam tursin va savat ochiladigan panelda ko‘rinsin.
- Qurilmada sensor orqali ishlash uchun asosiy tugmalar yetarlicha katta bo‘lsin. Loading, bo‘sh jadval, topilmagan mahsulot, ruxsat yetishmasligi va tarmoq xatosi holatlarini yoz. Matnlar aniq bo‘lsin. Masalan, «Omborda 3 dona bor. Savatda 5 dona.»
- Vizual namuna sifatida Shopify POS’dagi tezkor tovar qabul qilish va Loyverse’dagi yorliq sozlamalaridan foydalan. Ularning brendi va interfeysini ko‘chirma.  
  https://help.shopify.com/en/manual/sell-in-person/shopify-pos/inventory-management/receiving-transfers  
  https://help.loyverse.com/help/how-print-labels-items

### 3. Mahsulotlar va ombor

**Yangi mahsulot** formasida nom, kategoriya, birlik, sotuv narxi, ixtiyoriy yetkazib beruvchi, minimal qoldiq va ixtiyoriy SKU bo‘lsin. Boshlang‘ich qoldiq ixtiyoriy. Qoldiq kiritilsa, dona tannarxi ham so‘ralsin va shu amalda boshlang‘ich kirim yozuvi yaratilishi shart. Qoldiqsiz mahsulot ham saqlanishi mumkin.

Mahsulot yaratish muvaffaqiyatli tugagach **Yorliq chiqarish**, **Kirim qilish** va **Yana mahsulot qo‘shish** amallari chiqsin. Rang va o‘lcham variantlari alohida qoldiq, narx va shtrix-kodga ega bo‘lsin. Varianti yo‘q mahsulotni bitta oddiy tovar sifatida boshqarish mumkin bo‘lsin.

Mahsulotlar jadvalida nom, variant, SKU yoki kod, qoldiq, sotuv narxi va ruxsati bor foydalanuvchiga tannarx chiqsin. Nom, kod va SKU bo‘yicha qidirish, kategoriya va qoldiq bo‘yicha filtrlash, saralash va sahifalash bo‘lsin. Mahsulot tafsilotida uning harakatlari, yorliqlari va narx o‘zgarishi tarixi ko‘rinsin. Savdo tarixidagi mahsulotni arxivlash mumkin bo‘lsin. Arxivlangan kod boshqa mahsulotga qayta berilmasin.

**Kirim** hujjatiga bir nechta mahsulot qo‘shish mumkin bo‘lsin. Mahsulotni nom yoki shtrix-kod bilan top. Har qatorda miqdor va ayni partiyaning birlik tannarxi yozilsin. Yetkazib beruvchi, hujjat raqami va izoh ixtiyoriy. Tasdiqlashdan avval jami miqdor va kirim qiymati ko‘rinsin. Kirim yakunlangach, qabul qilingan miqdor asosida yorliq sonini taklif qil va sonini tahrirlashga ruxsat ber.

**Ombor harakatlari** kirim, sotuv, sotuvdan qaytim, hisobdan chiqarish va inventarizatsiya tuzatishlarini ko‘rsatsin. Shikastlangan yoki yo‘qolgan tovar chiqimiga sabab yozish majburiy bo‘lsin. Inventarizatsiyada tizim qoldig‘i, sanalgan miqdor va farq yonma-yon chiqsin. Tasdiqlangan kirim yoki chiqim o‘zgarsa, eski yozuvni saqla va sababli tuzatish harakati yarat.

### 4. Shtrix-kod va skaner

- Har yangi mahsulot yoki variantga server avtomatik tarzda ixcham, barqaror va do‘kon ichida noyob **ichki Code 128** identifikator beradi. Kod yaratilishi va mahsulot saqlanishi bitta tranzaksiyada bajarilsin. Noyoblik DB constraint bilan kafolatlansin.
- Zavoddan kelgan EAN yoki UPC kodini qo‘shimcha kod sifatida ulash mumkin bo‘lsin. Ichki kod ham, zavod kodi ham bir mahsulotga olib borsin. Kodlarni matn sifatida saqla va boshidagi nollarni saqla. Bitta do‘konda bir kod boshqa mahsulotga biriktirilgan bo‘lsa, qaysi mahsulot ekanini ko‘rsat. EAN/UPC formatlari uchun tegishli uzunlik va nazorat raqamini tekshir. O‘zing yaratgan ichki kodni rasmiy GS1 identifikatori sifatida ko‘rsatma.
- Barcode ichida barqaror identifikator bo‘lsin. Skaner identifikatorni yuboradi va tizim bazadan mahsulotning **joriy nomi, sotuv narxi va qoldig‘ini** ko‘rsatadi. Narx o‘zgarsa, eski yorliqdagi kod yangi narxni topishda davom etsin. Yorliqdagi bosilgan narx eskirganida narx tahriridan keyin yangi yorliq chiqarish amali taklif qilinsin.
- Birinchi navbatda klaviatura kabi ishlaydigan va kod oxirida `Enter` yuboradigan USB yoki Bluetooth skanerni qo‘llab-quvvatla. Kassada ko‘rinadigan skaner maydoni bo‘lsin. Dialog ochilganda yoki foydalanuvchi boshqa maydonda yozayotganda skaner kodi o‘sha amalni buzmasin. Savatga qo‘shilgach skaner maydoni yana tayyor bo‘lsin. Qo‘lda kiritish har doim ishlasin.
- Kassada ma’lum kod skanerlanganda mahsulot savatga qo‘shilsin. Xuddi shu tovar yana skanerlanganda miqdor bitta oshsin. Omborda skanerlash tegishli tovarni topish yoki kirimga qo‘shish uchun ishlasin. Noma’lum kod yuz bersa ekranda kodning o‘zi va tegishli keyingi amal chiqsin. Kassirga avtomatik yangi mahsulot ochib yuborma.

### 5. Xray Print va termal yorliqlar

**Printer modeli va ilovasi hozircha noma’lum.** Standart chop etish oqimi OS printer drayveri orqali brauzer dialogidan va aniq fizik o‘lchamli PDF’dan iborat bo‘lsin. Xray Print nomi bilan aytilgan qurilma yoki ilova uchun bevosita integratsiya model, platforma, ulanish turi va hujjatlar ma’lum bo‘lgach tekshiriladi.

- **Yorliq** oynasida mahsulot yoki variant, nusxalar soni, o‘lcham va oldindan ko‘rish bo‘lsin. 40 × 30, 50 × 30, 58 × 40 mm va qo‘lda kiritiladigan o‘lchamni qo‘llab-quvvatla. Bir mahsulotdan bir nechta nusxa va bir nechta turdagi mahsulotni bitta navbatda chiqarish ishlasin. Har bir stiker PDF’da o‘z fizik o‘lchamidagi alohida sahifa bo‘lsin.
- Yorliq oq fonli va qora yozuvli bo‘lsin. Yuqorida nom va variant, o‘rtada aniq ko‘rinadigan sotuv narxi, pastda skanerlanadigan chiziqlar va o‘qiladigan kod. Tannarx chiqarilmasin. Uzun nom ikki qatorgacha sig‘sin. Kod yetarli kenglikka sig‘masa, foydalanuvchiga kattaroq format tanlashni ko‘rsat.
- Code 128 uchun sinalgan kutubxona ishlat. Kodni SVG yoki vektor PDF shaklida chiqar. Ikki tomondagi bo‘sh zona, chiziq kengligi va kontrastni saqla. PDF va print CSS bir xil fizik o‘lchamni ishlatsin. PDF tekshiruvida sahifa o‘lchamini tekshir va sinovda eksport qilingan yorliqdagi barcode’ni mustaqil dekoder bilan o‘qi.
- Sozlamalarda odatiy yorliq o‘lchami, X/Y siljish, sinov yorlig‘i va **Qayta chop etish** amali bo‘lsin. Printer yo‘riqnomasida drayverdan ayni qog‘oz o‘lchamini tanlash, `Actual size / 100%`, sarlavha va pastki yozuvlarni o‘chirish hamda bitta yorliqni avval chiqarib skanerlashni tushuntir.
- **Chop etish** tugmasi bosilgani printerning qog‘ozga chiqarganini tasdiqlamaydi. Ilova holatini shunga mos ko‘rsat. Kelajakda modelga xos SDK, TSPL yoki ZPL kerak bo‘lsa, shu oqimga alohida ulash mumkin bo‘lsin. Model tekshirilmaguncha bir bosishda dialogsız chop etish va’dasini berma.

### 6. Kassa, qaytim va hisobotlar

**Sotuv oqimi** — skaner yoki qidiruv → savat → miqdor tekshiruvi → ruxsatli chegirma → to‘lov turi → yakunlash → savdo raqami va hujjat. Narx, chegirma, jami va qoldiqni server qayta tekshirsin. Savat ochilgandan keyin narx o‘zgargan bo‘lsa, yangilangan narxni ko‘rsat va sotuvchini qayta tasdiqlat. Bir sotuvda bir necha qator bo‘lsa, barcha qatorlar muvaffaqiyatli yozilishi kerak. Yetarli qoldiq bo‘lmasa qaysi mahsulotda muammo borligini ko‘rsat.

**Qaytim oqimi** — asl sotuvni topish → mahsulot va miqdor → sabab → tovar holati → tasdiqlash. Qisman qaytim mumkin. Bir necha qaytimning jami dastlab sotilgan miqdordan oshmasin. Pul summasi va tannarx asl sotuvdagi qiymatlarga bog‘lansin. Sotishga yaroqli qaytim omborga kiradi. Yaroqsiz qaytim sotiladigan qoldiqni oshirmaydi va tegishli hisobdan chiqarish sifatida qayd qilinadi. Qaytimdagi tannarx va zarar hisobotda ikki marta ayirilmasin.

**Hisob qoidalari**

- Har yangi kirimda vaznli o‘rtacha tannarxni hisobla. Formula `(oldingi qoldiq × oldingi o‘rtacha tannarx + yangi miqdor × kirim tannarxi) / yangi jami qoldiq`. Oldingi qoldiq nol bo‘lsa, yangi partiya tannarxi qo‘llanadi. Sotuv va hisobdan chiqarish tugayotgan qoldiqning tannarxini tegishli harakatga yozadi. Sotishga yaroqli qaytimda asl sotuvdagi birlik tannarxidan foydalanib ombor qiymatini qayta hisobla.
- Sotuv qatorida o‘sha paytdagi birlik narxi, chegirma, birlik tannarxi va yakuniy qiymat saqlansin. Keyingi narx yoki tannarx tahriri avvalgi savdoni o‘zgartirmasin.
- Tushum savdo summasidan chegirma va qaytimlarni hisobga olgan holda chiqsin. **Yalpi foyda = sof savdo tushumi − sotilgan mahsulot tannarxi.** Ijara, ish haqi va boshqa operatsion xarajatlar ushbu versiyada yuritilmasa, «Sof foyda» ko‘rsatkichini chiqarma. Ombor yo‘qotishlarini alohida ko‘rsat.
- Pul va kasrli miqdorlar uchun aniq decimal hisob ishlat. Tannarxga qo‘shimcha aniqlik saqla. Yakuniy pul miqdorini do‘kon valyutasiga mos bir xil qoida bilan yaxlitla. Savat darajasidagi chegirmani qatorlarga izchil taqsimla. Qisman qaytimlar yig‘indisi asl sotuv qiymati va chegirmasiga to‘liq mos kelsin.
- Hisobotlarda sana oralig‘i, kategoriya, mahsulot va to‘lov turi filtrlari, tushum, qaytim, tannarx, yalpi foyda va hisobdan chiqarish qiymati bo‘lsin. Filtrlangan natijani UTF-8 CSV sifatida yuklab olish mumkin bo‘lsin. Jadval va dashboard bir xil tasdiqlangan ma’lumotga tayansin.

### 7. Ma’lumotlar modeli va ruxsatlar

Kamida do‘kon, foydalanuvchi va a’zolik roli, kategoriya, mahsulot, sotiladigan variant, shtrix-kod, yetkazib beruvchi, qoldiq, kirim hujjati va qatorlari, ombor harakatlari, sotuv va qatorlari, to‘lov, qaytim va audit yozuvlarini modellashtir. Tasdiqlangan operatsiyalar uchun vaqt, foydalanuvchi, do‘kon va bog‘langan hujjat yozilsin.

- Egasi qoldiq, tannarx, foyda, sozlamalar va xodimlarni ko‘radi. Kassir sotuv narxi, qoldiq va kassaga kiradi. Tannarx va foyda kassirga yuboriladigan API javoblarida ham cheklansin. Qaytim, chegirma va hisobdan chiqarishga tegishli ruxsat bo‘lsin.
- Har bir biznes yozuvi do‘kon bilan bog‘lansin. Har bir so‘rovda server darajasida do‘kon a’zoligi va rol tekshirilsin. Supabase ishlatilsa, tegishli RLS siyosatlari va ularning testlari bo‘lsin. Server kalitlarini brauzerga yuborma.
- Ombor harakatlari audit uchun saqlansin. Tez ko‘rsatish uchun qoldiq alohida yozuvda saqlansa, u harakat bilan **aynan bitta DB tranzaksiyada** yangilansin. Parallel sotuvlarda qoldiq nazoratini DB darajasida bajar. Sotuv, kirim va qaytim qayta yuborilganda avvalgi natijani qaytaradigan idempotency mexanizmi qo‘llansin.

### 8. Qabul mezonlari va topshirish

Quyidagi ssenariylarni avtomatik test yoki takrorlanadigan qo‘lda tekshiruv orqali ko‘rsat. Hisob va tranzaksiyalarning xavfli holatlarini avtomatlashtir.

1. **Hisob.** 10 dona tovarni 8 000 so‘mdan kirim qil, sotuv narxini 12 000 so‘m qo‘y. 3 dona sotilganda qoldiq 7, tushum 36 000 va yalpi foyda 12 000 so‘m chiqsin. Keyin 7 donani 10 000 so‘mdan kirim qil. 14 dona qoldiqning o‘rtacha tannarxi 9 000 so‘m bo‘lsin. Avvalgi sotuv foydasi 12 000 so‘m bo‘lib qolsin.
2. **Qaytim.** O‘sha sotuvdan bitta yaroqli dona qaytarilganda ombor bir donaga oshsin. 12 000 so‘m qaytarilsin va qaytimda asl birlik tannarxi 8 000 so‘m ishlatilsin. Keyin qayta-qayta so‘rov yuborib, bir xarid miqdoridan ortiq qaytim bo‘lmasligini tekshir.
3. **Parallel sotuv.** Oxirgi bitta mahsulotni ikki kassadan bir vaqtda sotishga urin. Faqat bittasi yakunlansin. Bir xil sotuv so‘rovini qayta yuborganda qoldiq ikkinchi marta kamaymasin.
4. **Shtrix-kod.** Kamida ikkita variantga noyob kod yarat. Oldida nollari bor zavod kodini sinab ko‘r. Narx yangilanganda oldingi yorliqdagi kod joriy narxni topsin. Xuddi shu kod ikki marta skanerlanganda kassada miqdor ikki bo‘lsin. Noma’lum kod tushunarli holat ko‘rsatsin.
5. **Yorliq.** 50 × 30 mm formatda 3 nusxa eksport qil. PDF’da uchta tegishli o‘lchamdagi sahifa chiqsin. Uzun nom va katta narxda matn bilan barcode ustma-ust tushmasin. PDF’dagi kod mustaqil dekoderda o‘qilsin. Fizik printer sinovi bo‘lmasa, uni alohida belgila.
6. **Ruxsatlar.** Kassir tannarx va foydani sahifa, API yoki CSV orqali ololmasin. Bir do‘kon foydalanuvchisi boshqa do‘kon ma’lumotiga uning yozuv ID’sini bilgan holda ham kira olmasin.
7. **Interfeys.** Desktop, planshet va telefon kengligida kassa, forma va jadvalni tekshir. Skaner maydoni, klaviatura navigatsiyasi, tarmoq xatosi va bo‘sh holatlar ishlasin.

Ishni avval bitta to‘liq oqimdan boshlagin. **Mahsulot yaratish → kirim → yorliq → skanerlash → sotuv → foyda va tarix.** Shu oqim ishlagach qaytim, inventarizatsiya va qolgan hisobotlarni tugat. Test natijalari, ishga tushirish buyruqlari, zarur muhit o‘zgaruvchilari va telefon yoki kompyuterda sinab ko‘rish uchun qisqa yo‘riqnoma bilan topshir. Yakunda qaysi qismlar amalda tekshirilganini va jismoniy skaner yoki printer talab qiladigan tekshiruvni aniq yoz.