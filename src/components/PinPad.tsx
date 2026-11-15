"use client";

import { useEffect, useRef } from "react";

/**
 * Sensor va klaviatura uchun PIN kiritish. Raqamlar yashirin input’da saqlanadi va forma bilan yuboriladi.
 * Klaviaturadan raqam, Backspace va Enter ishlaydi.
 */
export function PinPad({
  value,
  onChange,
  maxLength = 6,
  disabled,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  disabled?: boolean;
  onSubmit?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const press = (d: string) => {
    if (disabled) return;
    if (value.length < maxLength) onChange(value + d);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      press(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      onChange(value.slice(0, -1));
    } else if (e.key === "Enter" && value.length >= 4) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div ref={ref} tabIndex={0} onKeyDown={onKeyDown} aria-label="PIN kiritish maydoni" className="stack pin-area">
      <input type="hidden" name="pin" value={value} />
      <div className="pin-dots" aria-live="polite" aria-label={`${value.length} ta raqam kiritildi`}>
        {Array.from({ length: Math.max(4, value.length) }).map((_, i) => (
          <span key={i} className={`pin-dot${i < value.length ? " filled" : ""}`} />
        ))}
      </div>
      <div className="pinpad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className="btn" onClick={() => press(d)} disabled={disabled}>
            {d}
          </button>
        ))}
        <button type="button" className="btn" onClick={() => onChange("")} disabled={disabled} aria-label="Tozalash">
          C
        </button>
        <button type="button" className="btn" onClick={() => press("0")} disabled={disabled}>
          0
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onChange(value.slice(0, -1))}
          disabled={disabled}
          aria-label="Oxirgi raqamni o‘chirish"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
