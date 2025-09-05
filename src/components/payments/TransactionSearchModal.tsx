import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatArabicDate } from '@/lib/utils-arabic';
import { Loader2, Search } from 'lucide-react';

interface TransactionSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionSelect: (transaction: Transaction) => void;
}

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// API function
const searchTransactions = async (searchTerm: string): Promise<Transaction[]> => {
  const { data, error } = await supabase.rpc('search_transactions', { p_search_term: searchTerm });
  if (error) throw new Error(error.message);
  return data as Transaction[];
};

export const TransactionSearchModal = ({ isOpen, onClose, onTransactionSelect }: TransactionSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: transactions, isLoading, isError } = useQuery<Transaction[]>({
    queryKey: ['searchTransactions', debouncedSearchTerm],
    queryFn: () => searchTransactions(debouncedSearchTerm),
    enabled: isOpen, // Only run the query when the modal is open
  });

  const handleSelect = (transaction: Transaction) => {
    onTransactionSelect(transaction);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>البحث عن معاملة</DialogTitle>
          <DialogDescription>
            ابحث بالاسم، الرقم المدني، رقم الهاتف، أو رقم المعاملة لتسجيل دفعة.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابدأ البحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-2 pr-4">
            {isLoading && (
              <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {isError && (
              <div className="text-red-500 text-center p-8">
                حدث خطأ أثناء البحث.
              </div>
            )}
            {!isLoading && !isError && transactions?.length === 0 && (
              <div className="text-center text-muted-foreground p-8">
                لا توجد معاملات تطابق بحثك.
              </div>
            )}
            {transactions?.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => handleSelect(transaction)}
                className="p-4 border rounded-md hover:bg-muted cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-foreground">{transaction.customer.full_name}</p>
                  <p className="text-sm text-muted-foreground">رقم المعاملة: {transaction.sequence_number}</p>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>المبلغ المتبقي: {formatCurrency(transaction.remaining_balance)}</span>
                  <span className="mx-2">|</span>
                  <span>تاريخ الإنشاء: {formatArabicDate(new Date(transaction.created_at))}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
