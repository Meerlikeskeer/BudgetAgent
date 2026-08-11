import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LoanRing } from "@/components/LoanRing";
import { formatCurrency, ordinal } from "@/lib/format";
import { useMonth } from "@/context/MonthContext";
import { toast } from "sonner";

const TIERS = [
  { key: "living" as const, label: "Living expenses", color: "bg-emerald-500", dot: "bg-emerald-500" },
  { key: "loans" as const, label: "Loan payments", color: "bg-blue-500", dot: "bg-blue-500" },
  { key: "discretionary" as const, label: "Discretionary", color: "bg-amber-500", dot: "bg-amber-500" },
];

export default function Dashboard() {
  const { month } = useMonth();
  const budget = useQuery(api.budget.forMonth, { month });
  const loans = useQuery(api.loans.list);
  const setIncome = useMutation(api.income.setForMonth);
  const [incomeInput, setIncomeInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (budget) setIncomeInput(budget.income ? String(budget.income) : "");
  }, [budget, month]);

  if (!budget) return null;

  const income = budget.income;
  const segments = TIERS.map((t) => ({ ...t, total: budget.tiers[t.key].total }));
  const spent = segments.reduce((a, s) => a + s.total, 0);
  const freeCash = budget.freeCash;

  const upcomingBills = [
    ...budget.tiers.living.items,
    ...budget.tiers.loans.billItems,
    ...budget.tiers.discretionary.items,
  ].sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">This month's budget</h1>
          <p className="text-sm text-muted-foreground">
            Living expenses first, then loans, then whatever's left for discretionary spending.
          </p>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await setIncome({ month, amount: Number(incomeInput) || 0 });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : String(err));
            } finally {
              setSaving(false);
            }
          }}
        >
          <div>
            <label className="text-xs text-muted-foreground">Monthly income</label>
            <Input
              type="number"
              step="0.01"
              className="w-40"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            Save
          </Button>
        </form>
      </div>

      {income > 0 ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
              {segments.map((s) =>
                s.total > 0 ? (
                  <div
                    key={s.key}
                    className={s.color}
                    style={{ width: `${Math.min(100, (s.total / income) * 100)}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {segments.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${s.dot}`} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(s.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Enter your income for {month} to see your budget breakdown.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Income" value={formatCurrency(income)} />
        <Stat label="Committed (living + loans + discretionary)" value={formatCurrency(spent)} />
        <Stat
          label="Free cash"
          value={formatCurrency(freeCash)}
          className={freeCash >= 0 ? "text-emerald-600" : "text-destructive"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming bills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBills.length === 0 && (
              <p className="text-sm text-muted-foreground">No bills yet.</p>
            )}
            {upcomingBills.map((bill) => (
              <div key={bill._id} className="flex items-center justify-between text-sm">
                <span>{bill.biller}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {ordinal(bill.dueDay)}
                  </span>
                  <span className="w-16 text-right tabular-nums">{formatCurrency(bill.amount)}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Loans</CardTitle>
            <Link to="/loans" className="text-xs text-muted-foreground underline underline-offset-4">
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            {loans?.length === 0 && (
              <p className="text-sm text-muted-foreground">No loans yet.</p>
            )}
            {loans?.slice(0, 3).map((loan) => {
              const denom = loan.originalBalance ?? loan.currentBalance;
              const percentRemaining = denom > 0 ? (loan.currentBalance / denom) * 100 : 100;
              return (
                <div key={loan._id} className="flex flex-col items-center gap-1">
                  <LoanRing percentRemaining={percentRemaining} size={80} />
                  <span className="max-w-20 truncate text-xs text-muted-foreground">
                    {loan.name}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums ${className ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
