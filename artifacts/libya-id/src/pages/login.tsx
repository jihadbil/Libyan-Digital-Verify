import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Eye, EyeOff, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: err instanceof Error ? err.message : "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-green-950 to-slate-900" dir="rtl">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-green-400" />
          <div className="absolute top-32 right-32 w-48 h-48 rounded-full border border-green-400" />
          <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full border border-green-400" />
          <div className="absolute -bottom-10 left-10 w-64 h-64 rounded-full border border-yellow-400" />
        </div>
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="w-24 h-24 rounded-2xl bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            منظومة الهوية الرقمية
            <br />
            <span className="text-green-400">الليبية</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            نظام متكامل للتحقق من الهوية وإدارة الوثائق الرسمية للمواطنين الليبيين
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { num: "100%", label: "آمن" },
              { num: "24/7", label: "متاح دائماً" },
              { num: "سريع", label: "معالجة فورية" },
            ].map(({ num, label }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-green-400 font-bold text-xl">{num}</div>
                <div className="text-slate-400 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8">
        <Card className="w-full max-w-sm shadow-2xl border-0 bg-white/98">
          <CardHeader className="text-center pb-4 pt-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">تسجيل الدخول</h2>
            <p className="text-sm text-muted-foreground mt-1">أدخل بياناتك للوصول إلى النظام</p>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pr-9"
                    dir="ltr"
                    data-testid="input-username"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-9 pl-9"
                    dir="ltr"
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading || !username || !password}
                data-testid="button-submit-login"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              نظام الهوية الرقمية الليبية — جميع الحقوق محفوظة
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
