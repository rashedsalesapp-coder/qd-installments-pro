import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Transaction, ExportRow } from '@/lib/types';
import * as XLSX from 'xlsx';
import { format, setDate, addMonths } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

// --- Supabase API Function ---
const getReportableTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select(`*, customers (fullName, mobileNumber)`)
        .gt('remainingBalance', 0)
        .eq('legalCase', false);

    if (error) throw new Error(error.message);

    return data.map((t: any) => ({
        ...t,
        customerName: t.customers?.fullName || 'Unknown',
        mobileNumber: t.customers?.mobileNumber || '',
    }));
};
// --- End Supabase API Function ---

const ReportsPage = () => {
    const { toast } = useToast();
    const { data: transactions, isLoading } = useQuery<Transaction[]>({
        queryKey: ['reportableTransactions'],
        queryFn: getReportableTransactions
    });

    const generateReport = () => {
        if (!transactions) {
            toast({ title: "لا توجد بيانات للتصدير", variant: "destructive" });
            return;
        }

        const reportData = transactions.map(t => {
            const now = new Date();
            const transactionDate = format(new Date(t.transactiondate), 'yyyy-MM-dd');
            const mobileNumber = t.mobileNumber || '';
            const dueDate = format(setDate(now, 20), 'dd/MM/yyyy');
            const expiryDate = format(addMonths(now, 2), 'yyyy-MM-dd');

            const installmentNumber = (t.totalinstallments - Math.floor(t.remainingbalance / t.installmentamount)) + 1;

            return {
                description: `${t.id.substring(0, 8)} - ${transactionDate} - ${t.installmentamount}`,
                amount: t.installmentamount,
                firstName: t.customerName,
                lastName: '',
                emailAddress: 'email@mail.com',
                mobileNumber: mobileNumber.startsWith('965') ? mobileNumber : `965${mobileNumber}`,
                dueDate: dueDate,
                reference: t.id,
                notes: `Installment ${installmentNumber}`,
                expiry: expiryDate
            };
        });

        const headers = [
            'Description', 'Amount', 'First Name', 'Last Name', 'Email Address',
            'Mobile Number', 'Due Date', 'Reference', 'Notes', 'Expiry'
        ];
        const worksheet = XLSX.utils.json_to_sheet(reportData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
        XLSX.writeFile(workbook, `Monthly_Payment_Report_${format(new Date(), 'yyyy_MM')}.xlsx`);

        toast({ title: "تم إنشاء التقرير", description: "تم تنزيل التقرير بنجاح." });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">إنشاء التقارير</h1>
            <div className="p-4 border rounded-lg bg-card">
                <h2 className="text-xl font-semibold mb-2">تقرير الدفع الشهري</h2>
                <p className="text-muted-foreground mb-4">
                    قم بإنشاء وتنزيل تقرير الدفع الشهري بتنسيق Excel متوافق مع خدمة الدفع عبر الإنترنت.
                </p>
                <Button onClick={generateReport} disabled={isLoading || !transactions || transactions.length === 0}>
                    {isLoading ? 'جاري تحميل البيانات...' : 'إنشاء وتنزيل التقرير'}
                </Button>
                {transactions && transactions.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground mt-2">
                        لا توجد معاملات قابلة للتصدير حاليًا.
                    </p>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
