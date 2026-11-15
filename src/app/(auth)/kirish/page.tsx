import Link from "next/link";
import { cookies } from "next/headers";
import { LoginForm } from "./LoginForm";
import { DEVICE_COOKIE } from "@/lib/cookies";

export const metadata = { title: "Kirish" };

export default async function LoginPage() {
  const deviceBound = Boolean((await cookies()).get(DEVICE_COOKIE));
  return (
    <main className="auth-page">
      <div className="panel auth-card stack">
        <div>
          <div className="auth-brand">Do‘kon Hisob</div>
          <h1>Tizimga kirish</h1>
        </div>
        <LoginForm />
        {deviceBound ? (
          <Link href="/kassa-kirish" className="btn btn-block">
            PIN bilan kirish (kassa)
          </Link>
        ) : null}
        <p className="muted">
          Do‘koningiz hali yo‘qmi? <Link href="/royxatdan-otish">Ro‘yxatdan o‘ting</Link>
        </p>
      </div>
    </main>
  );
}
