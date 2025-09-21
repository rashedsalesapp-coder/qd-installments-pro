import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, TrendingDown, UserX } from 'lucide-react';

const AIInsights = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            العملاء عالي المخاطر
          </CardTitle>
          <CardDescription>
            تحميل بيانات...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>جاري تحميل البيانات...</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-warning" />
            تنبؤات التأخر في السداد
          </CardTitle>
          <CardDescription>
            تحميل بيانات...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>جاري تحميل البيانات...</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            تحليلات الذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            تحميل بيانات...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>جاري تحميل البيانات...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
