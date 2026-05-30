# Gói SEO — Landing thi thử TOEIC 2 kỹ năng (Offline, HS/SV)

Trang landing: [thi-thu-toeic-mien-phi-chuan-format-iig-moi-nhat-offline-da-nang](https://ebest.edu.vn/thi-thu-toeic-mien-phi-chuan-format-iig-moi-nhat-offline-da-nang/)  
Form iframe: `https://student.ebest.edu.vn/mock-test-register` (noindex + canonical về URL landing)

**Đối tượng:** học sinh, sinh viên tại Đà Nẵng — thi thử TOEIC Listening & Reading offline tại trung tâm EBest.

---

## 1. Yoast SEO — dán nhanh

| Trường | Nội dung đề xuất |
|--------|------------------|
| **SEO title** | Thi thử TOEIC 2 kỹ năng miễn phí Offline Đà Nẵng \| EBest |
| **Meta description** | Đăng ký thi thử TOEIC L&R offline tại EBest Đà Nẵng — format chuẩn IIG, dành cho học sinh & sinh viên. Chọn lịch, điền form, nhận xác nhận nhanh. |
| **Focus keyphrase** | thi thử toeic đà nẵng |
| **Slug** | Giữ slug hiện tại (đã có backlink) |

**Lưu ý:** Không cần thêm meta `keywords`. Google bỏ qua.

---

## 2. H1 & mở bài (trên WordPress, không trong iframe)

**H1 (thay H2 nếu theme cho phép):**

> Thi thử TOEIC 2 kỹ năng miễn phí — Offline tại Đà Nẵng

**Đoạn mở (150–250 từ, chèn trước iframe):**

Bạn là học sinh hoặc sinh viên và muốn biết trình độ TOEIC trước khi đăng ký thi chính thức? EBest English tổ chức **thi thử TOEIC Listening & Reading (2 kỹ năng) offline** tại trung tâm tại Đà Nẵng — **format và trải nghiệm gần với kỳ thi IIG**, giúp bạn làm quen phòng thi, thời gian và cách làm bài.

Sau khi hoàn thành, bạn nhận **ước lượng điểm** và gợi ý lộ trình ôn luyện phù hợp. Đăng ký trực tuyến bên dưới: chọn cơ sở, chọn buổi thi và điền thông tin — EBest sẽ xác nhận qua điện thoại hoặc Zalo.

---

## 3. FAQ (chèn block FAQ trên WP + schema)

### Ai nên tham gia thi thử TOEIC tại EBest?

Học sinh THPT, sinh viên đại học/cao đẳng và người mới bắt đầu ôn TOEIC muốn đo trình độ L&R trước khi thi chính thức.

### Thi thử gồm những kỹ năng nào?

**Listening & Reading (2 kỹ năng)** — cùng cấu trúc phần thi bạn gặp trong kỳ thi TOEIC quốc tế.

### Thi offline ở đâu?

Tại **trung tâm EBest English, Đà Nẵng**. Bạn chọn cơ sở và khung giờ khi đăng ký trên form.

### Có mất phí không?

Chương trình **thi thử miễn phí** (theo đợt EBest công bố). Chi tiết ưu đãi xem trên trang hoặc khi tư vấn xác nhận đăng ký.

### Cần chuẩn bị gì?

CMND/CCCD hoặc thẻ sinh viên, đến sớm 15 phút. Mang bút chì (tô đáp án) theo hướng dẫn tại phòng thi.

### Làm sao để đăng ký?

Điền form trên trang này (chọn buổi thi, họ tên, SĐT). EBest liên hệ **xác nhận** trước ngày thi.

---

## 4. JSON-LD FAQ (Yoast FAQ block hoặc plugin schema)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Ai nên tham gia thi thử TOEIC tại EBest?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Học sinh THPT, sinh viên và người mới ôn TOEIC muốn đo trình độ Listening & Reading trước kỳ thi chính thức."
      }
    },
    {
      "@type": "Question",
      "name": "Thi thử gồm những kỹ năng nào?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TOEIC Listening & Reading (2 kỹ năng), format gần với kỳ thi IIG."
      }
    },
    {
      "@type": "Question",
      "name": "Thi offline ở đâu?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Tại trung tâm EBest English tại Đà Nẵng; chọn cơ sở khi đăng ký."
      }
    },
    {
      "@type": "Question",
      "name": "Làm sao để đăng ký?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Điền form trên trang, chọn buổi thi và thông tin liên hệ; EBest xác nhận qua điện thoại hoặc Zalo."
      }
    }
  ]
}
```

---

## 5. Event / LocalBusiness (tuỳ chọn)

Nếu Yoast hỗ trợ **Event** hoặc dùng schema plugin:

- `@type`: `EducationEvent` hoặc `Event`
- `name`: Thi thử TOEIC 2 kỹ năng — EBest Đà Nẵng
- `eventAttendanceMode`: `https://schema.org/OfflineEventAttendanceMode`
- `location`: địa chỉ cơ sở EBest (từng location nếu nhiều cơ sở)
- `organizer`: EBest English
- `audience`: `EducationalAudience` — học sinh, sinh viên

---

## 6. Iframe WordPress

```html
<iframe
  src="https://student.ebest.edu.vn/mock-test-register"
  title="Đăng ký thi thử TOEIC 2 kỹ năng offline — EBest Đà Nẵng"
  width="100%"
  height="1200"
  loading="lazy"
  style="border:0;min-height:800px;"
></iframe>
```

- `title` trên iframe giúp accessibility (không thay thế nội dung SEO trên trang cha).
- Nội dung index chính nằm **trên WordPress** (H1, mở bài, FAQ), không phụ thuộc crawl iframe.

---

## 7. Portal (repo)

| File | Vai trò |
|------|---------|
| `src/lib/public-mock-test/seo.constants.ts` | Copy title/description/widget + URL canonical |
| `src/app/mock-test-register/layout.tsx` | `noindex` + canonical |
| `PublicMockTestRegisterForm.tsx` | Tiêu đề & intro HS/SV |

Env (tuỳ chọn): `MOCK_TEST_LANDING_CANONICAL_URL` — xem `.env.local.example`.

---

## 8. Checklist sau khi publish

- [ ] Yoast: title + description như mục 1
- [ ] Một H1 duy nhất trên trang WP
- [ ] 300–800 từ nội dung + FAQ trước/sau iframe
- [ ] Canonical trỏ đúng URL landing (không trùng www/non-www)
- [ ] `PUBLIC_REG_ALLOWED_ORIGINS` CRM có domain `ebest.edu.vn`
- [ ] Test form trên mobile (iframe cao đủ, không cắt nút Gửi)
