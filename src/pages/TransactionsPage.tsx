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
        .select(`*, customers (fullname, mobilenumber)`)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map((t: any) => ({
        id: t.id,
        customerid: t.customerid,
        transactiondate: new Date(t.transactiondate),
        totalinstallments: t.totalinstallments,
        installmentamount: t.installmentamount,
        firstinstallmentdate: new Date(t.firstinstallmentdate),
        totalamount: t.totalamount,
        amountpaid: t.amountpaid,
        remainingbalance: t.remainingbalance,
        legalcase: t.legalcase,
        overdueinstallments: t.overdueinstallments || 0,
        overdueamount: t.overdueamount || 0,
        customerName: t.customers?.fullname || 'Unknown',
        mobileNumber: t.customers?.mobilenumber || '',
        created_at: new Date(t.created_at),
    }));
};

const getCustomers = async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) throw new Error(error.message);
    return data.map((customer: any) => ({
        id: customer.id,
        fullName: customer.fullname,
        mobileNumber: customer.mobilenumber,
        civilId: customer.civilid,
        created_at: new Date(customer.created_at),
    }));
};

const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'customerName' | 'mobileNumber'>): Promise<any> => {
    const transactionData = {
        customerid: transaction.customerid,
        transactiondate: transaction.transactiondate.toISOString().split('T')[0],
        totalinstallments: transaction.totalinstallments,
        installmentamount: transaction.installmentamount,
        firstinstallmentdate: transaction.firstinstallmentdate.toISOString().split('T')[0],
        totalamount: transaction.totalamount,
        amountpaid: transaction.amountpaid,
        remainingbalance: transaction.remainingbalance,
        legalcase: transaction.legalcase,
    };
    const { data, error } = await supabase.from('transactions').insert([transactionData]).select();
    if (error) throw new Error(error.message);
    return data;
};

const updateTransaction = async (transaction: Partial<Transaction>): Promise<any> => {
    const { id, customerName, mobileNumber, ...rest } = transaction;
    const updateData: any = { ...rest };
    
    // Convert camelCase to snake_case for database
    if (rest.customerid) updateData.customerid = rest.customerid;
    if (rest.transactiondate) updateData.transactiondate = rest.transactiondate instanceof Date ? rest.transactiondate.toISOString().split('T')[0] : rest.transactiondate;
    if (rest.firstinstallmentdate) updateData.firstinstallmentdate = rest.firstinstallmentdate instanceof Date ? rest.firstinstallmentdate.toISOString().split('T')[0] : rest.firstinstallmentdate;
    
    const { data, error } = await supabase.from('transactions').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
    return data;
};

const deleteTransaction = async (transactionId: string): Promise<any> => {
    const { data, error } = await supabase.from('transactions').delete().eq('id', transactionId);
    if (error) throw new Error(error.message);
    return data;
}
// --- End Supabase API Functions ---

const DEFAULT_MESSAGE_TEMPLATE = "عزيزي [CustomerName]،\nنود تذكيركم بأن قسطكم بمبلغ [Amount] دينار كويتي مستحق الدفع.\nالرصيد المتبقي: [Balance] دينار كويتي.\nشكرًا لتعاونكم.";


const TransactionsPage = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
    const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null);

    const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
        queryKey: ["transactions"],
        queryFn: getTransactions,
    });

    const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
        queryKey: ["customers"],
        queryFn: getCustomers,
    });

    const addMutation = useMutation({
        mutationFn: addTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions", "dashboardStats"] });
            setShowForm(false);
            toast({ title: "تمت إضافة المعاملة بنجاح" });
        },
        onError: (error: any) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: updateTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions", "dashboardStats"] });
            setShowForm(false);
            setEditingTransaction(undefined);
            toast({ title: "تم تحديث المعاملة بنجاح" });
        },
        onError: (error: any) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions", "dashboardStats"] });
            toast({ title: "تم حذف المعاملة بنجاح" });
        },
        onError: (error: any) => toast({ title: "خطأ", description: error.message, variant: "destructive" }),
    });

    const handleSave = (formData: any) => {
        if (editingTransaction) {
            updateMutation.mutate({ ...formData, id: editingTransaction.id });
        } else {
            const totalAmount = formData.totalInstallments * formData.installmentAmount;
            addMutation.mutate({ ...formData, totalAmount, remainingBalance: totalAmount });
        }
    };

    const handleSendReminder = (transaction: Transaction) => {
        const template = localStorage.getItem('whatsappMessageTemplate') || DEFAULT_MESSAGE_TEMPLATE;
        const message = template
            .replace('[CustomerName]', transaction.customerName)
            .replace('[Amount]', formatCurrency(transaction.installmentamount))
            .replace('[Balance]', formatCurrency(transaction.remainingbalance));

        const whatsappUrl = `https://wa.me/${transaction.mobileNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (isLoadingTransactions || isLoadingCustomers) return <div>جاري التحميل...</div>;

    return (
        <div>
            {showForm ? (
                <TransactionForm
                    transaction={editingTransaction}
                    customers={customers || []}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingTransaction(undefined);
                    }}
                    isLoading={addMutation.isPending || updateMutation.isPending}
                />
            ) : (
                <>
                    <TransactionList
                        transactions={transactions || []}
                        onAddTransaction={() => {
                            setEditingTransaction(undefined);
                            setShowForm(true);
                        }}
                        onEditTransaction={(transaction) => {
                            setEditingTransaction(transaction);
                            setShowForm(true);
                        }}
                        onDeleteTransaction={(id) => deleteMutation.mutate(id)}
                        onRecordPayment={(transaction) => setPaymentTransaction(transaction)}
                        onSendReminder={handleSendReminder}
                    />
                    {paymentTransaction && (
                        <PaymentForm
                            transaction={paymentTransaction}
                            isOpen={!!paymentTransaction}
                            onClose={() => setPaymentTransaction(null)}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default TransactionsPage;
