import assert from "node:assert/strict";
import test from "node:test";
import { buildCollection, collectionCounts } from "../src/lib/collection.ts";
import { reminderMessage, receiptMessage, whatsappLink, whatsappNumber } from "../src/lib/whatsapp.ts";
import { isValidUpiId, upiPayLink } from "../src/lib/upi.ts";
import { rupeesInWords } from "../src/lib/amount-words.ts";

const tenant = (id, extra = {}) => ({ id, name: `Tenant ${id}`, isActive: true, phone: "", unitId: `u-${id}`, ...extra });
const rent = (tenantId, dueDate, pending, extra = {}) => ({
  id: `bill-${tenantId}-${dueDate}`, tenantId, tenantName: "", billNumber: "R", billingPeriod: dueDate.slice(0, 7),
  issueDate: dueDate, dueDate, baseAmount: 1000, gstRate: 0, gstAmount: 0, tdsRate: 0, tdsAmount: 0,
  amount: 1000, paid: 1000 - pending, pending, status: pending ? "Pending" : "Paid", ...extra,
});

test("collection list puts overdue first, then due, then paid", () => {
  const rows = buildCollection({
    tenants: [tenant("a"), tenant("b"), tenant("c"), tenant("d", { isActive: false })],
    rentBills: [rent("a", "2026-11-05", 0), rent("b", "2026-11-30", 1000), rent("c", "2026-11-01", 500), rent("c", "2026-10-01", 1000)],
    electricityBills: [],
    analytics: [],
    today: "2026-11-26",
  });
  assert.deepEqual(rows.map((row) => [row.tenant.id, row.status]), [["c", "overdue"], ["b", "due"], ["a", "paid"]]);
  assert.equal(rows[0].outstanding, 1500);
  assert.equal(rows[0].dueDate, "2026-10-01");
  assert.equal(rows[0].daysOverdue, 56);
  assert.equal(rows[0].bill.record.dueDate, "2026-11-01", "reminder links the newest unpaid bill");
  assert.deepEqual(collectionCounts(rows), { overdue: 1, due: 1, paid: 1 });
});

test("an opening balance without bills counts as overdue", () => {
  const [row] = buildCollection({
    tenants: [tenant("a")], rentBills: [], electricityBills: [],
    analytics: [{ tenantId: "a", totalPending: 2500 }], today: "2026-11-26",
  });
  assert.equal(row.status, "overdue");
  assert.equal(row.outstanding, 2500);
  assert.equal(row.bill, null);
});

test("WhatsApp numbers are normalised to Indian international format", () => {
  assert.equal(whatsappNumber("98765 43210"), "919876543210");
  assert.equal(whatsappNumber("+91-98765-43210"), "919876543210");
  assert.equal(whatsappNumber("098765 43210"), "919876543210");
  assert.equal(whatsappNumber("12345"), null);
  assert.equal(whatsappNumber(""), null);
  assert.match(whatsappLink("", "hi there"), /^https:\/\/wa\.me\/\?text=hi%20there$/);
});

test("reminder and receipt messages carry the amount and link", () => {
  const message = reminderMessage({ tenantName: "Aarav Mehta", landlordName: "Shah Rentals", amount: 15000, dueDate: "2026-11-05", overdue: true, billUrl: "https://bhadaa.in/s/x" });
  assert.match(message, /Hi Aarav,/);
  assert.match(message, /₹15,000/);
  assert.match(message, /https:\/\/bhadaa\.in\/s\/x/);
  assert.match(reminderMessage({ tenantName: "A", landlordName: "L", amount: 10, overdue: false, upiId: "a@ok", language: "hi" }), /UPI: a@ok/);
  assert.match(receiptMessage({ tenantName: "A B", landlordName: "L", amount: 5000, receiptUrl: "u", language: "gu" }), /₹5,000/);
});

