import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Customer } from "@/lib/types";
import { formatArabicDate } from "@/lib/utils-arabic";
import { Search, Edit, Eye, UserPlus } from "lucide-react";

interface CustomerListProps {
  customers: Customer[];
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onViewCustomer: (customer: Customer) => void;
}

const CustomerList = ({ customers, onAddCustomer, onEditCustomer, onViewCustomer }: CustomerListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobileNumber.includes(searchTerm) ||
    customer.civilId.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            إدارة العملاء
          </h2>
          <p className="text-muted-foreground">
            إضافة وإدارة بيانات العملاء
          </p>
        </div>
        <Button onClick={onAddCustomer} className="flex items-center space-x-reverse space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>إضافة عميل جديد</span>
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو الهاتف أو الرقم المدني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم العميل</TableHead>
                <TableHead className="text-right">الاسم الكامل</TableHead>
                <TableHead className="text-right">رقم الهاتف</TableHead>
                <TableHead className="text-right">الرقم المدني</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا توجد عملاء مطابقون للبحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{customer.id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {customer.fullName}
                    </TableCell>
                    <TableCell>{customer.mobileNumber}</TableCell>
                    <TableCell>{customer.civilId}</TableCell>
                    <TableCell>{formatArabicDate(customer.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditCustomer(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerList;