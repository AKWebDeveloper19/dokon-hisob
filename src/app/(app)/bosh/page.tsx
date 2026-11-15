import { requireShop } from "@/lib/session";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Bosh sahifa" };

export default async function DashboardPage() {
  const { ctx } = await requireShop({ owner: true });
  return (
    <>
      <div className="page-head">
        <h1>Bosh sahifa</h1>
      </div>
      <EmptyState title={`${ctx.shop_name}: hali savdo ma’lumoti yo‘q`}>
        Mahsulot qo‘shib, kirim va sotuv qilinganidan keyin bu yerda tushum, yalpi foyda va kam qolgan tovarlar
        ko‘rinadi.
      </EmptyState>
    </>
  );
}
