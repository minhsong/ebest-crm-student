# Tiêu chuẩn code — ebest-student-portal

> **Cập nhật:** 2026-07-07  
> **Umbrella SSOT:** [docs/standards/README.md](../../ebest-crm-api/docs/monorepo/standards/README.md)

---

## Đọc trước (bắt buộc)

| # | Tài liệu | Nội dung |
|---|----------|----------|
| 1 | [ARCHITECTURE_STANDARDS.md](../../ebest-crm-api/docs/monorepo/standards/ARCHITECTURE_STANDARDS.md) | BFF boundary |
| 2 | [SECURITY_STANDARDS.md](../../ebest-crm-api/docs/monorepo/standards/SECURITY_STANDARDS.md) | SP-SEC, cookies |
| 3 | [NEXTJS_PORTAL_STANDARDS.md](../../ebest-crm-api/docs/monorepo/standards/NEXTJS_PORTAL_STANDARDS.md) | **SSOT Portal** |
| 4 | [REACT_CRM_STANDARDS.md](../../ebest-crm-api/docs/monorepo/standards/REACT_CRM_STANDARDS.md) | UI patterns (mirror) |

---

## Tiêu chuẩn riêng Student Portal

| Tài liệu | Nội dung |
|----------|----------|
| [STUDENT_PORTAL_BFF_RESPONSE_SECURITY_SPEC.md](../STUDENT_PORTAL_BFF_RESPONSE_SECURITY_SPEC.md) | SP-SEC-1…6 chi tiết |
| [STUDENT_PORTAL_LEARNING_UI.md](../STUDENT_PORTAL_LEARNING_UI.md) | Learning UI SSOT |
| [QUIZ_RUNTIME_AND_RESULT_VIEW.md](../QUIZ_RUNTIME_AND_RESULT_VIEW.md) | Quiz runtime |
| [LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md](../LEAD_PORTAL_SESSION_AND_MARKETING_SPEC.md) | Lead portal UX |

### Code SSOT (as-built)

| File | Vai trò |
|------|---------|
| `src/lib/crm-student-proxy.ts` | Proxy CRM student API |
| `src/lib/social-gateway-bff.util.ts` | Proxy Gateway |
| `src/lib/portal-bff-get-route.ts` | GET BFF pattern |
| `src/lib/student-safe-errors.ts` | Sanitize lỗi |
| `src/lib/env.ts` | Server-only env |
| `src/contexts/portal-session-context.tsx` | **SSOT identity actor** (guest/lead/customer) |
| `src/lib/portal-auth/portal-session.client.ts` | Client fetch session + logout |
| `src/lib/portal-auth/portal-session-nav.ts` | Home / post-login path helpers |

---

## Identity & BFF master plan

- [AUTHENTICATION_SERVICE_RULE.md](../../ebest-crm-api/docs/architecture/AUTHENTICATION_SERVICE_RULE.md)
- [PORTAL_LOGIN_KEY_AND_BFF_MASTER_PLAN.md](../../ebest-crm-api/docs/monorepo/portal-identity/PORTAL_LOGIN_KEY_AND_BFF_MASTER_PLAN.md)

---

## Shared types

Import `@ebest/crm-api-types` — không mirror local. Xem [SHARED_CODE_STANDARDS.md](../../ebest-crm-api/docs/monorepo/standards/SHARED_CODE_STANDARDS.md).

---

## Checklist nhanh feature mới

- [ ] Route Handler dùng proxy SSOT
- [ ] SP-SEC: mapper + sanitize
- [ ] Không CRM URL / secret ở client
- [ ] httpOnly cookie auth
- [ ] Learning spec nếu thuộc learning

---

## Review PR

[PR_REVIEW_CHECKLIST.md](../../ebest-crm-api/docs/monorepo/standards/PR_REVIEW_CHECKLIST.md) § F
