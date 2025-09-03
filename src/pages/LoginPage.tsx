import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// In a real app, you would have a more robust auth system (e.g., context, tokens)
// For now, we'll use a simple in-memory flag.
// This should be replaced with a proper auth provider.
export let FAKE_AUTH_TOKEN: string | null = null;

const LoginPage = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // In a real app, you'd make an API call here.
    // Simulating API call with a delay.
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mocking the login logic since the backend isn't running.
    // In a real scenario, you'd get a token from the backend.
    if (username === "admin" && password === "admin") {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحبا بعودتك!",
      });
      FAKE_AUTH_TOKEN = "supersecrettoken"; // Fake token
      navigate("/");
    } else {
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة.",
      });
      FAKE_AUTH_TOKEN = null;
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل اسم المستخدم وكلمة المرور للوصول إلى حسابك.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-right">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
