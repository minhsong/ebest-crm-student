# Portal Mock Test Hub — SSOT route & identity

> **Cập nhật:** 2026-07-17  
> **Trạng thái:** P0–P5i triển khai (lead + customer); E2E manual còn mở  
> **Liên quan:** [LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md](./LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md) · [PORTAL_MOCK_TEST_IMPLEMENTATION_ROADMAP.md](./PORTAL_MOCK_TEST_IMPLEMENTATION_ROADMAP.md)

## Mục tiêu

- Gom chức năng thi thử vào namespace **`/mock-test/*`** (actor-agnostic).
- **Lead:** `omniLeadId` + `leadAccountId` — bootstrap online không intake.
- **Customer:** `customerId` — online fast path qua GW bootstrap (P4); offline/results qua student JWT.
- Funnel online + exam giữ **`/mock-test-online/*`** (cookie `mto_*`, exam run).

## Route map (SSOT)

| Route | Vai trò | Auth |
|-------|---------|------|
| `/mock-test` | Hub 3 mục | Lead / Customer JWT |
| `/mock-test/results` | Lịch sử offline + online | Lead / Customer JWT |
| `/mock-test/offline` | Đăng ký tại trung tâm | Lead / Customer JWT |
| `/mock-test/online/start` | Lead / HV → bootstrap funnel (skip intake) | Lead / Customer JWT |
| `/mock-test-online/register` | Intake (guest / HV prefill) | Public / Customer |
| `/mock-test-online/select-exam` | Chọn đề | Funnel cookie |
| `/mock-test-online/confirm-exam` | Zalo unlock | Funnel |
| `/mock-test-online/exam/run` | Làm bài | Exam auth |
| `/mock-test-register` | Marketing iframe | Public |

### Alias legacy

| Cũ | Mới |
|----|-----|
| `/lead/tests` | redirect → `/mock-test/results` |
| `/mock-test-results` | redirect → `/mock-test/results` |

## Identity (`PortalMockTestPrincipal`)

```typescript
type PortalMockTestPrincipal =
  | { actor: 'lead'; omniLeadId: string; leadAccountId: number; profileCompleted: boolean; ... }
  | { actor: 'customer'; customerId: number; displayName: string; }
  | { actor: 'guest' };
```

| Actor | Online | Offline | Results |
|-------|--------|---------|---------|
| Lead | GW `bootstrap-lead-pending` (omniLeadId) | CRM `lead_portal_offline` | CRM `lead/me/test-results` |
| Customer | GW `bootstrap-customer-pending` (customerId) | CRM `customer_portal_offline` | CRM `me/mock-test-results` |

## Gate

- Lead `!profileCompleted` → `/lead/complete-profile`.
- Zalo mỗi lượt — giữ confirm-exam.
- Customer bootstrap phải có `portalCustomerId === session.customer.id`; thiếu hoặc lệch đều fail-closed.
- Lead bootstrap phải có `omniLeadId` khớp lead portal session.
- SSR gate SSOT: `features/portal-mock-test/server/access-guards.server.ts`.

## BFF

| Method | Path | Actor |
|--------|------|-------|
| Server Action | `startPortalOnlineBootstrapAction` (trang `/mock-test/online/start`) | Lead / Customer — **mutation bootstrap POST-only** |
| GET | `/api/mock-test/bootstrap-online` | Shim **@deprecated** — redirect → `/mock-test/online/start` (không side-effect) |
| POST | `/api/mock-test/offline-register` | Student JWT ưu tiên → Lead JWT |
| GET | `/api/public/mock-test-online/attempt-status` | Lead / Customer (inject omniLeadId server-side) |
| GET | `/api/public/mock-test-online/pending/[id]/status` | Funnel cookie ownership (P5h) — poll Zalo |
| POST | `/api/public/mock-test-online/pending/[id]/confirm-session` | Funnel cookie ownership (P5h) — hydrate confirm-exam |
| POST | `/api/public/mock-test-online/select-exam` | Bind body `pendingLeadId` với HttpOnly funnel cookie (P5i) |

