import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_MESSAGE_TEMPLATE = "عزيزي [CustomerName]،\nنود تذكيركم بأن قسطكم بمبلغ [Amount] دينار كويتي مستحق الدفع.\nالرصيد المتبقي: [Balance] دينار كويتي.\nشكرًا لتعاونكم.";

const SettingsPage = () => {
    const { toast } = useToast();
    const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE_TEMPLATE);

    const addPlusMutation = useMutation({
      mutationFn: async () => {
        const { data, error } = await supabase.rpc('bulk_add_plus_to_phones');
        if (error) throw error;
        return data;
      },
      onSuccess: (data: any) => {
        toast({ title: "نجاح", description: data });
      },
      onError: (error: any) => {
        toast({ title: "خطأ", description: `فشل تحديث أرقام الهواتف: ${error.message}`, variant: "destructive" });
      },
    });

    useEffect(() => {
        const savedTemplate = localStorage.getItem('whatsappMessageTemplate');
        if (savedTemplate) {
            setMessageTemplate(savedTemplate);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('whatsappMessageTemplate', messageTemplate);
        toast({
            title: "تم الحفظ",
            description: "تم حفظ قالب رسالة WhatsApp بنجاح.",
        });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">الإعدادات</h1>
            <Card>
                <CardHeader>
                    <CardTitle>قالب رسالة تذكير WhatsApp</CardTitle>
                    <CardDescription>
                        قم بتخصيص الرسالة التي سيتم إرسالها كتذكير بالدفع. يمكنك استخدام العناصر النائبة التالية:
                        [CustomerName], [Amount], [Balance].
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="message">القالب</Label>
                        <Textarea
                            id="message"
                            value={messageTemplate}
                            onChange={(e) => setMessageTemplate(e.target.value)}
                            rows={6}
                        />
                    </div>
                    <Button onClick={handleSave}>حفظ القالب</Button>
                </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>أدوات البيانات</CardTitle>
                <CardDescription>
                  عمليات لتنظيف وتنسيق البيانات الموجودة في قاعدة البيانات.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">إضافة علامة '+' لأرقام الهواتف</h3>
                    <p className="text-sm text-muted-foreground">
                      يقوم هذا الإجراء بإضافة علامة '+' إلى بداية كل رقم هاتف في جدول العملاء إذا لم تكن موجودة بالفعل.
                    </p>
                  </div>
                  <Button
                    onClick={() => addPlusMutation.mutate()}
                    disabled={addPlusMutation.isPending}
                  >
                    {addPlusMutation.isPending ? 'جاري التحديث...' : 'تشغيل الإجراء'}
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
