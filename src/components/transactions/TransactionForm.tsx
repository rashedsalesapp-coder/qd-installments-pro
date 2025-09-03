import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Transaction, Customer } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface TransactionFormProps {
  transaction?: Transaction;
  customers: Customer[];
  onSave: (transaction: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TransactionForm = ({ transaction, customers, onSave, onCancel, isLoading }: TransactionFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerId: transaction?.customerId || "",
    transactionDate: transaction?.transactionDate ? new Date(transaction.transactionDate) : new Date(),
    totalInstallments: transaction?.totalInstallments || 12,
    installmentAmount: transaction?.installmentAmount || 0,
    firstInstallmentDate: transaction?.firstInstallmentDate ? new Date(transaction.firstInstallmentDate) : new Date(),
    legalCase: transaction?.legalCase || false,
    legalCaseDetails: transaction?.legalCaseDetails || "",
    courtCollectionData: transaction?.courtCollectionData || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.transactionDate || !formData.totalInstallments || !formData.installmentAmount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة بشكل صحيح",
        variant: "destructive",
      });
      return;
    }
    // Convert dates to ISO string for Supabase
    const dataToSave = {
        ...formData,
        transactionDate: formData.transactionDate.toISOString().split('T')[0],
        firstInstallmentDate: formData.firstInstallmentDate.toISOString().split('T')[0],
    };
    onSave(dataToSave);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{transaction ? "تعديل المعاملة" : "إضافة معاملة جديدة"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerId">العميل *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                disabled={isLoading || !!transaction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionDate">تاريخ المعاملة *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal")} disabled={isLoading}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(formData.transactionDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.transactionDate} onSelect={(d) => d && setFormData({...formData, transactionDate: d})} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="totalInstallments">عدد الأقساط *</Label>
              <Input type="number" value={formData.totalInstallments} onChange={(e) => setFormData({ ...formData, totalInstallments: +e.target.value })} disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="installmentAmount">مبلغ القسط الشهري *</Label>
              <Input type="number" step="0.001" value={formData.installmentAmount} onChange={(e) => setFormData({ ...formData, installmentAmount: +e.target.value })} disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="firstInstallmentDueDate">تاريخ أول قسط *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal")} disabled={isLoading}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(formData.firstInstallmentDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.firstInstallmentDate} onSelect={(d) => d && setFormData({...formData, firstInstallmentDate: d})} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">إجراءات قانونية</h3>
            <div className="flex items-center space-x-2">
              <Switch id="legal-case" checked={formData.legalCase} onCheckedChange={(checked) => setFormData({ ...formData, legalCase: checked })} disabled={isLoading} />
              <Label htmlFor="legal-case">تم رفع قضية قانونية</Label>
            </div>
          </div>

          {formData.legalCase && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="legalCaseDetails">تفاصيل القضية</Label>
                <Textarea id="legalCaseDetails" value={formData.legalCaseDetails} onChange={(e) => setFormData({ ...formData, legalCaseDetails: e.target.value })} disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="courtCollectionData">بيانات تحصيل المحكمة</Label>
                <Textarea id="courtCollectionData" value={formData.courtCollectionData} onChange={(e) => setFormData({ ...formData, courtCollectionData: e.target.value })} disabled={isLoading} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>إلغاء</Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
