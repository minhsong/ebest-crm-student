# Lead Portal — Work Tracker

> SSOT: [LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md](./LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md) v1.3  
> **Roadmap milestone:** [PORTAL_MOCK_TEST_IMPLEMENTATION_ROADMAP.md](./PORTAL_MOCK_TEST_IMPLEMENTATION_ROADMAP.md)  
> Attempt limit: [MOCK_TEST_ONLINE_LEAD_ATTEMPT_LIMIT_SPEC.md](../../ebest-crm-api/docs/modules/mock-test/MOCK_TEST_ONLINE_LEAD_ATTEMPT_LIMIT_SPEC.md) v1.1  
> Zalo guard: [MOCK_TEST_ONLINE_ZALO_UNLOCK_CONTACT_GUARD_SPEC.md](../../ebest-crm-api/docs/modules/mock-test/MOCK_TEST_ONLINE_ZALO_UNLOCK_CONTACT_GUARD_SPEC.md)  
> Auth register/login + Google: [PORTAL_AUTH_REGISTER_AND_LOGIN_SPEC.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_AUTH_REGISTER_AND_LOGIN_SPEC.md)  
> Cập nhật: 2026-07-16

## Quyết định PM đã chốt

| ID | Nội dung |
|----|----------|
| BL-Q2 / LP-D10 | `in_exam`: không lượt mới; resume nếu còn giờ |
| BL-Q4 / LP-D11 | Fast path: cookie, không đăng ký lại; Zalo mỗi lần |
| BL-Q9 / LP-D12 | ~~Mongo `portal_marketing`~~ → **Postgres** `portal_course_catalog` + `portal_site_links` (2026-07-05 pivot) |
| ZU-D1…ZU-D5 | Zalo unlock contact guard — chặn xác nhận dùm |

## Default (chưa phản hồi — áp dụng P0)

BL-Q1 (tính lượt nếu đã Zalo) · BL-Q8 (login «Chưa học» không fallback customer)

---

## M0 — Zalo contact guard ✅ code / ⬜ QA

| ID | Việc | Trạng thái |
|----|------|------------|
| M0-1 | Spec ZU-D1…ZU-D5 | ✅ |
| M0-2 | Gateway guard util + service + hook unlock | ✅ |
| M0-3 | CRM `GET exam-owner-customer-ids` | ✅ |
| M0-4 | QA T1–T6 staging Zalo | ⬜ |

---

## M1 — Chrome & session (P0)

| ID | Việc | Trạng thái |
|----|------|------------|
| LP-UI-01 | `GET /api/portal/session` cookie-first | ✅ |
| LP-UI-02 | `PortalChromeGate` — sidebar+header khi cookie | ✅ |
| LP-UI-03 | `usePortalSession` hook SSOT | ✅ |

---

## M2 — Auth (P0)

| ID | Việc | Trạng thái |
|----|------|------------|
| LP-UI-04 | Self-declaration login (Segmented HV / Chưa học) | ✅ |
| LP-API-01 | Lead forgot-password + change-password | ✅ |
| LP-API-02 | `POST /api/auth/portal/logout` | ✅ |
| LP-UI-07 | `/lead/register` → `/login?mode=lead` | ✅ |

**Triển khai LP-UI-04:** BFF tách endpoint — `/api/auth/login` (customer only) vs `/api/auth/lead/login` (lead only, BL-Q8).

**Tái sử dụng code (2026-07-05):** `portal-login-api.ts` + `portal-auth-login.server.ts` (login BFF); `student-portal-password-reset.util.ts` (CRM reset JWT); `use-change-password.ts` (HV + lead); `fetch-portal-explore.ts` + `PortalExploreProvider` (1 request); `handlePortalBffGet` (BFF GET); `syncLeadPendingAfterFunnelGate` (GW intake/retake); `unwrapCrmResponseBody` GW `crm-response.util.ts`.

---

## M3 — Attempt limit & exam (P0)

| ID | Việc | Trạng thái |
|----|------|------------|
| LP-EXAM-01 | Attempt count + gate `in_exam` active (CRM+GW) | ✅ |
| LP-EXAM-01b | Session cap `max_attempts_per_phone` (AL-D5) | ✅ |
| LP-EXAM-01c | Gate intake + bootstrap + unlock-consumed | ✅ |
| LP-EXAM-01d | Gateway fail-closed (`MOCK_TEST_ATTEMPT_GATE_FAIL_CLOSED`) | ✅ default |
| LP-EXAM-02 | Fast path cookie + Zalo (`retake_zalo`) | ✅ |
| LP-EXAM-02b | Register pre-check attempt-status (G2) | ✅ |
| LP-EXAM-03 | Resume CTA khi `in_exam` còn giờ | ✅ |
| LP-EXAM-03b | Guest pending — attempt-status select-exam (GW `lead-pending/.../attempt-context`) | ✅ |
| LP-UI-08 | DRY `MockTestOnlineAttemptLimitAlert` + `LeadConsultCta` | ✅ |
| LP-QA-01 | Checklist spec §10 + attempt §6 + ZU §5 | ⬜ |

