import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { citizensApi, CitizenInput, CitizenResponse } from "@/lib/api";
import { formatDate, citizenStatusLabels, citizenStatusColors, maritalStatusLabels } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Eye, UserX, Users, UserCheck, Pencil } from "lucide-react";
import { Link } from "wouter";

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

export default function CitizensPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CitizenInput>(emptyForm);
  
  const [showEdit, setShowEdit] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenResponse | null>(null);
  const [editForm, setEditForm] = useState<CitizenInput>(emptyForm);

  const { data: citizens, isLoading } = useQuery({
    queryKey: ["citizens"],
    queryFn: citizensApi.list,
  });

  const addMutation = useMutation({
    mutationFn: citizensApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizens"] });
      setShowAdd(false);
      setForm(emptyForm);
      toast({ title: "تم إضافة المواطن بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: (data: CitizenInput) => {
      if (!selectedCitizen) throw new Error("لم يتم اختيار مواطن");
      return citizensApi.update(selectedCitizen.id, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citizens"] });
      setShowEdit(false);
      setSelectedCitizen(null);
      setEditForm(emptyForm);
      toast({ title: "تم تحديث بيانات المواطن بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const filtered = (citizens ?? []).filter((c) =>
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.nationalId?.includes(search) ||
    c.phoneNumber?.includes(search)
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    addMutation.mutate(form);
  }

  function setField(k: keyof CitizenInput, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    editMutation.mutate(editForm);
  }

  function setEditField(k: keyof CitizenInput, v: string | number) {
    setEditForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">المواطنون</h1>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-citizen">
          <Plus className="w-4 h-4 ml-2" />
          إضافة مواطن
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="البحث بالاسم أو الرقم الوطني أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
          data-testid="input-search-citizens"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>لا يوجد مواطنون</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الاسم الكامل</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الرقم الوطني</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">رقم الهاتف</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة الاجتماعية</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">تاريخ الإضافة</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-citizen-${c.id}`}>
                      <td className="px-4 py-3 font-medium">{c.fullName || `${c.name} ${c.lastName}`}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.nationalId}</td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">{c.phoneNumber}</td>
                      <td className="px-4 py-3">{maritalStatusLabels[c.maritalStatus] ?? c.maritalStatus}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border text-xs ${citizenStatusColors[c.status] ?? ""}`}>
                          {citizenStatusLabels[c.status] ?? c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/citizens/${c.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-citizen-${c.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            data-testid={`button-edit-citizen-${c.id}`}
                            onClick={() => {
                              setSelectedCitizen(c);
                              setEditForm({
                                nationalId: c.nationalId || "",
                                name: c.name || "",
                                fatherName: c.fatherName || "",
                                grandFatherName: c.grandFatherName || "",
                                lastName: c.lastName || "",
                                motherName: c.motherName || "",
                                dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split("T")[0] : "",
                                placeOfBirth: c.placeOfBirth || "",
                                phoneNumber: c.phoneNumber || "",
                                maritalStatus: maritalStatusToNumber[c.maritalStatus] || 1,
                              });
                              setShowEdit(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {c.status === "Active" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700"
                              data-testid={`button-suspend-citizen-${c.id}`}
                              onClick={() => {
                                const reason = prompt("سبب الإيقاف:");
                                if (reason) {
                                  citizensApi.suspend(c.id, reason).then(() => {
                                    qc.invalidateQueries({ queryKey: ["citizens"] });
                                    toast({ title: "تم إيقاف المواطن" });
                                  }).catch((e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }));
                                }
                              }}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            c.status !== "Revoked" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                data-testid={`button-activate-citizen-${c.id}`}
                                onClick={() => {
                                  if (confirm("هل أنت متأكد من تفعيل المواطن؟")) {
                                    citizensApi.activate(c.id).then(() => {
                                      qc.invalidateQueries({ queryKey: ["citizens"] });
                                      toast({ title: "تم تفعيل المواطن بنجاح" });
                                    }).catch((e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }));
                                  }
                                }}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مواطن جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>الرقم الوطني (12 رقم) *</Label>
                <Input
                  value={form.nationalId}
                  onChange={(e) => setField("nationalId", e.target.value)}
                  maxLength={12}
                  minLength={12}
                  required
                  dir="ltr"
                  data-testid="input-national-id"
                />
              </div>
              <div className="space-y-1.5">
                <Label>الاسم الأول *</Label>
                <Input value={form.name} onChange={(e) => setField("name", e.target.value)} required data-testid="input-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الأب *</Label>
                <Input value={form.fatherName} onChange={(e) => setField("fatherName", e.target.value)} required data-testid="input-father-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الجد *</Label>
                <Input value={form.grandFatherName} onChange={(e) => setField("grandFatherName", e.target.value)} required data-testid="input-grand-father-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم العائلة *</Label>
                <Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} required data-testid="input-last-name" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الأم *</Label>
                <Input value={form.motherName} onChange={(e) => setField("motherName", e.target.value)} required data-testid="input-mother-name" />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الميلاد *</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} required dir="ltr" data-testid="input-dob" />
              </div>
              <div className="space-y-1.5">
                <Label>مكان الميلاد *</Label>
                <Input value={form.placeOfBirth} onChange={(e) => setField("placeOfBirth", e.target.value)} required data-testid="input-place-of-birth" />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف *</Label>
                <Input value={form.phoneNumber} onChange={(e) => setField("phoneNumber", e.target.value)} required dir="ltr" data-testid="input-phone" />
              </div>
              <div className="space-y-1.5">
                <Label>الحالة الاجتماعية *</Label>
                <Select
                  value={String(form.maritalStatus)}
                  onValueChange={(v) => setField("maritalStatus", Number(v))}
                >
                  <SelectTrigger data-testid="select-marital-status">
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
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
              <Button type="submit" disabled={addMutation.isPending} data-testid="button-submit-add-citizen">
                {addMutation.isPending ? "جاري الإضافة..." : "إضافة المواطن"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
    </div>
  );
}
