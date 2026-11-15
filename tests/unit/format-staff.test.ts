import { describe, expect, it } from "vitest";
import { formatQty, formatSom } from "@/lib/format";
import { isStaffEmail, isValidLogin, normalizeLogin, pinProblem, staffEmail } from "@/lib/staff";

const sp = (s: string) => s.replace(/ /g, " ");

describe("formatSom", () => {
  it("minglarni bo‘sh joy bilan ajratadi va so‘m qo‘shadi", () => {
    expect(sp(formatSom(125000))).toBe("125 000 so‘m");
    expect(sp(formatSom("12500000"))).toBe("12 500 000 so‘m");
    expect(sp(formatSom(0))).toBe("0 so‘m");
    expect(sp(formatSom(999))).toBe("999 so‘m");
  });

  it("butun so‘mga yarmidan yuqoriga yaxlitlaydi", () => {
    expect(sp(formatSom("1234.5"))).toBe("1 235 so‘m");
    expect(sp(formatSom("1234.49"))).toBe("1 234 so‘m");
  });

  it("manfiy summani belgilaydi", () => {
    expect(sp(formatSom(-12000))).toBe("−12 000 so‘m");
  });

  it("satrga bo‘linmasligi uchun bo‘linmas bo‘sh joy ishlatadi", () => {
    expect(formatSom(125000)).toBe("125 000 so‘m");
  });
});

describe("formatQty", () => {
  it("dona butun, kg va l kasr bilan", () => {
    expect(sp(formatQty(3, "dona"))).toBe("3 dona");
    expect(sp(formatQty("2.500", "kg"))).toBe("2,5 kg");
    expect(sp(formatQty("0.125", "l"))).toBe("0,125 l");
    expect(sp(formatQty("1500", "kg"))).toBe("1 500 kg");
  });
});

describe("xodim logini", () => {
  it("katta harf va bo‘sh joyni normallashtiradi", () => {
    expect(normalizeLogin("  Ali.Kassa ")).toBe("ali.kassa");
    expect(staffEmail("Ali.Kassa")).toBe("ali.kassa@xodim.dokon-hisob.invalid");
    expect(isStaffEmail("ALI@XODIM.DOKON-HISOB.INVALID")).toBe(true);
    expect(isStaffEmail("ali@gmail.com")).toBe(false);
  });

  it("login qoidasi DB bilan bir xil", () => {
    for (const ok of ["ali", "ali.kassa", "kassir-1", "a_b", "0ali"]) expect(isValidLogin(ok), ok).toBe(true);
    for (const bad of ["al", ".ali", "ali kassa", "алі", "a".repeat(33), "ali@x"]) expect(isValidLogin(bad), bad).toBe(false);
  });
});

describe("PIN qoidasi", () => {
  it("format va zaif PIN’larni aniqlaydi", () => {
    expect(pinProblem("2580")).toBeNull();
    expect(pinProblem("739164")).toBeNull();
    expect(pinProblem("123")).toBe("format");
    expect(pinProblem("1234567")).toBe("format");
    expect(pinProblem("12a4")).toBe("format");
    for (const weak of ["0000", "1111", "1234", "4321", "123456", "6543", "0123"]) expect(pinProblem(weak), weak).toBe("weak");
  });
});
