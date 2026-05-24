import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getApiBase, setApiBase } from "@/lib/api";
import {
  ShieldCheck, Eye, EyeOff, Lock, User,
  Settings, Check, AlertTriangle, Wifi,
} from "lucide-react";
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

  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBase());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);

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

  function saveApiUrl() {
    const trimmed = apiUrl.trim();
    if (!trimmed) return;
    setApiBase(trimmed);
    setTestResult(null);
    toast({ title: "تم حفظ رابط الـ API", description: trimmed });
  }

  async function testConnection() {
    const trimmed = apiUrl.trim();
    if (!trimmed) return;
    setApiBase(trimmed);
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${trimmed}/api/auth/me`, {
        signal: AbortSignal.timeout(5000),
      });
      setTestResult(res.status === 401 ? "ok" : "ok");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  }

  const presets = [
    { label: "HTTP (ويندوز)", url: "http://localhost:7071" },
    { label: "HTTPS (ماك/لينكس)", url: "https://localhost:7071" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-green-950 to-slate-900" dir="rtl">
      {/* Decorative panel */}
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
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Card className="shadow-2xl border-0 bg-white/98">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">تسجيل الدخول</h2>
              <p className="text-sm text-muted-foreground mt-1">أدخل بياناتك للوصول إلى النظام</p>
            </CardHeader>
            <CardContent className="pb-6">
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

              {/* API Settings toggle */}
              <button
                type="button"
                onClick={() => setShowSettings((s) => !s)}
                className="mt-5 w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-settings"
              >
                <Settings className="w-3.5 h-3.5" />
                إعدادات الاتصال بالـ API
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                  {getApiBase().replace("http://", "").replace("https://", "").split("/")[0]}
                </span>
              </button>
            </CardContent>
          </Card>

          {/* API Settings panel */}
          {showSettings && (
            <Card className="border border-amber-200 bg-amber-50/90 shadow-lg animate-in slide-in-from-top-2">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">إعدادات رابط الـ API</h3>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {presets.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        setApiUrl(p.url);
                        setApiBase(p.url);
                        setTestResult(null);
                      }}
                      className={`text-xs px-3 py-2 rounded-lg border text-right transition-all font-medium ${
                        apiUrl === p.url
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary"
                      }`}
                      data-testid={`button-preset-${p.url.includes("https") ? "https" : "http"}`}
                    >
                      {p.label}
                      <div className="font-mono text-[10px] opacity-70 mt-0.5">{p.url}</div>
                    </button>
                  ))}
                </div>

                {/* Custom URL */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-700">رابط مخصص</Label>
                  <div className="flex gap-2">
                    <Input
                      value={apiUrl}
                      onChange={(e) => {
                        setApiUrl(e.target.value);
                        setTestResult(null);
                      }}
                      placeholder="http://localhost:7071"
                      dir="ltr"
                      className="text-xs h-8 bg-white"
                      data-testid="input-api-url"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 shrink-0"
                      onClick={saveApiUrl}
                      data-testid="button-save-api-url"
                    >
                      حفظ
                    </Button>
                  </div>
                </div>

                {/* Test connection */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={testConnection}
                  disabled={testing}
                  data-testid="button-test-connection"
                >
                  {testing ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      جاري الاختبار...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5" />
                      اختبار الاتصال
                    </span>
                  )}
                </Button>

                {testResult && (
                  <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                    testResult === "ok"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {testResult === "ok" ? (
                      <><Check className="w-3.5 h-3.5 shrink-0" /> الاتصال ناجح — الـ API يستجيب</>
                    ) : (
                      <><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> تعذّر الاتصال — تحقق من تشغيل الـ API</>
                    )}
                  </div>
                )}

                <p className="mt-3 text-[11px] text-amber-600 leading-relaxed">
                  على <strong>ويندوز</strong>: استخدم <code className="bg-amber-100 px-1 rounded">http://</code> مباشرةً بدون إعدادات إضافية.
                  <br />
                  على <strong>ماك/لينكس</strong>: استخدم <code className="bg-amber-100 px-1 rounded">https://</code> بعد قبول شهادة التطوير.
                </p>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-slate-500">
            نظام الهوية الرقمية الليبية — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
