import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaymentList from "@/components/payments/PaymentList";
import PaymentForm from "@/components/payments/PaymentForm";
import { TransactionSearchModal } from "@/components/payments/TransactionSearchModal";
import { Payment, Transaction } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const PAYMENTS_PER_PAGE = 30;

// --- Supabase API Functions ---
const getPayments = async ({ pageParam = 0 }): Promise<{ data: Payment[], nextPage: number | null }> => {
    const from = pageParam * PAYMENTS_PER_PAGE;
    const to = from + PAYMENTS_PER_PAGE - 1;

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            customer:customers!customer_id(full_name),
            transaction:transactions!transaction_id(sequence_number)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    const payments = data.map((payment: any) => ({
        ...payment,
        payment_date: new Date(payment.payment_date),
        created_at: new Date(payment.created_at),
    })) as Payment[];

    const nextPage = data.length === PAYMENTS_PER_PAGE ? pageParam + 1 : null;
    return { data: payments, nextPage };
};

const deletePayment = async (id: string): Promise<void> => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw new Error(error.message);
};
// --- End Supabase API Functions ---

const PaymentsPage = () => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showTransactionSearch, setShowTransactionSearch] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const {
        data: paymentsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteQuery({
        queryKey: ['payments'],
        queryFn: getPayments,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 0,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            toast({ title: "تم حذف الدفعة بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const allPayments = paymentsData?.pages.flatMap(page => page.data) || [];

    const handleDeletePayment = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleTransactionSelect = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowTransactionSearch(false);
        setShowPaymentForm(true);
    };

    const handleAddPayment = () => {
        setShowTransactionSearch(true);
    };

    if (error) {
        return <div className="text-center text-red-600">خطأ في تحميل البيانات: {(error as Error).message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">إدارة المدفوعات</h1>
            </div>

            <PaymentList
                payments={allPayments}
                onAddPayment={handleAddPayment}
                onDeletePayment={handleDeletePayment}
                onLoadMore={fetchNextPage}
            />

            <TransactionSearchModal
                isOpen={showTransactionSearch}
                onClose={() => setShowTransactionSearch(false)}
                onTransactionSelect={handleTransactionSelect}
            />

            {selectedTransaction && (
                <PaymentForm
                    transaction={selectedTransaction}
                    isOpen={showPaymentForm}
                    onClose={() => {
                        setShowPaymentForm(false);
                        setSelectedTransaction(null);
                    }}
                />
            )}
        </div>
    );
};

export default PaymentsPage;