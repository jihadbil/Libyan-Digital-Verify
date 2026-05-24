import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { verificationApi } from "@/lib/api";
import {
  verificationStatusLabels,
  verificationStatusColors,
  formatDateTime,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShieldCheck, CheckCircle, XCircle, Clock } from "lucide-react";

type TabKey = "pending" | "all";

export default function VerificationPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("pending");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ citizenId: "", institutionId: "", requestedFields: "" });
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveResult, setApproveResult] = useState("");

  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ["verification", "pending"],
    queryFn: verificationApi.getPending,
    enabled: tab === "pending",
  });

  const { data: approved } = useQuery({
    queryKey: ["verification", "approved"],
    queryFn: () => verificationApi.getByStatus("Approved"),
    enabled: tab === "all",
  });

  const { data: rejected } = useQuery({
    queryKey: ["verification", "rejected"],
    queryFn: () => verificationApi.getByStatus("Rejected"),
    enabled: tab === "all",
  });

  const createMutation = useMutation({
    mutationFn: () => verificationApi.createRequest({
      citizenId: addForm.citizenId,
      institutionId: addForm.institutionId,
      requestedFields: addForm.requestedFields,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verification"] });
      setShowAdd(false);
      setAddForm({ citizenId: "", institutionId: "", requestedFields: "" });
      toast({ title: "تم إنشاء طلب التحقق بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, result }: { id: string; result?: string }) =>
      verificationApi.approve(id, result),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verification"] });
      setApproveId(null);
      setApproveResult("");
      toast({ title: "تمت الموافقة على الطلب" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      verificationApi.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verification"] });
      setRejectId(null);
      setRejectReason("");
      toast({ title: "تم رفض الطلب" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: verificationApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verification"] });
      toast({ title: "تم إلغاء الطلب" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const displayItems = tab === "pending"
    ? (pending ?? [])
    : [...(approved ?? []), ...(rejected ?? [])];

  const isLoading = tab === "pending" ? loadingPending : false;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">طلبات التحقق من الهوية</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-verification">
          <Plus className="w-4 h-4 ml-2" />
          طلب تحقق جديد
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "pending" as TabKey, label: "معلقة", icon: Clock },
          { key: "all" as TabKey, label: "المعالَجة", icon: CheckCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-verification-${key}`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === "pending" && pending && pending.length > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-muted-foreground">جاري التحميل...</p>
          ) : displayItems.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">المعرّف</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">معرّف المواطن</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">معرّف المؤسسة</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">تاريخ الطلب</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayItems.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/20" data-testid={`row-verification-${v.id}`}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.id.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.citizenId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.institutionId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(v.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border text-xs ${verificationStatusColors[v.status] ?? ""}`}>
                          {verificationStatusLabels[v.status] ?? v.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {v.status === "Pending" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                              onClick={() => setApproveId(v.id)}
                              data-testid={`button-approve-${v.id}`}
                            >
                              <CheckCircle className="w-3 h-3 ml-1" />
                              موافقة
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => setRejectId(v.id)}
                              data-testid={`button-reject-${v.id}`}
                            >
                              <XCircle className="w-3 h-3 ml-1" />
                              رفض
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => cancelMutation.mutate(v.id)}
                              disabled={cancelMutation.isPending}
                              data-testid={`button-cancel-${v.id}`}
                            >
                              إلغاء
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>طلب تحقق جديد</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>معرّف المواطن (UUID) *</Label>
              <Input
                value={addForm.citizenId}
                onChange={(e) => setAddForm((f) => ({ ...f, citizenId: e.target.value }))}
                required dir="ltr"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                data-testid="input-verif-citizen-id"
              />
            </div>
            <div className="space-y-1.5">
              <Label>معرّف المؤسسة (UUID) *</Label>
              <Input
                value={addForm.institutionId}
                onChange={(e) => setAddForm((f) => ({ ...f, institutionId: e.target.value }))}
                required dir="ltr"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                data-testid="input-verif-institution-id"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الحقول المطلوبة *</Label>
              <Input
                value={addForm.requestedFields}
                onChange={(e) => setAddForm((f) => ({ ...f, requestedFields: e.target.value }))}
                required
                placeholder="مثال: name,nationalId,dateOfBirth"
                dir="ltr"
                data-testid="input-verif-fields"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-verification">
                {createMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveId} onOpenChange={() => setApproveId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>الموافقة على طلب التحقق</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>نتيجة التحقق (JSON اختياري)</Label>
              <Input
                value={approveResult}
                onChange={(e) => setApproveResult(e.target.value)}
                placeholder="{}"
                dir="ltr"
                data-testid="input-approve-result"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveId(null)}>إلغاء</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveMutation.mutate({ id: approveId!, result: approveResult || undefined })}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "جاري الموافقة..." : "موافقة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض طلب التحقق</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>سبب الرفض *</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="أدخل سبب الرفض..."
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectId(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ id: rejectId!, reason: rejectReason })}
              disabled={rejectMutation.isPending || !rejectReason}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "جاري الرفض..." : "رفض الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
