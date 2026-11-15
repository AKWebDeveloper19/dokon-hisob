import { expect, test } from "@playwright/test";

/**
 * 1-bosqich E2E: ro‘yxatdan o‘tish → do‘kon yaratish → kassir qo‘shish → qurilmani bog‘lash → PIN bilan kirish.
 * Supabase’da email tasdiqlash o‘chirilgan bo‘lishi kerak (lokal config.toml’da shunday).
 */
const stamp = Date.now().toString(36);
const owner = { name: "E2E Ega", email: `e2e.${stamp}@example.com`, password: "Sinov12345" };
const cashier = { name: "E2E Kassir", login: `e2e.${stamp}`, password: "Kassir12345", pin: "2580" };

test("egasi do‘kon ochadi, kassir qurilmada PIN bilan kiradi", async ({ page }) => {
  await page.goto("/royxatdan-otish");
  await page.getByLabel("Ism va familiya").fill(owner.name);
  await page.getByLabel("Email").fill(owner.email);
  await page.getByLabel("Parol").fill(owner.password);
  await page.getByRole("button", { name: "Ro‘yxatdan o‘tish" }).click();

  await expect(page.getByRole("heading", { name: "Yangi do‘kon" })).toBeVisible();
  await page.getByLabel("Do‘kon nomi").fill(`E2E do‘kon ${stamp}`);
  await page.getByRole("button", { name: "Do‘kon yaratish" }).click();
  await expect(page.getByRole("heading", { name: "Bosh sahifa" })).toBeVisible();

  await page.getByRole("link", { name: "Sozlamalar" }).click();
  await page.getByRole("link", { name: "Xodimlar" }).click();
  await page.getByLabel("Ism va familiya").fill(cashier.name);
  await page.getByLabel("Login").fill(cashier.login);
  await page.getByLabel("Parol").fill(cashier.password);
  await page.getByLabel("PIN (ixtiyoriy)").fill(cashier.pin);
  await page.getByRole("button", { name: "Kassirni qo‘shish" }).click();
  await expect(page.getByText(`${cashier.name} qo‘shildi`)).toBeVisible();

  await page.getByRole("link", { name: "Kassa qurilmalari" }).click();
  await page.getByLabel("Qurilma nomi").fill("E2E kassa");
  await page.getByRole("button", { name: "Shu brauzerni kassa sifatida bog‘lash" }).click();
  await page.getByRole("button", { name: "Kassa rejimiga o‘tish" }).click();

  await expect(page).toHaveURL(/kassa-kirish/);
  await page.getByRole("button", { name: cashier.name }).click();

  // Xato PIN → urinishlar soni ko‘rinadi.
  for (const d of "9999") await page.getByRole("button", { name: d, exact: true }).click();
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await expect(page.getByText("Yana 4 ta urinish qoldi")).toBeVisible();

  for (const d of cashier.pin) await page.getByRole("button", { name: d, exact: true }).click();
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kassa" })).toBeVisible();

  // Kassir egasi bo‘limlarini ko‘rmaydi.
  await expect(page.getByRole("link", { name: "Sozlamalar" })).toHaveCount(0);
  await page.goto("/sozlamalar/xodimlar");
  await expect(page).toHaveURL(/\/kassa$/);
});
