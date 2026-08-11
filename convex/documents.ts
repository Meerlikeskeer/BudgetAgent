import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const documentId = await ctx.db.insert("documents", {
      userId,
      storageId: args.storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      status: "pending",
    });
    await ctx.scheduler.runAfter(0, internal.documentActions.parseDocument, {
      documentId,
    });
    return documentId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getFileUrl = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== userId) return null;
    return ctx.storage.getUrl(doc.storageId);
  },
});

// --- internal, used by the parsing action ---

export const getInternal = internalMutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.documentId);
  },
});

export const markProcessing = internalMutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, { status: "processing" });
  },
});

export const markParsed = internalMutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, { status: "parsed" });
  },
});

export const markFailed = internalMutation({
  args: { documentId: v.id("documents"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      status: "failed",
      error: args.error,
    });
  },
});

export const insertExtractedBill = internalMutation({
  args: {
    userId: v.id("users"),
    documentId: v.id("documents"),
    biller: v.string(),
    amount: v.number(),
    dueDay: v.number(),
    category: v.union(
      v.literal("living"),
      v.literal("loan"),
      v.literal("discretionary"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bills", {
      userId: args.userId,
      documentId: args.documentId,
      biller: args.biller,
      amount: args.amount,
      dueDay: args.dueDay,
      category: args.category,
      recurring: true,
    });
  },
});

export const insertExtractedLoan = internalMutation({
  args: {
    userId: v.id("users"),
    documentId: v.id("documents"),
    name: v.string(),
    currentBalance: v.number(),
    originalBalance: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    monthlyPayment: v.number(),
    dueDay: v.number(),
    servicer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("loans", {
      userId: args.userId,
      documentId: args.documentId,
      name: args.name,
      currentBalance: args.currentBalance,
      originalBalance: args.originalBalance,
      interestRate: args.interestRate,
      monthlyPayment: args.monthlyPayment,
      dueDay: args.dueDay,
      servicer: args.servicer,
    });
  },
});
