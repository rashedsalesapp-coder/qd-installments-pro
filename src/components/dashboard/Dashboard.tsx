import { Users, Receipt, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import StatsCard from "./StatsCard";
import { DashboardStats } from "@/lib/types";

// Sample data - in a real app, this would come from your database
const sampleStats: DashboardStats = {
  totalCustomers: 45,
  totalActiveTransactions: 128,
  totalRevenue: 25000,
  totalOutstanding: 18500,
  totalOverdue: 3200,
  overdueTransactions: 8,
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            لوحة التحكم
          </h2>
          <p className="text-muted-foreground">
            نظرة شاملة على أعمالك المالية
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="إجمالي العملاء"
          value={sampleStats.totalCustomers}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="المعاملات النشطة"
          value={sampleStats.totalActiveTransactions}
          icon={Receipt}
          variant="default"
        />
        <StatsCard
          title="إجمالي الإيرادات"
          value={sampleStats.totalRevenue}
          icon={TrendingUp}
          variant="success"
          isCurrency
        />
        <StatsCard
          title="المبالغ المستحقة"
          value={sampleStats.totalOutstanding}
          icon={DollarSign}
          variant="warning"
          isCurrency
        />
        <StatsCard
          title="المتأخرات"
          value={sampleStats.totalOverdue}
          icon={AlertTriangle}
          variant="danger"
          isCurrency
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <div className="bg-card shadow-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              النشاط الأخير
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div>
                    <p className="font-medium text-foreground">دفعة جديدة</p>
                    <p className="text-sm text-muted-foreground">أحمد محمد - 150.000 د.ك</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">منذ 5 دقائق</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-medium text-foreground">معاملة جديدة</p>
                    <p className="text-sm text-muted-foreground">فاطمة علي - 12 قسط</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">منذ ساعة</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <div>
                    <p className="font-medium text-foreground">تذكير دفع</p>
                    <p className="text-sm text-muted-foreground">محمد سالم - قسط متأخر</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">منذ يومين</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="bg-card shadow-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              إحصائيات سريعة
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">معدل الدفع</span>
                <span className="font-semibold text-success">94.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">المعاملات المتأخرة</span>
                <span className="font-semibold text-danger">{sampleStats.overdueTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">متوسط القسط الشهري</span>
                <span className="font-semibold text-foreground">142.500 د.ك</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">عملاء جدد هذا الشهر</span>
                <span className="font-semibold text-primary">7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;