import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserRoleInfo } from "./UserList";

// Define Zod schemas for validation
const createUserSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
  role: z.enum(["admin", "user"]),
});

const editUserSchema = z.object({
  role: z.enum(["admin", "user"]),
});

interface UserFormProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  user?: UserRoleInfo;
}

// --- API Functions ---
const createUser = async (values: z.infer<typeof createUserSchema>) => {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email: values.email, password: values.password, role: values.role },
  });
  if (error) throw error;
  return data;
};

const updateUserRole = async ({ userId, role }: { userId: string, role: 'admin' | 'user' }) => {
  const { error } = await supabase.rpc('update_user_role', {
    p_user_id: userId,
    p_new_role: role,
  });
  if (error) throw error;
};
// --- End API Functions ---

export const UserForm = ({ mode, isOpen, onClose, user }: UserFormProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditMode = mode === 'edit';

  const form = useForm({
    resolver: zodResolver(isEditMode ? editUserSchema : createUserSchema),
    defaultValues: isEditMode
      ? { role: user?.role || 'user' }
      : { email: "", password: "", role: "user" },
  });

  const mutation = useMutation({
    mutationFn: isEditMode ? updateUserRole : createUser,
    onSuccess: () => {
      toast({ title: `تم ${isEditMode ? 'تحديث' : 'إنشاء'} المستخدم بنجاح` });
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

   const onSubmit = (values: any) => {
     if (isEditMode && user) {
         mutation.mutate({ userId: user.id, role: values.role });
     } else {
         mutation.mutate(values);
     }
   };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'تعديل صلاحية المستخدم' : 'إنشاء مستخدم جديد'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `تعديل صلاحية المستخدم ${user?.email}` : 'أدخل تفاصيل المستخدم الجديد.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!isEditMode && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl><Input placeholder="user@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الصلاحية</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                إلغاء
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
