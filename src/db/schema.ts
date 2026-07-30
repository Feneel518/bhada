import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const landlord = pgTable("landlord", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  plan: text("plan").default("one_door").notNull(),
  subscriptionStatus: text("subscription_status").default("none").notNull(),
  razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  rentBillingPeriod: text("rent_billing_period").default("previous").notNull(),
  phone: text("phone"),
  gstin: text("gstin"),
  pan: text("pan"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationRead = pgTable(
  "notification_read",
  {
    id: text("id").primaryKey(),
    landlordId: text("landlord_id").notNull().references(() => landlord.id, { onDelete: "cascade" }),
    notificationKey: text("notification_key").notNull(),
    readAt: timestamp("read_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_read_landlord_key_unique").on(
      table.landlordId,
      table.notificationKey,
    ),
    index("notification_read_landlord_id_idx").on(table.landlordId),
  ],
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const saasBillingEvent = pgTable(
  "saas_billing_event",
  {
    id: text("id").primaryKey(),
    landlordId: text("landlord_id").references(() => landlord.id, { onDelete: "set null" }),
    provider: text("provider").default("razorpay").notNull(),
    eventType: text("event_type").notNull(),
    subscriptionId: text("subscription_id"),
    amountPaise: integer("amount_paise").default(0).notNull(),
    currency: text("currency").default("INR").notNull(),
    status: text("status"),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("saas_billing_event_landlord_id_idx").on(table.landlordId),
    index("saas_billing_event_occurred_at_idx").on(table.occurredAt),
    index("saas_billing_event_event_type_idx").on(table.eventType),
  ],
);

export const leaseStatus = pgEnum("lease_status", ["active", "upcoming", "ended"]);
export const paymentStatus = pgEnum("payment_status", ["paid", "pending", "overdue"]);
export const paymentMethod = pgEnum("payment_method", ["bank_transfer", "cash", "check", "card"]);
export const receiptAllocationMode = pgEnum("receipt_allocation_mode", ["lump_sum", "bill_wise"]);
export const receiptChargeType = pgEnum("receipt_charge_type", ["rent", "light_bill", "other"]);
export const rentBillStatus = pgEnum("rent_bill_status", ["pending", "paid", "overdue"]);
export const unitStatus = pgEnum("unit_status", ["vacant", "occupied", "maintenance"]);

export const property = pgTable(
  "property",
  {
    id: text("id").primaryKey(),
    landlordId: text("landlord_id").notNull().references(() => landlord.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("property_landlord_id_idx").on(table.landlordId)],
);

export const unit = pgTable(
  "unit",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id").notNull().references(() => property.id, { onDelete: "cascade" }),
    landlordId: text("landlord_id").notNull().references(() => landlord.id),
    unitNumber: text("unit_number").notNull(),
    floor: text("floor"),
    areaSqft: real("area_sqft"),
    status: unitStatus("status").default("vacant").notNull(),
    openingMeterReading: real("opening_meter_reading"),
    openingMeterReadingDate: timestamp("opening_meter_reading_date"),
    lastMeterReading: real("last_meter_reading"),
    lastMeterReadingDate: timestamp("last_meter_reading_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unit_property_id_unit_number_unique").on(table.propertyId, table.unitNumber),
    index("unit_landlord_id_idx").on(table.landlordId),
    index("unit_property_id_idx").on(table.propertyId),
  ],
);

export const tenant = pgTable(
  "tenant",
  {
    id: text("id").primaryKey(),
    unitId: text("unit_id").notNull().references(() => unit.id, { onDelete: "cascade" }),
    landlordId: text("landlord_id").notNull().references(() => landlord.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    aadhaarMasked: text("aadhaar_masked"),
    panMasked: text("pan_masked"),
    gstin: text("gstin"),
    emergencyContact: text("emergency_contact"),
    emergencyPhone: text("emergency_phone"),
    leaseStart: timestamp("lease_start"),
    leaseEnd: timestamp("lease_end"),
    monthlyRent: real("monthly_rent"),
    rentBillingDay: integer("rent_billing_day").default(1).notNull(),
    rentDueDay: integer("rent_due_day").default(1).notNull(),
    gstEnabled: boolean("gst_enabled").default(false).notNull(),
    gstRate: real("gst_rate").default(0).notNull(),
    gstTaxablePercent: real("gst_taxable_percent").default(100).notNull(),
    tdsEnabled: boolean("tds_enabled").default(false).notNull(),
    tdsRate: real("tds_rate").default(0).notNull(),
    securityDeposit: real("security_deposit"),
    lockInMonths: integer("lock_in_months"),
    noticePeriodMonths: integer("notice_period_months"),
    rentEscalationPct: real("rent_escalation_pct"),
    rentEscalationMonths: integer("rent_escalation_months"),
    nextEscalationDate: timestamp("next_escalation_date"),
    leaseDocUrl: text("lease_doc_url"),
    isActive: boolean("is_active").default(true).notNull(),
    openingBalance: real("opening_balance").default(0).notNull(),
    creditBalance: real("credit_balance").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tenant_landlord_id_idx").on(table.landlordId),
    index("tenant_unit_id_idx").on(table.unitId),
  ],
);

export const rentBill = pgTable(
  "rent_bill",
  {
    id: text("id").primaryKey(),
    landlordId: text("landlord_id").notNull().references(() => landlord.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull().references(() => tenant.id, { onDelete: "cascade" }),
    billNumber: text("bill_number").notNull(),
    billingPeriod: text("billing_period").notNull(),
    baseAmount: numeric("base_amount", { precision: 12, scale: 2 }).notNull(),
    gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).default("0").notNull(),
    gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    tdsRate: numeric("tds_rate", { precision: 5, scale: 2 }).default("0").notNull(),
    tdsAmount: numeric("tds_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    dueDate: timestamp("due_date").notNull(),
    status: rentBillStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("rent_bill_tenant_period_unique").on(table.tenantId, table.billingPeriod),
    uniqueIndex("rent_bill_landlord_number_unique").on(table.landlordId, table.billNumber),
    index("rent_bill_landlord_id_idx").on(table.landlordId),
    index("rent_bill_tenant_id_idx").on(table.tenantId),
    index("rent_bill_due_date_idx").on(table.dueDate),
  ],
);

export const electricityBill = pgTable(
  "electricity_bill",
  {
    id: text("id").primaryKey(),
    landlordId: text("landlord_id").notNull().references(() => landlord.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull().references(() => unit.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").references(() => tenant.id, { onDelete: "set null" }),
    billNumber: text("bill_number").notNull(),
    billingPeriod: text("billing_period").notNull(),
    previousReading: numeric("previous_reading", { precision: 14, scale: 3 }).default("0").notNull(),
    currentReading: numeric("current_reading", { precision: 14, scale: 3 }).default("0").notNull(),
    unitsConsumed: numeric("units_consumed", { precision: 14, scale: 3 }).default("0").notNull(),
    unitRate: numeric("unit_rate", { precision: 12, scale: 4 }).default("0").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    dueDate: timestamp("due_date").notNull(),
    note: text("note"),
    status: rentBillStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("electricity_bill_unit_period_unique").on(table.unitId, table.billingPeriod),
    uniqueIndex("electricity_bill_landlord_number_unique").on(table.landlordId, table.billNumber),
    index("electricity_bill_landlord_id_idx").on(table.landlordId),
    index("electricity_bill_unit_id_idx").on(table.unitId),
    index("electricity_bill_tenant_id_idx").on(table.tenantId),
    index("electricity_bill_due_date_idx").on(table.dueDate),
  ],
);

export const lease = pgTable("lease", {
  id: text("id").primaryKey(),
  unitId: text("unit_id").notNull().references(() => unit.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenant.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  monthlyRent: numeric("monthly_rent", { precision: 12, scale: 2 }).notNull(),
  deposit: numeric("deposit", { precision: 12, scale: 2 }).default("0").notNull(),
  dueDay: integer("due_day").default(1).notNull(),
  status: leaseStatus("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  leaseId: text("lease_id").notNull().references(() => lease.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  status: paymentStatus("status").default("pending").notNull(),
  method: paymentMethod("method"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentReceipt = pgTable(
  "payment_receipt",
  {
    id: text("id").primaryKey(),
    landlordId: text("landlord_id").notNull().references(() => landlord.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull().references(() => tenant.id, { onDelete: "cascade" }),
    receiptNumber: text("receipt_number").notNull(),
    allocationMode: receiptAllocationMode("allocation_mode").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidAt: timestamp("paid_at").notNull(),
    method: paymentMethod("method").notNull(),
    reference: text("reference"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payment_receipt_landlord_number_unique").on(table.landlordId, table.receiptNumber),
    index("payment_receipt_landlord_id_idx").on(table.landlordId),
    index("payment_receipt_tenant_id_idx").on(table.tenantId),
    index("payment_receipt_paid_at_idx").on(table.paidAt),
  ],
);

export const paymentAllocation = pgTable(
  "payment_allocation",
  {
    id: text("id").primaryKey(),
    paymentReceiptId: text("payment_receipt_id").notNull().references(() => paymentReceipt.id, { onDelete: "cascade" }),
    chargeType: receiptChargeType("charge_type").notNull(),
    description: text("description"),
    billReference: text("bill_reference"),
    amountBeforeGst: numeric("amount_before_gst", { precision: 12, scale: 2 }).notNull(),
    gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).default("0").notNull(),
    gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("payment_allocation_receipt_id_idx").on(table.paymentReceiptId)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const landlordRelations = relations(landlord, ({ one, many }) => ({
  user: one(user, { fields: [landlord.userId], references: [user.id] }),
  properties: many(property),
  units: many(unit),
  tenants: many(tenant),
  rentBills: many(rentBill),
  electricityBills: many(electricityBill),
  paymentReceipts: many(paymentReceipt),
  notificationReads: many(notificationRead),
  billingEvents: many(saasBillingEvent),
}));

export const saasBillingEventRelations = relations(saasBillingEvent, ({ one }) => ({
  landlord: one(landlord, {
    fields: [saasBillingEvent.landlordId],
    references: [landlord.id],
  }),
}));

export const notificationReadRelations = relations(notificationRead, ({ one }) => ({
  landlord: one(landlord, {
    fields: [notificationRead.landlordId],
    references: [landlord.id],
  }),
}));

export const propertyRelations = relations(property, ({ one, many }) => ({
  landlord: one(landlord, { fields: [property.landlordId], references: [landlord.id] }),
  units: many(unit),
}));

export const unitRelations = relations(unit, ({ one, many }) => ({
  property: one(property, { fields: [unit.propertyId], references: [property.id] }),
  landlord: one(landlord, { fields: [unit.landlordId], references: [landlord.id] }),
  tenants: many(tenant),
  leases: many(lease),
  electricityBills: many(electricityBill),
}));

export const tenantRelations = relations(tenant, ({ one, many }) => ({
  unit: one(unit, { fields: [tenant.unitId], references: [unit.id] }),
  landlord: one(landlord, { fields: [tenant.landlordId], references: [landlord.id] }),
  leases: many(lease),
  rentBills: many(rentBill),
  electricityBills: many(electricityBill),
  paymentReceipts: many(paymentReceipt),
}));

export const rentBillRelations = relations(rentBill, ({ one }) => ({
  landlord: one(landlord, { fields: [rentBill.landlordId], references: [landlord.id] }),
  tenant: one(tenant, { fields: [rentBill.tenantId], references: [tenant.id] }),
}));

export const electricityBillRelations = relations(electricityBill, ({ one }) => ({
  landlord: one(landlord, { fields: [electricityBill.landlordId], references: [landlord.id] }),
  unit: one(unit, { fields: [electricityBill.unitId], references: [unit.id] }),
  tenant: one(tenant, { fields: [electricityBill.tenantId], references: [tenant.id] }),
}));

export const leaseRelations = relations(lease, ({ one, many }) => ({
  unit: one(unit, { fields: [lease.unitId], references: [unit.id] }),
  tenant: one(tenant, { fields: [lease.tenantId], references: [tenant.id] }),
  payments: many(payment),
}));

export const paymentReceiptRelations = relations(paymentReceipt, ({ one, many }) => ({
  landlord: one(landlord, { fields: [paymentReceipt.landlordId], references: [landlord.id] }),
  tenant: one(tenant, { fields: [paymentReceipt.tenantId], references: [tenant.id] }),
  allocations: many(paymentAllocation),
}));

export const paymentAllocationRelations = relations(paymentAllocation, ({ one }) => ({
  receipt: one(paymentReceipt, {
    fields: [paymentAllocation.paymentReceiptId],
    references: [paymentReceipt.id],
  }),
}));

export const schema = {
  user,
  landlord,
  notificationRead,
  session,
  account,
  verification,
  saasBillingEvent,
  property,
  unit,
  tenant,
  rentBill,
  electricityBill,
  lease,
  payment,
  paymentReceipt,
  paymentAllocation,
  userRelations,
  landlordRelations,
  saasBillingEventRelations,
  notificationReadRelations,
  propertyRelations,
  unitRelations,
  tenantRelations,
  rentBillRelations,
  electricityBillRelations,
  leaseRelations,
  paymentReceiptRelations,
  paymentAllocationRelations,
};
