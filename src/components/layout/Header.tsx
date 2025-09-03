import { NavLink, useNavigate } from "react-router-dom";
import { Calculator, Users, Receipt, LogOut, Upload, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAKE_AUTH_TOKEN } from "@/pages/LoginPage";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    FAKE_AUTH_TOKEN = null;
    navigate("/login");
  };

  const navigationItems = [
    { to: '/dashboard', label: 'لوحة التحكم', icon: Calculator },
    { to: '/customers', label: 'العملاء', icon: Users },
    { to: '/transactions', label: 'المعاملات', icon: Receipt },
    { to: '/import', label: 'استيراد', icon: Upload },
    { to: '/reports', label: 'التقارير', icon: FileText },
    { to: '/settings', label: 'الإعدادات', icon: Settings },
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
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;