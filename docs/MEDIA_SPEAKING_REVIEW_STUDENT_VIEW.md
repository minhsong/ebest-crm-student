# Student Portal — Xem nhận xét bài ghi âm / speaking

> **Spec API & schema:** [MEDIA_SPEAKING_REVIEW_SPEC.md](../../ebest-crm-api/docs/modules/assignments/MEDIA_SPEAKING_REVIEW_SPEC.md)  
> **Trường pronunciation:** [PRONUNCIATION_REVIEW_FIELDS.md](../../ebest-crm-api/docs/modules/assignments/PRONUNCIATION_REVIEW_FIELDS.md)

---

## 1. Khi nào học viên thấy nhận xét?

| Điều kiện | UI |
|-----------|-----|
| `learningAccess.submissionLocked === false` | Không thấy điểm GV, không thấy timeline pronunciation |
| `submissionLocked === true` | Card «Kết quả chấm bài» + danh sách bài nộp + «Xem nhận xét» |

`submissionLocked` do API CRM tính (điểm, note chung, tags, hoặc timeline đã lưu).

---

## 2. Luồng màn hình

1. **Lịch học** → mở bài tập (`StudentAssignmentDetailModal`).
2. Card **Kết quả chấm bài** — điểm, nhận xét chung, tags.
3. **Bài nộp của bạn** — «Bài 1», «Bài 2»:
   - Có nhận xét timeline → **Xem nhận xét**
   - Chưa có → **Phát** (player đơn giản)
4. Modal **Xem nhận xét**:
   - Player audio/video
   - **Chi tiết** (trên): khung shadow, mốc thời gian + nội dung đầy đủ
   - **Danh sách** (dưới): tóm tắt + note một dòng (…); highlight khi đang phát

---

## 3. Hiển thị từng loại nhận xét (chi tiết đoạn)

**Trên:** `timeline-note` — mốc thời gian + note đoạn (nếu có).

**Dưới:** hàng **cột card** (chỉ cột có dữ liệu), thứ tự: **IPA → Liaison → Âm cuối → Stress → Intonation**.

| Cột | Nội dung |
|-----|----------|
| IPA | Tag màu xanh, label catalog |
| Liaison | `word1 ⟷ word2` (+ âm nối) |
| Âm cuối | Tag |
| Stress | Từ + âm tiết **in đậm** |
| Intonation | Câu + mũi tên info (↑↓→) |

**Không** hiện cột/block trống.

---

## 4. Dữ liệu & API

| Nguồn | Field |
|-------|--------|
| `GET /api/assignments/:id` (BFF) | `result`, `learningAccess`, `submission.attachments[].mediaReviewComments` |
| Catalog labels | `GET /api/settings/public` → `pronunciation_review_catalog` |

Normalize: `student-assignment-detail-normalize.ts` — chỉ giữ comment v2 có `commentHasFeedback`.

---

## 5. Component

| File | Vai trò |
|------|---------|
| `StudentTeacherFeedbackCard` | Điểm + note chung |
| `StudentSubmissionReviewList` | Bài 1/2, nút Xem nhận xét |
| `StudentSubmissionMediaReviewModal` | Modal timeline |
| `MediaTimelineReview` | View-only: player + list/detail |
| `MediaCommentActiveDetail` | Khung chi tiết đoạn active |
| `MediaCommentRow` | Dòng list (tóm tắt, không mở detail) |
| `use-pronunciation-catalog.ts` | Load catalog |

---

## 6. Đồng bộ với CRM

Component `media-review` trên portal là **bản view-only** (không export hook chấm). Khi sửa UI xem, cân nhắc đồng bộ `PronunciationFeedbackView` với CRM hoặc tách package chung sau.
