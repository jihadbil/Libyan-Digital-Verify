import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api";
import { formatDate, documentTypeLabels } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, FileText, QrCode, Clock } from "lucide-react";

const documentTypes = [
  { value: "1", label: "شهادة الميلاد" },
  { value: "2", label: "بطاقة الهوية الوطنية" },
  { value: "3", label: "إثبات الإقامة" },
  { value: "4", label: "شهادة الزواج" },
  { value: "5", label: "رخصة القيادة" },
];

export default function DocumentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"search" | "expired">("search");
  const [searchNum, setSearchNum] = useState("");
  const [searchQr, setSearchQr] = useState("");
  const [searchCitizen, setSearchCitizen] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    citizenId: "",
    documentType: "2",
    documentNumber: "",
    issuedAt: "",
    expiresAt: "",
  });

  const { data: expiredDocs, isLoading: loadingExpired } = useQuery({
    queryKey: ["documents", "expired"],
    queryFn: documentsApi.getExpired,
    enabled: tab === "expired",
  });

  const { data: docByNumber } = useQuery({
    queryKey: ["document-by-number", searchNum],
    queryFn: () => documentsApi.getByNumber(searchNum),
    enabled: searchNum.length > 3,
    retry: false,
  });

  const { data: docByQr } = useQuery({
    queryKey: ["document-by-qr", searchQr],
    queryFn: () => documentsApi.verifyQr(searchQr),
    enabled: searchQr.length > 5,
    retry: false,
  });

  const { data: citizenDocs } = useQuery({
    queryKey: ["documents-by-citizen", searchCitizen],
    queryFn: () => documentsApi.getByCitizen(searchCitizen),
    enabled: searchCitizen.length === 36,
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof addForm) =>
      documentsApi.create({
        ...data,
        documentType: Number(data.documentType),
        expiresAt: data.expiresAt || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      setShowAdd(false);
      toast({ title: "تم إصدار الوثيقة بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  function DocBadge({ doc }: { doc: { isRevoked: boolean; isExpired: boolean } }) {
    if (doc.isRevoked) return <Badge className="text-red-700 bg-red-50 border-red-200 border text-xs">ملغى</Badge>;
    if (doc.isExpired) return <Badge className="text-gray-600 bg-gray-50 border-gray-200 border text-xs">منتهي</Badge>;
    return <Badge className="text-green-700 bg-green-50 border-green-200 border text-xs">ساري</Badge>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">الوثائق</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-issue-document">
          <Plus className="w-4 h-4 ml-2" />
          إصدار وثيقة
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "search", label: "بحث الوثائق", icon: Search },
          { key: "expired", label: "الوثائق المنتهية", icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${key}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "search" && (
        <div className="space-y-4">
          {/* Search by number */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">البحث برقم الوثيقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="أدخل رقم الوثيقة..."
                  value={searchNum}
                  onChange={(e) => setSearchNum(e.target.value)}
                  className="pr-9"
                  dir="ltr"
                  data-testid="input-search-doc-number"
                />
              </div>
              {docByNumber && (
                <div className="p-3 rounded-lg border bg-muted/30 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{documentTypeLabels[docByNumber.documentType] ?? docByNumber.documentType}</span>
                    <DocBadge doc={docByNumber} />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{docByNumber.documentNumber}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">إصدار: </span>{formatDate(docByNumber.issuedAt)}</div>
                    <div><span className="text-muted-foreground">انتهاء: </span>{docByNumber.expiresAt ? formatDate(docByNumber.expiresAt) : "—"}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verify QR */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                التحقق برمز QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <QrCode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="أدخل رمز QR..."
                  value={searchQr}
                  onChange={(e) => setSearchQr(e.target.value)}
                  className="pr-9"
                  dir="ltr"
                  data-testid="input-search-qr"
                />
              </div>
              {docByQr && (
                <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-700">الوثيقة صحيحة</span>
                    <DocBadge doc={docByQr} />
                  </div>
                  <p className="text-xs">{documentTypeLabels[docByQr.documentType] ?? docByQr.documentType}</p>
                  <p className="text-xs font-mono">{docByQr.documentNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* By citizen ID */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">وثائق المواطن</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="أدخل معرّف المواطن (UUID)..."
                value={searchCitizen}
                onChange={(e) => setSearchCitizen(e.target.value)}
                dir="ltr"
                data-testid="input-search-citizen-id"
              />
              {citizenDocs && citizenDocs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">النوع</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">رقم الوثيقة</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">الإصدار</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {citizenDocs.map((doc) => (
                        <tr key={doc.id} data-testid={`row-doc-${doc.id}`}>
                          <td className="px-3 py-2">{documentTypeLabels[doc.documentType] ?? doc.documentType}</td>
                          <td className="px-3 py-2 font-mono text-xs">{doc.documentNumber}</td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDate(doc.issuedAt)}</td>
                          <td className="px-3 py-2"><DocBadge doc={doc} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "expired" && (
        <Card>
          <CardContent className="p-0">
            {loadingExpired ? (
              <p className="p-8 text-center text-muted-foreground">جاري التحميل...</p>
            ) : !expiredDocs || expiredDocs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>لا توجد وثائق منتهية الصلاحية</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">نوع الوثيقة</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">رقم الوثيقة</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">تاريخ الإصدار</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">تاريخ الانتهاء</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expiredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-muted/20" data-testid={`row-expired-doc-${doc.id}`}>
                        <td className="px-4 py-3">{documentTypeLabels[doc.documentType] ?? doc.documentType}</td>
                        <td className="px-4 py-3 font-mono text-xs">{doc.documentNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.issuedAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{doc.expiresAt ? formatDate(doc.expiresAt) : "—"}</td>
                        <td className="px-4 py-3"><DocBadge doc={doc} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Issue Document Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إصدار وثيقة جديدة</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate(addForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>معرّف المواطن (UUID) *</Label>
              <Input
                value={addForm.citizenId}
                onChange={(e) => setAddForm((f) => ({ ...f, citizenId: e.target.value }))}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
                dir="ltr"
                data-testid="input-doc-citizen-id"
              />
            </div>
            <div className="space-y-1.5">
              <Label>نوع الوثيقة *</Label>
              <Select
                value={addForm.documentType}
                onValueChange={(v) => setAddForm((f) => ({ ...f, documentType: v }))}
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
                value={addForm.documentNumber}
                onChange={(e) => setAddForm((f) => ({ ...f, documentNumber: e.target.value }))}
                required
                dir="ltr"
                data-testid="input-doc-number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ الإصدار *</Label>
              <Input
                type="date"
                value={addForm.issuedAt}
                onChange={(e) => setAddForm((f) => ({ ...f, issuedAt: e.target.value }))}
                required
                dir="ltr"
                data-testid="input-doc-issued"
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ الانتهاء</Label>
              <Input
                type="date"
                value={addForm.expiresAt}
                onChange={(e) => setAddForm((f) => ({ ...f, expiresAt: e.target.value }))}
                dir="ltr"
                data-testid="input-doc-expires"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
              <Button type="submit" disabled={addMutation.isPending} data-testid="button-submit-issue-doc">
                {addMutation.isPending ? "جاري الإصدار..." : "إصدار"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
