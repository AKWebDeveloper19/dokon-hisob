"use client";

import { useActionState } from "react";
import { bindDeviceAction } from "../actions";
import { Field, FormAlert, SubmitButton } from "@/components/form";

export function BindDeviceForm() {
  const [state, action] = useActionState(bindDeviceAction, undefined);
  return (
    <form action={action} className="stack">
      <FormAlert state={state} />
      <Field label="Qurilma nomi" name="name" placeholder="Kassa 1" maxLength={60} required />
      <div>
        <SubmitButton pendingText="Bog‘lanmoqda…">Shu brauzerni kassa sifatida bog‘lash</SubmitButton>
      </div>
    </form>
  );
}
