import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.ERP_WEB_SMOKE_PORT ?? 4022);

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure"
  },
  webServer: {
    command: `pnpm --filter @erp/web exec next start -p ${port} -H 127.0.0.1`,
    reuseExistingServer: !process.env.CI,
    timeout: 45_000,
    url: `http://127.0.0.1:${port}`
  },
  projects: [
    {
      name: "desktop",
      testMatch: /ui-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } }
    },
    {
      name: "mobile",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["Pixel 7"] }
    }
  ]
});
