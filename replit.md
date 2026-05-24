# منظومة الهوية الرقمية الليبية

نظام إدارة الهوية الرقمية للمواطنين الليبيين — واجهة مشرف لإدارة المواطنين والوثائق والمؤسسات والتحقق من الهوية.

## Run & Operate

- Frontend: `artifacts/libya-id: web` workflow (Vite, port 18331, preview path `/`)
- Backend: External API at `https://localhost:7071/` — يُشغّله المستخدم محلياً
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui + Tailwind v4
- Font: IBM Plex Sans Arabic (Google Fonts)
- Direction: Arabic RTL (`dir="rtl"` on html element)
- API: Raw fetch client in `artifacts/libya-id/src/lib/api.ts` — no codegen (external API)

## Where things live

- `artifacts/libya-id/src/lib/api.ts` — كامل عميل API (Auth, Citizens, Institutions, Documents, Verification, Audit, Notifications, InstitutionDocuments)
- `artifacts/libya-id/src/lib/auth.tsx` — React AuthContext (login/logout/me, token in localStorage)
- `artifacts/libya-id/src/lib/utils.ts` — formatDate/formatDateTime + all Arabic label/color maps
- `artifacts/libya-id/src/index.css` — Libyan green/gold theme, IBM Plex Sans Arabic
- `artifacts/libya-id/src/App.tsx` — Router + providers
- `artifacts/libya-id/src/components/layout.tsx` — Collapsible sidebar + mobile nav

## Architecture decisions

- External API at `https://localhost:7071/` — direct raw fetch, no codegen
- Auth token stored in localStorage as `access_token` / `refresh_token`
- All UI is Arabic RTL — `direction: rtl` set at html and body level
- Sidebar collapses to icon-only mode on desktop; slide-over drawer on mobile
- Each page self-contained with its own TanStack Query hooks

## Product

- **المواطنون**: قائمة، بحث، إضافة، إيقاف، عرض تفاصيل مع الوثائق وطلبات التحقق
- **المؤسسات**: قائمة بطاقات، إضافة، إيقاف، تجديد مفتاح API
- **الوثائق**: إصدار، بحث برقم/QR/معرّف المواطن، عرض المنتهية
- **التحقق**: إنشاء طلبات، موافقة/رفض/إلغاء، فلترة بالحالة
- **سجل الأحداث**: تصفية بالمواطن/المستخدم/IP/التاريخ/الفشل
- **الإشعارات**: عرض/قراءة/حذف، إعادة إرسال الفاشلة

## User preferences

- التطبيق بالكامل باللغة العربية مع دعم RTL
- الألوان: أخضر ليبي (#2e7d52) وذهبي (#D4A017)
- الخط: IBM Plex Sans Arabic

## Gotchas

- API يعمل على `https://localhost:7071/` ويجب أن يكون مُشغّلاً محلياً
- يجب قبول شهادة TLS الخاصة بالـ API قبل استخدام التطبيق (زيارة الرابط مباشرةً في المتصفح)
- تسجيل الدخول يخزن التوكن في localStorage

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
