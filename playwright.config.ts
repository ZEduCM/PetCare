import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3200";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "pt-BR",
    storageState: {
      cookies: [
        {
          name: "petcare_consent",
          value: "denied",
          domain: "127.0.0.1",
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/test-server.mjs",
    url: `${baseURL}/login`,
    env: { TEST_SERVER_PORT: port },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
