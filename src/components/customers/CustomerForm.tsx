import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Customer } from "@/lib/types";
import { UserPlus, Save } from "lucide-react";

interface CustomerFormProps {
  customer?: Customer;
  onSave: (customer: Omit<Customer, 'id' | 'created_at' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CustomerForm = ({ customer, onSave, onCancel, isLoading }: CustomerFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: customer?.fullName || '',
    mobileNumber: customer?.mobileNumber || '',
    civilId: customer?.civilId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.mobileNumber || !formData.civilId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center space-x-reverse space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>{customer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">الاسم الكامل *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="أدخل الاسم الكامل"
                className="text-right"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="mobileNumber">رقم الهاتف *</Label>
              <Input
                id="mobileNumber"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="أدخل رقم الهاتف"
                className="text-right"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="civilId">الرقم المدني *</Label>
            <Input
              id="civilId"
              value={formData.civilId}
              onChange={(e) => setFormData({ ...formData, civilId: e.target.value })}
              placeholder="أدخل الرقم المدني"
              className="text-right"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-end space-x-reverse space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" className="flex items-center space-x-reverse space-x-2" disabled={isLoading}>
              <Save className="h-4 w-4" />
              <span>{isLoading ? (customer ? 'جاري التحديث...' : 'جاري الحفظ...') : (customer ? "تحديث" : "حفظ")}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerForm;