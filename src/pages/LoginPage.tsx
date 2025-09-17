import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

const LoginPage = () => {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminReset, setShowAdminReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: error.message,
      });
    } else {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبا بعودتك!",
      });
      navigate("/");
    }

    setIsLoading(false);
  };

  const createEmergencyAdmin = async () => {
    setIsLoading(true);
    
    // Create emergency admin account
    const { data, error } = await supabase.auth.signUp({
      email: "admin@system.local",
      password: "Admin123!@#",
      options: {
        data: {
          full_name: "مدير النظام",
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء حساب المدير",
        description: error.message,
      });
    } else {
      toast({
        title: "تم إنشاء حساب المدير الطارئ",
        description: "البريد: admin@system.local | كلمة المرور: Admin123!@#",
      });
      setEmail("admin@system.local");
      setPassword("Admin123!@#");
      setShowAdminReset(false);
    }
    
    setIsLoading(false);
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-right">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
            <div className="text-sm">
              ليس لديك حساب؟{" "}
              <Link to="/register" className="underline">
                إنشاء حساب
              </Link>
            </div>
            <div className="text-sm border-t pt-4">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAdminReset(!showAdminReset)}
                className="w-full"
              >
                نسيت بيانات المدير؟
              </Button>
              {showAdminReset && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-xs mb-2">إنشاء حساب مدير طارئ:</p>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={createEmergencyAdmin}
                    disabled={isLoading}
                    className="w-full"
                  >
                    إنشاء حساب مدير طارئ
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
