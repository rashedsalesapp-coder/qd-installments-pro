import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";
import { Customer } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { getCustomers, addCustomer, updateCustomer } from "@/lib/localApi";

const CustomersPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const { data: customers, isLoading, isError } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const addMutation = useMutation({
    mutationFn: addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowCustomerForm(false);
      toast({ title: "تم إضافة العميل", description: "تمت إضافة العميل الجديد بنجاح." });
    },
    onError: () => {
        toast({ variant: "destructive", title: "خطأ", description: "فشل في إضافة العميل." });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowCustomerForm(false);
      setEditingCustomer(undefined);
      toast({ title: "تم تحديث العميل", description: "تم تحديث بيانات العميل بنجاح." });
    },
    onError: () => {
        toast({ variant: "destructive", title: "خطأ", description: "فشل في تحديث العميل." });
    }
  });

  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCustomer) {
        updateMutation.mutate({ ...customerData, id: editingCustomer.id, createdAt: editingCustomer.createdAt, updatedAt: editingCustomer.updatedAt });
    } else {
        addMutation.mutate(customerData);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(undefined);
    setShowCustomerForm(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    // TODO: Implement customer detail view
    console.log("View customer:", customer);
  };

  if (isLoading) return <div>جاري تحميل العملاء...</div>;
  if (isError) return <div>خطأ في تحميل العملاء</div>;

  if (showCustomerForm) {
    return (
      <CustomerForm
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        onCancel={() => {
          setShowCustomerForm(false);
          setEditingCustomer(undefined);
        }}
        isLoading={addMutation.isPending || updateMutation.isPending}
      />
    );
  }

  return (
    <CustomerList
      customers={customers || []}
      onAddCustomer={handleAddCustomer}
      onEditCustomer={handleEditCustomer}
      onViewCustomer={handleViewCustomer}
    />
  );
};

export default CustomersPage;
