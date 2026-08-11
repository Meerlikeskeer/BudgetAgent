import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function LoanFormDialog({
  loan,
  open,
  onOpenChange,
}: {
  loan?: Doc<"loans"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useMutation(api.loans.create);
  const update = useMutation(api.loans.update);
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{loan ? "Edit loan" : "Add loan"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            const fd = new FormData(e.currentTarget);
            const payload = {
              name: String(fd.get("name")),
              currentBalance: Number(fd.get("currentBalance")),
              originalBalance: fd.get("originalBalance")
                ? Number(fd.get("originalBalance"))
                : undefined,
              interestRate: fd.get("interestRate")
                ? Number(fd.get("interestRate"))
                : undefined,
              monthlyPayment: Number(fd.get("monthlyPayment")),
              dueDay: Number(fd.get("dueDay")),
              servicer: fd.get("servicer") ? String(fd.get("servicer")) : undefined,
            };
            try {
              if (loan) await update({ id: loan._id, ...payload });
              else await create(payload);
              onOpenChange(false);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : String(err));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Field label="Name" name="name" defaultValue={loan?.name} required />
          <Field label="Servicer" name="servicer" defaultValue={loan?.servicer} />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Current balance"
              name="currentBalance"
              type="number"
              step="0.01"
              defaultValue={loan?.currentBalance}
              required
            />
            <Field
              label="Original balance"
              name="originalBalance"
              type="number"
              step="0.01"
              defaultValue={loan?.originalBalance}
            />
            <Field
              label="Interest rate (%)"
              name="interestRate"
              type="number"
              step="0.01"
              defaultValue={loan?.interestRate}
            />
            <Field
              label="Monthly payment"
              name="monthlyPayment"
              type="number"
              step="0.01"
              defaultValue={loan?.monthlyPayment}
              required
            />
          </div>
          <Field
            label="Due day of month"
            name="dueDay"
            type="number"
            min={1}
            max={31}
            defaultValue={loan?.dueDay}
            required
          />
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {loan ? "Save" : "Add loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
