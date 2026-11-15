export type MemberRow = {
  membership_id: string;
  user_id: string;
  full_name: string;
  login: string | null;
  role: "owner" | "cashier";
  active: boolean;
  can_discount: boolean;
  can_refund: boolean;
  can_write_off: boolean;
  can_receive: boolean;
  has_pin: boolean;
  pin_locked_until: string | null;
  created_at: string;
};

export function permissionList(m: MemberRow) {
  if (m.role === "owner") return "Barcha ruxsatlar";
  const list = [
    m.can_discount && "chegirma",
    m.can_refund && "qaytim",
    m.can_write_off && "hisobdan chiqarish",
    m.can_receive && "kirim",
  ].filter(Boolean);
  return list.length ? list.join(", ") : "Faqat sotuv";
}
