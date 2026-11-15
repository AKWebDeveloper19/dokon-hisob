"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbErrorMessage, NETWORK_ERROR, type FormState } from "@/lib/errors";
import { isStaffEmail, isValidLogin, staffEmail } from "@/lib/staff";
import {
  DEVICE_COOKIE,
  LOCK_COOKIE,
  SHOP_COOKIE,
  lockCookieOptions,
  shopCookieOptions,
} from "@/lib/cookies";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// ---------------------------------------------------------------------------
// Kirish (egasi: email + parol, xodim: login + parol)
// ---------------------------------------------------------------------------
export async function loginAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const mode = str(fd, "mode") === "xodim" ? "xodim" : "ega";
  const identifier = str(fd, "identifier");
  const password = String(fd.get("password") ?? "");

  if (!identifier || !password) return { error: "Barcha maydonlarni to‘ldiring." };

  let email: string;
  if (mode === "xodim") {
    if (!isValidLogin(identifier)) return { error: "Login noto‘g‘ri. Faqat lotin harflari, raqam, nuqta va chiziqcha." };
    email = staffEmail(identifier);
  } else {
    if (!z.email().safeParse(identifier).success) return { error: "Email manzili noto‘g‘ri." };
    if (isStaffEmail(identifier)) return { error: "Xodimlar «Xodim» bo‘limi orqali kiradi." };
    email = identifier;
  }

  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        error:
          mode === "xodim" ? "Login yoki parol noto‘g‘ri." : "Email yoki parol noto‘g‘ri. Email tasdiqlanganini ham tekshiring.",
      };
    }
  } catch {
    return { error: NETWORK_ERROR };
  }
  (await cookies()).delete(LOCK_COOKIE);
  redirect("/dokon-tanlash");
}

// ---------------------------------------------------------------------------
// Ro‘yxatdan o‘tish (faqat do‘kon egasi)
// ---------------------------------------------------------------------------
const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Ismingizni kiriting.").max(120),
  email: z.email("Email manzili noto‘g‘ri."),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo‘lsin.").max(72),
});

export async function signupAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    full_name: str(fd, "full_name"),
    email: str(fd, "email"),
    password: String(fd.get("password") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Maydonlarni tekshiring.", fieldErrors };
  }
  if (isStaffEmail(parsed.data.email)) return { error: "Bu email manzilidan foydalanib bo‘lmaydi." };

  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.full_name } },
    });
    if (error) {
      if (/already/i.test(error.message)) return { error: "Bu email bilan hisob mavjud. Kirish sahifasidan kiring." };
      return { error: "Ro‘yxatdan o‘tib bo‘lmadi. Qayta urinib ko‘ring." };
    }
    if (!data.session) {
      return { ok: "Emailingizga tasdiqlash xati yuborildi. Uni tasdiqlab, so‘ng tizimga kiring." };
    }
  } catch {
    return { error: NETWORK_ERROR };
  }
  redirect("/dokon-yaratish");
}

// ---------------------------------------------------------------------------
// Do‘kon yaratish va tanlash
// ---------------------------------------------------------------------------
export async function createShopAction(_prev: FormState | undefined, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const timezone = str(fd, "timezone") || "Asia/Tashkent";
  if (name.length < 2) return { error: "Do‘kon nomini kiriting (kamida 2 ta belgi)." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/kirish");
  if (isStaffEmail(auth.user.email ?? "")) return { error: "Xodim hisobi bilan do‘kon ochib bo‘lmaydi." };

  const fullName = String(auth.user.user_metadata?.full_name ?? "");
  const { data, error } = await supabase.rpc("create_shop", { p_name: name, p_timezone: timezone, p_full_name: fullName });
  if (error) return { error: dbErrorMessage(error) };

  (await cookies()).set(SHOP_COOKIE, String(data), shopCookieOptions);
  redirect("/bosh");
}

export async function selectShopAction(fd: FormData) {
  const shopId = str(fd, "shop_id");
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shop_context", { p_shop: shopId });
  if (!data) redirect("/dokon-tanlash");
  (await cookies()).set(SHOP_COOKIE, shopId, shopCookieOptions);
  redirect((data as { role: string }).role === "owner" ? "/bosh" : "/kassa");
}

// ---------------------------------------------------------------------------
// Chiqish
// ---------------------------------------------------------------------------
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const store = await cookies();
  store.delete(LOCK_COOKIE);
  // Kassa qurilmasida do‘kon cookie’si qoladi, PIN ekraniga qaytamiz.
  if (store.get(DEVICE_COOKIE)) redirect("/kassa-kirish");
  store.delete(SHOP_COOKIE);
  redirect("/kirish");
}

// ---------------------------------------------------------------------------
// Kassa qurilmasida PIN bilan kirish
// ---------------------------------------------------------------------------
export type PinState = FormState & { attemptsLeft?: number };

