import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Payment } from "@/lib/types";
import { formatCurrency, formatArabicDate } from "@/lib/utils-arabic";
import { ChevronsDown, Loader2, PlusCircle, Trash2 } from "lucide-react";

interface PaymentListProps {
  payments: Payment[];
  onAddPayment: () => void;
  onDeletePayment: (paymentId: string) => void;
  // Re-adding pagination props
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
}

const PaymentList = ({
    payments,
    onAddPayment,
    onDeletePayment,
    onLoadMore,
    canLoadMore,
    isLoadingMore,
}: PaymentListProps) => {
  const { hasRole } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            المدفوعات
          </h2>
          <p className="text-muted-foreground">
            عرض جميع المدفوعات المسجلة في النظام.
          </p>
        </div>
        <Button onClick={onAddPayment} className="flex items-center space-x-reverse space-x-2">
          <PlusCircle className="h-4 w-4" />
          <span>إضافة دفعة جديدة</span>
        </Button>
      </div>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">رقم المعاملة</TableHead>
                <TableHead className="text-right">المبلغ المدفوع</TableHead>
                <TableHead className="text-right">الرصيد بعد الدفعة</TableHead>
                <TableHead className="text-right">تاريخ الدفع</TableHead>
                <TableHead className="text-right">طريقة الدفع</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لم يتم العثور على مدفوعات.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.customer?.full_name || 'غير متوفر'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.transaction?.sequence_number || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatCurrency(payment.balance_after)}</TableCell>
                    <TableCell>{formatArabicDate(new Date(payment.payment_date))}</TableCell>
                    <TableCell>{payment.payment_method || 'غير محدد'}</TableCell>
                    <TableCell>
                        {hasRole('admin') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeletePayment(payment.id)}
                                title="حذف الدفعة"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {canLoadMore && onLoadMore && (
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

export default PaymentList;