### Chi tiết LP-EXAM-02 (fast path)

| Thành phần | File / endpoint |
|------------|-----------------|
| GW bootstrap pending | `MockTestOnlineRetakeBootstrapService` · `POST internal/.../leads/:omniLeadId/bootstrap-lead-pending` |
| Portal BFF | `GET /api/public/mock-test-online/bootstrap-retake` |
| Register skip form | `register/page.tsx` — lead cookie → redirect bootstrap |
| Bypass intake mới | `?new=1` trên `/mock-test-online/register` |

### Chi tiết LP-EXAM-03 (resume)

| Thành phần | File / endpoint |
|------------|-----------------|
| BFF attempt-status | `GET /api/public/mock-test-online/attempt-status?testTypeCode=` |
| SSR helper | `fetch-attempt-status.server.ts` |
| UI Alert | `MockTestOnlineInExamResumeAlert.tsx` trên select-exam |

### Chi tiết LP-EXAM-03b (guest funnel attempt-status)

| Thành phần | File / endpoint |
|------------|-----------------|
| GW context | `GET /api/v1/public/mock-test-online/lead-pending/:id/attempt-context` |
| SSR resolver | `resolve-select-exam-attempt-status.server.ts` |
| Shared util | `mock-test-online-attempt-limit.util.ts` |
| UI Alert SSOT | `MockTestOnlineAttemptLimitAlert.tsx` |

### Dev / staging — course catalog Postgres

```bash
# CRM API
npm run migration:run
npm run seed:portal-course-catalog
npm run smoke:portal-course-catalog   # CRM API đang listen
```

Env tùy chọn seed: `PORTAL_SITE_ABOUT_URL`, `PORTAL_SITE_ZALO_URL`, `PORTAL_SITE_MESSENGER_URL`.

**CRM Client:** menu `Portal học viên → Catalog khóa học lead` (`/student-portal/course-catalog`) — migration `20260705120000`.

---

## M4 — Portal identity

| ID | Việc | Trạng thái |
|----|------|------------|
| LP-ID-01 | Migration portal identity staging | ✅ local (no pending) |
| LP-ID-02 | Provision + notify + silent upgrade | ✅ |

---

## M5 — Course catalog & site links (P1)

| ID | Việc | Trạng thái |
|----|------|------------|
| LP-CAT-01 | Migration `portal_course_catalog` + `portal_site_links` | ✅ |
| LP-CAT-02 | CRM public `GET student/portal/explore` (gộp) + legacy paths | ✅ |
| LP-CAT-03 | CRM admin CRUD `/v1/portal-course-catalog` | ✅ |
| LP-CAT-04 | Portal BFF `/api/portal/explore` + `PortalExploreProvider` | ✅ |
| LP-UI-05 | `/lead/courses` card grid + consult Zalo/Messenger | ✅ |
| LP-UI-05b | `/lead/about` redirect → `aboutUrl` ngoài | ✅ |
| LP-UI-05c | `LeadMarketingStrip` dùng site links | ✅ |
| LP-UI-06 | `/lead/profile` | ✅ |
| LP-CAT-05 | CRM Client UI quản lý catalog + upload thumbnail | ✅ |
| LP-DATA-LEG | ~~Mongo `portal_marketing`~~ — đã gỡ CRM (2026-07-05) | ✅ |
| LP-TYPES-01 | Wire types `@ebest/crm-api-types` (attempt + portal + phone) | ✅ |

**Wire types:** `@ebest/crm-api-types/student/mock-test-online` · `student/portal` · `utils/contact-phone` — spec [PORTAL_COURSE_CATALOG_SPEC.md](../../ebest-crm-api/docs/modules/student-portal/PORTAL_COURSE_CATALOG_SPEC.md)

Public endpoints:
- `GET /api/v1/student/portal/explore?locale=vi-VN`
- `GET /api/v1/student/portal/course-catalog?locale=vi-VN`
- `GET /api/v1/student/portal/site-links?locale=vi-VN`

---

## M5b — Course Recommendation Engine (CRE) — SPEC

