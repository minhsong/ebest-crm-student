# Portal Lead + Mock Test Online — Kế hoạch triển khai & milestone

> **Cập nhật:** 2026-07-05  
> **SSOT nghiệp vụ:** [LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md](./LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md) v1.3  
> **Attempt limit:** [MOCK_TEST_ONLINE_LEAD_ATTEMPT_LIMIT_SPEC.md](../../ebest-crm-api/docs/modules/mock-test/MOCK_TEST_ONLINE_LEAD_ATTEMPT_LIMIT_SPEC.md)  
> **Zalo contact guard:** [MOCK_TEST_ONLINE_ZALO_UNLOCK_CONTACT_GUARD_SPEC.md](../../ebest-crm-api/docs/modules/mock-test/MOCK_TEST_ONLINE_ZALO_UNLOCK_CONTACT_GUARD_SPEC.md)

---

## Tổng quan milestone

| Milestone | Phạm vi | Mục tiêu hoàn thành | Trạng thái |
|-----------|---------|---------------------|------------|
| **M0** | Zalo contact guard | Chặn xác nhận dùm; link contact đúng lead | 🟡 Code ✅ — QA ⬜ |
| **M1** | Portal chrome + session | Cookie → sidebar/header mọi route funnel | ✅ Code |
| **M2** | Auth lead unified | Login self-declaration, logout, forgot password | ✅ Code — QA ⬜ |
| **M3** | Attempt limit + fast path | 3 lượt/testType, in_exam resume, retake Zalo | 🟡 Code ✅ — E2E QA ⬜ |
| **M4** | Portal identity prod | Migration `lead_portal_accounts`, provision, notify | 🟡 Code có — migration staging |
| **M5** | Course catalog P1 | Postgres `portal_course_catalog` + CRM Client admin | ✅ code |

---

## M0 — Zalo contact guard (Gateway + CRM)

**Owner:** Gateway team · **Phụ thuộc:** Mongo Omni, CRM service token

| ID | Việc | Repo | Trạng thái |
|----|------|------|------------|
| M0-1 | Spec ZU-D1…ZU-D5 | `ebest-crm-api/docs/.../MOCK_TEST_ONLINE_ZALO_UNLOCK_CONTACT_GUARD_SPEC.md` | ✅ |
| M0-2 | `evaluateMockTestZaloUnlockContactGuard` + unit test | `ebest-social-gateway` | ✅ |
| M0-3 | `MockTestOnlineZaloUnlockContactGuardService` | `ebest-social-gateway` | ✅ |
| M0-4 | Hook `handleUnlock` trước attach | `mock-test-online-zalo-unlock.service.ts` | ✅ |
| M0-5 | `findLeadIdsForContactPerson` | `omni-identity.service.ts` | ✅ |
| M0-6 | `GET .../exam-owner-customer-ids` | CRM API | ✅ |
| M0-7 | QA manual T1–T6 trên staging Zalo OA | — | ⬜ |
| M0-8 | Activity log blocked (P2) | CRM / logs | 🔒 |

**Definition of Done M0:** Parent Zalo unlock hộ SĐT con → OA từ chối; cùng HV retake → unlock OK.

---

## M1 — Portal chrome & session (Student Portal)

**Owner:** Portal · **Phụ thuộc:** M4 cookie provision (có thể song song)

| ID | Việc | Trạng thái |
|----|------|------------|
| M1-1 | `GET /api/portal/session` cookie-first | ✅ |
| M1-2 | `usePortalSession` hook SSOT | ✅ |
| M1-3 | `PortalChromeGate` bọc `/mock-test-online/*` | ✅ |
| M1-4 | Funnel: lead → `LeadAuthenticatedLayoutClient`; customer → dashboard | ✅ |
| M1-5 | QA: đã login vào `/mock-test-online/register` có sidebar | ⬜ |

---

## M2 — Auth lead unified (CRM + Portal BFF)

| ID | Việc | Trạng thái |
|----|------|------------|
| M2-1 | Self-declaration «HV / Chưa học» trên `/login` | ✅ |
| M2-2 | `POST /api/auth/portal/logout` xóa cả 2 cookie | ✅ |
| M2-3 | Lead forgot-password + change-password (CRM + BFF) | ✅ |
| M2-4 | `/lead/register` → redirect `/login?mode=lead` | ✅ |

