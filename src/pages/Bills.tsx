import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { BillFormDialog } from "@/components/BillFormDialog";
import { formatCurrency, ordinal } from "@/lib/format";
import type { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

const categoryLabel: Record<string, { label: string; className: string }> = {
  living: { label: "Living", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  loan: { label: "Loan", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  discretionary: { label: "Discretionary", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
};

export default function BillsPage() {
  const bills = useQuery(api.bills.list);
  const remove = useMutation(api.bills.remove);
  const [editing, setEditing] = useState<Doc<"bills"> | null | undefined>(undefined);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bills</h1>
          <p className="text-sm text-muted-foreground">Recurring monthly bills, sorted by due date.</p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          Add bill
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All bills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bills?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No bills yet. Add one manually or upload a document.
            </p>
          )}
          {bills
            ?.slice()
            .sort((a, b) => a.dueDay - b.dueDay)
            .map((bill) => (
              <div
                key={bill._id}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div>
                  <div className="font-medium">{bill.biller}</div>
                  <div className="text-xs text-muted-foreground">
                    Due the {ordinal(bill.dueDay)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={categoryLabel[bill.category].className}>
                    {categoryLabel[bill.category].label}
                  </Badge>
                  <span className="w-20 text-right font-medium tabular-nums">
                    {formatCurrency(bill.amount)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(bill)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      remove({ id: bill._id }).catch((err) =>
                        toast.error(err instanceof Error ? err.message : String(err)),
                      );
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <BillFormDialog
        bill={editing ?? null}
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </div>
  );
}
