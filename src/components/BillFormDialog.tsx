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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function BillFormDialog({
  bill,
  open,
  onOpenChange,
}: {
  bill?: Doc<"bills"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useMutation(api.bills.create);
  const update = useMutation(api.bills.update);
  const [category, setCategory] = useState(bill?.category ?? "living");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bill ? "Edit bill" : "Add bill"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            const fd = new FormData(e.currentTarget);
            const payload = {
              biller: String(fd.get("biller")),
              amount: Number(fd.get("amount")),
              dueDay: Number(fd.get("dueDay")),
              category: category as "living" | "loan" | "discretionary",
              recurring: fd.get("recurring") === "on",
            };
            try {
              if (bill) await update({ id: bill._id, ...payload });
              else await create(payload);
              onOpenChange(false);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : String(err));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="biller">Biller</Label>
            <Input id="biller" name="biller" defaultValue={bill?.biller} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={bill?.amount}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dueDay">Due day of month</Label>
              <Input
                id="dueDay"
                name="dueDay"
                type="number"
                min={1}
                max={31}
                defaultValue={bill?.dueDay}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="living">Living expense</SelectItem>
                <SelectItem value="loan">Loan payment</SelectItem>
                <SelectItem value="discretionary">Discretionary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="recurring"
              name="recurring"
              type="checkbox"
              defaultChecked={bill?.recurring ?? true}
              className="size-4"
            />
            <Label htmlFor="recurring">Recurring monthly</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {bill ? "Save" : "Add bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
