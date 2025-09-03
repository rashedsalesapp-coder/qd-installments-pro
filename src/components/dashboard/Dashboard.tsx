import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Receipt, DollarSign, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import StatsCard from "./StatsCard";
import { DashboardStats } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

// --- Supabase API Functions ---
const getDashboardStats = async (): Promise<DashboardStats> => {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) throw new Error(error.message);
    return data as DashboardStats;
};

const checkOverdueTransactions = async (): Promise<{ message: string }> => {
    const { data, error } = await supabase.rpc('check_overdue_transactions');
    if (error) throw new Error(error.message);
    return { message: data };
};
// --- End Supabase API Functions ---

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats
  });

  const overdueMutation = useMutation({
    mutationFn: checkOverdueTransactions,
    onSuccess: (data) => {
        toast({ title: "Success", description: data.message });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const chartData = [
    { name: 'المالية', 'إجمالي الإيرادات': stats?.totalRevenue || 0, 'المبالغ المستحقة': stats?.totalOutstanding || 0 },
  ];

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-1/4" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="col-span-4 h-80" />
                <Skeleton className="col-span-3 h-80" />
            </div>
        </div>
    )
  }

  if (!stats) return <div>No stats available.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">لوحة التحكم</h2>
          <p className="text-muted-foreground">نظرة شاملة على أعمالك المالية</p>
        </div>
        <Button onClick={() => overdueMutation.mutate()} disabled={overdueMutation.isPending}>
            <RefreshCw className={`ml-2 h-4 w-4 ${overdueMutation.isPending ? 'animate-spin' : ''}`} />
            {overdueMutation.isPending ? 'جاري الفحص...' : 'فحص المتأخرات'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="إجمالي العملاء" value={stats.totalCustomers} icon={Users} />
        <StatsCard title="المعاملات النشطة" value={stats.totalActiveTransactions} icon={Receipt} />
        <StatsCard title="إجمالي الإيرادات" value={stats.totalRevenue} icon={TrendingUp} variant="success" isCurrency />
        <StatsCard title="المبالغ المستحقة" value={stats.totalOutstanding} icon={DollarSign} variant="warning" isCurrency />
        <StatsCard title="المتأخرات" value={stats.totalOverdue} icon={AlertTriangle} variant="danger" isCurrency />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 bg-card shadow-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">نظرة عامة على الإيرادات</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('ar-KW', { style: 'currency', currency: 'KWD' }).format(value)} />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('ar-KW', { style: 'currency', currency: 'KWD' }).format(value as number)} />
                    <Legend />
                    <Bar dataKey="إجمالي الإيرادات" fill="#16a34a" />
                    <Bar dataKey="المبالغ المستحقة" fill="#f97316" />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="col-span-3 bg-card shadow-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">إحصائيات سريعة</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">معدل التحصيل</span>
                <span className="font-semibold text-success">
                    {stats.totalRevenue > 0 ? `${(((stats.totalRevenue - stats.totalOutstanding) / stats.totalRevenue) * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">المعاملات المتأخرة</span>
                <span className="font-semibold text-danger">{stats.overdueTransactions}</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;