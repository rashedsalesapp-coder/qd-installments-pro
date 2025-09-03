import { Calculator, Users, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Header = ({ currentPage, onPageChange }: HeaderProps) => {
  const navigationItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Calculator },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'transactions', label: 'المعاملات', icon: Receipt },
  ];

  return (
    <header className="bg-card shadow-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="gradient-primary w-10 h-10 rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                نظام إدارة المبيعات بالتقسيط
              </h1>
              <p className="text-sm text-muted-foreground">
                إدارة شاملة للمبيعات والعملاء
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-reverse space-x-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onPageChange(item.id)}
                  className="flex items-center space-x-reverse space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;