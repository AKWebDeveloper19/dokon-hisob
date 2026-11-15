import { requireShop } from "@/lib/session";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Mahsulotlar" };

export default async function ProductsPage() {
  await requireShop();
  return (
    <>
      <div className="page-head">
        <h1>Mahsulotlar</h1>
      </div>
      <EmptyState title="Mahsulotlar hali qo‘shilmagan" />
    </>
  );
}
