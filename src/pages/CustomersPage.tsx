import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";
import { Customer } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// --- Supabase API Functions ---
const getCustomers = async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((customer: any) => ({
        ...customer,
        created_at: new Date(customer.created_at),
        alternate_phone: customer.mobile_number2,
    })) as Customer[];
};

const createCustomer = async (customerData: Omit<Customer, "id" | "created_at" | "updatedAt">): Promise<Customer> => {
    const insertData = {
        full_name: customerData.full_name,
        mobile_number: customerData.mobile_number,
        mobile_number2: customerData.alternate_phone || null,
        civil_id: customerData.civil_id || null,
        sequence_number: customerData.sequence_number || null,
    };
    
    const { data, error } = await supabase.from('customers').insert(insertData as any).select().single();
    if (error) throw new Error(error.message);
    return {
        ...data,
        created_at: new Date(data.created_at),
        alternate_phone: data.mobile_number2
    } as Customer;
};

const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    const updateData: any = {
        full_name: customerData.full_name,
        mobile_number: customerData.mobile_number,
        mobile_number2: customerData.alternate_phone || null,
        civil_id: customerData.civil_id || null,
        sequence_number: customerData.sequence_number || null,
    };

    const { data, error } = await supabase.from('customers').update(updateData).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return {
        ...data,
        created_at: new Date(data.created_at),
        alternate_phone: data.mobile_number2
    } as Customer;
};

const deleteCustomer = async (id: string): Promise<void> => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw new Error(error.message);
};
// --- End Supabase API Functions ---

const CustomersPage = () => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: customers, isLoading, error } = useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: getCustomers
    });

    const createMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setShowCustomerForm(false);
            toast({ title: "تم إنشاء العميل بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setShowCustomerForm(false);
            setSelectedCustomer(null);
            toast({ title: "تم تحديث العميل بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({ title: "تم حذف العميل بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const handleSaveCustomer = (customerData: Omit<Customer, "id" | "created_at" | "updatedAt">) => {
        if (selectedCustomer) {
            updateMutation.mutate({ id: selectedCustomer.id, data: customerData });
        } else {
            createMutation.mutate(customerData);
        }
    };

    const handleEditCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowCustomerForm(true);
    };

    const handleDeleteCustomer = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setShowCustomerForm(true);
    };

    if (error) {
        return <div className="text-center text-red-600">خطأ في تحميل البيانات: {(error as Error).message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">إدارة العملاء</h1>
            </div>

            <CustomerList
                customers={customers || []}
                onAddCustomer={handleAddCustomer}
                onEditCustomer={handleEditCustomer}
                onViewCustomer={handleEditCustomer}
            />

            <CustomerForm
                customer={selectedCustomer || undefined}
                onSave={handleSaveCustomer}
                onCancel={() => {
                    setShowCustomerForm(false);
                    setSelectedCustomer(null);
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};

export default CustomersPage;