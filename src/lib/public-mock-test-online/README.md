# `lib/public-mock-test-online` — Guest MTO (khối B/C/D)

> Chuẩn hóa layer: [MOCK_TEST_LAYER_STANDARDIZATION_TRACKER.md](../../../../ebest-crm-api/docs/modules/mock-test/MOCK_TEST_LAYER_STANDARDIZATION_TRACKER.md)

## Ranh giới

| Khối logic | Files neo | Không làm |
|------------|-----------|-----------|
| **mto-funnel** | `mock-test-online-lead-cookie.ts`, `ssr/fetch-mock-test-online-gateway.server.ts`, intake/select BFF | Không mint `portal_at` |
| **mto-exam-capability** | `mock-test-online-exam-auth-cookie.ts`, `gateway-public-proxy.ts` (authorize) | Không verify portal JWT |
| **mto-bff-crm** | `proxy-public-mock-test-crm.server.ts`, `mock-test-bff-*.ts` | Không raw `getApiBaseUrl` ở route mới |
| **mto-errors** | `mock-test-error-details.ts`, `mock-test-bff-catch-response.ts`, `report-mock-test-client-error.ts` | — |

**Identity (`portal_at`):** chỉ `lib/portal-auth/` + `portal-auth-cookie.ts`.

**Hub authenticated:** `features/portal-mock-test/` (re-export qua `features/mock-test-online/hub`).

**Ownership assert:** `features/portal-mock-test/server/assert-confirm-session-ownership.server.ts` — re-export `features/mock-test-online/shared/server`.

## Cấm

- Import vòng: `portal-auth` ←→ quiz runtime client.
- Gộp ba cookie thành một token.
- `fetch(CRM_API_URL)` mới ngoài `proxy-public-mock-test-crm.server.ts`.
- **Nuốt lỗi** (`catch {}` / return generic) mà không log module + `requestId`.

## Nguyên tắc lỗi (bắt buộc)

1. Mỗi **layer/module** gọi `logMtoLayerError` (hoặc `logAndRethrowMtoError`) với `module` + `operation` + `requestId`.
2. Intermediate (**proxy-crm / proxy-gw / ssr**): **log rồi rethrow** — không map JSON tại giữa stack.
3. Terminal (**BFF Route Handler**): `mockTestBffCatchResponse` — log layer `bff` + trả JSON an toàn + header `X-Request-Id`.
4. Client boundary: `reportMockTestClientError` → BFF `report-client-error` (layer `client`).

Helpers: `mto-layer-error.ts` · `with-mto-bff-request.ts` · `portal-request-context.ts`.
