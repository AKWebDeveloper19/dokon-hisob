import { defineConfig, devices } from "@playwright/test";

/**
 * E2E testlar haqiqiy Supabase (lokal `supabase start` yoki dev loyiha) bilan ishlaydi.
 * Oldin: `.env.local` to‘ldirilgan, migratsiyalar qo‘llangan, `npm run build`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "uz-UZ",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run start", url: "http://localhost:3000/kirish", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 800 } } },
  ],
});
