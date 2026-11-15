import { requireShop } from "@/lib/session";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Sotuvlar" };

export default async function SalesPage() {
  await requireShop();
  return (
    <>
      <div className="page-head">
        <h1>Sotuvlar</h1>
      </div>
      <EmptyState title="Hali sotuv yo‘q" />
    </>
  );
}
