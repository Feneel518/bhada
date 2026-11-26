import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(filename, overrides) {
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  const dependency = (name) => (Object.hasOwn(overrides, name) ? overrides[name] : require(name));
  new Function("require", "module", "exports", source)(dependency, loaded, loaded.exports);
  return loaded.exports;
}

const renter = { id: "t1", name: "Aarav", isActive: true, landlordId: "l1", businessName: "Shah Rentals", landlordEmail: "l@x.in", propertyName: "Shanti", unitNumber: "101" };

function setup({ found = renter, pending = 0 } = {}) {
  const inserted = [];
  const db = {
    select: () => ({ from: () => ({ where: async () => [{ pending }] }) }),
    insert: () => ({ values: async (value) => { inserted.push(value); } }),
  };
  const { submitPaymentClaim } = load(resolve("src/app/t/actions.ts"), {
    "drizzle-orm": { and: () => ({}), count: () => ({}), eq: () => ({}) },
    "next/cache": { revalidatePath() {} },
    "@/db": { db },
    "@/db/schema": { paymentClaim: {} },
    "@/lib/email": { emailConfigured: () => false, sendPaymentClaimEmail: async () => {} },
    "@/lib/share-links": { appOrigin: () => "https://bhadaa.in" },
    "@/lib/tenant-portal": {
      CLAIM_METHODS: ["upi", "bank_transfer", "cash", "check"],
      MAX_PENDING_CLAIMS: 3,
      findTenantByPortalToken: async () => found,
    },
    "@/lib/utils": { formatCurrency: (value) => `₹${value}` },
  });
  return { submitPaymentClaim, inserted };
}

function form(values) {
  const data = new FormData();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  for (const [key, value] of Object.entries({ token: "a".repeat(32), amount: "15000", paidOn: today, method: "upi", reference: "430912345678", ...values })) {
    data.set(key, value);
  }
  return data;
}

test("a tenant's claim is saved as pending, without touching payments", async () => {
  const { submitPaymentClaim, inserted } = setup();
  const result = await submitPaymentClaim({ status: "idle", message: "" }, form({}));
  assert.equal(result.status, "success");
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].amount, "15000.00");
  assert.equal(inserted[0].method, "upi");
  assert.equal(inserted[0].tenantId, "t1");
  assert.equal(inserted[0].landlordId, "l1");
  assert.equal(inserted[0].status, undefined, "status comes from the column default: pending");
});

test("bad links, ended tenancies, bad input and too many pending claims are refused", async () => {
  assert.equal((await setup({ found: null }).submitPaymentClaim({}, form({}))).status, "error");
  assert.equal((await setup({ found: { ...renter, isActive: false } }).submitPaymentClaim({}, form({}))).status, "error");
  const bad = await setup().submitPaymentClaim({}, form({ amount: "-5", paidOn: "2099-01-01" }));
  assert.ok(bad.errors.amount && bad.errors.paidOn);
  const capped = setup({ pending: 3 });
  assert.match((await capped.submitPaymentClaim({}, form({}))).message, /3 payments waiting/);
  assert.equal(capped.inserted.length, 0);
});

test("an unknown payment method falls back to UPI", async () => {
  const { submitPaymentClaim, inserted } = setup();
  await submitPaymentClaim({}, form({ method: "crypto" }));
  assert.equal(inserted[0].method, "upi");
});
