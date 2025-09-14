import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

type UserProfile = {
  id: string;
  full_name: string;
  email: string | undefined;
  role: string;
};

const UserManagementPage = () => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Admin-only access check
    if (userRole && userRole !== 'admin') {
      toast({
        variant: "destructive",
        title: "غير مصرح به",
        description: "ليس لديك الإذن للوصول إلى هذه الصفحة.",
      });
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      // Fetch users using the RPC function
      const { data, error } = await supabase.rpc('get_all_users_with_roles');

      if (error) {
        toast({
          variant: "destructive",
          title: "خطأ في جلب المستخدمين",
          description: error.message,
        });
        setUsers([]);
      } else {
        const formattedUsers = data.map(user => ({
          id: user.id,
          full_name: user.full_name,
          role: user.role || 'user',
          email: user.email,
        }));
        setUsers(formattedUsers);
      }
      setIsLoading(false);
    };

    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [user, userRole, navigate, toast]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        toast({ variant: "destructive", title: "Authentication Error", description: "No active session." });
        return;
    }

    const { error } = await supabase.functions.invoke('update-user-role', {
      body: { userId, newRole },
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "فشل تحديث الدور",
        description: error.message,
      });
    } else {
      toast({
        title: "تم تحديث الدور بنجاح",
      });
      // Optimistically update the UI or refetch users
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  if (isLoading) {
    return <div>جاري تحميل المستخدمين...</div>;
  }

  if (userRole !== 'admin') {
    return null; // or a dedicated "Access Denied" component
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">إدارة المستخدمين</h1>
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>تغيير الدور</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={u.role}
                      onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                      disabled={u.id === user?.id} // Prevent admin from changing their own role
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="اختر دوراً" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="staff">موظف</SelectItem>
                        <SelectItem value="user">مستخدم</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;
