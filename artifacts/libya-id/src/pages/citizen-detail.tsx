import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { citizensApi, documentsApi, CitizenInput, CitizenResponse } from "@/lib/api";
import {
  formatDate, formatDateTime,
  citizenStatusLabels, citizenStatusColors,
  maritalStatusLabels, documentTypeLabels, verificationStatusLabels, verificationStatusColors,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, User, FileText, ShieldCheck, UserCheck, UserX, Pencil, Plus } from "lucide-react";

const maritalStatusToNumber: Record<string, number> = {
  Single: 1,
  Married: 2,
  Divorced: 3,
  Widowed: 4,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
};

const emptyForm: CitizenInput = {
  nationalId: "",
  name: "",
  fatherName: "",
  grandFatherName: "",
  lastName: "",
  motherName: "",
  dateOfBirth: "",
  placeOfBirth: "",
  phoneNumber: "",
  maritalStatus: 1,
};

const documentTypes = [
  { value: "1", label: "شهادة الميلاد" },
  { value: "2", label: "بطاقة الهوية الوطنية" },
  { value: "3", label: "إثبات الإقامة" },
  { value: "4", label: "شهادة الزواج" },
  { value: "5", label: "رخصة القيادة" },
];

export default function CitizenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<CitizenInput>(emptyForm);

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    documentType: "2",
    documentNumber: "",
    expiresAt: "",
  });

  const editMutation = useMutation({
    mutationFn: (data: CitizenInput) => {
      if (!id) throw new Error("المواطن غير موجود");
      return citizensApi.update(id, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen", id] });
      qc.invalidateQueries({ queryKey: ["citizens"] });
      setShowEdit(false);
      toast({ title: "تم تحديث بيانات المواطن بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const activateMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error("المواطن غير موجود");
      return citizensApi.activate(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen", id] });
      qc.invalidateQueries({ queryKey: ["citizens"] });
      toast({ title: "تم تفعيل المواطن بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => {
      if (!id) throw new Error("المواطن غير موجود");
      return citizensApi.suspend(id, reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen", id] });
      qc.invalidateQueries({ queryKey: ["citizens"] });
      toast({ title: "تم إيقاف المواطن بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const addDocMutation = useMutation({
    mutationFn: (data: typeof docForm) => {
      if (!id) throw new Error("المواطن غير موجود");
      return documentsApi.create({
        citizenId: id,
        type: Number(data.documentType),
        documentNumber: data.documentNumber,
        expiresAt: data.expiresAt || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizen-documents", id] });
      setShowAddDoc(false);
      setDocForm({
        documentType: "2",
        documentNumber: "",
        expiresAt: "",
      });
      toast({ title: "تم إصدار الوثيقة بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    editMutation.mutate(editForm);
  }

  function setEditField(k: keyof CitizenInput, v: string | number) {
    setEditForm((f) => ({ ...f, [k]: v }));
  }

  function handleAddDoc(e: React.FormEvent) {
    e.preventDefault();
    addDocMutation.mutate(docForm);
  }

  const { data: citizen, isLoading: loadingCitizen } = useQuery({
    queryKey: ["citizen", id],
    queryFn: () => citizensApi.get(id),
    enabled: !!id,
  });

  const { data: withDocuments } = useQuery({
    queryKey: ["citizen-documents", id],
    queryFn: () => citizensApi.getDocuments(id),
    enabled: !!id,
  });

  const { data: withVerifications } = useQuery({
    queryKey: ["citizen-verifications", id],
    queryFn: () => citizensApi.getVerifications(id),
    enabled: !!id,
  });

  if (loadingCitizen) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="text-center py-12 text-muted-foreground">المواطن غير موجود</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/citizens">
            <Button variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4 ml-1" />
              العودة
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{citizen.fullName || `${citizen.name} ${citizen.lastName}`}</h1>
          <Badge className={`border ${citizenStatusColors[citizen.status] ?? ""}`}>
            {citizenStatusLabels[citizen.status] ?? citizen.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditForm({
                nationalId: citizen.nationalId || "",
                name: citizen.name || "",
                fatherName: citizen.fatherName || "",
                grandFatherName: citizen.grandFatherName || "",
                lastName: citizen.lastName || "",
                motherName: citizen.motherName || "",
                dateOfBirth: citizen.dateOfBirth ? citizen.dateOfBirth.split("T")[0] : "",
                placeOfBirth: citizen.placeOfBirth || "",
                phoneNumber: citizen.phoneNumber || "",
                maritalStatus: maritalStatusToNumber[citizen.maritalStatus] || 1,
              });
              setShowEdit(true);
            }}
            data-testid="button-edit-citizen-detail"
          >
            <Pencil className="w-4 h-4 ml-2" />
            تعديل البيانات
          </Button>
          {citizen.status === "Active" ? (
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
              onClick={() => {
                const reason = prompt("سبب الإيقاف:");
                if (reason) {
                  suspendMutation.mutate(reason);
                }
              }}
              data-testid="button-suspend-citizen-detail"
            >
              <UserX className="w-4 h-4 ml-2" />
              إيقاف التفعيل
            </Button>
          ) : (
            citizen.status !== "Revoked" && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                onClick={() => {
                  if (confirm("هل أنت متأكد من تفعيل هذا المواطن؟")) {
                    activateMutation.mutate();
                  }
                }}
                data-testid="button-activate-citizen-detail"
              >
                <UserCheck className="w-4 h-4 ml-2" />
                تفعيل المواطن
              </Button>
            )
          )}
        </div>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-primary" />
            البيانات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              { label: "الرقم الوطني", value: citizen.nationalId, mono: true },
              { label: "الاسم الأول", value: citizen.name },
              { label: "اسم الأب", value: citizen.fatherName },
              { label: "اسم الجد", value: citizen.grandFatherName },
              { label: "اسم العائلة", value: citizen.lastName },
              { label: "اسم الأم", value: citizen.motherName },
              { label: "تاريخ الميلاد", value: formatDate(citizen.dateOfBirth) },
              { label: "مكان الميلاد", value: citizen.placeOfBirth },
              { label: "رقم الهاتف", value: citizen.phoneNumber, dir: "ltr" },
              { label: "الحالة الاجتماعية", value: maritalStatusLabels[citizen.maritalStatus] ?? citizen.maritalStatus },
              { label: "تاريخ الإضافة", value: formatDateTime(citizen.createdAt) },
              { label: "آخر تحديث", value: formatDateTime(citizen.updatedAt) },
            ].map(({ label, value, mono, dir }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-muted-foreground text-xs font-medium">{label}</p>
                <p className={`font-medium ${mono ? "font-mono text-xs" : ""}`} dir={dir}>{value || "—"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-blue-600" />
            الوثائق ({withDocuments?.documents?.length ?? 0})
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddDoc(true)}
            data-testid="button-add-document-citizen-detail"
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة وثيقة
          </Button>
        </CardHeader>
        <CardContent>
          {!withDocuments?.documents || withDocuments.documents.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">لا توجد وثائق</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">نوع الوثيقة</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">رقم الوثيقة</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">تاريخ الإصدار</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">تاريخ الانتهاء</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withDocuments.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/20" data-testid={`row-document-${doc.id}`}>
                      <td className="px-3 py-2">{documentTypeLabels[doc.documentType] ?? doc.documentType}</td>
                      <td className="px-3 py-2 font-mono text-xs">{doc.documentNumber}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(doc.issuedAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{doc.expiresAt ? formatDate(doc.expiresAt) : "—"}</td>
                      <td className="px-3 py-2">
                        {doc.isRevoked ? (
                          <Badge className="text-red-700 bg-red-50 border-red-200 border text-xs">ملغى</Badge>
                        ) : doc.isExpired ? (
                          <Badge className="text-gray-600 bg-gray-50 border-gray-200 border text-xs">منتهي</Badge>
                        ) : (
                          <Badge className="text-green-700 bg-green-50 border-green-200 border text-xs">ساري</Badge>
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

      {/* Verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            طلبات التحقق ({withVerifications?.verificationRequests?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!withVerifications?.verificationRequests || withVerifications.verificationRequests.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">لا توجد طلبات تحقق</p>
          ) : (
            <div className="space-y-2">
              {withVerifications.verificationRequests.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border text-sm" data-testid={`row-verification-${v.id}`}>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{v.id.slice(0, 16)}...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(v.createdAt)}</p>
                  </div>
                  <Badge className={`border text-xs ${verificationStatusColors[v.status] ?? ""}`}>
                    {verificationStatusLabels[v.status] ?? v.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Citizen Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المواطن</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الرقم الوطني (12 رقم) *</Label>
                <Input
                  value={editForm.nationalId}
                  onChange={(e) => setEditField("nationalId", e.target.value)}
                  maxLength={12}
                  minLength={12}
                  required
                  dir="ltr"
                  data-testid="input-edit-national-id"
                />
              </div>
              <div className="space-y-1.5">
                <Label>الاسم الأول *</Label>
                <Input value={editForm.name} onChange={(e) => setEditField("name", e.target.value)} required data-testid="input-edit-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الأب *</Label>
                <Input value={editForm.fatherName} onChange={(e) => setEditField("fatherName", e.target.value)} required data-testid="input-edit-father-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الجد *</Label>
                <Input value={editForm.grandFatherName} onChange={(e) => setEditField("grandFatherName", e.target.value)} required data-testid="input-edit-grand-father-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم العائلة *</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditField("lastName", e.target.value)} required data-testid="input-edit-last-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الأم *</Label>
                <Input value={editForm.motherName} onChange={(e) => setEditField("motherName", e.target.value)} required data-testid="input-edit-mother-name" />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الميلاد *</Label>
                <Input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditField("dateOfBirth", e.target.value)} required dir="ltr" data-testid="input-edit-dob" />
              </div>
              <div className="space-y-1.5">
                <Label>مكان الميلاد *</Label>
                <Input value={editForm.placeOfBirth} onChange={(e) => setEditField("placeOfBirth", e.target.value)} required data-testid="input-edit-place-of-birth" />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف *</Label>
                <Input value={editForm.phoneNumber} onChange={(e) => setEditField("phoneNumber", e.target.value)} required dir="ltr" data-testid="input-edit-phone" />
              </div>
              <div className="space-y-1.5">
                <Label>الحالة الاجتماعية *</Label>
                <Select
                  value={String(editForm.maritalStatus)}
                  onValueChange={(v) => setEditField("maritalStatus", Number(v))}
                >
                  <SelectTrigger data-testid="select-edit-marital-status">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">أعزب</SelectItem>
                    <SelectItem value="2">متزوج</SelectItem>
                    <SelectItem value="3">مطلق</SelectItem>
                    <SelectItem value="4">أرمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>إلغاء</Button>
              <Button type="submit" disabled={editMutation.isPending} data-testid="button-submit-edit-citizen">
                {editMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={showAddDoc} onOpenChange={setShowAddDoc}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إصدار وثيقة جديدة للمواطن</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDoc} className="space-y-4">
            <div className="space-y-1.5">
              <Label>نوع الوثيقة *</Label>
              <Select
                value={docForm.documentType}
                onValueChange={(v) => setDocForm((f) => ({ ...f, documentType: v }))}
              >
                <SelectTrigger data-testid="select-doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>رقم الوثيقة *</Label>
              <Input
                value={docForm.documentNumber}
                onChange={(e) => setDocForm((f) => ({ ...f, documentNumber: e.target.value }))}
                required
                dir="ltr"
                data-testid="input-doc-number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ الانتهاء</Label>
              <Input
                type="date"
                value={docForm.expiresAt}
                onChange={(e) => setDocForm((f) => ({ ...f, expiresAt: e.target.value }))}
                dir="ltr"
                data-testid="input-doc-expires"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDoc(false)}>إلغاء</Button>
              <Button type="submit" disabled={addDocMutation.isPending} data-testid="button-submit-issue-doc">
                {addDocMutation.isPending ? "جاري الإصدار..." : "إصدار الوثيقة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
