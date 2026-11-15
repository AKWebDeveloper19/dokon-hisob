import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/session";
import type { MemberRow } from "../members";
import { PasswordForm, PinForm, StaffEditForm } from "./forms";
import { revokeSessionsAction, setStaffActiveAction } from "../../actions";

export const metadata = { title: "Xodim" };

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, ctx } = await requireShop({ owner: true });
  const { data } = await supabase.rpc("list_shop_members", { p_shop: ctx.shop_id });
  const m = ((data ?? []) as MemberRow[]).find((x) => x.membership_id === id);
  if (!m) notFound();

  const isSelf = m.role === "owner";
  const readOnly = ctx.status === "suspended";

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 640 }}>
      <div className="row">
        <Link href="/sozlamalar/xodimlar" className="btn btn-small">
          ← Xodimlar
        </Link>
        <h2>{m.full_name}</h2>
        {!m.active ? <span className="badge badge-danger">Nofaol</span> : null}
        {m.pin_locked_until ? <span className="badge badge-danger">PIN bloklangan</span> : null}
      </div>

      {readOnly ? <div className="alert alert-warn">Do‘kon to‘xtatilgan, o‘zgartirib bo‘lmaydi.</div> : null}

      {!isSelf ? (
        <section className="panel panel-pad stack">
          <h3>Ma’lumot va ruxsatlar</h3>
          <p className="muted">Login: {m.login}</p>
          <StaffEditForm member={m} disabled={readOnly} />
        </section>
      ) : null}

      <section className="panel panel-pad stack">
        <h3>{m.has_pin ? "PIN’ni almashtirish" : "PIN o‘rnatish"}</h3>
        {m.pin_locked_until ? (
          <p className="alert alert-warn">
            Ko‘p xato urinish tufayli PIN vaqtincha bloklangan. Yangi PIN o‘rnatilsa, blok darhol olinadi.
          </p>
        ) : null}
        <PinForm membershipId={m.membership_id} disabled={readOnly} isSelf={isSelf} />
      </section>

      {!isSelf ? (
        <>
          <section className="panel panel-pad stack">
            <h3>Yangi parol berish</h3>
            <PasswordForm membershipId={m.membership_id} disabled={readOnly} />
          </section>

          <section className="panel panel-pad stack">
            <h3>Kirish huquqi</h3>
            <div className="row">
              <form action={revokeSessionsAction}>
                <input type="hidden" name="membership_id" value={m.membership_id} />
                <button type="submit" className="btn">
                  Barcha sessiyalarini yopish
                </button>
              </form>
              <form action={setStaffActiveAction}>
                <input type="hidden" name="membership_id" value={m.membership_id} />
                <input type="hidden" name="active" value={m.active ? "false" : "true"} />
                <button type="submit" className={m.active ? "btn btn-danger" : "btn"} disabled={readOnly}>
                  {m.active ? "Nofaol qilish" : "Qayta faollashtirish"}
                </button>
              </form>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              Nofaol xodim tizimga kira olmaydi, ochiq sessiyalari darhol yopiladi. Uning eski sotuvlari saqlanib qoladi.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
