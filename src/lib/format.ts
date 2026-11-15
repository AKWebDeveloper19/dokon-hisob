import Decimal from "decimal.js";

const NBSP = " ";

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** 125000 → "125 000 so‘m". Pul har doim butun so‘mga yaxlitlanadi (ROUND_HALF_UP). */
export function formatSom(value: Decimal.Value): string {
  const d = new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const sign = d.isNegative() && !d.isZero() ? "−" : "";
  return `${sign}${groupThousands(d.abs().toFixed(0))}${NBSP}so‘m`;
}

export type Unit = "dona" | "kg" | "l";

/** Miqdor: dona butun, kg va l uchun 3 xonagacha (keraksiz nollarsiz, vergul bilan). */
export function formatQty(value: Decimal.Value, unit: Unit): string {
  const d = new Decimal(value);
  const places = unit === "dona" ? 0 : 3;
  const fixed = d.toDecimalPlaces(places, Decimal.ROUND_HALF_UP).toFixed(places);
  const [int, frac] = fixed.replace("-", "").split(".");
  const cleanFrac = frac?.replace(/0+$/, "");
  const sign = d.isNegative() && !d.isZero() ? "−" : "";
  return `${sign}${groupThousands(int)}${cleanFrac ? `,${cleanFrac}` : ""}${NBSP}${unit}`;
}
