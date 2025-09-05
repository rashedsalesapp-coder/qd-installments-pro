import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import PaymentList from "@/components/payments/PaymentList";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { TransactionSearchModal } from "@/components/payments/TransactionSearchModal";
import { Payment, Transaction } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

const PAYMENTS_PER_PAGE = 30;

// --- Supabase API Function ---
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

    const hasMore = count ? from + data.length < count : false;

    return {
        data: data as Payment[],
        nextPage: hasMore ? pageParam + 1 : null,
    };
};
// --- End Supabase API Function ---

const PaymentsPage = () => {
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
                onLoadMore={fetchNextPage}
                canLoadMore={!!hasNextPage}
                isLoadingMore={isFetchingNextPage}
                onAddPayment={() => setIsSearchModalOpen(true)}
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
