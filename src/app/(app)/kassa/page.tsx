import { requireShop } from "@/lib/session";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Kassa" };

export default async function PosPage() {
  await requireShop();
  return (
    <>
      <div className="page-head">
        <h1>Kassa</h1>
      </div>
      <EmptyState title="Sotuv uchun mahsulot yo‘q">
        Mahsulotlar qo‘shilgach, shu yerda shtrix-kod skanerlab sotuv qilinadi.
      </EmptyState>
    </>
  );
}
