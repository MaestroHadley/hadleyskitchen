import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/responsive",
  testMatch: "**/*.pw.ts",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    },
  },
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:3100/dashboard",
  },
  projects: [
    {
      name: "chromium",
      grepInvert: /iOS WebKit/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit-iphone",
      grep: /iOS WebKit/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
