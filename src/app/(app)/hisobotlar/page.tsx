import { requireShop } from "@/lib/session";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Hisobotlar" };

export default async function ReportsPage() {
  await requireShop({ owner: true });
  return (
    <>
      <div className="page-head">
        <h1>Hisobotlar</h1>
      </div>
      <EmptyState title="Hisobot uchun ma’lumot yo‘q" />
    </>
  );
}
