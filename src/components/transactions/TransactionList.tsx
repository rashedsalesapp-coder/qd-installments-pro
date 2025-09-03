import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils-arabic";
import { Edit, Trash2, Eye, DollarSign, MessageCircle } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onRecordPayment: (transaction: Transaction) => void;
  onSendReminder: (transaction: Transaction) => void;
}

const TransactionList = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onRecordPayment,
  onSendReminder,
}: TransactionListProps) => {
  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.legalCase) {
      return <Badge variant="destructive">قضية قانونية</Badge>;
    }
    if (transaction.remainingBalance <= 0) {
      return <Badge className="bg-green-600">مكتملة</Badge>;
    }
    if (transaction.overdueAmount > 0) {
      return <Badge variant="warning">متأخرة</Badge>;
    }
    return <Badge variant="secondary">نشطة</Badge>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">إدارة المعاملات</h2>
        <Button onClick={onAddTransaction}>إضافة معاملة جديدة</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العميل</TableHead>
            <TableHead>المبلغ الإجمالي</TableHead>
            <TableHead>المبلغ المتبقي</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>تاريخ الإنشاء</TableHead>
            <TableHead>إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.customerName}</TableCell>
              <TableCell>{formatCurrency(transaction.totalAmount)}</TableCell>
              <TableCell>{formatCurrency(transaction.remainingBalance)}</TableCell>
              <TableCell>{getStatusBadge(transaction)}</TableCell>
              <TableCell>{formatDate(new Date(transaction.created_at))}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {transaction.overdueAmount > 0 && (
                    <Button variant="ghost" size="icon" onClick={() => onSendReminder(transaction)} title="إرسال تذكير واتساب">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onRecordPayment(transaction)} title="تسجيل دفعة">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEditTransaction(transaction)} title="تعديل">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteTransaction(transaction.id)} title="حذف">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
