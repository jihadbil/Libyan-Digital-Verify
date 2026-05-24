import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="text-8xl font-bold text-muted-foreground/20 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground mb-6">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
      <Link href="/">
        <Button>
          <Home className="w-4 h-4 ml-2" />
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}
