import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEVICE_COOKIE, LOCK_COOKIE, SHOP_COOKIE } from "@/lib/cookies";

export type ShopContext = {
  shop_id: string;
  shop_name: string;
  timezone: string;
  currency: string;
  status: "active" | "suspended";
  is_demo: boolean;
  lock_minutes: number;
  membership_id: string;
  role: "owner" | "cashier";
  can_discount: boolean;
  can_refund: boolean;
  can_write_off: boolean;
  can_receive: boolean;
  full_name: string;
  has_pin: boolean;
};

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/kirish");
  return { supabase, user };
}

/**
 * Faol do‘kon kontekstini qaytaradi. A’zolik va rol DB’da (get_shop_context) tekshiriladi,
 * cookie’dagi do‘kon ID’siga ishonilmaydi.
 */
export async function requireShop(opts: { owner?: boolean } = {}) {
  const { supabase, user } = await requireUser();
  const store = await cookies();
  const shopId = store.get(SHOP_COOKIE)?.value;
  if (!shopId) redirect("/dokon-tanlash");

  const { data, error } = await supabase.rpc("get_shop_context", { p_shop: shopId });
  if (error || !data) redirect("/dokon-tanlash");
  const ctx = data as ShopContext;

  if (opts.owner && ctx.role !== "owner") redirect("/kassa");

  return {
    supabase,
    user,
    ctx,
    deviceBound: Boolean(store.get(DEVICE_COOKIE)?.value),
    locked: store.get(LOCK_COOKIE)?.value === "1",
  };
}
