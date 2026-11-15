#!/usr/bin/env node
/**
 * Demo do‘konlarni yaratadi (faqat ishlab chiqish va sinov uchun).
 *
 *   ALLOW_DEMO_SEED=ha npm run seed:demo
 *
 * Har biri «Demo» deb belgilangan 2 ta do‘kon, har birida 1 ta egasi va 2 ta kassir (PIN bilan) yaratiladi.
 * Skript qayta ishga tushirilsa, mavjud demo foydalanuvchilarni qayta yaratmaydi.
 * Production loyihasida ishga TUSHIRMANG.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

// .env.local ni o‘qish (qo‘shimcha kutubxonasiz).
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.ALLOW_DEMO_SEED !== "ha") {
  console.error("To‘xtatildi: demo seed faqat ALLOW_DEMO_SEED=ha bo‘lganda ishlaydi.");
  process.exit(1);
}
if (!url || !anonKey || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY va SUPABASE_SERVICE_ROLE_KEY kerak.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const STAFF_DOMAIN = "xodim.dokon-hisob.invalid";
const PASSWORD = "Demo12345";

const SHOPS = [
  {
    name: "Demo: Oziq-ovqat do‘koni",
    owner: { email: "ega.demo1@example.com", full_name: "Demo Ega Bir", pin: "2580" },
    staff: [
      { login: "demo1.kassa1", full_name: "Aziza Karimova", pin: "1357", can_discount: true },
      { login: "demo1.kassa2", full_name: "Bobur Toshmatov", pin: "2468", can_refund: true },
    ],
  },
  {
    name: "Demo: Kiyim do‘koni",
    owner: { email: "ega.demo2@example.com", full_name: "Demo Ega Ikki", pin: "3690" },
    staff: [
      { login: "demo2.kassa1", full_name: "Dilnoza Rahimova", pin: "1593" },
      { login: "demo2.kassa2", full_name: "Jasur Aliyev", pin: "7531", can_receive: true },
    ],
  },
];

async function findUserByEmail(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser(email, full_name, extra = {}) {
  const existing = await findUserByEmail(email);
  if (existing) return { user: existing, created: false };
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name, ...extra },
  });
  if (error) throw error;
  return { user: data.user, created: true };
}

async function asUser(email) {
  const c = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`${email} bilan kirib bo‘lmadi: ${error.message}`);
  return c;
}

async function rpc(client, fn, args) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data;
}

for (const shop of SHOPS) {
  const { user: owner } = await ensureUser(shop.owner.email, shop.owner.full_name);
  const ownerClient = await asUser(shop.owner.email);

  const { data: existing } = await ownerClient.from("memberships").select("shop_id, shops(name)").eq("user_id", owner.id);
  let shopId = existing?.find((m) => m.shops?.name === shop.name)?.shop_id;

  if (!shopId) {
    shopId = await rpc(ownerClient, "create_shop", { p_name: shop.name, p_timezone: "Asia/Tashkent", p_full_name: shop.owner.full_name });
    const { error } = await admin.from("shops").update({ is_demo: true }).eq("id", shopId);
    if (error) throw error;
    const members = await rpc(ownerClient, "list_shop_members", { p_shop: shopId });
    await rpc(ownerClient, "set_member_pin", { p_membership: members[0].membership_id, p_pin: shop.owner.pin });
    console.log(`Do‘kon yaratildi: ${shop.name}`);
  } else {
    console.log(`Do‘kon mavjud: ${shop.name}`);
  }

  for (const s of shop.staff) {
    const { user, created } = await ensureUser(`${s.login}@${STAFF_DOMAIN}`, s.full_name, { staff: true });
    if (!created) continue;
    const membershipId = await rpc(ownerClient, "add_staff_member", {
      p_shop: shopId,
      p_user: user.id,
      p_login: s.login,
      p_full_name: s.full_name,
      p_can_discount: Boolean(s.can_discount),
      p_can_refund: Boolean(s.can_refund),
      p_can_write_off: false,
      p_can_receive: Boolean(s.can_receive),
    });
    await rpc(ownerClient, "set_member_pin", { p_membership: membershipId, p_pin: s.pin });
    console.log(`  Kassir qo‘shildi: ${s.full_name} (${s.login})`);
  }
}

console.log("\nTayyor. Barcha demo parollar: " + PASSWORD + " — PIN’lar README.md da.");
