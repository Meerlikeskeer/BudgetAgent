import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { buildAmortizationSchedule } from "@/lib/amortization";
import { formatCurrency, ordinal } from "@/lib/format";
import type { Doc } from "../../convex/_generated/dataModel";

export function LoanDetailDialog({
  loan,
  open,
  onOpenChange,
}: {
  loan: Doc<"loans"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!loan) return null;

  const { schedule, payoffMonths } = buildAmortizationSchedule(
    loan.currentBalance,
    loan.interestRate,
    loan.monthlyPayment,
  );

  const chartData = [
    { month: 0, balance: loan.currentBalance },
    ...schedule
      .filter((_, i) => i % Math.max(1, Math.floor(schedule.length / 24)) === 0 || i === schedule.length - 1)
      .map((row) => ({ month: row.month, balance: row.balance })),
  ];

  const payoffDate = payoffMonths
    ? new Date(new Date().setMonth(new Date().getMonth() + payoffMonths)).toLocaleDateString(
        "en-US",
        { month: "short", year: "numeric" },
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{loan.name}</DialogTitle>
          <DialogDescription>
            {loan.servicer ?? "Loan"} · due the {ordinal(loan.dueDay)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Balance" value={formatCurrency(loan.currentBalance)} />
          <Stat
            label="Original"
            value={loan.originalBalance ? formatCurrency(loan.originalBalance) : "—"}
          />
          <Stat
            label="Rate"
            value={loan.interestRate !== undefined ? `${loan.interestRate}%` : "—"}
          />
          <Stat label="Monthly payment" value={formatCurrency(loan.monthlyPayment)} />
        </div>

        {payoffMonths ? (
          <p className="text-sm text-muted-foreground">
            At this rate, paid off in <span className="font-medium text-foreground">{payoffMonths} months</span> (
            {payoffDate})
          </p>
        ) : (
          <p className="text-sm text-destructive">
            The monthly payment doesn't cover accruing interest — balance won't shrink at this rate.
          </p>
        )}

        {chartData.length > 1 && (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(m) => `Month ${m}`}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {schedule.length > 0 && (
          <div className="max-h-56 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.slice(0, 12).map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="tabular-nums">{row.month}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.principal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.interest)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
