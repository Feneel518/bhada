import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";
import * as plans from "../src/lib/plans.ts";

const require = createRequire(import.meta.url);
// Load the actual route/action with only its external boundaries replaced.
// No database or payment-provider calls are made by this suite.
function load(filename, overrides) {
  const cache = new Map();
  function read(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loaded = { exports: {} };
    cache.set(file, loaded);
    const source = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const dependency = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name === "server-only") return {};
      if (name === "@/lib/plans") return plans;
      if (name.startsWith("@/")) return read(resolve("src", `${name.slice(2)}.ts`));
      return require(name);
    };
    new Function("require", "module", "exports", source)(dependency, loaded, loaded.exports);
    return loaded.exports;
  }
  return read(resolve(filename));
}

const owner = { id: "owner", plan: "one_door", subscriptionStatus: "none" };
const session = { user: { id: "user", name: "Test landlord" } };
function base(account = owner, authenticated = true) {
  return {
    "next/headers": { headers: async () => new Headers() },
    "next/cache": { revalidatePath() {} },
    "@/lib/auth": { auth: { api: { getSession: async () => authenticated ? session : null } } },
    "@/lib/landlords": { ensureLandlord: async () => account },
    "@/db": { db: new Proxy({}, { get() { throw new Error("Unexpected database access"); } }) },
  };
}

function exportRoute(account, authenticated = true) {
  return load("src/app/api/export/route.ts", {
    ...base(account, authenticated),
    "@/lib/plan-access": { getPlanAccount: async () => account },
    "@/lib/properties": { getProperties: async () => [] },
    "@/lib/electricity-billing": {}, "@/lib/financial-year": {},
    "@/lib/payments": {}, "@/lib/rent-billing": {}, "@/lib/tenants": {},
  });
}

test("direct export requests reject signed-out, free, expired and cancelled accounts", async () => {
  const request = new Request("https://bhada.test/api/export?section=Properties");
  assert.equal((await exportRoute(owner, false).GET(request)).status, 401);
  for (const account of [owner, { ...owner, plan: "portfolio", subscriptionStatus: "active", subscriptionCurrentPeriodEnd: new Date(0) },
    { ...owner, plan: "portfolio", subscriptionStatus: "cancelled", subscriptionCancelAtPeriodEnd: true, subscriptionCurrentPeriodEnd: new Date(Date.now() + 86400000) }]) {
    assert.equal((await exportRoute(account).GET(request)).status, 403);
  }
});

test("a live trial can export; an expired trial cannot", async () => {
  const trial = { ...owner, trialStartedAt: new Date(Date.now() - 1000), trialEndsAt: new Date(Date.now() + 60000) };
  const request = new Request("https://bhada.test/api/export?section=Properties");
  const response = await exportRoute(trial).GET(request);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/csv/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await exportRoute({ ...trial, trialEndsAt: new Date(0) }).GET(request)).status, 403);
});

test("property edit cannot bypass read-only rentals by invoking the action directly", async () => {
  const { saveProperty } = load("src/app/dashboard/properties/actions.ts", {
    ...base(), "@/lib/plan-access": { getRentalAccess: async () => ({ propertyIds: ["included"] }), RENTAL_LOCK_MESSAGE: "locked" },
  });
  const form = new FormData(); form.set("id", "extra-property"); form.set("name", "Changed name");
  assert.deepEqual(await saveProperty({}, form), { status: "error", message: "locked" });
});

test("new units cannot be added to a locked property", async () => {
  const { saveUnit } = load("src/app/dashboard/units/actions.ts", {
    ...base(), "@/lib/plan-access": { getRentalAccess: async () => ({ propertyIds: ["included"], unitIds: [] }), RENTAL_LOCK_MESSAGE: "locked" },
  });
  const form = new FormData(); form.set("propertyId", "extra-property"); form.set("unitNumber", "4"); form.set("status", "vacant");
  assert.deepEqual(await saveUnit({}, form), { status: "error", message: "locked" });
});

test("trial activation requires a session before touching the database", async () => {
  const { startPortfolioTrial } = load("src/app/dashboard/trial/actions.ts", base(owner, false));
  assert.equal((await startPortfolioTrial()).ok, false);
});

test("a revoked trial stays revoked even when a new checkout is created", () => {
  assert.equal(plans.hasPortfolioAccess({ ...owner, subscriptionStatus: "created", trialStartedAt: new Date(Date.now() - 1000), trialEndsAt: new Date(Date.now() + 60000), trialRevoked: true }), false);
});

test("trial activation builds a conditional single-use insert with server time", async () => {
  const { drizzle } = require("drizzle-orm/neon-http");
  const db = drizzle.mock();
  const insert = db.insert.bind(db);
  let query;
  let claimed = false;
  db.insert = (table) => {
    const builder = insert(table);
    const select = builder.select.bind(builder);
    builder.select = (selection) => {
      const statement = select(selection);
      const returning = statement.returning.bind(statement);
      statement.returning = (fields) => {
        query = returning(fields).toSQL();
        const result = claimed ? [] : [{ id: "portfolio_trial_owner" }];
        claimed = true;
        return Promise.resolve(result);
      };
      return statement;
    };
    return builder;
  };
  const { startPortfolioTrial } = load("src/app/dashboard/trial/actions.ts", { ...base(), "@/db": { db } });
  assert.equal((await startPortfolioTrial()).ok, true);
  assert.match(query.sql, /on conflict.*do nothing/i);
  assert.match(query.sql, /now\(\)/);
  assert.match(query.sql, /not exists/);
  assert.ok(query.params.includes("portfolio_trial_owner"));
  assert.equal((await startPortfolioTrial()).ok, false);
});

test("an old activation webhook cannot restore a currently cancelled subscription", async (context) => {
  const previousSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = "test-secret";
  context.after(() => { if (previousSecret === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET; else process.env.RAZORPAY_WEBHOOK_SECRET = previousSecret; });
  let saved;
  let providerReads = 0;
  const chain = { from() { return this; }, where() { return this; }, limit: async () => [{ id: "owner", updatedAt: new Date() }] };
  const db = {
    select: () => chain,
    update: () => ({ set: (value) => { saved = value; return { where: () => ({ returning: async () => [{ id: "owner" }] }) }; } }),
    insert: () => ({ values: () => ({ onConflictDoNothing: async () => [] }) }),
  };
  const { POST } = load("src/app/api/billing/razorpay/webhook/route.ts", {
    ...base(), "@/db": { db },
    "@/lib/razorpay": {
      hmacHex: async () => "0".repeat(64), safeEqualHex: () => true,
      razorpayConfig: () => ({ planId: "plan_test" }),
      razorpayRequest: async () => { providerReads++; return { id: "sub_test", plan_id: "plan_test", status: "cancelled", current_end: null }; },
      subscriptionPlan: (status) => status === "active" ? "portfolio" : "one_door",
      subscriptionPeriodEnd: () => null,
    },
  });
  const response = await POST(new Request("https://bhada.test/webhook", {
    method: "POST", headers: { "x-razorpay-signature": "0".repeat(64) },
    body: JSON.stringify({ event: "subscription.activated", payload: { subscription: { entity: { id: "sub_test", plan_id: "plan_test", status: "active", current_end: 9999999999 } } } }),
  }));
  assert.equal(response.status, 200);
  assert.equal(providerReads, 1);
  assert.equal(saved.subscriptionStatus, "cancelled");
  assert.equal(saved.plan, "one_door");
  assert.equal(saved.subscriptionCancelAtPeriodEnd, false);
});
