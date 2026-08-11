import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Waterfall: income covers living expenses first, then loan payments,
// then whatever remains is available for discretionary spending.
export const forMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const [income, bills, loans] = await Promise.all([
      ctx.db
        .query("incomeEntries")
        .withIndex("by_user_month", (q) =>
          q.eq("userId", userId).eq("month", args.month),
        )
        .unique(),
      ctx.db
        .query("bills")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("loans")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    const incomeAmount = income?.amount ?? 0;

    const living = bills.filter((b) => b.category === "living");
    const discretionaryBills = bills.filter(
      (b) => b.category === "discretionary",
    );
    const loanBills = bills.filter((b) => b.category === "loan");

    const livingTotal = sum(living.map((b) => b.amount));
    const loanBillsTotal = sum(loanBills.map((b) => b.amount));
    const loanPaymentsTotal = sum(loans.map((l) => l.monthlyPayment));
    const loanTotal = loanBillsTotal + loanPaymentsTotal;
    const discretionaryTotal = sum(discretionaryBills.map((b) => b.amount));

    const afterLiving = incomeAmount - livingTotal;
    const afterLoans = afterLiving - loanTotal;
    const afterDiscretionary = afterLoans - discretionaryTotal;

    return {
      month: args.month,
      income: incomeAmount,
      tiers: {
        living: {
          total: livingTotal,
          remainingAfter: afterLiving,
          covered: afterLiving >= 0,
          items: living,
        },
        loans: {
          total: loanTotal,
          remainingAfter: afterLoans,
          covered: afterLoans >= 0,
          billItems: loanBills,
          loanItems: loans,
        },
        discretionary: {
          total: discretionaryTotal,
          remainingAfter: afterDiscretionary,
          covered: afterDiscretionary >= 0,
          items: discretionaryBills,
        },
      },
      freeCash: afterDiscretionary,
    };
  },
});

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}
