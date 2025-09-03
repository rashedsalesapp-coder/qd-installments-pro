import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/lib/types";
import { generateCustomerId } from "@/lib/utils-arabic";
import { UserPlus, Save } from "lucide-react";

interface CustomerFormProps {
  customer?: Customer;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

const CustomerForm = ({ customer, onSave, onCancel }: CustomerFormProps) => {
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

    const customerData: Customer = {
      id: customer?.id || generateCustomerId(),
      fullName: formData.fullName,
      mobileNumber: formData.mobileNumber,
      civilId: formData.civilId,
      createdAt: customer?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(customerData);
    
    toast({
      title: "تم الحفظ",
      description: customer ? "تم تحديث بيانات العميل بنجاح" : "تم إضافة العميل الجديد بنجاح",
    });
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
            />
          </div>

          <div className="flex items-center justify-end space-x-reverse space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button type="submit" className="flex items-center space-x-reverse space-x-2">
              <Save className="h-4 w-4" />
              <span>{customer ? "تحديث" : "حفظ"}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerForm;