import { cookies } from "next/headers";
import { requireShop } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVICE_COOKIE } from "@/lib/cookies";
import { BindDeviceForm } from "./BindDeviceForm";
import { enterPosModeAction, revokeDeviceAction } from "../actions";

export const metadata = { title: "Kassa qurilmalari" };

type Device = { id: string; name: string; created_at: string; last_seen_at: string | null; revoked_at: string | null };

function fmt(ts: string | null, tz: string) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("uz-UZ", { dateStyle: "short", timeStyle: "short", timeZone: tz }).format(new Date(ts));
}

export default async function DevicesPage() {
  const { supabase, ctx } = await requireShop({ owner: true });
  const { data, error } = await supabase
    .from("pos_devices")
    .select("id, name, created_at, last_seen_at, revoked_at")
    .eq("shop_id", ctx.shop_id)
    .order("created_at", { ascending: false });
  const devices = (data ?? []) as Device[];

  // Joriy brauzer qaysi qurilma ekanini aniqlash.
  let currentId: string | null = null;
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (token) {
    const { data: d } = await createAdminClient().rpc("device_lookup", { p_token: token });
    const row = (d as Array<{ device_id: string; shop_id: string }> | null)?.[0];
    if (row?.shop_id === ctx.shop_id) currentId = row.device_id;
  }
  const active = devices.filter((d) => !d.revoked_at);
  const revoked = devices.filter((d) => d.revoked_at);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <section className="panel panel-pad stack" style={{ maxWidth: 640 }}>
        <h2>Shu brauzer</h2>
        {currentId ? (
          <>
            <div className="alert alert-ok">
              Bu brauzer kassa qurilmasi sifatida bog‘langan. Xodimlar bu yerda PIN bilan kira oladi.
            </div>
            <form action={enterPosModeAction}>
              <button type="submit" className="btn btn-primary">
                Kassa rejimiga o‘tish
              </button>
            </form>
            <p className="muted" style={{ fontSize: 13 }}>
              Siz tizimdan chiqasiz va PIN ekrani ochiladi. Egasi sifatida qaytish uchun o‘z PIN’ingiz yoki email va
              parolingizdan foydalaning.
            </p>
          </>
        ) : (
          <>
            <p className="muted">
              Do‘kon peshtaxtasidagi kompyuter yoki planshetni bog‘lang. Bog‘lanmagan qurilmada PIN bilan kirib bo‘lmaydi.
            </p>
            {ctx.status === "suspended" ? (
              <div className="alert alert-warn">Do‘kon to‘xtatilgan, yangi qurilma bog‘lab bo‘lmaydi.</div>
            ) : (
              <BindDeviceForm />
            )}
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-pad">
          <h2>Bog‘langan qurilmalar</h2>
        </div>
        {error ? (
          <div className="panel-pad">
            <div className="alert alert-error">Ro‘yxatni yuklab bo‘lmadi. Sahifani yangilang.</div>
          </div>
        ) : active.length === 0 ? (
          <div className="empty">Hali bog‘langan qurilma yo‘q.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Bog‘langan</th>
                  <th>Oxirgi faollik</th>
                  <th>
                    <span className="visually-hidden">Amallar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {active.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {d.name} {d.id === currentId ? <span className="badge badge-ok">Shu brauzer</span> : null}
                    </td>
                    <td className="num">{fmt(d.created_at, ctx.timezone)}</td>
                    <td className="num">{fmt(d.last_seen_at, ctx.timezone)}</td>
                    <td className="num">
                      <form action={revokeDeviceAction}>
                        <input type="hidden" name="device_id" value={d.id} />
                        <input type="hidden" name="is_current" value={String(d.id === currentId)} />
                        <button type="submit" className="btn btn-small btn-danger">
                          Uzish
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {revoked.length ? (
          <p className="panel-pad muted" style={{ fontSize: 13 }}>
            Uzilgan qurilmalar: {revoked.length} ta. Ular orqali endi PIN bilan kirib bo‘lmaydi.
          </p>
        ) : null}
      </section>
    </div>
  );
}
