import { requireShop } from "@/lib/session";
import { SettingsNav } from "./SettingsNav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireShop({ owner: true });
  return (
    <>
      <div className="page-head">
        <h1>Sozlamalar</h1>
      </div>
      <SettingsNav />
      {children}
    </>
  );
}
