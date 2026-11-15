"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireShop } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbErrorMessage, type FormState } from "@/lib/errors";
import { isValidLogin, normalizeLogin, pinProblem, staffEmail } from "@/lib/staff";
import { DEVICE_COOKIE, deviceCookieOptions } from "@/lib/cookies";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const bool = (fd: FormData, k: string) => fd.get(k) === "on";

const PIN_TEXT = {
  format: "PIN 4–6 ta raqamdan iborat bo‘lishi kerak.",
  weak: "Bu PIN juda oddiy. 1111 yoki 1234 kabi PIN’larni ishlatib bo‘lmaydi.",
} as const;

// ---------------------------------------------------------------------------
// Do‘kon sozlamalari
// ---------------------------------------------------------------------------
export async function updateShopAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const { supabase, ctx } = await requireShop({ owner: true });
  const lock = Number.parseInt(str(fd, "lock_minutes"), 10);
  const { error } = await supabase.rpc("update_shop_settings", {
    p_shop: ctx.shop_id,
    p_name: str(fd, "name"),
    p_timezone: str(fd, "timezone"),
    p_lock_minutes: Number.isFinite(lock) ? lock : 0,
  });
  if (error) return { error: dbErrorMessage(error) };
  revalidatePath("/", "layout");
  return { ok: "Saqlandi." };
}

// ---------------------------------------------------------------------------
// Xodimlar
// ---------------------------------------------------------------------------
export async function addStaffAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const { supabase, ctx } = await requireShop({ owner: true });

  const fullName = str(fd, "full_name");
  const login = normalizeLogin(str(fd, "login"));
  const password = String(fd.get("password") ?? "");
  const pin = str(fd, "pin");

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.full_name = "Ism kamida 2 ta belgidan iborat bo‘lsin.";
  if (!isValidLogin(login)) fieldErrors.login = "3–32 belgi: lotin harflari, raqam, nuqta, chiziqcha. Harf yoki raqam bilan boshlansin.";
  if (password.length < 8) fieldErrors.password = "Parol kamida 8 ta belgidan iborat bo‘lsin.";
  if (pin) {
    const p = pinProblem(pin);
    if (p) fieldErrors.pin = PIN_TEXT[p];
  }
  if (Object.keys(fieldErrors).length) return { error: "Maydonlarni tekshiring.", fieldErrors };

  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: staffEmail(login),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, staff: true },
  });
  if (createErr || !created.user) {
    if (/already|exists|registered/i.test(createErr?.message ?? "")) {
      return { error: "Bu login band. Boshqa login tanlang.", fieldErrors: { login: "Bu login band." } };
    }
    return { error: "Xodim hisobini yaratib bo‘lmadi. Qayta urinib ko‘ring." };
  }

  const { data: membershipId, error } = await supabase.rpc("add_staff_member", {
    p_shop: ctx.shop_id,
    p_user: created.user.id,
    p_login: login,
    p_full_name: fullName,
    p_can_discount: bool(fd, "can_discount"),
    p_can_refund: bool(fd, "can_refund"),
    p_can_write_off: bool(fd, "can_write_off"),
    p_can_receive: bool(fd, "can_receive"),
  });
  if (error) {
    // Do‘konga biriktirilmagan auth hisobini qoldirmaymiz.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: dbErrorMessage(error) };
  }

  if (pin) {
    const { error: pinErr } = await supabase.rpc("set_member_pin", { p_membership: membershipId, p_pin: pin });
    if (pinErr) {
      revalidatePath("/sozlamalar/xodimlar");
      return { error: `Xodim qo‘shildi, lekin PIN o‘rnatilmadi: ${dbErrorMessage(pinErr)}` };
    }
  }

  revalidatePath("/sozlamalar/xodimlar");
  return { ok: `${fullName} qo‘shildi. Login: ${login}` };
}

export async function updateStaffAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const { supabase } = await requireShop({ owner: true });
  const { error } = await supabase.rpc("update_staff_member", {
    p_membership: str(fd, "membership_id"),
    p_full_name: str(fd, "full_name"),
    p_can_discount: bool(fd, "can_discount"),
    p_can_refund: bool(fd, "can_refund"),
    p_can_write_off: bool(fd, "can_write_off"),
    p_can_receive: bool(fd, "can_receive"),
  });
  if (error) return { error: dbErrorMessage(error) };
  revalidatePath("/sozlamalar/xodimlar", "layout");
  return { ok: "Saqlandi." };
}

