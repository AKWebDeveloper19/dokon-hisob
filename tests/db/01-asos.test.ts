import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { TestDb, anon, createTestDatabase, errorOf, service, user } from "./helpers";

let db: TestDb;
let drop: () => Promise<void>;

// Sahna: ikki mustaqil do‘kon, A do‘konida kassir va kassa qurilmasi.
let ownerA: string, ownerB: string, cashierA: string, stranger: string;
let shopA: string, shopB: string;
let memberCashierA: string, memberOwnerA: string, memberOwnerB: string;
let deviceTokenA: string, deviceA: string, deviceTokenB: string;

const now = () => Math.floor(Date.now() / 1000);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  const created = await createTestDatabase();
  drop = created.drop;
  db = await TestDb.open(created.url);

  ownerA = await db.createAuthUser("ega.a@test.invalid");
  ownerB = await db.createAuthUser("ega.b@test.invalid");
  cashierA = await db.createAuthUser("kassir.a@xodim.dokon-hisob.invalid");
  stranger = await db.createAuthUser("begona@test.invalid");

  shopA = (await db.as(user(ownerA), "select public.create_shop('A do‘kon', 'Asia/Tashkent', 'Ega A') as id")).rows[0].id;
  shopB = (await db.as(user(ownerB), "select public.create_shop('B do‘kon') as id")).rows[0].id;

  memberCashierA = (
    await db.as(user(ownerA), "select public.add_staff_member($1, $2, 'Kassir.A', 'Kassir Ali', true) as id", [
      shopA,
      cashierA,
    ])
  ).rows[0].id;
  memberOwnerA = (await db.sql("select id from public.memberships where shop_id = $1 and role = 'owner'", [shopA]))
    .rows[0].id;
  memberOwnerB = (await db.sql("select id from public.memberships where shop_id = $1 and role = 'owner'", [shopB]))
    .rows[0].id;

  await db.as(user(ownerA), "select public.set_member_pin($1, '2580')", [memberCashierA]);

  deviceTokenA = randomBytes(32).toString("base64url");
  deviceA = (
    await db.as(user(ownerA), "select public.register_device($1, 'Kassa 1', $2) as id", [shopA, deviceTokenA])
  ).rows[0].id;
  deviceTokenB = randomBytes(32).toString("base64url");
  await db.as(user(ownerB), "select public.register_device($1, 'B kassa', $2)", [shopB, deviceTokenB]);
}, 60_000);

afterAll(async () => {
  await db?.close();
  await drop?.();
});

describe("Do‘kon yaratish", () => {
  it("do‘kon va egasi a’zoligi birga yaratiladi", async () => {
    const r = await db.as(user(ownerA), "select role, can_refund from public.memberships where shop_id = $1", [shopA]);
    expect(r.rows).toContainEqual({ role: "owner", can_refund: true });
    const ctx = await db.as(user(ownerA), "select public.get_shop_context($1) as c", [shopA]);
    expect(ctx.rows[0].c).toMatchObject({ shop_name: "A do‘kon", role: "owner", timezone: "Asia/Tashkent" });
  });

  it("anonim foydalanuvchi do‘kon yarata olmaydi", async () => {
    expect(await errorOf(db.as(anon, "select public.create_shop('X do‘kon')"))).toMatch(/permission denied/);
  });

  it("noto‘g‘ri vaqt mintaqasi rad etiladi", async () => {
    expect(await errorOf(db.as(user(stranger), "select public.create_shop('X do‘kon', 'Mars/Olympus')"))).toBe(
      "invalid_input",
    );
  });
});

