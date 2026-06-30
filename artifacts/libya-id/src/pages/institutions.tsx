import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { institutionsApi, institutionDocumentsApi, InstitutionInput } from "@/lib/api";
import { institutionTypeLabels, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, PowerOff, RefreshCw, Eye, Play, FileText } from "lucide-react";

const institutionDocumentTypeLabels: Record<string, string> = {
  "1": "شهادة التسجيل التجاري",
  "2": "رخصة العمل التجاري أو الإدارية",
  "3": "شهادة التسجيل بغرفة التجارة",
  "4": "رقم التعريف الضريبي",
  "5": "النظام الأساسي أو عقد التأسيس",
  "6": "قرار تعيين المدير أو المفوض الموقع",
  "7": "إثبات عنوان المقر الرئيسي",
  "8": "بيانات المالكين أو الشركاء",
  "CommercialRegistration": "شهادة التسجيل التجاري",
  "CommercialOrAdministrativeLicense": "رخصة العمل التجاري أو الإدارية",
  "CertificateOfRegistrationWithTheChamberOfCommerce": "شهادة التسجيل بغرفة التجارة",
  "TaxIdentificationNumber": "رقم التعريف الضريبي",
  "ArticlesOfAssociationOrMemorandumOfIncorporation": "النظام الأساسي أو عقد التأسيس",
  "DecisionAppointingTheManagerOrAuthorizedSignatory": "قرار تعيين المدير أو المفوض الموقع",
  "ProofOfTheHeadOfficeAddress": "إثبات عنوان المقر الرئيسي",
  "OwnersOrPartnersInformation": "بيانات المالكين أو الشركاء",
};

const institutionDocumentTypes = [
  { value: "1", label: "شهادة التسجيل التجاري" },
  { value: "2", label: "رخصة العمل التجاري أو الإدارية" },
  { value: "3", label: "شهادة التسجيل بغرفة التجارة" },
  { value: "4", label: "رقم التعريف الضريبي" },
  { value: "5", label: "النظام الأساسي أو عقد التأسيس" },
  { value: "6", label: "قرار تعيين المدير أو المفوض الموقع" },
  { value: "7", label: "إثبات عنوان المقر الرئيسي" },
  { value: "8", label: "بيانات المالكين أو الشركاء" },
];

const emptyForm: InstitutionInput = {
  name: "",
  type: 1,
  contactEmail: "",
  contactPhone: "",
  address: "",
};

const institutionTypes = [
  { value: "1", label: "بنك" },
  { value: "2", label: "وزارة" },
  { value: "3", label: "اتصالات" },
  { value: "4", label: "جامعة" },
  { value: "5", label: "مستشفى" },
  { value: "99", label: "أخرى" },
];

