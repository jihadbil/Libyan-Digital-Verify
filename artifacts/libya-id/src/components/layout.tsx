import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ShieldCheck,
  ScrollText,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/citizens", icon: Users, label: "المواطنون" },
  { href: "/institutions", icon: Building2, label: "المؤسسات" },
  { href: "/documents", icon: FileText, label: "الوثائق" },
  { href: "/verification", icon: ShieldCheck, label: "طلبات التحقق" },
  { href: "/audit", icon: ScrollText, label: "سجل الأحداث" },
  { href: "/notifications", icon: Bell, label: "الإشعارات" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast({ title: "تم تسجيل الخروج بنجاح" });
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "h-full flex flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border",
        !mobile && (collapsed ? "w-16" : "w-64"),
        "transition-all duration-200"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
        collapsed && !mobile ? "justify-center px-2" : ""
      )}>
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-tight">منظومة الهوية</p>
            <p className="text-xs text-sidebar-foreground/60">الرقمية الليبية</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium",
                  collapsed && !mobile ? "justify-center px-2" : "",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                data-testid={`nav-${href.replace("/", "") || "home"}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(!collapsed || mobile) && <span>{label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn(
        "border-t border-sidebar-border px-2 py-3",
        collapsed && !mobile ? "px-1" : ""
      )}>
        {(!collapsed || mobile) && (
          <div className="px-2 mb-2">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.username}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && !mobile ? "justify-center px-2" : "justify-start gap-2"
          )}
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          {(!collapsed || mobile) && "تسجيل الخروج"}
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        <Sidebar />
        <button
          className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-sidebar-border border border-sidebar-border flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors z-10"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="button-toggle-sidebar"
        >
          <ChevronLeft className={cn("w-3 h-3 transition-transform", !collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 md:hidden transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Sidebar mobile />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted"
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">منظومة الهوية الرقمية</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