> **P5e** — mutation bootstrap tách khỏi HTTP GET để tránh side-effect khi prefetch/duplicate-tab. Trang `online/start` giữ SSR guard read-only (guest → login, lead chưa hồ sơ → complete-profile), rồi client hiển thị spinner «Đang chuẩn bị phòng thi…» và kích Server Action. GW `assertMockTestFunnelGate` vẫn là chốt attempt-limit thẩm quyền (403 → `attemptLimit`); precheck portal là fast-path UX (cho qua khi `in_exam` resume).

### CRM

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/student/lead/mock-test/offline-registrations` | Lead JWT |
| POST | `/api/v1/student/me/mock-test/offline-registrations` | Student JWT |
| GET | `/api/v1/student/lead/me/test-results` | Lead JWT |
| GET | `/api/v1/student/me/mock-test-results` | Student JWT |
| GET | `/api/v1/student/me/mock-test-online/bootstrap-context` | Student JWT — omniLeadId + SĐT (P5c precheck) |
| GET | `/api/v1/student/me/mock-test-online/attempt-status` | Student JWT — read-only cho Hub; không auto-provision Omni |
| GET | `/api/v1/internal/mock-test-online/customers/:id/portal-bootstrap-context` | GW service token |

### Gateway (internal, service token)

| Method | Path |
|--------|------|
| POST | `/api/v1/internal/mock-test-online/leads/:omniLeadId/bootstrap-lead-pending` |
| POST | `/api/v1/internal/mock-test-online/customers/:customerId/bootstrap-customer-pending` |

### Registration source

| Source | Kênh |
|--------|------|
| `public_web` | Marketing offline |
| `public_mock_test_online` | Funnel online guest/lead |
| `lead_portal_offline` | Lead portal `/mock-test/offline` |
| `customer_portal_offline` | HV portal `/mock-test/offline` |

## Code layout

```
features/portal-mock-test/
  routes.config.ts
  identity/
  adapters/route-hrefs.ts      # SSOT href hub theo actor
  server/
    access-guards.server.ts
    assert-funnel-identity.server.ts   # P5b select-exam
    bootstrap-online.server.ts
    start-online-bootstrap.action.ts   # P5e Server Action (POST-only)
    fetch-customer-bootstrap-context.server.ts  # P5c
  components/
    MockTestHub.tsx
    PortalOfflineRegisterForm.tsx
app/mock-test/
  online/start/page.tsx + start-client.tsx  # SSR guard + spinner
