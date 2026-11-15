import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

const ROOT = path.resolve(__dirname, "../..");

export function adminUrl(): string {
  return process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://postgres@127.0.0.1:54329/postgres";
}

function withDatabase(url: string, db: string): string {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u.toString();
}

/** Toza test bazasini yaratadi: shim (agar auth yo‘q bo‘lsa) + barcha migratsiyalar. */
export async function createTestDatabase(): Promise<{ url: string; drop: () => Promise<void> }> {
  const name = `dokon_test_${randomBytes(4).toString("hex")}`;
  const admin = new pg.Client({ connectionString: adminUrl() });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();

  const url = withDatabase(adminUrl(), name);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const hasAuth = await c.query(`select 1 from pg_namespace where nspname = 'auth'`);
  if (hasAuth.rowCount === 0) {
    await c.query(readFileSync(path.join(ROOT, "tests/db/supabase-shim.sql"), "utf8"));
  }
  const dir = path.join(ROOT, "supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await c.query(readFileSync(path.join(dir, file), "utf8"));
  }
  await c.end();

  return {
    url,
    drop: async () => {
      const a = new pg.Client({ connectionString: adminUrl() });
      await a.connect();
      await a.query(`drop database if exists ${name} with (force)`);
      await a.end();
    },
  };
}

export type Actor =
  | { kind: "user"; id: string; iat?: number }
  | { kind: "anon" }
  | { kind: "service" };

/** Supabase so‘rovini taqlid qiladi: rol + JWT claimlari tranzaksiya ichida o‘rnatiladi. */
export class TestDb {
  constructor(public pool: pg.Pool) {}

  static async open(url: string) {
    return new TestDb(new pg.Pool({ connectionString: url, max: 10 }));
  }

  async close() {
    await this.pool.end();
  }

  /** Superuser sifatida (test tayyorlash uchun). */
  async sql<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []) {
    return this.pool.query<T>(text, params);
  }

  async as<T extends pg.QueryResultRow = pg.QueryResultRow>(
    actor: Actor,
    text: string,
    params: unknown[] = [],
  ): Promise<pg.QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      if (actor.kind === "user") {
        const claims = {
          sub: actor.id,
          role: "authenticated",
          iat: actor.iat ?? Math.floor(Date.now() / 1000),
        };
        await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
        await client.query("set local role authenticated");
      } else if (actor.kind === "anon") {
        await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "anon" })]);
        await client.query("set local role anon");
      } else {
        await client.query("select set_config('request.jwt.claims', $1, true)", [
          JSON.stringify({ role: "service_role" }),
        ]);
        await client.query("set local role service_role");
      }
      const res = await client.query<T>(text, params);
      await client.query("commit");
      return res;
    } catch (e) {
      await client.query("rollback").catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  }

  async createAuthUser(email?: string): Promise<string> {
    const id = randomUUID();
    await this.sql("insert into auth.users (id, email) values ($1, $2)", [id, email ?? `${id}@test.invalid`]);
    await this.sql("insert into auth.sessions (user_id) values ($1)", [id]);
    return id;
  }
}

export const user = (id: string, iat?: number): Actor => ({ kind: "user", id, iat });
export const anon: Actor = { kind: "anon" };
export const service: Actor = { kind: "service" };

/** Xatoni kutadi va uning xabarini qaytaradi. */
export async function errorOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("Xato kutilgan edi, lekin so‘rov muvaffaqiyatli bajarildi");
}
