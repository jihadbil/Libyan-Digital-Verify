import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export const maritalStatusLabels: Record<string, string> = {
  Single: "أعزب",
  Married: "متزوج",
  Divorced: "مطلق",
  Widowed: "أرمل",
  "1": "أعزب",
  "2": "متزوج",
  "3": "مطلق",
  "4": "أرمل",
};

export const citizenStatusLabels: Record<string, string> = {
  PendingActivation: "في انتظار التفعيل",
  Active: "مفعّل",
  Suspended: "موقوف",
  Revoked: "ملغى",
};

export const citizenStatusColors: Record<string, string> = {
  PendingActivation: "text-yellow-700 bg-yellow-50 border-yellow-200",
  Active: "text-green-700 bg-green-50 border-green-200",
  Suspended: "text-orange-700 bg-orange-50 border-orange-200",
  Revoked: "text-red-700 bg-red-50 border-red-200",
};

export const documentTypeLabels: Record<string, string> = {
  BirthCertificate: "شهادة الميلاد",
  NationalIdCard: "بطاقة الهوية الوطنية",
  ResidencyProof: "إثبات الإقامة",
  MarriageCertificate: "شهادة الزواج",
  DriversLicense: "رخصة القيادة",
};

export const institutionTypeLabels: Record<string, string> = {
  Bank: "بنك",
  Ministry: "وزارة",
  Telecom: "اتصالات",
  University: "جامعة",
  Hospital: "مستشفى",
  Other: "أخرى",
};

export const verificationStatusLabels: Record<string, string> = {
  Pending: "معلق",
  Approved: "موافق عليه",
  Rejected: "مرفوض",
  Expired: "منتهي الصلاحية",
  Cancelled: "ملغى",
};

export const verificationStatusColors: Record<string, string> = {
  Pending: "text-yellow-700 bg-yellow-50 border-yellow-200",
  Approved: "text-green-700 bg-green-50 border-green-200",
  Rejected: "text-red-700 bg-red-50 border-red-200",
  Expired: "text-gray-600 bg-gray-50 border-gray-200",
  Cancelled: "text-gray-500 bg-gray-50 border-gray-200",
};

export const auditActionLabels: Record<string, string> = {
  Login: "تسجيل دخول",
  LoginFailed: "فشل تسجيل الدخول",
  FaceVerified: "التحقق من الوجه",
  FaceFailed: "فشل التحقق من الوجه",
  OtpSent: "إرسال OTP",
  OtpVerified: "التحقق من OTP",
  OtpFailed: "فشل OTP",
  IdentityVerified: "تحقق الهوية",
  DocumentIssued: "إصدار وثيقة",
  DocumentVerified: "التحقق من وثيقة",
  AccountSuspended: "تعليق الحساب",
  AccountActivated: "تفعيل الحساب",
  FaceRegistered: "تسجيل الوجه",
  BulkImport: "استيراد جماعي",
};

export const userTypeLabels: Record<string, string> = {
  Citizen: "مواطن",
  InstitutionStaff: "موظف مؤسسة",
  InstitutionAdmin: "إداري مؤسسة",
  SuperAdmin: "مسؤول النظام",
  CivilRegistry: "موظف أحوال مدنية",
};

