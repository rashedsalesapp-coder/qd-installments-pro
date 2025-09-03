import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionForm from "@/components/transactions/TransactionForm";
import PaymentForm from "@/components/payments/PaymentForm";
import { Transaction, Customer } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils-arabic";
import {
    getTransactions,
    getCustomers,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    recordPayment
} from "@/lib/localApi";

const DEFAULT_MESSAGE_TEMPLATE = "عزيزي [CustomerName]،\nنود تذكيركم بأن قسطكم بمبلغ [Amount] دينار كويتي مستحق الدفع.\nالرصيد المتبقي: [Balance] دينار كويتي.\nشكرًا لتعاونكم.";

const TransactionsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
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
      setShowTransactionForm(false);
      toast({ title: "تمت إضافة المعاملة بنجاح" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["transactions", "dashboardStats"] });
        setShowTransactionForm(false);
        setEditingTransaction(undefined);
        toast({ title: "تم تحديث المعاملة بنجاح" });
    }
  });

  const deleteMutation = useMutation({
      mutationFn: deleteTransaction,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["transactions", "dashboardStats"] });
          toast({ title: "تم حذف المعاملة بنجاح" });
      }
  });

  const paymentMutation = useMutation({
      mutationFn: recordPayment,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["transactions", "dashboardStats"] });
          setPaymentTransaction(null); // Close dialog on success
          toast({ title: "تم تسجيل الدفعة بنجاح" });
      },
      onError: () => {
        toast({ title: "فشل تسجيل الدفعة", variant: "destructive" });
      }
  });

  const handleSaveTransaction = (data: any) => {
    if (editingTransaction) {
        updateMutation.mutate({ ...editingTransaction, ...data });
    } else {
        addMutation.mutate(data);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setShowTransactionForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  }

  const handleDeleteTransaction = (transactionId: string) => {
      deleteMutation.mutate(transactionId);
  }

  const handleRecordPayment = (transaction: Transaction) => {
      setPaymentTransaction(transaction);
  }

  const handleSendReminder = (transaction: Transaction) => {
    const template = localStorage.getItem('whatsappMessageTemplate') || DEFAULT_MESSAGE_TEMPLATE;
    const message = template
        .replace('[CustomerName]', transaction.customerName)
        .replace('[Amount]', formatCurrency(transaction.monthlyInstallmentAmount))
        .replace('[Balance]', formatCurrency(transaction.remainingBalance));

    const whatsappUrl = `https://wa.me/${transaction.mobileNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  const isLoading = isLoadingTransactions || isLoadingCustomers;

  if (isLoading) return <div>جاري تحميل المعاملات...</div>;

  if (showTransactionForm) {
    return (
      <TransactionForm
        transaction={editingTransaction}
        customers={customers || []}
        onSave={handleSaveTransaction}
        onCancel={() => {
            setShowTransactionForm(false);
            setEditingTransaction(undefined);
        }}
        isLoading={addMutation.isPending || updateMutation.isPending}
      />
    );
  }

  return (
    <>
      <TransactionList
        transactions={transactions || []}
        onAddTransaction={handleAddTransaction}
        onEditTransaction={handleEditTransaction}
        onViewTransaction={(t) => { alert("Viewing not implemented yet") }}
        onDeleteTransaction={handleDeleteTransaction}
        onRecordPayment={handleRecordPayment}
        onSendReminder={handleSendReminder}
      />
      {paymentTransaction && (
        <PaymentForm
            transaction={paymentTransaction}
            isOpen={!!paymentTransaction}
            onClose={() => setPaymentTransaction(null)}
            recordPayment={paymentMutation.mutateAsync}
        />
      )}
    </>
  );
};

export default TransactionsPage;