> SSOT: [COURSE_RECOMMENDATION_ENGINE_SPEC.md](../../ebest-crm-api/docs/modules/student-portal/COURSE_RECOMMENDATION_ENGINE_SPEC.md)

| ID | Việc | Trạng thái |
|----|------|------------|
| CRE-P0a | Taxonomy catalog + band TOEIC v1 | ✅ |
| CRE-P0b | Module `course-recommendation` + pipeline 6 lớp | ✅ |
| CRE-P0c | `GET student/portal/recommendations` (output **2** khóa) | ✅ |
| CRE-P0d | Portal `/lead/courses` block gợi ý | ✅ |
| CRE-P1a | Taxonomy + pipeline 7 chiều + lead tags | ✅ |
| CRE-P1b | CRM Client gợi ý tag + admin preview API | ✅ |
| CRE-P1c | Portal CTA tests → courses, post-exam link | ✅ |
| CRE-P1 | `courseId` catalog + Course `targetTestTypes` | ✅ P1f |
| CRE-P2 | `course_test_affinities` + audience rules + explore merge | ✅ P2 core |
| CRE-P2b | Band guard (TOEIC &lt;350 loại Master) + merge partAnalytics persisted | ✅ |
| CRE-P2ops | Catalog `courseId` CRM UI + `relink:portal-catalog-courses` | ✅ script + form |
| CRE-P2polish | Rules: course/catalog picker + tag search + affinity cache + seed | ✅ |
| CRE-P3 | communication / kids / vstep bands | ⬜ |

---

## Future

| ID | Việc | Trạng thái |
|----|------|------------|
| LP-PROMO-01 | Ưu đãi + countdown | 🔒 Nợ |
| LP-OPS-01 | Admin reset attempt counter | 🔒 P2 |
| ZU-P2-01 | Activity log unlock blocked | 🔒 P2 |

---

## M6 — Portal email / login key conflict (PI-D14, PI-D15) 🟢 Phase 1 done

> SSOT: [PORTAL_LOGIN_KEY_EMAIL_CONFLICT_SPEC.md](../../ebest-crm-api/docs/system/PORTAL_LOGIN_KEY_EMAIL_CONFLICT_SPEC.md) · Tracker: [PORTAL_LOGIN_KEY_IMPLEMENTATION_TRACKER.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_LOGIN_KEY_IMPLEMENTATION_TRACKER.md)

| ID | Việc | Trạng thái |
|----|------|------------|
| M6-0 | Chốt spec + master plan + BL-Q1/2/5/7 | ✅ |
| M6-1 | `PortalLoginKeyResolver` + unit tests | ✅ |
| M6-2 | Complete-profile `PATCH profile-by-token` (W1) | ✅ |
| M6-3 | `PATCH /student/me` email (W2) | ✅ |
| M6-4 | `register-by-token` + lead register (W3–W4) | ✅ |
| M6-5 | Zalo provision guard (W5) | ✅ |
| M6-6 | Portal UI `ProfileForm` — `action` từ BFF (PI-D16) | ✅ |
| M6-7 | CRM `changePrimaryEmail` (W6) | ✅ |
| M6-8 | AC-1…AC-8 QA | ⬜ → [PORTAL_LOGIN_KEY_QA_CHECKLIST.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_LOGIN_KEY_QA_CHECKLIST.md) §2 |
| PL-INTAKE | Lead intake + merge + history | ✅ P0/P1 — [PORTAL_LEAD_INTAKE_AND_MERGE_SPEC.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_LEAD_INTAKE_AND_MERGE_SPEC.md) |
| M6-9a | Internal API `portal/login-key/check` | ✅ |
| M6-9b | Gateway hook create/patch omni | ✅ |
| M6-9c | CRM staff `omni/leads/portal-login-key/check` | ✅ |
| M6-9d | CRM Client merge UI (W14) | ✅ |

**Gate:** M6-1 → M6-2 → M6-6 + M7-10 trước go-live funnel + complete-profile.

---

## M7 — BFF response security (PI-D16, PI-D17) 🟢 Phase 1 done

> SSOT: [STUDENT_PORTAL_BFF_RESPONSE_SECURITY_SPEC.md](./STUDENT_PORTAL_BFF_RESPONSE_SECURITY_SPEC.md)

