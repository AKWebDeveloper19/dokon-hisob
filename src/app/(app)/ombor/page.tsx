import { requireShop } from "@/lib/session";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Ombor" };

export default async function StockPage() {
  await requireShop({ owner: true });
  return (
    <>
      <div className="page-head">
        <h1>Ombor</h1>
      </div>
      <EmptyState title="Ombor harakatlari yo‘q">Kirim, sotuv va hisobdan chiqarish harakatlari shu yerda ko‘rinadi.</EmptyState>
    </>
  );
}
