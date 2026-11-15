"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "../actions";
import { Field, FormAlert, SubmitButton } from "@/components/form";

export default function SignupPage() {
  const [state, action] = useActionState(signupAction, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <main className="auth-page">
      <div className="panel auth-card stack">
        <div>
          <div className="auth-brand">Do‘kon Hisob</div>
          <h1>Do‘kon egasi sifatida ro‘yxatdan o‘tish</h1>
        </div>
        <form action={action} className="stack">
          <FormAlert state={state} />
          <Field label="Ism va familiya" name="full_name" autoComplete="name" required error={fe.full_name} />
          <Field label="Email" name="email" type="email" autoComplete="email" required error={fe.email} />
          <Field
            label="Parol"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            hint="Kamida 8 ta belgi."
            required
            error={fe.password}
          />
          <SubmitButton className="btn btn-primary btn-block" pendingText="Yaratilmoqda…">
            Ro‘yxatdan o‘tish
          </SubmitButton>
        </form>
        <p className="muted">
          Hisobingiz bormi? <Link href="/kirish">Kirish</Link>
        </p>
        <p className="muted" style={{ fontSize: 13 }}>
          Kassirlar bu yerda ro‘yxatdan o‘tmaydi: ularni do‘kon egasi qo‘shadi.
        </p>
      </div>
    </main>
  );
}
