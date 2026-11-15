import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { isStaffEmail } from "@/lib/staff";
import { logoutAction, selectShopAction } from "../actions";

export const metadata = { title: "Do‘konni tanlang" };

type Row = {
  shop_id: string;
  role: "owner" | "cashier";
  shops: { name: string; is_demo: boolean; status: "active" | "suspended" } | null;
};

export default async function SelectShopPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("memberships")
    .select("shop_id, role, shops(name, is_demo, status)")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at");

  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.shops);
  const isStaff = isStaffEmail(user.email ?? "");

  if (!error && rows.length === 0 && !isStaff) redirect("/dokon-yaratish");

  return (
    <main className="auth-page">
      <div className="panel auth-card stack">
        <div>
          <div className="auth-brand">Do‘kon Hisob</div>
          <h1>Do‘konni tanlang</h1>
        </div>
        {error ? (
          <div className="alert alert-error" role="alert">
            Do‘konlar ro‘yxatini yuklab bo‘lmadi. Sahifani yangilang.
          </div>
        ) : null}
        {rows.length === 0 && isStaff ? (
          <div className="alert alert-warn">Siz hech bir faol do‘konga biriktirilmagansiz. Do‘kon egasi bilan bog‘laning.</div>
        ) : null}
        <div className="stack">
          {rows.map((r) => (
            <form key={r.shop_id} action={selectShopAction}>
              <input type="hidden" name="shop_id" value={r.shop_id} />
              <button type="submit" className="btn btn-block" style={{ justifyContent: "space-between" }}>
                <span>{r.shops!.name}</span>
                <span className="row">
                  {r.shops!.is_demo ? <span className="badge badge-demo">Demo</span> : null}
                  {r.shops!.status === "suspended" ? <span className="badge badge-danger">To‘xtatilgan</span> : null}
                  <span className="badge">{r.role === "owner" ? "Egasi" : "Kassir"}</span>
                </span>
              </button>
            </form>
          ))}
        </div>
        {!isStaff ? (
          <Link href="/dokon-yaratish" className="btn btn-block">
            Yangi do‘kon ochish
          </Link>
        ) : null}
        <form action={logoutAction}>
          <button type="submit" className="btn btn-block">
            Chiqish
          </button>
        </form>
      </div>
    </main>
  );
}