| ID | Việc | Trạng thái |
|----|------|------------|
| M7-1 | `mapPortalConflictForClient()` | ✅ |
| M7-2 | Fix `proxyLeadAuthenticatedGetJson` passthrough lỗi | ✅ |
| M7-3 | `/api/profile` sanitize + conflict map (gắn M6) | ✅ |
| M7-4 | `/api/me` PATCH sanitize | ✅ |
| M7-5 | Mở rộng `TECHNICAL_MESSAGE_PATTERNS` | ✅ |
| M7-6 | CRM exception copy audit (bỏ «lead»/«HV» user-facing) | ✅ lead auth paths |
| M7-7 | `/api/lead/me` public DTO | ✅ |
| M7-8 | Mock test routes 🔴 sanitize | ✅ |
| M7-9 | SP-SEC AC regression | ⬜ → [PORTAL_LOGIN_KEY_QA_CHECKLIST.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_LOGIN_KEY_QA_CHECKLIST.md) §5 |
| M7-10 | **PI-D18** session DTO SSR-only (BL-Q9) | ✅ |
| M7-11 | Audit client `omniLeadId` → SSR/BFF | ✅ |

---

## M8 — Đăng ký lead + profile gate + Google (P0→P2)

> SSOT: [PORTAL_AUTH_REGISTER_AND_LOGIN_SPEC.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_AUTH_REGISTER_AND_LOGIN_SPEC.md) · Tracker: [PORTAL_AUTH_REGISTER_IMPLEMENTATION_TRACKER.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_AUTH_REGISTER_IMPLEMENTATION_TRACKER.md)

| ID | Việc | Trạng thái |
|----|------|------------|
| M8-P0 | `profile_completed_at` + gate layout + wizard register | 🟡 Code local — migration ✅ local |
| M8-P1 | Ẩn Google khi login mode=lead; post-login redirect gate | ✅ |
| M8-P2 | Lead Google register-or-login + finalize | ⬜ Planned |
| M8-P3 | Lead Google login (`google_sub`) | ⬜ Backlog |

**Gate:** Chạy migration `20260716130000` trước deploy Portal M8-P0.

---

## Việc mở P0 (go-live)

1. **M0-4 / LP-QA-01** — QA Zalo guard T1–T6 trên staging  
2. ~~**LP-ID-01** — Migration portal identity~~ ✅ `npm run migration:run` local — **no pending** (staging/prod: chạy cùng lệnh trước deploy)  
3. **M6 + M7 Phase 1** — email conflict + BFF sanitize (gate: [PORTAL_LOGIN_KEY_AND_BFF_MASTER_PLAN.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_LOGIN_KEY_AND_BFF_MASTER_PLAN.md) §Gate 0)  
4. **LP-QA-01** — E2E checklist bên dưới

---

## LP-QA-01 — Checklist E2E (P0 go-live)

| # | Kịch bản | Kỳ vọng | Trạng thái |
|---|----------|---------|------------|
| Q1 | Guest vào `/mock-test-online/register` | Form intake | ⬜ |
| Q2 | Lead cookie → `/mock-test-online/register` | Fast path → select-exam (không form) | ⬜ |
| Q3 | Retake lượt 2–3 | Zalo mỗi lần; cap 3 lượt/testType | ⬜ |
| Q4 | Đang `in_exam` còn giờ | CTA «Tiếp tục làm bài»; không mở lượt mới | ⬜ |
| Q5 | Login Segmented HV / Chưa học | Đúng endpoint; lead không fallback customer | ⬜ |
| Q6 | Lead forgot → reset email | `?mode=lead` trên link; đăng nhập lại OK | ⬜ |
| Q7 | Zalo guard T1–T6 | Parent unlock hộ → chặn; cùng HV retake OK | ⬜ |
| Q8 | Đã login funnel | Sidebar chrome hiển thị | ⬜ |
| Q9 | Logout unified | Xóa cả `student_portal_at` + `lead_portal_at` | ✅ P0 — UI/`AuthProvider`/`leadLogout` → `portal/logout`; alias logout routes clear cả hai; login set cookie xóa sibling |
| Q10 | Silent upgrade lead→customer | Cookie đổi; dashboard HV | ⬜ |
| Q11 | Complete-profile email trùng (bất kỳ nguồn portal) | 409 `EMAIL_ALREADY_IN_SYSTEM` + nút Đăng nhập; **cùng message** mọi case | ⬜ M6+M7 |
| Q12 | *(gộp Q11)* — không phân biệt HV vs lead trên client | SP-AC-2 | ⬜ M7 |
| Q13 | Lead register email trùng HV | 409, không tạo account | ⬜ M6 |
| Q14 | Complete-profile 409 — response không chứa lead/customer/omni | SP-AC-1 | ⬜ M7 |
| Q15 | Cùng email trùng HV vs lead — message client giống nhau | SP-AC-2 | ⬜ M7 |
