import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, PlusCircle, Users } from 'lucide-react';
import { UserForm } from './UserForm';

export interface UserRoleInfo {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// API function to fetch users and their roles from the view
const getUsers = async (): Promise<UserRoleInfo[]> => {
  const { data, error } = await supabase.from('user_roles_view').select('*');
  if (error) throw new Error(error.message);
  return data as UserRoleInfo[];
};

const UserList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRoleInfo | undefined>(undefined);

  const { data: users, isLoading, isError, error } = useQuery<UserRoleInfo[]>({
    queryKey: ['user_roles'],
    queryFn: getUsers,
  });

  const handleCreateUser = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const handleEditRole = (user: UserRoleInfo) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              إدارة المستخدمين
            </h2>
            <p className="text-muted-foreground">
              إنشاء مستخدمين جدد وتعديل صلاحياتهم.
            </p>
          </div>
          <Button onClick={handleCreateUser} className="flex items-center space-x-reverse space-x-2">
            <PlusCircle className="h-4 w-4" />
            <span>إنشاء مستخدم جديد</span>
          </Button>
        </div>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              قائمة المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      جاري تحميل المستخدمين...
                    </TableCell>
                  </TableRow>
                )}
                {isError && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-destructive">
                      حدث خطأ أثناء تحميل المستخدمين: {error.message}
                    </TableCell>
                  </TableRow>
                )}
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRole(user)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">تعديل الصلاحية</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {isFormOpen && (
        <UserForm
          mode={editingUser ? 'edit' : 'create'}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(undefined);
          }}
          user={editingUser}
        />
      )}
    </>
  );
};

export default UserList;
