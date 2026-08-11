import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { LoanRing } from "@/components/LoanRing";
import { LoanFormDialog } from "@/components/LoanFormDialog";
import { LoanDetailDialog } from "@/components/LoanDetailDialog";
import { formatCurrency } from "@/lib/format";
import type { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function LoansPage() {
  const loans = useQuery(api.loans.list);
  const remove = useMutation(api.loans.remove);
  const [editing, setEditing] = useState<Doc<"loans"> | null | undefined>(undefined);
  const [viewing, setViewing] = useState<Doc<"loans"> | null>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Loans</h1>
          <p className="text-sm text-muted-foreground">
            Student loans and other debt. Click a loan for the full amortization detail.
          </p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          Add loan
        </Button>
      </div>

      {loans?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No loans yet. Add one manually or upload a loan statement.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loans?.map((loan) => {
          const denom = loan.originalBalance ?? loan.currentBalance;
          const percentRemaining = denom > 0 ? (loan.currentBalance / denom) * 100 : 100;
          return (
            <Card
              key={loan._id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setViewing(loan)}
            >
              <CardHeader className="pb-0">
                <CardTitle className="flex items-start justify-between text-base">
                  <span className="truncate">{loan.name}</span>
                  <span className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(loan);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove({ id: loan._id }).catch((err) =>
                          toast.error(err instanceof Error ? err.message : String(err)),
                        );
                      }}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pt-4">
                <LoanRing percentRemaining={percentRemaining} />
                <div className="text-center">
                  <div className="font-semibold tabular-nums">
                    {formatCurrency(loan.currentBalance)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(loan.monthlyPayment)}/mo
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LoanFormDialog
        loan={editing ?? null}
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
      <LoanDetailDialog loan={viewing} open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  );
}
