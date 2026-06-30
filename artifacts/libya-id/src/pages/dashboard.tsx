import { useQuery } from "@tanstack/react-query";
import { citizensApi, institutionsApi, verificationApi, auditApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, userTypeLabels } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Building2, ShieldCheck, ScrollText,
  CheckCircle, XCircle, Clock, TrendingUp,
} from "lucide-react";
import { Link } from "wouter";

function StatCard({
  title, value, icon: Icon, color, sub,
}: {
  title: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace("text-", "bg-").replace("-600", "-100")}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: citizens } = useQuery({
    queryKey: ["citizens"],
    queryFn: citizensApi.list,
  });

  const { data: institutions } = useQuery({
    queryKey: ["institutions"],
    queryFn: institutionsApi.list,
  });

  const { data: pendingVerifications } = useQuery({
    queryKey: ["verification", "pending"],
    queryFn: verificationApi.getPending,
  });

  const { data: recentAudit } = useQuery({
    queryKey: ["audit", "failed"],
    queryFn: () => auditApi.getFailed(),
  });

  const activeCitizens = citizens?.filter((c) => c.status === "Active") ?? [];
  const suspendedCitizens = citizens?.filter((c) => c.status === "Suspended") ?? [];
  const activeInstitutions = institutions?.filter((i) => i.isActive) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          مرحباً، {user?.fullName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {userTypeLabels[user?.userType ?? ""] ?? user?.userType} — لوحة التحكم الرئيسية
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المواطنين"
          value={citizens?.length ?? "—"}
          icon={Users}
          color="text-blue-600"
          sub={`${activeCitizens.length} مفعّل`}
        />
        <StatCard
          title="المؤسسات النشطة"
          value={activeInstitutions.length}
          icon={Building2}
          color="text-green-600"
          sub={`${institutions?.length ?? 0} إجمالي`}
        />
        <StatCard
          title="طلبات التحقق المعلقة"
          value={pendingVerifications?.length ?? "—"}
          icon={ShieldCheck}
          color="text-yellow-600"
          sub="بانتظار المعالجة"
        />
        <StatCard
          title="المواطنون الموقوفون"
          value={suspendedCitizens.length}
          icon={XCircle}
          color="text-red-600"
          sub="حسابات موقوفة"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              طلبات التحقق المعلقة
            </CardTitle>
            <Link href="/verification">
              <span className="text-xs text-primary hover:underline cursor-pointer">عرض الكل</span>
            </Link>
          </CardHeader>
          <CardContent>
            {!pendingVerifications || pendingVerifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-sm">لا توجد طلبات معلقة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingVerifications.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-sm"
                    data-testid={`card-verification-${v.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs text-muted-foreground font-mono">{v.id.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(v.createdAt)}</p>
                    </div>
                    <Badge className="text-yellow-700 bg-yellow-50 border-yellow-200 border">معلق</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Failed Audit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-red-600" />
              أحداث الفشل الأخيرة
            </CardTitle>
            <Link href="/audit">
              <span className="text-xs text-primary hover:underline cursor-pointer">عرض الكل</span>
            </Link>
          </CardHeader>
          <CardContent>
            {!recentAudit || recentAudit.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-sm">لا توجد أحداث فشل</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAudit.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-red-50/50 border-red-100 text-sm"
                    data-testid={`card-audit-${log.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-red-700">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">فشل</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Citizens status breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              توزيع حالات المواطنين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "مفعّل", key: "Active", color: "bg-green-500", textColor: "text-green-700" },
                { label: "في انتظار التفعيل", key: "PendingActivation", color: "bg-yellow-500", textColor: "text-yellow-700" },
                { label: "موقوف", key: "Suspended", color: "bg-orange-500", textColor: "text-orange-700" },
                { label: "ملغى", key: "Revoked", color: "bg-red-500", textColor: "text-red-700" },
              ].map(({ label, key, color, textColor }) => {
                const count = citizens?.filter((c) => c.status === key).length ?? 0;
                const total = citizens?.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${textColor}`}>{label}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Institutions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-600" />
              أحدث المؤسسات
            </CardTitle>
            <Link href="/institutions">
              <span className="text-xs text-primary hover:underline cursor-pointer">عرض الكل</span>
            </Link>
          </CardHeader>
          <CardContent>
            {!institutions || institutions.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">لا توجد مؤسسات</p>
            ) : (
              <div className="space-y-2">
                {institutions.slice(0, 5).map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between p-3 rounded-lg border text-sm"
                    data-testid={`card-institution-${inst.id}`}
                  >
                    <div>
                      <p className="font-medium">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">{inst.type}</p>
                    </div>
                    <Badge variant={inst.isActive ? "default" : "secondary"}>
                      {inst.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
