import { useState } from "react";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/dashboard/Dashboard";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";
import { Customer } from "@/lib/types";

// Sample data - in a real app, this would come from your database
const sampleCustomers: Customer[] = [
  {
    id: "CUS240001",
    fullName: "أحمد محمد الخالد",
    mobileNumber: "96599887766",
    civilId: "289123456789",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "CUS240002",
    fullName: "فاطمة علي السالم",
    mobileNumber: "96566778899",
    civilId: "289987654321",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
];

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const handleSaveCustomer = (customer: Customer) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
    } else {
      setCustomers([...customers, customer]);
    }
    setShowCustomerForm(false);
    setEditingCustomer(undefined);
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

  const renderCurrentPage = () => {
    if (showCustomerForm) {
      return (
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setShowCustomerForm(false);
            setEditingCustomer(undefined);
          }}
        />
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "customers":
        return (
          <CustomerList
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
            onViewCustomer={handleViewCustomer}
          />
        );
      case "transactions":
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-lg">
              إدارة المعاملات - قريباً
            </p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="container mx-auto px-6 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;