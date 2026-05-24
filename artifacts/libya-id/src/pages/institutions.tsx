import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { institutionsApi, InstitutionInput } from "@/lib/api";
import { institutionTypeLabels, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, PowerOff, RefreshCw, Eye } from "lucide-react";

const emptyForm: InstitutionInput = {
  name: "",
  institutionType: 1,
  registrationNumber: "",
  email: "",
  phoneNumber: "",
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

  const { data: institutions, isLoading } = useQuery({
    queryKey: ["institutions"],
    queryFn: institutionsApi.list,
  });

  const addMutation = useMutation({
    mutationFn: institutionsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
      setShowAdd(false);
      setForm(emptyForm);
      toast({ title: "تم إضافة المؤسسة بنجاح" });
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

  const rotateMutation = useMutation({
    mutationFn: institutionsApi.rotateApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
      toast({ title: "تم تجديد مفتاح API" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const filtered = (institutions ?? []).filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.registrationNumber?.includes(search)
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
                <p className="text-sm text-muted-foreground mb-1">{institutionTypeLabels[inst.institutionType] ?? inst.institutionType}</p>
                <p className="text-xs text-muted-foreground mb-1">{inst.email}</p>
                <p className="text-xs text-muted-foreground mb-4" dir="ltr">{inst.phoneNumber}</p>
                <p className="text-xs text-muted-foreground mb-1">رقم التسجيل: <span className="font-mono">{inst.registrationNumber}</span></p>
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
                  {inst.isActive && (
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
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل المؤسسة</DialogTitle>
          </DialogHeader>
          {selectedInst && (
            <div className="space-y-3 text-sm">
              {[
                { label: "الاسم", value: selectedInst.name },
                { label: "النوع", value: institutionTypeLabels[selectedInst.institutionType] ?? selectedInst.institutionType },
                { label: "رقم التسجيل", value: selectedInst.registrationNumber, mono: true },
                { label: "البريد الإلكتروني", value: selectedInst.email },
                { label: "رقم الهاتف", value: selectedInst.phoneNumber, dir: "ltr" },
                { label: "العنوان", value: selectedInst.address },
                { label: "مفتاح API", value: selectedInst.apiKey, mono: true },
                { label: "تاريخ الإنشاء", value: formatDate(selectedInst.createdAt) },
              ].map(({ label, value, mono, dir }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs font-medium">{label}</span>
                  <span className={mono ? "font-mono text-xs break-all" : ""} dir={dir}>{value || "—"}</span>
                </div>
              ))}
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
              <Select value={String(form.institutionType)} onValueChange={(v) => setField("institutionType", Number(v))}>
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
              <Label>رقم التسجيل *</Label>
              <Input value={form.registrationNumber} onChange={(e) => setField("registrationNumber", e.target.value)} required dir="ltr" data-testid="input-inst-reg" />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني *</Label>
              <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required dir="ltr" data-testid="input-inst-email" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف *</Label>
              <Input value={form.phoneNumber} onChange={(e) => setField("phoneNumber", e.target.value)} required dir="ltr" data-testid="input-inst-phone" />
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
    </div>
  );
}