export default function InstitutionsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<InstitutionInput>(emptyForm);

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    institutionId: "",
    documentType: "1",
    documentNumber: "",
    issuedAt: "",
    expiresAt: "",
  });

  const { data: institutions, isLoading } = useQuery({
    queryKey: ["institutions"],
    queryFn: institutionsApi.list,
  });

  const addMutation = useMutation({
    mutationFn: institutionsApi.create,
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
      setShowAdd(false);
      setForm(emptyForm);
      toast({ title: "تم إضافة المؤسسة بنجاح" });
      
      const instId = res?.id || (typeof res === "string" ? res : null);
      if (confirm("تم إضافة المؤسسة بنجاح. هل تريد رفع وثائق المؤسسة الآن؟")) {
        setDocForm({
          institutionId: instId || "",
          documentType: "1",
          documentNumber: "",
          issuedAt: new Date().toISOString().split("T")[0],
          expiresAt: "",
        });
        setShowAddDoc(true);
      }
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: institutionsApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
      toast({ title: "تم إيقاف المؤسسة" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const activateMutation = useMutation({
    mutationFn: institutionsApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
      toast({ title: "تم تفعيل المؤسسة بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const rotateMutation = useMutation({
    mutationFn: institutionsApi.rotateApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
      toast({ title: "تم تجديد مفتاح API" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const addDocMutation = useMutation({
    mutationFn: (data: typeof docForm) =>
      institutionDocumentsApi.create({
        institutionId: data.institutionId,
        type: Number(data.documentType),
        documentNumber: data.documentNumber,
        issuedAt: data.issuedAt ? new Date(data.issuedAt).toISOString() : new Date().toISOString(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institution-documents"] });
      setShowAddDoc(false);
      setDocForm({
        institutionId: "",
        documentType: "1",
        documentNumber: "",
        issuedAt: "",
        expiresAt: "",
      });
      toast({ title: "تم رفع وثيقة المؤسسة بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const { data: instDocs } = useQuery({
    queryKey: ["institution-documents", selected],
    queryFn: () => institutionDocumentsApi.getByInstitution(selected!),
    enabled: !!selected,
  });

  const filtered = (institutions ?? []).filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedInst = institutions?.find((i) => i.id === selected);

  function setField(k: keyof InstitutionInput, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">المؤسسات</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-institution">
          <Plus className="w-4 h-4 ml-2" />
          إضافة مؤسسة
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="البحث بالاسم أو رقم التسجيل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
          data-testid="input-search-institutions"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>لا توجد مؤسسات</p>
          </div>
        ) : (
          filtered.map((inst) => (
            <Card key={inst.id} className="hover:shadow-md transition-shadow" data-testid={`card-institution-${inst.id}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant={inst.isActive ? "default" : "secondary"}>
                    {inst.isActive ? "نشط" : "غير نشط"}
                  </Badge>
                </div>
                <h3 className="font-bold text-base mb-1">{inst.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">{institutionTypeLabels[inst.type] ?? inst.type}</p>
                <p className="text-xs text-muted-foreground mb-1">{inst.contactEmail}</p>
                <p className="text-xs text-muted-foreground mb-4" dir="ltr">{inst.contactPhone}</p>
                <p className="text-xs text-muted-foreground mb-4">{inst.address}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(inst.id)}
                    data-testid={`button-view-institution-${inst.id}`}
                  >
                    <Eye className="w-3.5 h-3.5 ml-1" />
                    التفاصيل
                  </Button>
                  {inst.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 hover:text-orange-700"
                      onClick={() => deactivateMutation.mutate(inst.id)}
                      disabled={deactivateMutation.isPending}
                      data-testid={`button-deactivate-institution-${inst.id}`}
                    >
                      <PowerOff className="w-3.5 h-3.5 ml-1" />
                      إيقاف
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => {
                        if (confirm("هل أنت متأكد من تفعيل المؤسسة؟")) {
                          activateMutation.mutate(inst.id);
                        }
                      }}
                      disabled={activateMutation.isPending}
                      data-testid={`button-activate-institution-${inst.id}`}
                    >
                      <Play className="w-3.5 h-3.5 ml-1" />
                      تفعيل
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotateMutation.mutate(inst.id)}
                    disabled={rotateMutation.isPending}
                    data-testid={`button-rotate-key-${inst.id}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 ml-1" />
                    تجديد API
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المؤسسة</DialogTitle>
          </DialogHeader>
          {selectedInst && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label: "الاسم", value: selectedInst.name },
                  { label: "النوع", value: institutionTypeLabels[selectedInst.type] ?? selectedInst.type },
                  { label: "البريد الإلكتروني", value: selectedInst.contactEmail },
                  { label: "رقم الهاتف", value: selectedInst.contactPhone, dir: "ltr" },
                  { label: "العنوان", value: selectedInst.address },
                  { label: "مفتاح API", value: selectedInst.apiKey || selectedInst.apiKeyPrefix, mono: true },
                  { label: "تاريخ الإنشاء", value: formatDate(selectedInst.createdAt) },
                ].map(({ label, value, mono, dir }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs font-medium">{label}</span>
                    <span className={mono ? "font-mono text-xs break-all" : ""} dir={dir}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              <hr className="my-2 border-muted" />

              {/* Institution Documents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    وثائق المؤسسة ({instDocs?.length ?? 0})
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => {
                      setDocForm({
                        institutionId: selectedInst.id,
                        documentType: "1",
                        documentNumber: "",
                        issuedAt: new Date().toISOString().split("T")[0],
                        expiresAt: "",
                      });
                      setShowAddDoc(true);
                    }}
                    data-testid="button-add-document-institution-details"
                  >
                    <Plus className="w-3.5 h-3.5 ml-1" />
                    رفع وثيقة
                  </Button>
                </div>

                {!instDocs || instDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">لا توجد وثائق مرفوعة لهذه المؤسسة</p>
                ) : (
                  <div className="overflow-x-auto rounded-md border text-xs">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="p-2 font-medium">نوع الوثيقة</th>
                          <th className="p-2 font-medium">رقم الوثيقة</th>
                          <th className="p-2 font-medium">تاريخ الإصدار</th>
                          <th className="p-2 font-medium">تاريخ الانتهاء</th>
                          <th className="p-2 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {instDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-muted/10">
                            <td className="p-2">{institutionDocumentTypeLabels[doc.documentType] ?? doc.documentType}</td>
                            <td className="p-2 font-mono">{doc.documentNumber}</td>
                            <td className="p-2 text-muted-foreground">{formatDate(doc.issuedAt)}</td>
                            <td className="p-2 text-muted-foreground">{doc.expiresAt ? formatDate(doc.expiresAt) : "—"}</td>
                            <td className="p-2">
                              {doc.isRevoked ? (
                                <Badge className="text-red-700 bg-red-50 border-red-200 border text-[10px] py-0 px-1.5" variant="outline">ملغى</Badge>
                              ) : (
                                <Badge className="text-green-700 bg-green-50 border-green-200 border text-[10px] py-0 px-1.5" variant="outline">ساري</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مؤسسة جديدة</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>اسم المؤسسة *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} required data-testid="input-inst-name" />
            </div>
            <div className="space-y-1.5">
              <Label>نوع المؤسسة *</Label>
              <Select value={String(form.type)} onValueChange={(v) => setField("type", Number(v))}>
                <SelectTrigger data-testid="select-institution-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {institutionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني *</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} required dir="ltr" data-testid="input-inst-email" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف *</Label>
              <Input value={form.contactPhone} onChange={(e) => setField("contactPhone", e.target.value)} required dir="ltr" data-testid="input-inst-phone" />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان *</Label>
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} required data-testid="input-inst-address" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
              <Button type="submit" disabled={addMutation.isPending} data-testid="button-submit-add-institution">
                {addMutation.isPending ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Institution Document Dialog */}
      <Dialog open={showAddDoc} onOpenChange={setShowAddDoc}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفع وثيقة للمؤسسة</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addDocMutation.mutate(docForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>المؤسسة *</Label>
              <Select
                value={docForm.institutionId}
                onValueChange={(v) => setDocForm((f) => ({ ...f, institutionId: v }))}
                disabled={!!docForm.institutionId}
              >
                <SelectTrigger data-testid="select-doc-institution">
                  <SelectValue placeholder="اختر المؤسسة" />
                </SelectTrigger>
                <SelectContent>
                  {(institutions ?? []).map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  {institutionDocumentTypes.map((t) => (
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
              <Label>تاريخ الإصدار *</Label>
              <Input
                type="date"
                value={docForm.issuedAt}
                onChange={(e) => setDocForm((f) => ({ ...f, issuedAt: e.target.value }))}
                required
                dir="ltr"
                data-testid="input-doc-issued"
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
              <Button type="submit" disabled={addDocMutation.isPending} data-testid="button-submit-upload-doc">
                {addDocMutation.isPending ? "جاري الرفع..." : "رفع الوثيقة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
