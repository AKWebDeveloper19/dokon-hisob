"use client";

import { useActionState, useEffect, useRef } from "react";
import { resetStaffPasswordAction, setPinAction, updateStaffAction } from "../../actions";
import { Field, FormAlert, SubmitButton } from "@/components/form";
import { PermissionChecks } from "../PermissionChecks";
import type { MemberRow } from "../members";

export function StaffEditForm({ member, disabled }: { member: MemberRow; disabled: boolean }) {
  const [state, action] = useActionState(updateStaffAction, undefined);
  return (
    <form action={action} className="stack">
      <fieldset disabled={disabled} className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
        <FormAlert state={state} />
        <input type="hidden" name="membership_id" value={member.membership_id} />
        <Field label="Ism va familiya" name="full_name" defaultValue={member.full_name} required minLength={2} />
        <PermissionChecks defaults={member} />
        <div>
          <SubmitButton pendingText="Saqlanmoqda…">Saqlash</SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}

export function PinForm({ membershipId, disabled, isSelf }: { membershipId: string; disabled: boolean; isSelf: boolean }) {
  const [state, action] = useActionState(setPinAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="stack">
      <fieldset disabled={disabled} className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
        <FormAlert state={state} />
        <input type="hidden" name="membership_id" value={membershipId} />
        <div className="row" style={{ alignItems: "flex-start" }}>
          <Field label="Yangi PIN" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} autoComplete="off" required />
          <Field label="PIN’ni takrorlang" name="pin_confirm" type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} autoComplete="off" required />
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          4–6 raqam. 1111, 1234 kabi oddiy PIN qabul qilinmaydi.
          {isSelf ? " Bu sizning PIN’ingiz: kassa qurilmasida egasi sifatida kirish uchun." : " PIN almashsa, xodimning ochiq sessiyalari yopiladi."}
        </span>
        <div>
          <SubmitButton pendingText="Saqlanmoqda…">PIN’ni saqlash</SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}

export function PasswordForm({ membershipId, disabled }: { membershipId: string; disabled: boolean }) {
  const [state, action] = useActionState(resetStaffPasswordAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="stack">
      <fieldset disabled={disabled} className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
        <FormAlert state={state} />
        <input type="hidden" name="membership_id" value={membershipId} />
        <Field label="Yangi parol" name="password" type="password" minLength={8} autoComplete="new-password" required hint="Kamida 8 ta belgi." />
        <div>
          <SubmitButton pendingText="Saqlanmoqda…">Parolni saqlash</SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}
