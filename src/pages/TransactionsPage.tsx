import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionForm from "@/components/transactions/TransactionForm";
import PaymentForm from "@/components/payments/PaymentForm";
import { Transaction, Customer } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils-arabic";

// --- Supabase API Functions ---
const getTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            customer:customers!customer_id(
                id,
                full_name,
                mobile_number
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    return data.map((transaction: any) => ({
        ...transaction,
        created_at: new Date(transaction.created_at),
        start_date: new Date(transaction.start_date),
        customerName: transaction.customer?.full_name || '',
        mobileNumber: transaction.customer?.mobile_number || ''
    })) as Transaction[];
};

const getCustomers = async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((customer: any) => ({
        ...customer,
        created_at: new Date(customer.created_at),
        alternate_phone: customer.mobile_number2,
    })) as Customer[];
};

const createTransaction = async (transactionData: Omit<Transaction, "id" | "created_at" | "customerName" | "mobileNumber">): Promise<Transaction> => {
    const insertData = {
        customer_id: transactionData.customer_id,
        sequence_number: transactionData.sequence_number,
        cost_price: transactionData.cost_price,
        extra_price: transactionData.extra_price || 0,
        amount: transactionData.amount,
        profit: transactionData.profit || 0,
        installment_amount: transactionData.installment_amount,
        start_date: transactionData.start_date instanceof Date ? transactionData.start_date.toISOString().split('T')[0] : transactionData.start_date,
        number_of_installments: transactionData.number_of_installments,
        remaining_balance: transactionData.remaining_balance || transactionData.amount,
        status: transactionData.status || 'active',
        has_legal_case: transactionData.has_legal_case || false,
        legal_case_details: transactionData.legal_case_details || null,
        notes: transactionData.notes || null,
    };

    const { data, error } = await supabase.from('transactions').insert([insertData]).select().single();
    if (error) throw new Error(error.message);
    return {
        ...data,
        created_at: new Date(data.created_at),
        start_date: new Date(data.start_date)
    } as Transaction;
};

const updateTransaction = async (id: string, transactionData: Partial<Transaction>): Promise<Transaction> => {
    const updateData: any = {
        customer_id: transactionData.customer_id,
        sequence_number: transactionData.sequence_number,
        cost_price: transactionData.cost_price,
        extra_price: transactionData.extra_price,
        amount: transactionData.amount,
        profit: transactionData.profit,
        installment_amount: transactionData.installment_amount,
        start_date: transactionData.start_date instanceof Date ? transactionData.start_date.toISOString().split('T')[0] : transactionData.start_date,
        number_of_installments: transactionData.number_of_installments,
        remaining_balance: transactionData.remaining_balance,
        status: transactionData.status,
        has_legal_case: transactionData.has_legal_case,
        legal_case_details: transactionData.legal_case_details,
        notes: transactionData.notes,
    };

    const { data, error } = await supabase.from('transactions').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return {
        ...data,
        created_at: new Date(data.created_at),
        start_date: new Date(data.start_date)
    } as Transaction;
};

const deleteTransaction = async (id: string): Promise<void> => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
};
// --- End Supabase API Functions ---

const TransactionsPage = () => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
        queryKey: ['transactions'],
        queryFn: getTransactions
    });

    const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: getCustomers
    });

    const createMutation = useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            setShowTransactionForm(false);
            toast({ title: "تم إنشاء المعاملة بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) => updateTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            setShowTransactionForm(false);
            setSelectedTransaction(null);
            toast({ title: "تم تحديث المعاملة بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            toast({ title: "تم حذف المعاملة بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const handleSaveTransaction = (transactionData: Omit<Transaction, "id" | "created_at" | "customerName" | "mobileNumber">) => {
        if (selectedTransaction) {
            updateMutation.mutate({ id: selectedTransaction.id, data: transactionData });
        } else {
            createMutation.mutate(transactionData);
        }
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowTransactionForm(true);
    };

    const handleDeleteTransaction = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddTransaction = () => {
        setSelectedTransaction(null);
        setShowTransactionForm(true);
    };

    const handleAddPayment = (transaction: Transaction) => {
        setPaymentTransaction(transaction);
        setShowPaymentForm(true);
    };

    if (transactionsError) {
        return <div className="text-center text-red-600">خطأ في تحميل البيانات: {(transactionsError as Error).message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">إدارة المعاملات</h1>
            </div>

            <TransactionList
                transactions={transactions || []}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onRecordPayment={handleAddPayment}
                onSendReminder={() => {}}
            />

            <TransactionForm
                transaction={selectedTransaction || undefined}
                customers={customers || []}
                onSave={handleSaveTransaction}
                onCancel={() => {
                    setShowTransactionForm(false);
                    setSelectedTransaction(null);
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            {paymentTransaction && (
                <PaymentForm
                    transaction={paymentTransaction}
                    isOpen={showPaymentForm}
                    onClose={() => {
                        setShowPaymentForm(false);
                        setPaymentTransaction(null);
                    }}
                />
            )}
        </div>
    );
};

export default TransactionsPage;