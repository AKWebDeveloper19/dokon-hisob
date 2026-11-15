/** DB funksiyalari qaytaradigan kodlar → foydalanuvchiga tushunarli matn. */
const MESSAGES: Record<string, string> = {
  not_authenticated: "Tizimga qayta kiring.",
  forbidden: "Bu amal uchun ruxsatingiz yo‘q.",
  shop_suspended: "Do‘kon faoliyati to‘xtatilgan. Ma’lumotlarni faqat ko‘rish mumkin.",
  invalid_input: "Ma’lumot noto‘g‘ri kiritilgan. Maydonlarni tekshiring.",
  not_found: "Yozuv topilmadi.",
  login_taken: "Bu login band. Boshqa login tanlang.",
  user_already_member: "Bu foydalanuvchi allaqachon do‘kon a’zosi.",
  invalid_pin_format: "PIN 4–6 ta raqamdan iborat bo‘lishi kerak.",
  weak_pin: "Bu PIN juda oddiy. 1111 yoki 1234 kabi PIN’larni ishlatib bo‘lmaydi.",
};

export const NETWORK_ERROR = "Server bilan aloqa yo‘q. Internetni tekshirib, qayta urinib ko‘ring.";

export function dbErrorMessage(error: { message?: string } | null | undefined): string {
  if (!error?.message) return "Kutilmagan xato yuz berdi. Qayta urinib ko‘ring.";
  if (/fetch failed|network|ECONNREFUSED/i.test(error.message)) return NETWORK_ERROR;
  return MESSAGES[error.message] ?? "Kutilmagan xato yuz berdi. Qayta urinib ko‘ring.";
}

export type FormState = { error?: string; ok?: string; fieldErrors?: Record<string, string> };