**Trade-off M2-1 (BL-Q8):** Portal BFF tách route — `customer` → `POST /student/auth/login`; `lead` → `POST /student/auth/lead/login` (không fallback customer). Google OAuth chỉ hiện khi chọn «Đang là học viên Ebest».

---

## M3 — Attempt limit & exam flow (CRM + Gateway + Portal)

**SSOT:** AL-D1…AL-D7, BL-Q2, BL-Q4

| ID | Việc | Trạng thái |
|----|------|------------|
| M3-1 | `countVerifiedOnlineAttemptsByLeadAndTestType` | ✅ |
| M3-2 | Gate intake/select-exam khi ≥3 lượt | ✅ |
| M3-3 | `findActiveInExamRegistration` — chặn lượt mới | ✅ |
| M3-4 | Fast path `attemptMode=retake_zalo` (cookie, không form) | ✅ |
| M3-5 | UI «Tiếp tục làm bài» resume | ✅ |
| M3-6 | E2E: 3 lượt + in_exam + retake Zalo | ⬜ |

**Trade-off M3-4 (BL-Q4):** Gateway internal `POST .../bootstrap-lead-pending/{omniLeadId}` tạo Redis pending từ Omni lead — không qua intake/recaptcha. Portal redirect qua `GET /api/public/mock-test-online/bootstrap-retake` (set cookie + → select-exam). Lý do chọn GET redirect thay vì Server Action: cookie `mto_pending_lead` chỉ set được từ Route Handler; register page SSR redirect sạch, không duplicate logic client.

**Resume CTA (M3-5):** `MockTestOnlineInExamResumeAlert` / `MockTestResultCard` → `navigateMockTestOnlineResume`: `POST authorize-resume` (BFF inject `omniLeadId`) → `/exam/run?registrationId=&form=`. **Không** qua `confirm-exam` khi đã `in_exam`.

---

## M4 — Portal identity (CRM)

| ID | Việc | Trạng thái |
|----|------|------------|
| M4-1 | Migration `20260705100000-PortalIdentityLeadCustomerLink` | ✅ local DB |
| M4-2 | `LeadPortalProvisionService` sau Zalo | ✅ |
| M4-3 | Notify login bundle sau chấm | ✅ |
| M4-4 | `GET /lead/me` silent upgrade | ✅ |
| M4-5 | Chạy migration staging/prod | ⬜ |

---

## M5 — Course catalog & site links (LP-D12 pivot Postgres)

| ID | Việc | Trạng thái |
|----|------|------------|
| M5-1 | Postgres `portal_course_catalog` + `portal_site_links` | ✅ |
| M5-2 | Redis cache + BFF `handlePortalBffGet` + explore SSOT | ✅ |
| M5-3 | Portal `/lead/courses`, strip, about redirect | ✅ |
| M5-4 | CRM Client admin + menu migration `20260705120000` | ✅ |
| M5-5 | Gỡ Mongo `portal-marketing` khỏi CRM API | ✅ |

---

## Thứ tự triển khai đề xuất

```text
M0 (guard) ──► M4 migration staging
     │
     ├──► M1 chrome ✅
     │
     ├──► M2 login self-declaration ✅ (forgot ⬜)
     │
     └──► M3 attempt limit ✅ (E2E ⬜)
              │
              └──► M5 marketing P1
```

**Song song được:** M0 QA · M4 migration · M3 E2E  
**Tuần tự bắt buộc trước go-live:** M4 migration staging + M0 QA Zalo

---

## Checklist go-live P0 (gộp)

- [ ] M0 QA Zalo guard T1–T6
- [ ] M4 migration staging/prod (`migration:run` — local ✅ no pending)
- [x] M1 chrome funnel có sidebar khi cookie
- [x] M2 logout unified + login self-declaration + lead forgot/change password
- [x] M3 attempt cap + in_exam + retake (code)
- [ ] M3 E2E regression
- [ ] Regression: submit → Zalo/email kết quả → portal login

---

## Cross-ref tracker chi tiết

- [LEAD_PORTAL_WORK_TRACKER.md](./LEAD_PORTAL_WORK_TRACKER.md) — task ID LP-*
- [MOCK_TEST_WORK_TRACKER.md](../../ebest-crm-api/docs/modules/mock-test/MOCK_TEST_WORK_TRACKER.md) — PO online
