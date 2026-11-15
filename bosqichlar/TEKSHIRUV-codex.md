# Har bosqichdan keyin Codex uchun tekshiruv prompti

Quyidagini Codex’ga yuboring (`N` o‘rniga bosqich raqamini yozing):

---

Sen tajribali code reviewer’san. `AGENTS.md`, `SPEC.md` va `bosqichlar/0N-*.md` fayllarini o‘qi. Shu bosqichda yozilgan kodni tekshir. **Kodni o‘zgartirma**, faqat hisobot yoz.

Tekshir:
1. Bosqich faylidagi har bir band bajarilganmi? Bajarilmaganlarini ro‘yxat qil.
2. **Xavfsizlik:** RLS yo‘q yoki bo‘sh jadvallar; boshqa do‘kon ma’lumotiga kirish yo‘li; kassirga tannarx yoki foyda qaytaradigan API; brauzerga chiqib ketgan server kaliti.
3. **Pul va ombor:** `float` bilan hisob; tranzaksiyadan tashqarida qoldiq o‘zgarishi; parallel so‘rovda poyga holati (race condition); idempotency yo‘qligi; yaxlitlash xatolari.
4. Testlar haqiqatan kerakli narsani tekshiradimi yoki faqat «o‘tib ketadimi»? Yetishmayotgan muhim testlar qaysilar?
5. Testlarni o‘zing ishga tushir va natijani yoz.

Har topilmani muhimlik darajasi (Kritik / Muhim / Kichik), fayl va qator, muammo va tuzatish taklifi bilan yoz.
