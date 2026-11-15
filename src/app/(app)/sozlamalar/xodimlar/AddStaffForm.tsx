"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStaffAction } from "../actions";
import { Field, FormAlert, SubmitButton } from "@/components/form";
import { PermissionChecks } from "./PermissionChecks";

export function AddStaffForm() {
  const [state, action] = useActionState(addStaffAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="stack">
      <FormAlert state={state} />
      <Field label="Ism va familiya" name="full_name" required error={fe.full_name} />
      <Field
        label="Login"
        name="login"
        autoCapitalize="none"
        spellCheck={false}
        autoComplete="off"
        hint="Masalan: ali.kassa. Xodim shu login bilan kiradi."
        required
        error={fe.login}
      />
      <Field
        label="Parol"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Kamida 8 ta belgi. Xodimga o‘zingiz yetkazasiz."
        required
        error={fe.password}
      />
      <Field
        label="PIN (ixtiyoriy)"
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]{4,6}"
        maxLength={6}
        hint="4–6 raqam. Kassa qurilmasida tez kirish uchun."
        error={fe.pin}
      />
      <PermissionChecks />
      <div>
        <SubmitButton pendingText="Qo‘shilmoqda…">Kassirni qo‘shish</SubmitButton>
      </div>
    </form>
  );
}
