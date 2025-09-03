import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
  onSave: (transaction: any) => void; // Simplified for this step
  onCancel: () => void;
  isLoading: boolean;
}

const TransactionForm = ({ transaction, customers, onSave, onCancel, isLoading }: TransactionFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerId: transaction?.customerId || "",
    transactionDate: transaction?.transactionDate || new Date(),
    totalInstallments: transaction?.totalInstallments || 12,
    monthlyInstallmentAmount: transaction?.monthlyInstallmentAmount || 0,
    firstInstallmentDueDate: transaction?.firstInstallmentDueDate || new Date(),
    hasLegalCase: transaction?.hasLegalCase || false,
    legalCaseDetails: transaction?.legalCaseDetails || "",
    courtCollectionData: transaction?.courtCollectionData || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.transactionDate || formData.totalInstallments <= 0 || formData.monthlyInstallmentAmount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة بشكل صحيح",
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
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
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-right font-normal", !formData.transactionDate && "text-muted-foreground")}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.transactionDate ? format(formData.transactionDate, "PPP") : <span>اختر تاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.transactionDate}
                    onSelect={(date) => setFormData({ ...formData, transactionDate: date || new Date() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="totalInstallments">عدد الأقساط *</Label>
              <Input
                id="totalInstallments"
                type="number"
                value={formData.totalInstallments}
                onChange={(e) => setFormData({ ...formData, totalInstallments: +e.target.value })}
                placeholder="أدخل عدد الأقساط"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="monthlyInstallmentAmount">مبلغ القسط الشهري *</Label>
              <Input
                id="monthlyInstallmentAmount"
                type="number"
                value={formData.monthlyInstallmentAmount}
                onChange={(e) => setFormData({ ...formData, monthlyInstallmentAmount: +e.target.value })}
                placeholder="أدخل مبلغ القسط"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="firstInstallmentDueDate">تاريخ أول قسط *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-right font-normal", !formData.firstInstallmentDueDate && "text-muted-foreground")}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.firstInstallmentDueDate ? format(formData.firstInstallmentDueDate, "PPP") : <span>اختر تاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.firstInstallmentDueDate}
                    onSelect={(date) => setFormData({ ...formData, firstInstallmentDueDate: date || new Date() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">إجراءات قانونية</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="legal-case"
                checked={formData.hasLegalCase}
                onCheckedChange={(checked) => setFormData({ ...formData, hasLegalCase: checked })}
                disabled={isLoading}
              />
              <Label htmlFor="legal-case">تم رفع قضية قانونية</Label>
            </div>
          </div>

          {formData.hasLegalCase && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="legalCaseDetails">تفاصيل القضية</Label>
                <Textarea
                  id="legalCaseDetails"
                  value={formData.legalCaseDetails}
                  onChange={(e) => setFormData({ ...formData, legalCaseDetails: e.target.value })}
                  placeholder="أدخل تفاصيل القضية"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="courtCollectionData">بيانات تحصيل المحكمة</Label>
                <Textarea
                  id="courtCollectionData"
                  value={formData.courtCollectionData}
                  onChange={(e) => setFormData({ ...formData, courtCollectionData: e.target.value })}
                  placeholder="أدخل بيانات تحصيل المحكمة"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              إلغاء
            </Button>
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
