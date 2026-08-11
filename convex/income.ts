import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getForMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("incomeEntries")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", userId).eq("month", args.month),
      )
      .unique();
  },
});

export const setForMonth = mutation({
  args: { month: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("incomeEntries")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", userId).eq("month", args.month),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { amount: args.amount });
      return existing._id;
    }
    return ctx.db.insert("incomeEntries", {
      userId,
      month: args.month,
      amount: args.amount,
    });
  },
});
