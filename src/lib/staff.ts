/**
 * Xodimlar Supabase Auth’da sintetik email bilan saqlanadi: <login>@xodim.dokon-hisob.invalid
 * `.invalid` domeni (RFC 2606) hech qachon haqiqiy pochta qabul qilmaydi.
 */
export const STAFF_EMAIL_DOMAIN = "xodim.dokon-hisob.invalid";

export const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function isValidLogin(login: string): boolean {
  return LOGIN_RE.test(normalizeLogin(login));
}

export function staffEmail(login: string): string {
  return `${normalizeLogin(login)}@${STAFF_EMAIL_DOMAIN}`;
}

export function isStaffEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${STAFF_EMAIL_DOMAIN}`);
}

/** DB’dagi private.assert_pin_ok bilan bir xil qoida (DB baribir qayta tekshiradi). */
export function pinProblem(pin: string): "format" | "weak" | null {
  if (!/^[0-9]{4,6}$/.test(pin)) return "format";
  if (/^([0-9])\1+$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) return "weak";
  return null;
}
