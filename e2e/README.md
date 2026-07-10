# Playwright E2E — Student Portal

## Games Hub (`§10.2` implementation plan)

### Chạy nhanh (redirect / 404 — không cần login)

```bash
npm run dev          # port 3001
npm run test:e2e:public
```

### Chạy đầy đủ (có catalog + deep link)

```powershell
$env:E2E_PORTAL_LOGIN_ID="student@example.com"
$env:E2E_PORTAL_PASSWORD="..."
npm run test:e2e
```

File phiên: `e2e/.auth/student.json` (gitignored).

### Biến môi trường

| Biến | Mặc định | Ghi chú |
|------|----------|---------|
| `E2E_PORTAL_BASE_URL` | `http://localhost:3001` | Portal đang chạy |
| `E2E_PORTAL_LOGIN_ID` | — | Học viên test CRM |
| `E2E_PORTAL_PASSWORD` | — | |
| `E2E_SKIP_WEB_SERVER` | — | Set `1` nếu đã `npm run dev` |

### Ma trận scenario

| ID | File | Cần auth |
|----|------|----------|
| T6 | `public.spec.ts` | Không |
| T11 | `public.spec.ts` | Không |
| T1 | `authenticated.spec.ts` | Có |
| T7–T8 | `authenticated.spec.ts` | Có |
| T2–T5, T9–T10 | `games-hub-acceptance.matrix.test.ts` (vitest) | — |

T2–T5 playing/result/abandon cần mock Gateway — bổ sung sau khi có test harness WS.
