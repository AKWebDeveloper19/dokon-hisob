import { requireShop } from "@/lib/session";
import { logoutAction } from "../(auth)/actions";
import { NavLinks } from "@/components/NavLinks";
import { IdleLock } from "@/components/IdleLock";
import { LockScreen } from "@/components/LockScreen";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { ctx, deviceBound, locked } = await requireShop();
  const isOwner = ctx.role === "owner";

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Asosiy menyu">
        <div className="sidebar-inner">
          <div className="sidebar-shop">
            <strong>
              {ctx.shop_name}
              {ctx.is_demo ? <span className="badge badge-demo">Demo</span> : null}
            </strong>
            <span className="muted" style={{ fontSize: 13 }}>
              {isOwner ? "Egasi" : "Kassir"}
            </span>
          </div>
          <NavLinks isOwner={isOwner} />
          <div className="sidebar-foot">
            <span className="who muted">{ctx.full_name}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-small">
                {deviceBound ? "Xodimni almashtirish" : "Chiqish"}
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="main">
        {ctx.status === "suspended" ? (
          <div className="alert alert-warn" style={{ marginBottom: 16 }}>
            Do‘kon faoliyati to‘xtatilgan. Ma’lumotlarni ko‘rish mumkin, lekin o‘zgartirib bo‘lmaydi.
          </div>
        ) : null}
        {/* Qulf vaqtida sahifa mazmuni umuman chizilmaydi. */}
        {deviceBound && locked ? null : children}
      </main>
      {deviceBound ? <IdleLock minutes={ctx.lock_minutes} /> : null}
      {deviceBound && locked ? <LockScreen fullName={ctx.full_name} /> : null}
    </div>
  );
}