export async function setPinAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const { supabase } = await requireShop({ owner: true });
  const pin = str(fd, "pin");
  if (pin !== str(fd, "pin_confirm")) return { error: "PIN’lar bir-biriga mos kelmadi." };
  const p = pinProblem(pin);
  if (p) return { error: PIN_TEXT[p] };
  const { error } = await supabase.rpc("set_member_pin", { p_membership: str(fd, "membership_id"), p_pin: pin });
  if (error) return { error: dbErrorMessage(error) };
  revalidatePath("/sozlamalar/xodimlar", "layout");
  return { ok: "PIN saqlandi. Agar xodim tizimda bo‘lsa, u qayta kirishi kerak." };
}

export async function resetStaffPasswordAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const { supabase } = await requireShop({ owner: true });
  const membershipId = str(fd, "membership_id");
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Parol kamida 8 ta belgidan iborat bo‘lsin." };

  // Avval DB egalikni tekshiradi va user_id’ni qaytaradi; shundan keyingina service role ishlatiladi.
  const { data: userId, error } = await supabase.rpc("staff_user_for_password_reset", { p_membership: membershipId });
  if (error || !userId) return { error: dbErrorMessage(error) };

  const admin = createAdminClient();
  const { error: upErr } = await admin.auth.admin.updateUserById(String(userId), { password });
  if (upErr) return { error: "Parolni o‘zgartirib bo‘lmadi. Qayta urinib ko‘ring." };

  await supabase.rpc("revoke_staff_sessions", { p_membership: membershipId });
  return { ok: "Yangi parol saqlandi. Xodimning eski sessiyalari yopildi." };
}

export async function setStaffActiveAction(fd: FormData) {
  const { supabase } = await requireShop({ owner: true });
  await supabase.rpc("set_staff_active", {
    p_membership: str(fd, "membership_id"),
    p_active: str(fd, "active") === "true",
  });
  revalidatePath("/sozlamalar/xodimlar", "layout");
}

export async function revokeSessionsAction(fd: FormData) {
  const { supabase } = await requireShop({ owner: true });
  await supabase.rpc("revoke_staff_sessions", { p_membership: str(fd, "membership_id") });
  revalidatePath("/sozlamalar/xodimlar", "layout");
}

// ---------------------------------------------------------------------------
// Kassa qurilmalari
// ---------------------------------------------------------------------------
export async function bindDeviceAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const { supabase, ctx } = await requireShop({ owner: true });
  const name = str(fd, "name");
  if (!name) return { error: "Qurilma nomini kiriting, masalan «Kassa 1»." };

  const store = await cookies();
  const oldToken = store.get(DEVICE_COOKIE)?.value;
  const token = randomBytes(32).toString("base64url");

  const { error } = await supabase.rpc("register_device", { p_shop: ctx.shop_id, p_name: name, p_token: token });
  if (error) return { error: dbErrorMessage(error) };

  // Brauzer oldin boshqa qurilma yozuviga bog‘langan bo‘lsa, eskisini uzamiz (egasi bo‘lsa).
  if (oldToken) {
    const admin = createAdminClient();
    const { data } = await admin.rpc("device_lookup", { p_token: oldToken });
    const old = (data as Array<{ device_id: string }> | null)?.[0];
    if (old) await supabase.rpc("revoke_device", { p_device: old.device_id });
  }

  store.set(DEVICE_COOKIE, token, deviceCookieOptions);
  revalidatePath("/sozlamalar/qurilmalar");
  return { ok: `Bu brauzer «${name}» sifatida bog‘landi.` };
}

export async function revokeDeviceAction(fd: FormData) {
  const { supabase } = await requireShop({ owner: true });
  const deviceId = str(fd, "device_id");
  await supabase.rpc("revoke_device", { p_device: deviceId });
  if (str(fd, "is_current") === "true") (await cookies()).delete(DEVICE_COOKIE);
  revalidatePath("/sozlamalar/qurilmalar");
}

/** Joriy brauzerni kassa rejimiga o‘tkazadi: egasi chiqadi va PIN ekrani ochiladi. */
export async function enterPosModeAction() {
  const { supabase } = await requireShop({ owner: true });
  if (!(await cookies()).get(DEVICE_COOKIE)) redirect("/sozlamalar/qurilmalar");
  await supabase.auth.signOut({ scope: "local" });
  redirect("/kassa-kirish");
}