```

CRM offline SSOT: `PortalOfflineRegistrationService` (`portal-offline-registration.service.ts`).

## Tracker

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| P0 | Hub, layout, menu, results, alias | ✅ |
| P1 | online/start + bootstrap BFF + redirect register | ✅ |
| P2 | offline lead API + page | ✅ |
| P3 | Customer adapters (`customerId`) + chuẩn hóa reuse | ✅ |
| P4 | GW bootstrap customer online (không intake) | ✅ |
| P5 | Auto-provision omniLead khi HV chưa có lead | ✅ |
| P5b | Assert funnel identity select-exam (lead omni / HV customerId) | ✅ |
| P5c | Precheck attempt-status HV trước bootstrap (CRM bootstrap-context + BFF) | ✅ |
| P5d | Results parity HV: cảnh báo hết lượt + resume `in_exam`; identity customer fail-closed | ✅ |
| P5e | Bootstrap tách khỏi GET → Server Action (POST-only) + spinner; GET shim redirect | ✅ |
| P5f | Legacy `/lead/tests` → `/mock-test/results` (UI + CRM notify); assert identity confirm-exam; route-hrefs incomplete → complete-profile; HV LeadConsultCta parity | ✅ |
| P5g | Hub badge lượt thi/resume (read-only); offline dedup; service-token constant-time | ✅ |
| P5h | confirm-session + pending status bắt buộc funnel cookie/session khớp pending UUID (chống bearer-capability) | ✅ |
| P5i | Chuẩn hóa trust boundary: cookie v2 path `/`; select/confirm/status bind funnel; Gateway sensitive endpoints service-token; history chỉ identity keys; retry DB `23505` idempotent | ✅ |

## QA checklist (M9 hub)

| # | Kịch bản | Kỳ vọng | Auto / Manual |
|---|----------|---------|---------------|
| H1 | Guest `/mock-test` | Redirect login | Manual |
| H2 | Lead hub 3 mục + menu | Hiển thị online/offline/results | Manual |
| H3 | HV hub + menu «Thi thử» | `/mock-test` | Manual |
| H4 | Lead `/mock-test/online/start` | SSR guard → spinner → Server Action bootstrap → select-exam | Manual |
| H5 | HV `/mock-test/online/start` | bootstrap-context → precheck → GW bootstrap (Server Action) | Manual |
| H4b | Prefetch/duplicate-tab trang start | Không tạo pending/omni rác (mutation chỉ ở Server Action POST) | Manual |
| H4c | GET `/api/mock-test/bootstrap-online` (bookmark cũ) | Redirect → `/mock-test/online/start`, không side-effect | Manual |
| H6 | HV hết lượt | Redirect + hiển thị cảnh báo tại `/mock-test/results?notice=attempt_limit` | Manual |
| H7 | Alias `/lead/tests`, `/mock-test-results` | 307 → `/mock-test/results` | Manual |
| H8 | Offline lead + HV | `LEAD_PORTAL_OFFLINE` / `CUSTOMER_PORTAL_OFFLINE` | Manual |
| H9 | Select-exam + confirm-exam identity assert (P5b/P5d/P5f) | Customer id thiếu/lệch → hub; lead omni lệch → online/start | ✅ Unit + Manual |
| H12 | Legacy UI `/lead/tests` hardcode | Không còn trong funnel/UI; alias redirect vẫn giữ | ✅ Code audit |
| H13 | CRM notify `resultsUrl` | `/mock-test/results` (lead + customer) | ✅ Code |
| H14 | Hub online status | Còn lượt / đang làm dở / hết lượt; HV chưa Omni không bị provision | ✅ Unit + Manual |
| H15 | Submit offline lặp lại cùng actor + session | Trả registration cũ với `duplicate=true`, không tạo mới | ✅ Unit + Manual |
| H16 | Gateway service token | So sánh constant-time; sai độ dài/giá trị → reject | ✅ Unit |
| H17 | confirm-session / pending status không cookie hoặc pending lệch | 403; không trả examSessionToken / Zalo secret | ✅ Unit + Manual |
| H18 | Cookie funnel gửi tới page + BFF | `mto_funnel_session_v2` path `/`; dual legacy path cũ | ✅ Unit |
| H19 | Select-exam body pending lệch cookie | 403 `SESSION_MISMATCH`; Gateway không được gọi | ✅ Unit + Manual |
| H20 | Customer history trùng SĐT nhưng khác identity | Không suy đoán ownership theo phone | ✅ Unit |
| H10 | `parseCustomerOnlineBootstrapContext` | Unit vitest | ✅ Auto |
| H11 | Attempt redirect (`blocked` / `in_exam`) | Unit vitest | ✅ Auto |

### Kiểm chứng tự động

```bash
cd ebest-student-portal
npm test
npx tsc --noEmit

cd ../ebest-crm-api
npm run build
```

Ngày 2026-07-17: Mock Test Portal pass 29/29 test; `tsc --noEmit` sạch; CRM ownership/dedup pass 4/4 + API build; Gateway ownership/token/guard pass 14/14 + build/typecheck. P5e–P5i đã áp dụng. Suite Portal tổng có 2 failure tồn tại ở Vocabulary Drill lobby, không thuộc M9.

> Giới hạn P5i: identity lookup + bắt unique violation `23505` xử lý retry/race có SĐT. Customer không SĐT vẫn cần partial unique index `(session_id, customer_id/omni_lead_id)` sau khi audit dữ liệu trùng production; không tự thêm migration có thể fail deploy hoặc tự huỷ dữ liệu.
