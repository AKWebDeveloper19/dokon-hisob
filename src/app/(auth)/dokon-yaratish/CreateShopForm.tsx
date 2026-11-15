"use client";

import { useActionState } from "react";
import { createShopAction } from "../actions";
import { Field, FormAlert, SubmitButton } from "@/components/form";
import { TIMEZONES } from "@/lib/timezones";

export function CreateShopForm() {
  const [state, action] = useActionState(createShopAction, undefined);
  return (
    <form action={action} className="stack">
      <FormAlert state={state} />
      <Field label="Do‘kon nomi" name="name" required minLength={2} maxLength={120} autoFocus />
      <div className="field">
        <label htmlFor="f-timezone">Vaqt mintaqasi</label>
        <select id="f-timezone" name="timezone" className="input" defaultValue="Asia/Tashkent">
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <span className="hint">Hisobotlardagi «bugun» va «kecha» shu vaqt bo‘yicha hisoblanadi.</span>
      </div>
      <SubmitButton className="btn btn-primary btn-block" pendingText="Yaratilmoqda…">
        Do‘kon yaratish
      </SubmitButton>
    </form>
  );
}
