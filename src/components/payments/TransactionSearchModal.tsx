import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Transaction } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils-arabic";

interface TransactionSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionSelect: (transaction: Transaction) => void;
}

const searchTransactions = async (searchTerm: string): Promise<Transaction[]> => {
  const { data, error } = await supabase.rpc('search_transactions', {
    p_search_term: searchTerm
  });
  if (error) throw new Error(error.message);
  return data || [];
};

export const TransactionSearchModal = ({ isOpen, onClose, onTransactionSelect }: TransactionSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["searchTransactions", searchTerm],
    queryFn: () => searchTransactions(searchTerm),
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>البحث عن معاملة لتسجيل دفعة</DialogTitle>
          <DialogDescription>
            ابحث عن المعاملة التي تريد تسجيل دفعة لها
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="ابحث برقم المعاملة أو اسم العميل أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4">جاري البحث...</div>
            ) : transactions?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchTerm ? "لم يتم العثور على معاملات." : "أدخل كلمة للبحث"}
              </div>
            ) : (
              transactions?.map((transaction) => (
                <Card key={transaction.id} className="cursor-pointer hover:bg-accent" onClick={() => onTransactionSelect(transaction)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{transaction.customer?.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          رقم المعاملة: {transaction.sequence_number}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{formatCurrency(transaction.remaining_balance)}</div>
                        <div className="text-sm text-muted-foreground">متبقي</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};