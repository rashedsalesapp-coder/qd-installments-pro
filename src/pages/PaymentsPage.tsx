import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaymentList from "@/components/payments/PaymentList";
import PaymentForm from "@/components/payments/PaymentForm";
import { TransactionSearchModal } from "@/components/payments/TransactionSearchModal";
import { Payment, Transaction } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

const PAYMENTS_PER_PAGE = 30;

// --- Supabase API Functions ---
const getPayments = async ({ pageParam = 0 }): Promise<{ data: Payment[], nextPage: number | null }> => {
    const from = pageParam * PAYMENTS_PER_PAGE;
    const to = from + PAYMENTS_PER_PAGE - 1;

    const { data, error, count } = await supabase
        .from('payments')
        .select(`
            *,
            customer:customers (full_name),
            transaction:transactions (sequence_number)
        `, { count: 'exact' })
        .order('payment_date', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    const hasMore = count ? from + (data?.length || 0) < count : false;

    return {
        data: data as Payment[],
        nextPage: hasMore ? pageParam + 1 : null,
    };
};

const deletePayment = async (paymentId: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) throw new Error(error.message);
};
// --- End Supabase API Functions ---

const PaymentsPage = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["payments"],
        queryFn: getPayments,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePayment,
        onSuccess: () => {
            toast({ title: "تم حذف الدفعة بنجاح" });
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        },
    });

    const payments = data?.pages.flatMap(page => page.data) ?? [];

    const handleTransactionSelect = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsSearchModalOpen(false);
    };

    if (isLoading && !payments.length) return <div>جاري تحميل المدفوعات...</div>;
    if (isError) return <div>خطأ في تحميل المدفوعات</div>;

    return (
        <>
            <PaymentList
                payments={payments}
                onAddPayment={() => setIsSearchModalOpen(true)}
                onDeletePayment={(paymentId) => deleteMutation.mutate(paymentId)}
            />
            <TransactionSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onTransactionSelect={handleTransactionSelect}
            />
            {selectedTransaction && (
                <PaymentForm
                    transaction={selectedTransaction}
                    isOpen={!!selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </>
    );
};

export default PaymentsPage;
