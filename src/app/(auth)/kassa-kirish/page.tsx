import Link from "next/link";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVICE_COOKIE } from "@/lib/cookies";
import { PinLogin, type StaffOption } from "./PinLogin";

export const metadata = { title: "Kassaga kirish" };
export const dynamic = "force-dynamic";

export default async function PinLoginPage() {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;

type DeviceInfo = { device_name: string; shop_name: string; is_demo: boolean };

  let device: DeviceInfo | null = null;
  let staff: StaffOption[] = [];
  let loadError = false;

  if (token) {
    try {
      const admin = createAdminClient();
      const [d, s] = await Promise.all([
        admin.rpc("device_lookup", { p_token: token }),
        admin.rpc("device_staff_list", { p_token: token }),
      ]);
      if (d.error || s.error) loadError = true;
      device = (d.data as DeviceInfo[] | null)?.[0] ?? null;
      staff = ((s.data ?? []) as StaffOption[]).filter((x) => x.has_pin);
    } catch {
      loadError = true;
    }
  }

  return (
    <main className="auth-page">
      <div className="panel auth-card stack" style={{ maxWidth: 520 }}>
        <div>
          <div className="auth-brand">Do‘kon Hisob · Kassa</div>
          {device ? (
            <>
              <h1 className="row">
                {device.shop_name}
                {device.is_demo ? <span className="badge badge-demo">Demo</span> : null}
              </h1>
              <p className="muted">Qurilma: {device.device_name}</p>
            </>
          ) : (
            <h1>Kassaga kirish</h1>
          )}
        </div>

        {loadError ? (
          <div className="alert alert-error" role="alert">
            Server bilan aloqa yo‘q. Internetni tekshirib, sahifani yangilang.
          </div>
        ) : !device ? (
          <div className="alert alert-warn">
            Bu brauzer kassa qurilmasi sifatida bog‘lanmagan yoki uzib qo‘yilgan. Do‘kon egasi tizimga kirib, Sozlamalar →
            Qurilmalar bo‘limida bog‘lashi kerak.
          </div>
        ) : staff.length === 0 ? (
          <div className="alert alert-warn">
            PIN o‘rnatilgan faol xodim yo‘q. Egasi Sozlamalar → Xodimlar bo‘limida PIN o‘rnatadi.
          </div>
        ) : (
          <PinLogin staff={staff} />
        )}

        <Link href="/kirish" className="btn btn-block">
          Login va parol bilan kirish
        </Link>
      </div>
    </main>
  );
}
