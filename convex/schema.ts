import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  documents: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("parsed"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  bills: defineTable({
    userId: v.id("users"),
    documentId: v.optional(v.id("documents")),
    biller: v.string(),
    amount: v.number(),
    dueDay: v.number(), // day of month, 1-31
    category: v.union(
      v.literal("living"),
      v.literal("loan"),
      v.literal("discretionary"),
    ),
    recurring: v.boolean(),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  loans: defineTable({
    userId: v.id("users"),
    documentId: v.optional(v.id("documents")),
    name: v.string(),
    originalBalance: v.optional(v.number()),
    currentBalance: v.number(),
    interestRate: v.optional(v.number()), // annual %, e.g. 5.5
    monthlyPayment: v.number(),
    dueDay: v.number(),
    servicer: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  incomeEntries: defineTable({
    userId: v.id("users"),
    month: v.string(), // "2026-08"
    amount: v.number(),
  }).index("by_user_month", ["userId", "month"]),
});
