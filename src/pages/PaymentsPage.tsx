import { useQuery } from "@tanstack/react-query";
import PaymentList from "@/components/payments/PaymentList";
import { Payment } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

// --- Supabase API Function ---
const getPayments = async (): Promise<Payment[]> => {
    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            customer:customers (full_name),
            transaction:transactions (sequence_number)
        `)
        .order('payment_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Payment[];
};
// --- End Supabase API Function ---

const PaymentsPage = () => {
    const { data: payments, isLoading, isError } = useQuery<Payment[]>({
        queryKey: ["payments"],
        queryFn: getPayments,
    });

    if (isLoading) return <div>جاري تحميل المدفوعات...</div>;
    if (isError) return <div>خطأ في تحميل المدفوعات</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">المدفوعات</h1>
            <PaymentList payments={payments || []} />
        </div>
    );
};

export default PaymentsPage;