describe("Do‘konlar ma’lumoti ajratilgan (RLS)", () => {
  it("A egasi B do‘konini ID bilan ham ko‘rmaydi", async () => {
    const r = await db.as(user(ownerA), "select * from public.shops where id = $1", [shopB]);
    expect(r.rowCount).toBe(0);
    const ctx = await db.as(user(ownerA), "select public.get_shop_context($1) as c", [shopB]);
    expect(ctx.rows[0].c).toBeNull();
  });

  it("A egasi B a’zoliklari, qurilmalari va audit yozuvlarini ko‘rmaydi", async () => {
    for (const table of ["memberships", "pos_devices", "audit_log"]) {
      const r = await db.as(user(ownerA), `select 1 from public.${table} where shop_id = $1`, [shopB]);
      expect(r.rowCount, table).toBe(0);
    }
    const m = await db.as(user(ownerA), "select 1 from public.memberships where id = $1", [memberOwnerB]);
    expect(m.rowCount).toBe(0);
  });

  it("A egasi B do‘konini o‘zgartira, xodim yoki qurilma qo‘sha olmaydi", async () => {
    const someone = await db.createAuthUser();
    const token = randomBytes(32).toString("base64url");
    expect(
      await errorOf(db.as(user(ownerA), "select public.update_shop_settings($1, 'Buzildi', 'Asia/Tashkent', 5)", [shopB])),
    ).toBe("forbidden");
    expect(
      await errorOf(db.as(user(ownerA), "select public.add_staff_member($1, $2, 'buzgunchi', 'Buzg‘unchi')", [shopB, someone])),
    ).toBe("forbidden");
    expect(await errorOf(db.as(user(ownerA), "select public.register_device($1, 'X', $2)", [shopB, token]))).toBe(
      "forbidden",
    );
    expect(await errorOf(db.as(user(ownerA), "select public.set_member_pin($1, '7391')", [memberOwnerB]))).toBe(
      "forbidden",
    );
  });

  it("jadvallarga to‘g‘ridan-to‘g‘ri yozish taqiqlangan", async () => {
    expect(
      await errorOf(db.as(user(ownerA), "update public.shops set status = 'active' where id = $1", [shopA])),
    ).toMatch(/permission denied/);
    expect(
      await errorOf(
        db.as(user(ownerA), "insert into public.memberships (shop_id, user_id, role) values ($1, $2, 'owner')", [
          shopB,
          ownerA,
        ]),
      ),
    ).toMatch(/permission denied/);
    expect(
      await errorOf(db.as(user(ownerA), "delete from public.audit_log where shop_id = $1", [shopA])),
    ).toMatch(/permission denied/);
  });

  it("anonim hech narsani o‘qiy olmaydi", async () => {
    for (const table of ["shops", "memberships", "profiles", "pos_devices", "audit_log", "staff_logins"]) {
      expect(await errorOf(db.as(anon, `select * from public.${table}`)), table).toMatch(/permission denied/);
    }
  });

  it("begona foydalanuvchi hech bir do‘konni ko‘rmaydi", async () => {
    const r = await db.as(user(stranger), "select * from public.shops where id in ($1, $2)", [shopA, shopB]);
    expect(r.rowCount).toBe(0);
  });
});

describe("Kassir cheklovlari", () => {
  it("kassir o‘z do‘konini ko‘radi, lekin qurilma, audit va boshqa a’zoliklarni ko‘rmaydi", async () => {
    expect((await db.as(user(cashierA), "select 1 from public.shops where id = $1", [shopA])).rowCount).toBe(1);
    expect((await db.as(user(cashierA), "select 1 from public.pos_devices")).rowCount).toBe(0);
    expect((await db.as(user(cashierA), "select 1 from public.audit_log")).rowCount).toBe(0);
    const ms = await db.as(user(cashierA), "select user_id from public.memberships");
    expect(ms.rows).toEqual([{ user_id: cashierA }]);
  });

  it("kassir egasi funksiyalarini chaqira olmaydi", async () => {
    expect(
      await errorOf(db.as(user(cashierA), "select public.update_shop_settings($1, 'X do‘kon', 'Asia/Tashkent', 5)", [shopA])),
    ).toBe("forbidden");
    expect(await errorOf(db.as(user(cashierA), "select public.set_member_pin($1, '7391')", [memberCashierA]))).toBe(
      "forbidden",
    );
    expect(
      await errorOf(
        db.as(user(cashierA), "select public.register_device($1, 'X', $2)", [shopA, randomBytes(32).toString("hex")]),
      ),
    ).toBe("forbidden");
  });

  it("PIN hash hech kimga ochiq emas, qurilma token hash’i ham", async () => {
    expect(await errorOf(db.as(user(ownerA), "select * from public.membership_pins"))).toMatch(/permission denied/);
    expect(await errorOf(db.as(user(cashierA), "select * from public.membership_pins"))).toMatch(/permission denied/);
    expect(await errorOf(db.as(user(ownerA), "select token_hash from public.pos_devices"))).toMatch(
      /permission denied/,
    );
    const ok = await db.as(user(ownerA), "select id, name from public.pos_devices where shop_id = $1", [shopA]);
    expect(ok.rowCount).toBe(1);
  });

  it("mijoz rollari PIN tekshiruvi va qurilma funksiyalarini chaqira olmaydi", async () => {
    for (const actor of [user(ownerA), user(cashierA), anon]) {
      expect(
        await errorOf(db.as(actor, "select * from public.pin_check($1, $2, '2580')", [deviceTokenA, memberCashierA])),
      ).toMatch(/permission denied/);
      expect(await errorOf(db.as(actor, "select * from public.device_staff_list($1)", [deviceTokenA]))).toMatch(
        /permission denied/,
      );
    }
  });
});

