"use client";

import { useActionState, useState } from "react";
import { loginAction } from "../actions";
import { Field, FormAlert, SubmitButton } from "@/components/form";

export function LoginForm() {
  const [mode, setMode] = useState<"ega" | "xodim">("ega");
  const [state, action] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="stack">
      <div className="tabs" role="tablist" aria-label="Kim sifatida kirasiz">
        <button type="button" role="tab" aria-selected={mode === "ega"} onClick={() => setMode("ega")}>
          Do‘kon egasi
        </button>
        <button type="button" role="tab" aria-selected={mode === "xodim"} onClick={() => setMode("xodim")}>
          Xodim
        </button>
      </div>
      <input type="hidden" name="mode" value={mode} />
      <FormAlert state={state} />
      {mode === "ega" ? (
        <Field key="email" label="Email" name="identifier" type="email" autoComplete="email" required autoFocus />
      ) : (
        <Field
          key="login"
          label="Login"
          name="identifier"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          hint="Loginni do‘kon egasi beradi."
          required
          autoFocus
        />
      )}
      <Field label="Parol" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton className="btn btn-primary btn-block" pendingText="Kirilmoqda…">
        Kirish
      </SubmitButton>
    </form>
  );
}
