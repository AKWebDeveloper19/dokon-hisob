import { requireShop } from "@/lib/session";
import { ShopSettingsForm } from "./ShopSettingsForm";

export const metadata = { title: "Do‘kon sozlamalari" };

export default async function ShopSettingsPage() {
  const { ctx } = await requireShop({ owner: true });
  return (
    <div className="panel panel-pad" style={{ maxWidth: 560 }}>
      <ShopSettingsForm
        name={ctx.shop_name}
        timezone={ctx.timezone}
        lockMinutes={ctx.lock_minutes}
        disabled={ctx.status === "suspended"}
      />
      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
        Valyuta: so‘m (UZS). {ctx.is_demo ? "Bu demo do‘kon: undagi ma’lumotlar sinov uchun." : null}
      </p>
    </div>
  );
}
