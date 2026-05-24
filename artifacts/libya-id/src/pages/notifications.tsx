import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCheck, Trash2, RefreshCw, Mail, Phone, Smartphone } from "lucide-react";
import { useState } from "react";

const typeIcons: Record<string, React.ElementType> = {
  Email: Mail,
  SMS: Phone,
  Push: Smartphone,
};

const typeLabels: Record<string, string> = {
  Email: "بريد إلكتروني",
  SMS: "رسالة نصية",
  Push: "إشعار",
};

const statusColors: Record<string, string> = {
  Pending: "text-yellow-700 bg-yellow-50 border-yellow-200",
  Sent: "text-blue-700 bg-blue-50 border-blue-200",
  Failed: "text-red-700 bg-red-50 border-red-200",
  Read: "text-green-700 bg-green-50 border-green-200",
};

const statusLabels: Record<string, string> = {
  Pending: "معلق",
  Sent: "مُرسَل",
  Failed: "فشل",
  Read: "مقروء",
};

type TabKey = "my" | "unread" | "failed";

export default function NotificationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("my");

  const { data: myNotifications, isLoading: loadingMy } = useQuery({
    queryKey: ["notifications", "my"],
    queryFn: notificationsApi.getMy,
    enabled: tab === "my",
  });

  const { data: unreadNotifications, isLoading: loadingUnread } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.getMyUnread,
    enabled: tab === "unread",
  });

  const { data: failedNotifications, isLoading: loadingFailed } = useQuery({
    queryKey: ["notifications", "failed"],
    queryFn: notificationsApi.getFailed,
    enabled: tab === "failed",
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "تم تحديد الإشعار كمقروء" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "تم حذف الإشعار" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const retryMutation = useMutation({
    mutationFn: notificationsApi.retryFailed,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "تم إعادة الإرسال" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const notifications =
    tab === "my" ? myNotifications :
    tab === "unread" ? unreadNotifications :
    failedNotifications;

  const isLoading =
    tab === "my" ? loadingMy :
    tab === "unread" ? loadingUnread :
    loadingFailed;

  const unreadCount = unreadNotifications?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">الإشعارات</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {tab === "failed" && (
          <Button
            variant="outline"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            data-testid="button-retry-failed"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة إرسال الفاشلة
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "my" as TabKey, label: "جميع إشعاراتي" },
          { key: "unread" as TabKey, label: "غير المقروءة" },
          { key: "failed" as TabKey, label: "الفاشلة" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-notifications-${key}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>
      ) : !notifications || notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-medium">لا توجد إشعارات</p>
          <p className="text-sm mt-1">ستظهر إشعاراتك هنا</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] ?? Bell;
            const isRead = notif.status === "Read";
            return (
              <Card
                key={notif.id}
                className={`hover:shadow-sm transition-shadow ${!isRead ? "border-primary/30 bg-primary/5" : ""}`}
                data-testid={`card-notification-${notif.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!isRead ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`w-4 h-4 ${!isRead ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{typeLabels[notif.type] ?? notif.type}</span>
                        <Badge className={`border text-xs ${statusColors[notif.status] ?? ""}`}>
                          {statusLabels[notif.status] ?? notif.status}
                        </Badge>
                      </div>
                      <p className={`text-sm ${!isRead ? "font-medium" : "text-muted-foreground"}`}>{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(notif.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary"
                          onClick={() => markReadMutation.mutate(notif.id)}
                          disabled={markReadMutation.isPending}
                          data-testid={`button-mark-read-${notif.id}`}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(notif.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-notification-${notif.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
