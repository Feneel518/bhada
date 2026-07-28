import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
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

export const leaseStatus = pgEnum("lease_status", ["active", "upcoming", "ended"]);
export const paymentStatus = pgEnum("payment_status", ["paid", "pending", "overdue"]);
export const paymentMethod = pgEnum("payment_method", ["bank_transfer", "cash", "check", "card"]);

export const property = pgTable("property", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const unit = pgTable("unit", {
  id: text("id").primaryKey(),
  propertyId: text("property_id").notNull().references(() => property.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  bedrooms: integer("bedrooms").default(1).notNull(),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }).default("1").notNull(),
  monthlyRent: numeric("monthly_rent", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenant = pgTable("tenant", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  properties: many(property),
  tenants: many(tenant),
}));

export const propertyRelations = relations(property, ({ one, many }) => ({
  owner: one(user, { fields: [property.ownerId], references: [user.id] }),
  units: many(unit),
}));

export const unitRelations = relations(unit, ({ one, many }) => ({
  property: one(property, { fields: [unit.propertyId], references: [property.id] }),
  leases: many(lease),
}));

export const leaseRelations = relations(lease, ({ one, many }) => ({
  unit: one(unit, { fields: [lease.unitId], references: [unit.id] }),
  tenant: one(tenant, { fields: [lease.tenantId], references: [tenant.id] }),
  payments: many(payment),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  property,
  unit,
  tenant,
  lease,
  payment,
  userRelations,
  propertyRelations,
  unitRelations,
  leaseRelations,
};
