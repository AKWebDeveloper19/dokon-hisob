"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction, unlockAction } from "@/app/(auth)/actions";
import { PinPad } from "./PinPad";
import { FormAlert, SubmitButton } from "./form";

export function LockScreen({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [state, action, pending] = useActionState(unlockAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok === "unlocked") router.refresh();
  }, [state, router]);

  const submit = (fd: FormData) => {
    setPin("");
    action(fd);
  };

  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-labelledby="lock-title">
      <div className="panel auth-card stack">
        <div>
          <h1 id="lock-title">Ekran qulflangan</h1>
          <p className="muted">{fullName}, davom etish uchun PIN kiriting.</p>
        </div>
        <form ref={formRef} action={submit} className="stack">
          <FormAlert state={state?.ok ? undefined : state} />
          <PinPad value={pin} onChange={setPin} disabled={pending} onSubmit={() => formRef.current?.requestSubmit()} />
          <SubmitButton className="btn btn-primary btn-block" pendingText="Tekshirilmoqda…">
            Qulfni ochish
          </SubmitButton>
        </form>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-block">
            Boshqa xodim
          </button>
        </form>
      </div>
    </div>
  );
}
