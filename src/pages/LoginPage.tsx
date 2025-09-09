import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

const LoginPage = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@1");
  const [signupEmail, setSignupEmail] = useState("admin@example.com");
  const [signupPassword, setSignupPassword] = useState("Admin@1");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      if (data.user) {
        // Set up as admin user
        const { error: setupError } = await supabase.rpc('setup_admin_user', {
          user_id: data.user.id,
          user_email: signupEmail
        });

        if (setupError) {
          console.error('Error setting up admin:', setupError);
        }

        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "تم إنشاء حساب المدير الأول بنجاح",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء الحساب",
        description: error.message,
      });
    }

    setIsLoading(false);
  };
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl">نظام إدارة المبيعات</CardTitle>
          <CardDescription>
            سجل دخولك أو أنشئ حساب المدير الأول
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="signup">إنشاء حساب المدير</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
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
                    placeholder="admin@example.com"
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
                    placeholder="Admin@1"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2 text-right">
                  <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="text-right"
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="grid gap-2 text-right">
                  <Label htmlFor="signup-password">كلمة المرور</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="text-right"
                    placeholder="Admin@1"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-right">
                  سيتم إنشاء أول حساب مدير في النظام
                </p>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب المدير"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