test("UPI links and IDs", () => {
  assert.ok(isValidUpiId("shahrentals@okhdfcbank"));
  assert.ok(isValidUpiId(" Shah.Rentals@ybl "));
  assert.ok(!isValidUpiId("not an id"));
  assert.ok(!isValidUpiId("name@"));
  assert.equal(
    upiPayLink({ upiId: "a@ybl", payeeName: "Shah Rentals", amount: 1500, note: "Rent R-1" }),
    "upi://pay?pa=a@ybl&pn=Shah%20Rentals&cu=INR&am=1500.00&tn=Rent%20R-1",
  );
});

test("amounts in words use the Indian system", () => {
  assert.equal(rupeesInWords(15000), "Fifteen thousand rupees only");
  assert.equal(rupeesInWords(125000.5), "One lakh twenty-five thousand rupees and fifty paise only");
  assert.equal(rupeesInWords(1), "One rupee only");
  assert.equal(rupeesInWords(23_45_67_891), "Twenty-three crore forty-five lakh sixty-seven thousand eight hundred ninety-one rupees only");
});

import { expandUnitNumbers, parseRentalSheet } from "../src/lib/rental-import.ts";

test("unit ranges expand and plain lists are kept", () => {
  assert.deepEqual(expandUnitNumbers("101-105"), ["101", "102", "103", "104", "105"]);
  assert.deepEqual(expandUnitNumbers("A1 to A3, G1"), ["A1", "A2", "A3", "G1"]);
  assert.deepEqual(expandUnitNumbers("01-03"), ["01", "02", "03"]);
  assert.deepEqual(expandUnitNumbers("2A"), ["2A"]);
  assert.equal(expandUnitNumbers("1-500").length, 1, "huge ranges are not expanded");
});

test("pasted Excel rows with a header map to rentals", () => {
  const rows = parseRentalSheet([
    "Property\tRoom\tName\tMobile\tRent\tDue day",
    "Shanti\t101\tAarav\t98765 43210\t₹15,000\t5th",
    "\t102\tPriya\t\t14000\t",
    "\t103\t\t\t\t",
    "\t104\tRavi\t\tabc\t",
  ].join("\n"));
  assert.equal(rows.length, 4);
  assert.deepEqual(
    { property: rows[0].property, unit: rows[0].unit, rent: rows[0].rent, dueDay: rows[0].dueDay, phone: rows[0].phone },
    { property: "Shanti", unit: "101", rent: 15000, dueDay: 5, phone: "98765 43210" },
  );
  assert.equal(rows[1].property, "Shanti", "blank property repeats the one above");
  assert.equal(rows[1].dueDay, 1);
  assert.equal(rows[2].error, undefined, "a vacant unit is fine");
  assert.match(rows[3].error, /number/);
});

test("CSV without a header uses the template order", () => {
  const [row] = parseRentalSheet('"Shah Complex, Block A",G1,Neha,9000000000,"12,500",10,25000,500');
  assert.equal(row.property, "Shah Complex, Block A");
  assert.equal(row.rent, 12500);
  assert.equal(row.dueDay, 10);
  assert.equal(row.openingBalance, 500);
});

import { summaryToSend } from "../src/lib/collection.ts";

test("morning summary only goes out when there is something to act on", () => {
  const rows = (dueDate, pending) => buildCollection({
    tenants: [tenant("a")], rentBills: [rent("a", dueDate, pending)], electricityBills: [], analytics: [], today: "2026-11-26",
  });
  assert.equal(summaryToSend(rows("2026-11-26", 1000), "2026-11-26", 4)?.dueToday.length, 1, "due today");
  assert.equal(summaryToSend(rows("2026-11-25", 1000), "2026-11-26", 4)?.overdue.length, 1, "became late yesterday");
  assert.equal(summaryToSend(rows("2026-11-20", 1000), "2026-11-26", 4), null, "still late, mid-week: quiet");
  assert.ok(summaryToSend(rows("2026-11-20", 1000), "2026-11-26", 1), "still late, Monday: weekly nudge");
  assert.equal(summaryToSend(rows("2026-11-30", 1000), "2026-11-26", 1), null, "due later: quiet");
  assert.equal(summaryToSend(rows("2026-11-26", 0), "2026-11-26", 4), null, "paid: quiet");
});
