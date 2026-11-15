"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/errors";

export function SubmitButton({
  children,
  pendingText = "Kuting…",
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormAlert({ state }: { state: FormState | undefined }) {
  if (!state) return null;
  if (state.error) {
    return (
      <div className="alert alert-error" role="alert">
        {state.error}
      </div>
    );
  }
  if (state.ok) {
    return (
      <div className="alert alert-ok" role="status">
        {state.ok}
      </div>
    );
  }
  return null;
}

export function Field({
  label,
  name,
  hint,
  error,
  ...input
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} className="input" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...input} />
      {hint ? (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-err`} className="error-text">
          {error}
        </span>
      ) : null}
    </div>
  );
}