describe("PIN", () => {
  const check = (token: string, membership: string, pin: string) =>
    db.as(service, "select * from public.pin_check($1, $2, $3)", [token, membership, pin]).then((r) => r.rows[0]);

  it("zaif yoki noto‘g‘ri formatdagi PIN rad etiladi", async () => {
    for (const pin of ["1111", "1234", "4321", "123456", "0000"]) {
      expect(await errorOf(db.as(user(ownerA), "select public.set_member_pin($1, $2)", [memberCashierA, pin])), pin).toBe(
        "weak_pin",
      );
    }
    for (const pin of ["12", "1234567", "12a4", ""]) {
      expect(await errorOf(db.as(user(ownerA), "select public.set_member_pin($1, $2)", [memberCashierA, pin])), pin).toBe(
        "invalid_pin_format",
      );
    }
  });

  it("bog‘langan qurilmada to‘g‘ri PIN ishlaydi va xodim ID’sini qaytaradi", async () => {
    const r = await check(deviceTokenA, memberCashierA, "2580");
    expect(r).toMatchObject({ ok: true, code: "ok", user_id: cashierA, shop_id: shopA });
  });

  it("qurilma ro‘yxatida faqat shu do‘kon xodimlari chiqadi, hash chiqmaydi", async () => {
    const r = await db.as(service, "select * from public.device_staff_list($1)", [deviceTokenA]);
    expect(r.rows.map((x) => x.full_name).sort()).toEqual(["Ega A", "Kassir Ali"]);
    expect(Object.keys(r.rows[0]).sort()).toEqual(["full_name", "has_pin", "membership_id", "role"]);
  });

  it("noma’lum yoki boshqa do‘kon qurilmasida PIN ishlamaydi", async () => {
    expect(await check("notogri-token-notogri-token-notogri", memberCashierA, "2580")).toMatchObject({
      ok: false,
      code: "device_invalid",
    });
    expect(await check(deviceTokenB, memberCashierA, "2580")).toMatchObject({ ok: false, code: "member_invalid" });
  });

  it("5 ta xatodan keyin bloklanadi, blok vaqtida to‘g‘ri PIN ham ishlamaydi", async () => {
    for (let i = 1; i <= 4; i++) {
      expect(await check(deviceTokenA, memberCashierA, "9999")).toMatchObject({
        ok: false,
        code: "wrong_pin",
        attempts_left: 5 - i,
      });
    }
    const fifth = await check(deviceTokenA, memberCashierA, "9999");
    expect(fifth).toMatchObject({ ok: false, code: "locked" });
    const minutes = (new Date(fifth.locked_until).getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(4.9);
    expect(minutes).toBeLessThanOrEqual(5);

    expect(await check(deviceTokenA, memberCashierA, "2580")).toMatchObject({ ok: false, code: "locked" });

    // Blok muddati tugaganini taqlid qilamiz.
    await db.sql("update public.membership_pins set locked_until = now() - interval '1 second' where membership_id = $1", [
      memberCashierA,
    ]);
    expect(await check(deviceTokenA, memberCashierA, "2580")).toMatchObject({ ok: true });

    const audit = await db.as(
      user(ownerA),
      "select action, count(*)::int as n from public.audit_log where shop_id = $1 and action like 'pin.%' group by action",
      [shopA],
    );
    const counts = Object.fromEntries(audit.rows.map((x) => [x.action, x.n]));
    expect(counts["pin.failed"]).toBe(4);
    expect(counts["pin.locked"]).toBe(1);
    expect(counts["pin.rejected"]).toBeGreaterThanOrEqual(1);
  });

  it("uzilgan qurilmada PIN ishlamaydi", async () => {
    const token = randomBytes(32).toString("base64url");
    const id = (await db.as(user(ownerA), "select public.register_device($1, 'Vaqtinchalik', $2) as id", [shopA, token]))
      .rows[0].id;
    expect(await check(token, memberCashierA, "2580")).toMatchObject({ ok: true });
    await db.as(user(ownerA), "select public.revoke_device($1)", [id]);
    expect(await check(token, memberCashierA, "2580")).toMatchObject({ ok: false, code: "device_invalid" });
    const lookup = await db.as(service, "select * from public.device_lookup($1)", [token]);
    expect(lookup.rowCount).toBe(0);
    const live = await db.as(service, "select shop_id, device_id from public.device_lookup($1)", [deviceTokenA]);
    expect(live.rows[0]).toEqual({ shop_id: shopA, device_id: deviceA });
  });
});

describe("Sessiyalarni bekor qilish", () => {
  it("PIN almashtirilsa, kassirning eski tokeni do‘konga kira olmaydi va auth sessiyalari o‘chadi", async () => {
    const extra = await db.createAuthUser();
    const m = (await db.as(user(ownerA), "select public.add_staff_member($1, $2, 'vali', 'Vali Karimov') as id", [shopA, extra]))
      .rows[0].id;
    await db.as(user(ownerA), "select public.set_member_pin($1, '3691')", [m]);

    const oldIat = now() - 5;
    expect((await db.as(user(extra, oldIat), "select 1 from public.shops where id = $1", [shopA])).rowCount).toBe(1);

    await db.as(user(ownerA), "select public.set_member_pin($1, '4826')", [m]);

    expect((await db.as(user(extra, oldIat), "select 1 from public.shops where id = $1", [shopA])).rowCount).toBe(0);
    const sessions = await db.sql("select count(*)::int as n from auth.sessions where user_id = $1", [extra]);
    expect(sessions.rows[0].n).toBe(0);

    await sleep(1100);
    // Qayta kirgandan keyingi yangi token ishlaydi.
    expect((await db.as(user(extra, now()), "select 1 from public.shops where id = $1", [shopA])).rowCount).toBe(1);
  });

  it("nofaol qilingan kassir na token, na PIN bilan kira oladi", async () => {
    const extra = await db.createAuthUser();
    const m = (await db.as(user(ownerA), "select public.add_staff_member($1, $2, 'soli', 'Soli Aliyev') as id", [shopA, extra]))
      .rows[0].id;
    await db.as(user(ownerA), "select public.set_member_pin($1, '5937')", [m]);

    await db.as(user(ownerA), "select public.set_staff_active($1, false)", [m]);

    expect((await db.as(user(extra, now() + 60), "select 1 from public.shops where id = $1", [shopA])).rowCount).toBe(0);
    const pin = await db.as(service, "select * from public.pin_check($1, $2, '5937')", [deviceTokenA, m]);
    expect(pin.rows[0]).toMatchObject({ ok: false, code: "member_invalid" });
    const sessions = await db.sql("select count(*)::int as n from auth.sessions where user_id = $1", [extra]);
    expect(sessions.rows[0].n).toBe(0);
  });

  it("egasini kassir funksiyalari orqali o‘chirib yoki o‘zgartirib bo‘lmaydi", async () => {
    expect(await errorOf(db.as(user(ownerA), "select public.set_staff_active($1, false)", [memberOwnerA]))).toBe(
      "forbidden",
    );
  });
});

describe("Xodim qo‘shish", () => {
  it("band login rad etiladi (katta-kichik harf farqsiz)", async () => {
    const extra = await db.createAuthUser();
    expect(
      await errorOf(db.as(user(ownerA), "select public.add_staff_member($1, $2, 'KASSIR.A', 'Boshqa odam')", [shopA, extra])),
    ).toBe("login_taken");
  });

  it("allaqachon a’zo foydalanuvchini qayta qo‘shib bo‘lmaydi", async () => {
    expect(
      await errorOf(db.as(user(ownerA), "select public.add_staff_member($1, $2, 'yangi.login', 'Ega B')", [shopA, ownerB])),
    ).toBe("user_already_member");
  });

  it("egasi o‘z xodimining loginini ko‘radi, boshqa do‘kon egasi ko‘rmaydi", async () => {
    expect((await db.as(user(ownerA), "select login from public.staff_logins where user_id = $1", [cashierA])).rows).toEqual([
      { login: "kassir.a" },
    ]);
    expect((await db.as(user(ownerB), "select 1 from public.staff_logins where user_id = $1", [cashierA])).rowCount).toBe(
      0,
    );
  });
});

describe("Xodimlar ro‘yxati", () => {
  it("egasi ro‘yxatni PIN holati bilan oladi, hash chiqmaydi", async () => {
    const r = await db.as(user(ownerA), "select * from public.list_shop_members($1)", [shopA]);
    const kassir = r.rows.find((x) => x.membership_id === memberCashierA);
    expect(kassir).toMatchObject({ login: "kassir.a", has_pin: true, role: "cashier", can_discount: true });
    expect(Object.keys(kassir!)).not.toContain("pin_hash");
  });

  it("kassir va boshqa do‘kon egasi ro‘yxatni ololmaydi", async () => {
    expect(await errorOf(db.as(user(cashierA), "select * from public.list_shop_members($1)", [shopA]))).toBe("forbidden");
    expect(await errorOf(db.as(user(ownerB), "select * from public.list_shop_members($1)", [shopA]))).toBe("forbidden");
  });
});

describe("To‘xtatilgan do‘kon", () => {
  it("o‘qish ishlaydi, yozish amallari rad etiladi", async () => {
    const owner = await db.createAuthUser();
    const shop = (await db.as(user(owner), "select public.create_shop('To‘xtatilgan do‘kon') as id")).rows[0].id;
    await db.sql("update public.shops set status = 'suspended' where id = $1", [shop]);

    expect((await db.as(user(owner), "select 1 from public.shops where id = $1", [shop])).rowCount).toBe(1);
    expect(
      await errorOf(db.as(user(owner), "select public.update_shop_settings($1, 'Yangi nom', 'Asia/Tashkent', 5)", [shop])),
    ).toBe("shop_suspended");
    const extra = await db.createAuthUser();
    expect(
      await errorOf(db.as(user(owner), "select public.add_staff_member($1, $2, 'xodim1', 'Xodim Bir')", [shop, extra])),
    ).toBe("shop_suspended");
    expect(
      await errorOf(
        db.as(user(owner), "select public.register_device($1, 'K', $2)", [shop, randomBytes(32).toString("hex")]),
      ),
    ).toBe("shop_suspended");
  });
});

describe("Ichki sxema", () => {
  it("private sxema funksiyalari mijozga yopiq", async () => {
    expect(await errorOf(db.as(user(ownerA), "select private.token_hash('x')"))).toMatch(/permission denied/);
    expect(await errorOf(db.as(user(ownerA), "select private.revoke_auth_sessions($1)", [ownerB]))).toMatch(
      /permission denied/,
    );
  });

  it("barcha public jadvallarda RLS yoqilgan", async () => {
    const r = await db.sql(
      "select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity",
    );
    expect(r.rows).toEqual([]);
  });
});
