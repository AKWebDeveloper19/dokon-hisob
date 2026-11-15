"use client";

import { useActionState } from "react";
import { updateShopAction } from "./actions";
import { Field, FormAlert, SubmitButton } from "@/components/form";
import { TIMEZONES } from "@/lib/timezones";

export function ShopSettingsForm(props: { name: string; timezone: string; lockMinutes: number; disabled: boolean }) {
  const [state, action] = useActionState(updateShopAction, undefined);
  const zones = TIMEZONES.some((t) => t.value === props.timezone)
    ? TIMEZONES
    : [{ value: props.timezone, label: props.timezone }, ...TIMEZONES];

  return (
    <form action={action} className="stack">
      <FormAlert state={state} />
      <fieldset disabled={props.disabled} className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
        <Field label="Do‘kon nomi" name="name" defaultValue={props.name} required minLength={2} maxLength={120} />
        <div className="field">
          <label htmlFor="f-timezone">Vaqt mintaqasi</label>
          <select id="f-timezone" name="timezone" className="input" defaultValue={props.timezone}>
            {zones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Kassa ekranini qulflash (daqiqa)"
          name="lock_minutes"
          type="number"
          inputMode="numeric"
          min={1}
          max={120}
          defaultValue={props.lockMinutes}
          hint="Kassa qurilmasida shuncha vaqt harakat bo‘lmasa, ekran PIN bilan qulflanadi."
          required
        />
        <div>
          <SubmitButton pendingText="Saqlanmoqda…">Saqlash</SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}
