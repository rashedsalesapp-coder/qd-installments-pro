import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Payment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils-arabic";

interface PaymentListProps {
  payments: Payment[];
}

const PaymentList = ({ payments }: PaymentListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل المدفوعات</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العميل</TableHead>
              <TableHead>رقم المعاملة</TableHead>
              <TableHead>المبلغ المدفوع</TableHead>
              <TableHead>الرصيد المتبقي بعد الدفعة</TableHead>
              <TableHead>تاريخ الدفع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.customer?.full_name || 'غير متوفر'}</TableCell>
                <TableCell>{payment.transaction?.sequence_number || 'غير متوفر'}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{formatCurrency(payment.balance_after)}</TableCell>
                <TableCell>{formatDate(new Date(payment.payment_date))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentList;
