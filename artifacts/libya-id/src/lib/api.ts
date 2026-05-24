const API_BASE = "https://localhost:7071";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  return localStorage.getItem("access_token");
}

export function setRefreshToken(token: string) {
  localStorage.setItem("refresh_token", token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      errMsg = errBody?.message || errBody?.title || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function put<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function del<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserResponse;
};

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
};

export type CitizenResponse = {
  id: string;
  nationalId: string;
  fullName: string;
  name: string;
  fatherName: string;
  grandFatherName: string;
  lastName: string;
  motherName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  phoneNumber: string;
  maritalStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type CitizenInput = {
  nationalId: string;
  name: string;
  fatherName: string;
  grandFatherName: string;
  lastName: string;
  motherName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  phoneNumber: string;
  maritalStatus: number;
};

export type IssuedDocument = {
  id: string;
  citizenId: string;
  documentType: string;
  documentNumber: string;
  issuedAt: string;
  expiresAt: string | null;
  isRevoked: boolean;
  isExpired: boolean;
  qrHash: string;
  issuedByUserId: string;
};

export type CitizenWithDocuments = {
  citizen: CitizenResponse;
  documents: IssuedDocument[];
};

export type CitizenWithVerifications = {
  citizen: CitizenResponse;
  verificationRequests: VerificationRequest[];
};

export type InstitutionResponse = {
  id: string;
  name: string;
  institutionType: string;
  registrationNumber: string;
  email: string;
  phoneNumber: string;
  address: string;
  isActive: boolean;
  apiKey: string;
  createdAt: string;
};

export type InstitutionInput = {
  name: string;
  institutionType: number;
  registrationNumber: string;
  email: string;
  phoneNumber: string;
  address: string;
};

export type VerificationRequest = {
  id: string;
  citizenId: string;
  institutionId: string;
  status: string;
  requestedFields: string;
  fieldsResultJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VerificationRequestInput = {
  citizenId: string;
  institutionId: string;
  requestedFields: string;
};

export type AuditLog = {
  id: string;
  citizenId: string | null;
  userId: string | null;
  action: string;
  success: boolean;
  details: string | null;
  ipAddress: string;
  timestamp: string;
};

export type NotificationLog = {
  id: string;
  userId: string;
  type: string;
  status: string;
  message: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
};

export type InstitutionDocument = {
  id: string;
  institutionId: string;
  documentType: string;
  documentNumber: string;
  issuedAt: string;
  expiresAt: string | null;
  isRevoked: boolean;
};

export type DocumentRevision = {
  id: string;
  ownerType: string;
  changeType: string;
  changedAt: string;
  changedByUserId: string;
  notes: string | null;
};

export const authApi = {
  login: (username: string, password: string) =>
    post<AuthResponse>("/api/auth/login", { username, password }),
  register: (data: object) => post<UserResponse>("/api/auth/register", data),
  logout: () => post<void>("/api/auth/logout"),
  me: () => get<UserResponse>("/api/auth/me"),
  refreshToken: (refreshToken: string) =>
    post<AuthResponse>("/api/auth/refresh-token", { refreshToken }),
  sendOtp: (data: object) => post<void>("/api/auth/otp/send", data),
  verifyOtp: (data: object) => post<void>("/api/auth/otp/verify", data),
  registerFace: (data: object) => post<void>("/api/auth/face/register", data),
  verifyFace: (data: object) => post<void>("/api/auth/face/verify", data),
};

export const citizensApi = {
  list: () => get<CitizenResponse[]>("/api/Citizens"),
  get: (id: string) => get<CitizenResponse>(`/api/Citizens/${id}`),
  getByNationalId: (nationalId: string) =>
    get<CitizenResponse>(`/api/Citizens/national-id/${nationalId}`),
  create: (data: CitizenInput) => post<CitizenResponse>("/api/Citizens", data),
  update: (id: string, data: CitizenInput) =>
    put<CitizenResponse>(`/api/Citizens/${id}`, data),
  getDocuments: (id: string) =>
    get<CitizenWithDocuments>(`/api/Citizens/${id}/documents`),
  getVerifications: (id: string) =>
    get<CitizenWithVerifications>(`/api/Citizens/${id}/verifications`),
  listActive: () => get<CitizenResponse[]>("/api/Citizens/active"),
  suspend: (id: string, reason: string) =>
    post<void>(`/api/Citizens/${id}/suspend`, { reason }),
  revoke: (id: string, reason: string) =>
    post<void>(`/api/Citizens/${id}/revoke`, { reason }),
  bulkImport: (data: CitizenInput[]) =>
    post<void>("/api/Citizens/bulk-import", data),
};

export const documentsApi = {
  get: (id: string) => get<IssuedDocument>(`/api/Documents/${id}`),
  getByCitizen: (citizenId: string) =>
    get<IssuedDocument[]>(`/api/Documents/citizen/${citizenId}`),
  getActiveByCitizen: (citizenId: string) =>
    get<IssuedDocument[]>(`/api/Documents/citizen/${citizenId}/active`),
  getExpired: () => get<IssuedDocument[]>("/api/Documents/expired"),
  getByNumber: (number: string) =>
    get<IssuedDocument>(`/api/Documents/number/${number}`),
  verifyQr: (qrHash: string) =>
    get<IssuedDocument>(`/api/Documents/verify-qr/${qrHash}`),
  create: (data: object) => post<IssuedDocument>("/api/Documents", data),
  revoke: (id: string, data: object) =>
    post<IssuedDocument>(`/api/Documents/${id}/revoke`, data),
  renew: (id: string, data: object) =>
    post<IssuedDocument>(`/api/Documents/${id}/renew`, data),
  getRevisions: (id: string) =>
    get<{ document: IssuedDocument; revisions: DocumentRevision[] }>(`/api/Documents/${id}/revisions`),
};

export const institutionsApi = {
  list: () => get<InstitutionResponse[]>("/api/Institutions"),
  get: (id: string) => get<InstitutionResponse>(`/api/Institutions/${id}`),
  create: (data: InstitutionInput) =>
    post<InstitutionResponse>("/api/Institutions", data),
  update: (id: string, data: InstitutionInput) =>
    put<InstitutionResponse>(`/api/Institutions/${id}`, data),
  deactivate: (id: string) =>
    post<void>(`/api/Institutions/${id}/deactivate`),
  rotateApiKey: (id: string) =>
    post<void>(`/api/Institutions/${id}/rotate-api-key`),
};

export const verificationApi = {
  createRequest: (data: VerificationRequestInput) =>
    post<VerificationRequest>("/api/Verification/requests", data),
  getRequest: (id: string) =>
    get<VerificationRequest>(`/api/Verification/requests/${id}`),
  getRequestDetails: (id: string) =>
    get<VerificationRequest>(`/api/Verification/requests/${id}/details`),
  getPending: () =>
    get<VerificationRequest[]>("/api/Verification/requests/pending"),
  getByStatus: (status: string) =>
    get<VerificationRequest[]>(
      `/api/Verification/requests/status/${status}`
    ),
  getByInstitution: (id: string) =>
    get<VerificationRequest[]>(
      `/api/Verification/requests/institution/${id}`
    ),
  getByCitizen: (id: string) =>
    get<VerificationRequest[]>(`/api/Verification/requests/citizen/${id}`),
  approve: (id: string, fieldsResultJson?: string) =>
    post<VerificationRequest>(`/api/Verification/requests/${id}/approve`, {
      fieldsResultJson,
    }),
  reject: (id: string, reason: string) =>
    post<VerificationRequest>(`/api/Verification/requests/${id}/reject`, {
      reason,
    }),
  cancel: (id: string) =>
    post<void>(`/api/Verification/requests/${id}/cancel`),
};

export const auditApi = {
  getById: (id: string) => get<AuditLog>(`/api/Audit/${id}`),
  getByCitizen: (citizenId: string) =>
    get<AuditLog[]>(`/api/Audit/citizen/${citizenId}`),
  getByUser: (userId: string) =>
    get<AuditLog[]>(`/api/Audit/user/${userId}`),
  getByAction: (action: number) =>
    get<AuditLog[]>(`/api/Audit/action/${action}`),
  getDateRange: (from: string, to: string) =>
    get<AuditLog[]>(`/api/Audit/date-range?from=${from}&to=${to}`),
  getFailed: (citizenId?: string) =>
    get<AuditLog[]>(
      `/api/Audit/failed${citizenId ? `?citizenId=${citizenId}` : ""}`
    ),
  getByIp: (ipAddress: string) =>
    get<AuditLog[]>(`/api/Audit/ip/${ipAddress}`),
  getCount: (action?: number, success?: boolean) => {
    const params = new URLSearchParams();
    if (action !== undefined) params.append("action", String(action));
    if (success !== undefined) params.append("success", String(success));
    return get<number>(`/api/Audit/count?${params}`);
  },
};

export const notificationsApi = {
  getMy: () => get<NotificationLog[]>("/api/Notifications/my"),
  getMyUnread: () => get<NotificationLog[]>("/api/Notifications/my/unread"),
  getMyByType: (type: number) =>
    get<NotificationLog[]>(`/api/Notifications/my/type/${type}`),
  getPending: () => get<NotificationLog[]>("/api/Notifications/pending"),
  getFailed: () => get<NotificationLog[]>("/api/Notifications/failed"),
  send: (data: object) => post<NotificationLog>("/api/Notifications/send", data),
  markRead: (id: string) => post<void>(`/api/Notifications/${id}/read`),
  retryFailed: () => post<void>("/api/Notifications/retry-failed"),
  delete: (id: string) => del<void>(`/api/Notifications/${id}`),
};

export const institutionDocumentsApi = {
  get: (id: string) => get<InstitutionDocument>(`/api/InstitutionDocuments/${id}`),
  getByInstitution: (institutionId: string) =>
    get<InstitutionDocument[]>(
      `/api/InstitutionDocuments/institution/${institutionId}`
    ),
  getActiveByInstitution: (institutionId: string) =>
    get<InstitutionDocument[]>(
      `/api/InstitutionDocuments/institution/${institutionId}/active`
    ),
  getExpired: () =>
    get<InstitutionDocument[]>("/api/InstitutionDocuments/expired"),
  create: (data: object) =>
    post<InstitutionDocument>("/api/InstitutionDocuments", data),
  update: (id: string, data: object) =>
    put<InstitutionDocument>(`/api/InstitutionDocuments/${id}`, data),
  delete: (id: string) => del<void>(`/api/InstitutionDocuments/${id}`),
  revoke: (id: string, data: object) =>
    post<InstitutionDocument>(
      `/api/InstitutionDocuments/${id}/revoke`,
      data
    ),
};
