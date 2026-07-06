# Gói SEO — Landing thi thử TOEIC online (Public)

> **Cấu hình động:** CRM System Settings key `mock_test_online_seo` (public) + Redis cache CRM + ISR Portal 5 phút.  
> **Không cần deploy code** khi đổi title, description, FAQ, canonical.

## 1. Nơi chỉnh cấu hình

| Kênh | Cách |
|------|------|
| **CRM Admin** | Settings → `mock_test_online_seo` (category `mock_test`) |
| **API public** | `GET /api/v1/public/mock-test-online/seo` |
| **Portal BFF** | `GET /api/public/mock-test-online/seo` |
| **Env override (iframe WP)** | `MOCK_TEST_ONLINE_LANDING_CANONICAL_URL` → force `noindex` + canonical |

Sau khi lưu Settings, CRM xóa Redis key `mock-test:online:seo:v1` — lần request sau build lại cache (TTL mặc định 1h, env `MOCK_TEST_ONLINE_SEO_CACHE_TTL_SEC`).

## 2. Cấu trúc JSON (`mock_test_online_seo`)

```json
{
  "landing": {
    "indexable": true,
    "title": "...",
    "description": "...",
    "canonicalUrl": "https://ebest.edu.vn/...",
    "ogImagePath": "/og-image.png",
    "widgetTitle": "...",
    "widgetIntro": "..."
  },
  "embed": {
    "title": "...",
    "description": "..."
  },
  "faq": [{ "question": "...", "answer": "..." }],
  "schema": {
    "enableFaqPage": true,
    "enableEducationEvent": true,
    "eventName": "...",
    "organizerName": "Ebest English"
  }
}
```

| Field | Ghi chú |
|-------|---------|
| `landing.indexable` | `false` khi nhúng iframe WordPress |
| `landing.canonicalUrl` | Trống → auto `STUDENT_PORTAL_ORIGIN/mock-test-online/register` |
| `faq` + `schema.enableFaqPage` | JSON-LD FAQ trên `/mock-test-online/register` |
| `embed.*` | Metadata `noindex` cho `/exam`, `/verify-email`, … |

## 3. Hành vi Portal

| Route | Metadata |
|-------|----------|
| `/mock-test-online/register` | Landing — index hoặc noindex theo config |
| `/mock-test-online/register/waiting` | Kế thừa layout register |
| `/mock-test-online/exam/*` | Embed noindex + canonical landing |
| `/mock-test-online/verify-email` | Embed noindex |

## 4. WordPress iframe

```html
<iframe
  src="https://student.ebest.edu.vn/mock-test-online/register?campaign=..."
  title="Đăng ký thi thử TOEIC online — Ebest English"
  width="100%"
  height="1200"
  loading="lazy"
  style="border:0;min-height:800px;"
></iframe>
```

**CRM:** đặt `landing.indexable = false`, `canonicalUrl` = URL bài WP.  
**Hoặc Portal env:** `MOCK_TEST_ONLINE_LANDING_CANONICAL_URL=https://ebest.edu.vn/...`

## 5. File code

| Repo | File |
|------|------|
| CRM | `default-settings.config.ts` → `mock_test_online_seo` |
| CRM | `mock-test-online-seo.service.ts` |
| Portal | `lib/public-mock-test-online/seo/*` |
| Portal | `register/layout.tsx`, `MockTestOnlineSeoJsonLd.tsx` |

## 6. Checklist go-live SEO

- [ ] `SITE_URL` / `STUDENT_PORTAL_ORIGIN` đúng production
- [ ] `metadataBase` resolve OG image absolute URL
- [ ] CRM `mock_test_online_seo` title + description theo Yoast WP
- [ ] FAQ schema khớp nội dung trang WP
- [ ] Iframe: `indexable=false` + canonical WP
- [ ] Google Search Console inspect `/mock-test-online/register`
