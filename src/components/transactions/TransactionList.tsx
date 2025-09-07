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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatArabicDate } from "@/lib/utils-arabic";
import { Edit, Trash2, DollarSign, MessageCircle, ChevronsDown, Loader2, PlusCircle, Search } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onRecordPayment: (transaction: Transaction) => void;
  onSendReminder: (transaction: Transaction) => void;
  onLoadMore: () => void;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isSearching: boolean;
}

const TransactionList = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onRecordPayment,
  onSendReminder,
  onLoadMore,
  canLoadMore,
  isLoadingMore,
  searchTerm,
  onSearchChange,
  isSearching,
}: TransactionListProps) => {
  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.has_legal_case) {
      return <Badge variant="destructive">قضية قانونية</Badge>;
    }
    if (transaction.remaining_balance <= 0) {
      return <Badge className="bg-green-600 text-white">مكتملة</Badge>;
    }
    if (transaction.status === 'overdue') {
      return <Badge variant="secondary">متأخرة</Badge>;
    }
    return <Badge variant="outline">نشطة</Badge>;
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            إدارة المعاملات
          </h2>
          <p className="text-muted-foreground">
            عرض وتحديث جميع معاملات البيع بالتقسيط.
          </p>
        </div>
        <Button onClick={onAddTransaction} className="flex items-center space-x-reverse space-x-2">
          <PlusCircle className="h-4 w-4" />
          <span>إضافة معاملة جديدة</span>
        </Button>
      </div>
      <Card className="shadow-card">
        <CardHeader>
           <CardTitle>قائمة المعاملات</CardTitle>
           <div className="flex items-center space-x-reverse space-x-2 mt-4">
             <div className="relative flex-1 max-w-sm">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder="البحث بالاسم أو رقم الهاتف أو رقم المعاملة..."
                 value={searchTerm}
                 onChange={(e) => onSearchChange(e.target.value)}
                 className="pl-9"
               />
             </div>
             {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم المعاملة</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right">المبلغ المتبقي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && !isLoadingMore && !isSearching ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "لم يتم العثور على نتائج للبحث." : "لم يتم العثور على معاملات."}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                       <Badge variant="outline">{transaction.sequence_number}</Badge>
                    </TableCell>
                    <TableCell>{transaction.customer?.full_name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell className="font-medium text-red-600">{formatCurrency(transaction.remaining_balance)}</TableCell>
                    <TableCell>{getStatusBadge(transaction)}</TableCell>
                    <TableCell>{formatArabicDate(new Date(transaction.created_at))}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-reverse space-x-1">
                        {transaction.status === 'overdue' && (
                          <Button variant="ghost" size="sm" onClick={() => onSendReminder(transaction)} title="إرسال تذكير واتساب">
                              <MessageCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => onRecordPayment(transaction)} title="تسجيل دفعة">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onEditTransaction(transaction)} title="تعديل">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDeleteTransaction(transaction.id)} title="حذف">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {canLoadMore && (
          <CardFooter className="flex justify-center">
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="flex items-center space-x-reverse space-x-2"
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronsDown className="h-4 w-4" />
              )}
              <span>{isLoadingMore ? "جاري التحميل..." : "تحميل المزيد"}</span>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default TransactionList;
