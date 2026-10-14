import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.UI_TEST_URL || "http://localhost:3014/workspace-preview";
await mkdir("artifacts/ui", { recursive: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(60000);
  await page.route("https://checkout.razorpay.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  page.on("console", (message) => { if (message.type() === "error" && /hydration|hydrated|did not match/i.test(message.text())) errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.getByRole("dialog").waitFor();
  await page.screenshot({ caret: "initial", path: "artifacts/ui/welcome-mobile.png" });
  for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Continue with free plan", exact: true }).click();
  await page.reload({ waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  assert.equal(await page.getByRole("dialog").count(), 0, "Tour dismissal persists for this user");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ caret: "initial", path: `artifacts/ui/overview-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Record payment", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.screenshot({ caret: "initial", path: "artifacts/ui/payment-mobile.png" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  for (const name of ["Properties", "Tenants", "Payments"]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await page.getByRole("heading", { name, exact: true }).waitFor();
    await page.screenshot({ caret: "initial", path: `artifacts/ui/${name.toLowerCase()}-mobile.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.getByRole("button", { name: "Export CSV", exact: true }).isDisabled(), true);
  }
  await page.getByRole("button", { name: "More: settings and help" }).click();
  await page.getByRole("dialog", { name: "Bhada navigation" }).waitFor();
  await page.screenshot({ caret: "initial", path: "artifacts/ui/navigation-mobile.png" });
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.goto(`${base}?state=expired`, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByText("Some rentals are now read-only", { exact: true }).waitFor();
  await page.screenshot({ caret: "initial", path: "artifacts/ui/expired-mobile.png", fullPage: true });
  await page.goto(`${base}?state=trial`, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByRole("button", { name: "Quick tour", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Skip tour", exact: true }).click();
  await nav.getByRole("link", { name: "Properties", exact: true }).click();
  await page.getByRole("heading", { name: "Properties", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Export CSV", exact: true }).isEnabled(), true);
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log("Passed mobile navigation, tour persistence, payment dialog, plan states and overflow checks at 320/390/768/1440px.");
} catch (error) {
  console.error("Browser pages:", browser.contexts().flatMap((context) => context.pages().map((page) => page.url())));
  throw error;
} finally { await browser.close(); }
