import Link from "next/link";
import { requireShop } from "@/lib/session";
import { AddStaffForm } from "./AddStaffForm";
import { permissionList, type MemberRow } from "./members";

export const metadata = { title: "Xodimlar" };

export default async function StaffPage() {
  const { supabase, ctx } = await requireShop({ owner: true });
  const { data, error } = await supabase.rpc("list_shop_members", { p_shop: ctx.shop_id });
  const rows = (data ?? []) as MemberRow[];

  return (
    <div className="stack" style={{ gap: 20 }}>
      <section className="panel">
        <div className="panel-pad row">
          <h2>Xodimlar</h2>
          <span className="muted">{rows.length} ta</span>
        </div>
        {error ? (
          <div className="panel-pad">
            <div className="alert alert-error" role="alert">
              Xodimlar ro‘yxatini yuklab bo‘lmadi. Sahifani yangilang.
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Login</th>
                  <th>Rol</th>
                  <th>Ruxsatlar</th>
                  <th>PIN</th>
                  <th>Holat</th>
                  <th>
                    <span className="visually-hidden">Amallar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.membership_id}>
                    <td>{m.full_name || "—"}</td>
                    <td>{m.login ?? <span className="muted">email orqali</span>}</td>
                    <td>{m.role === "owner" ? "Egasi" : "Kassir"}</td>
                    <td>{permissionList(m)}</td>
                    <td>
                      {m.pin_locked_until ? (
                        <span className="badge badge-danger">Bloklangan</span>
                      ) : m.has_pin ? (
                        <span className="badge badge-ok">O‘rnatilgan</span>
                      ) : (
                        <span className="badge">Yo‘q</span>
                      )}
                    </td>
                    <td>{m.active ? "Faol" : <span className="badge badge-danger">Nofaol</span>}</td>
                    <td className="num">
                      <Link className="btn btn-small" href={`/sozlamalar/xodimlar/${m.membership_id}`}>
                        Boshqarish
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel panel-pad" style={{ maxWidth: 640 }}>
        <h2 style={{ marginBottom: 12 }}>Yangi kassir qo‘shish</h2>
        {ctx.status === "suspended" ? (
          <div className="alert alert-warn">Do‘kon to‘xtatilgan, yangi xodim qo‘shib bo‘lmaydi.</div>
        ) : (
          <AddStaffForm />
        )}
      </section>
    </div>
  );
}
