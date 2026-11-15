import { requireUser } from "@/lib/session";
import { CreateShopForm } from "./CreateShopForm";

export const metadata = { title: "Do‘kon yaratish" };

export default async function CreateShopPage() {
  await requireUser();
  return (
    <main className="auth-page">
      <div className="panel auth-card stack">
        <div>
          <div className="auth-brand">Do‘kon Hisob</div>
          <h1>Yangi do‘kon</h1>
          <p className="muted">Do‘kon ma’lumotlari boshqa do‘konlardan to‘liq ajratilgan holda saqlanadi.</p>
        </div>
        <CreateShopForm />
      </div>
    </main>
  );
}
