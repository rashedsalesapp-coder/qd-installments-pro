import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils-arabic";
import { useMutation } from "@tanstack/react-query";

interface PaymentFormProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  recordPayment: (paymentData: { transactionId: string; amount: number; }) => Promise<any>;
}

const PaymentForm = ({ transaction, isOpen, onClose, recordPayment }: PaymentFormProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | ''>('');

  const { mutate, isPending } = useMutation({
      mutationFn: recordPayment,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !amount || amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح.",
        variant: "destructive",
      });
      return;
    }
    if (amount > transaction.remainingBalance) {
      toast({
        title: "خطأ",
        description: "المبلغ المدفوع أكبر من المبلغ المتبقي.",
        variant: "destructive",
      });
      return;
    }

    mutate({ transactionId: transaction.id, amount: Number(amount) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة للمعاملة: {transaction.id}</DialogTitle>
          <DialogDescription>
            العميل: {transaction.customerName} | المبلغ المتبقي:{" "}
            {formatCurrency(transaction.remainingBalance)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                المبلغ
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "جاري الحفظ..." : "حفظ الدفعة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentForm;
