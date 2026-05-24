import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/api";
import { auditActionLabels, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, CheckCircle, XCircle } from "lucide-react";

const auditActions = [
  { value: "1", label: "تسجيل دخول" },
  { value: "2", label: "فشل تسجيل الدخول" },
  { value: "3", label: "التحقق من الوجه" },
  { value: "4", label: "فشل التحقق من الوجه" },
  { value: "5", label: "إرسال OTP" },
  { value: "6", label: "التحقق من OTP" },
  { value: "7", label: "فشل OTP" },
  { value: "8", label: "تحقق الهوية" },
  { value: "9", label: "إصدار وثيقة" },
  { value: "10", label: "التحقق من وثيقة" },
  { value: "11", label: "تعليق الحساب" },
  { value: "12", label: "تفعيل الحساب" },
  { value: "13", label: "تسجيل الوجه" },
  { value: "14", label: "استيراد جماعي" },
];

export default function AuditPage() {
  const [filterType, setFilterType] = useState<"failed" | "citizen" | "user" | "ip" | "date">("failed");
  const [citizenId, setCitizenId] = useState("");
  const [userId, setUserId] = useState("");
  const [ip, setIp] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: failedLogs, isLoading: loadingFailed } = useQuery({
    queryKey: ["audit", "failed"],
    queryFn: () => auditApi.getFailed(),
    enabled: filterType === "failed",
  });

  const { data: citizenLogs, isLoading: loadingCitizen } = useQuery({
    queryKey: ["audit", "citizen", citizenId],
    queryFn: () => auditApi.getByCitizen(citizenId),
    enabled: filterType === "citizen" && citizenId.length === 36,
  });

  const { data: userLogs, isLoading: loadingUser } = useQuery({
    queryKey: ["audit", "user", userId],
    queryFn: () => auditApi.getByUser(userId),
    enabled: filterType === "user" && userId.length === 36,
  });

  const { data: ipLogs, isLoading: loadingIp } = useQuery({
    queryKey: ["audit", "ip", ip],
    queryFn: () => auditApi.getByIp(ip),
    enabled: filterType === "ip" && ip.length > 4,
  });

  const { data: dateLogs, isLoading: loadingDate } = useQuery({
    queryKey: ["audit", "date", dateFrom, dateTo],
    queryFn: () => auditApi.getDateRange(
      new Date(dateFrom).toISOString(),
      new Date(dateTo).toISOString()
    ),
    enabled: filterType === "date" && !!dateFrom && !!dateTo,
  });

  const logs =
    filterType === "failed" ? failedLogs :
    filterType === "citizen" ? citizenLogs :
    filterType === "user" ? userLogs :
    filterType === "ip" ? ipLogs :
    dateLogs;

  const isLoading =
    filterType === "failed" ? loadingFailed :
    filterType === "citizen" ? loadingCitizen :
    filterType === "user" ? loadingUser :
    filterType === "ip" ? loadingIp :
    loadingDate;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ScrollText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">سجل الأحداث</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">تصفية السجلات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { key: "failed", label: "الأحداث الفاشلة" },
              { key: "citizen", label: "بالمواطن" },
              { key: "user", label: "بالمستخدم" },
              { key: "ip", label: "بعنوان IP" },
              { key: "date", label: "بالتاريخ" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterType(key as typeof filterType)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  filterType === key
                    ? "bg-primary text-white border-primary"
                    : "text-muted-foreground hover:bg-muted border-border"
                }`}
                data-testid={`button-filter-${key}`}
              >
                {label}
              </button>
            ))}
          </div>

          {filterType === "citizen" && (
            <div className="space-y-1.5">
              <Label>معرّف المواطن (UUID)</Label>
              <Input value={citizenId} onChange={(e) => setCitizenId(e.target.value)} dir="ltr" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" data-testid="input-audit-citizen" />
            </div>
          )}
          {filterType === "user" && (
            <div className="space-y-1.5">
              <Label>معرّف المستخدم (UUID)</Label>
              <Input value={userId} onChange={(e) => setUserId(e.target.value)} dir="ltr" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" data-testid="input-audit-user" />
            </div>
          )}
          {filterType === "ip" && (
            <div className="space-y-1.5">
              <Label>عنوان IP</Label>
              <Input value={ip} onChange={(e) => setIp(e.target.value)} dir="ltr" placeholder="192.168.1.1" data-testid="input-audit-ip" />
            </div>
          )}
          {filterType === "date" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>من تاريخ</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} dir="ltr" data-testid="input-audit-from" />
              </div>
              <div className="space-y-1.5">
                <Label>إلى تاريخ</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} dir="ltr" data-testid="input-audit-to" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-muted-foreground">جاري التحميل...</p>
          ) : !logs || logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>لا توجد سجلات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحدث</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">عنوان IP</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">التفاصيل</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-muted/20 ${!log.success ? "bg-red-50/30" : ""}`}
                      data-testid={`row-audit-${log.id}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {auditActionLabels[log.action] ?? log.action}
                      </td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">نجاح</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs">فشل</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">{log.ipAddress}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">{log.details || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                إجمالي: {logs.length} سجل
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
