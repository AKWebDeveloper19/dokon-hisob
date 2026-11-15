"use client";

import { useActionState, useRef, useState } from "react";
import { pinLoginAction } from "../actions";
import { PinPad } from "@/components/PinPad";
import { FormAlert, SubmitButton } from "@/components/form";

export type StaffOption = { membership_id: string; full_name: string; role: "owner" | "cashier"; has_pin: boolean };

export function PinLogin({ staff }: { staff: StaffOption[] }) {
  const [selected, setSelected] = useState<StaffOption | null>(staff.length === 1 ? staff[0] : null);
  const [pin, setPin] = useState("");
  const [state, action, pending] = useActionState(pinLoginAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = (fd: FormData) => {
    setPin("");
    action(fd);
  };

  if (!selected) {
    return (
      <div className="stack">
        <h2>Xodimni tanlang</h2>
        <div className="staff-list">
          {staff.map((s) => (
            <button key={s.membership_id} type="button" className="btn" onClick={() => setSelected(s)}>
              <span>{s.full_name || "Ismsiz"}</span>
              <span className="muted" style={{ fontSize: 12 }}>
                {s.role === "owner" ? "Egasi" : "Kassir"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action={submit} className="stack">
      <input type="hidden" name="membership_id" value={selected.membership_id} />
      <div className="row">
        <h2>{selected.full_name}</h2>
        <span className="spacer" />
        {staff.length > 1 ? (
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              setSelected(null);
              setPin("");
            }}
          >
            Boshqa xodim
          </button>
        ) : null}
      </div>
      <FormAlert state={state} />
      <PinPad value={pin} onChange={setPin} disabled={pending} onSubmit={() => formRef.current?.requestSubmit()} />
      <SubmitButton className="btn btn-primary btn-block" pendingText="Tekshirilmoqda…">
        Kirish
      </SubmitButton>
    </form>
  );
}
