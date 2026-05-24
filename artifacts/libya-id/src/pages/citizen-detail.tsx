import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { citizensApi } from "@/lib/api";
import {
  formatDate, formatDateTime,
  citizenStatusLabels, citizenStatusColors,
  maritalStatusLabels, documentTypeLabels, verificationStatusLabels, verificationStatusColors,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, FileText, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function CitizenDetailPage() {
  const { id } = useParams<{ id: string }>();

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
      {/* Back */}
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-blue-600" />
            الوثائق ({withDocuments?.documents?.length ?? 0})
          </CardTitle>
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
    </div>
  );
}