const PIN_MESSAGES: Record<string, string> = {
  device_invalid: "Bu qurilma kassa sifatida bog‘lanmagan yoki uzib qo‘yilgan. Egasi bilan bog‘laning.",
  member_invalid: "Bu xodim faol emas.",
  no_pin: "Bu xodimga PIN o‘rnatilmagan. Egasi Sozlamalar → Xodimlar bo‘limida o‘rnatadi.",
};

function lockedMessage(until: string | null) {
  const minutes = until ? Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 60_000)) : 5;
  return `PIN ko‘p marta xato kiritildi. ${minutes} daqiqadan keyin qayta urinib ko‘ring.`;
}

export async function pinLoginAction(_prev: PinState | undefined, fd: FormData): Promise<PinState> {
  const membershipId = str(fd, "membership_id");
  const pin = str(fd, "pin");
  const store = await cookies();
  const token = store.get(DEVICE_COOKIE)?.value;
  if (!token) return { error: PIN_MESSAGES.device_invalid };
  if (!/^[0-9]{4,6}$/.test(pin)) return { error: "PIN 4–6 ta raqamdan iborat." };

  const admin = createAdminClient();
  let userId: string;
  let shopId: string;
  try {
    const { data, error } = await admin.rpc("pin_check", {
      p_token: token,
      p_membership: membershipId,
      p_pin: pin,
    });
    if (error) return { error: dbErrorMessage(error) };
    const r = (data as Array<{ ok: boolean; code: string; user_id: string; shop_id: string; attempts_left: number; locked_until: string | null }>)[0];
    if (!r?.ok) {
      if (r?.code === "wrong_pin") return { error: `PIN noto‘g‘ri. Yana ${r.attempts_left} ta urinish qoldi.`, attemptsLeft: r.attempts_left };
      if (r?.code === "locked") return { error: lockedMessage(r.locked_until) };
      return { error: PIN_MESSAGES[r?.code ?? ""] ?? "Kirib bo‘lmadi." };
    }
    userId = r.user_id;
    shopId = r.shop_id;
  } catch {
    return { error: NETWORK_ERROR };
  }

  // PIN to‘g‘ri: shu xodim uchun bir martalik havola tokeni yaratib, uni darhol sessiyaga almashtiramiz.
  // Token brauzerga chiqmaydi va email yuborilmaydi.
  try {
    const { data: u, error: uErr } = await admin.auth.admin.getUserById(userId);
    if (uErr || !u.user?.email) return { error: "Xodim hisobi topilmadi." };
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
    if (linkErr || !link.properties?.hashed_token) return { error: "Sessiya ochib bo‘lmadi. Qayta urinib ko‘ring." };

    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
    const { error: vErr } = await supabase.auth.verifyOtp({ type: "email", token_hash: link.properties.hashed_token });
    if (vErr) return { error: "Sessiya ochib bo‘lmadi. Qayta urinib ko‘ring." };
  } catch {
    return { error: NETWORK_ERROR };
  }

  store.set(SHOP_COOKIE, shopId, shopCookieOptions);
  store.delete(LOCK_COOKIE);
  redirect("/kassa");
}

/** Harakatsizlikdan keyin ekranni qulflash (server cookie: sahifani yangilash qulfni ochmaydi). */
export async function lockScreenAction() {
  (await cookies()).set(LOCK_COOKIE, "1", lockCookieOptions);
}

/** Qulfni joriy xodimning PIN’i bilan ochish. */
export async function unlockAction(_prev: PinState | undefined, fd: FormData): Promise<PinState> {
  const pin = str(fd, "pin");
  const store = await cookies();
  const token = store.get(DEVICE_COOKIE)?.value;
  const shopId = store.get(SHOP_COOKIE)?.value;
  if (!token || !shopId) redirect("/kassa-kirish");

  const supabase = await createClient();
  const { data: ctx } = await supabase.rpc("get_shop_context", { p_shop: shopId });
  if (!ctx) redirect("/kassa-kirish");

  const admin = createAdminClient();
  try {
    const { data, error } = await admin.rpc("pin_check", {
      p_token: token,
      p_membership: (ctx as { membership_id: string }).membership_id,
      p_pin: pin,
    });
    if (error) return { error: dbErrorMessage(error) };
    const r = (data as Array<{ ok: boolean; code: string; attempts_left: number; locked_until: string | null }>)[0];
    if (!r?.ok) {
      if (r?.code === "wrong_pin") return { error: `PIN noto‘g‘ri. Yana ${r.attempts_left} ta urinish qoldi.` };
      if (r?.code === "locked") return { error: lockedMessage(r.locked_until) };
      return { error: PIN_MESSAGES[r?.code ?? ""] ?? "Qulfni ochib bo‘lmadi." };
    }
  } catch {
    return { error: NETWORK_ERROR };
  }
  store.delete(LOCK_COOKIE);
  return { ok: "unlocked" };
}
