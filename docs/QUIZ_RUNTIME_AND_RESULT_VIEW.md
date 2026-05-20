# Student Portal — Quiz runtime, kết quả & tối ưu request

> **Cập nhật:** 2026-05-20  
> **Canonical CRM/Gateway:** `ebest-crm-api/docs/modules/test-quiz/TEST_FORM_SCOPE_DELIVERY_AND_ACCESS.md`  
> **CRM xem kết quả lớp:** `ebest-crm-api/docs/modules/test-quiz/QUIZ_STUDENT_RESULT_LOGIC.md`

---

## 1. Nguyên tắc routing (không `?assignmentId=` trên URL công khai)

| Route | Mục đích |
|-------|----------|
| `/quiz-test/{formPublicId}` | Làm bài — context từ `sessionStorage` + CRM authorize |
| `/quiz-test/{formPublicId}/results` | Danh sách lần làm (bài tập) |
| `/quiz-test/{formPublicId}/attempts/{attemptPublicId}` | Chi tiết một lần làm |

**Quyết định:** Học viên có thể xóa query string; hệ thống **không** phụ thuộc `?assignmentId=` trên link danh sách/kết quả. Assignment được nhớ qua:

1. Snapshot attempt (`assignmentId` trên bản ghi attempt khi có).
2. `sessionStorage` — `quiz-form-context` theo `formPublicId`.
3. CRM `POST /api/student/quiz/authorize` với `intent: access | start` — **ưu tiên slot bài tập** nếu form có assignment hợp lệ, ngược lại practice.

---

## 2. Module & trách nhiệm

| File | Trách nhiệm |
|------|----------------|
| `src/lib/quiz-form-context.ts` | Pin `assignment` / `practice` theo form (session) |
| `src/lib/quiz-runtime-access.ts` | `resolveQuizRuntimeAccess`, cache 60s, `pinAssignmentQuizRuntimeAccess` |
| `src/lib/quiz-runtime-access-cache.ts` | Cache in-memory theo `(form, attempt, practice, intent)` |
| `src/lib/quiz-assignment-action.ts` | Nút Làm bài / Xem kết quả; `loadAssignmentQuizActionStateWithAccess` |
| `src/lib/quiz-attempt-result-bundle.ts` | **Một** resolve access + `Promise.all` form / attempt / eligibility / action |
| `src/features/quiz-test/lib/quiz-result-view-policy.ts` | Pure: `computeCanViewResultDetails`, `getCannotViewResultMessage` |
| `src/features/quiz-test/hooks/useQuizAttemptResultPage.ts` | Hook trang chi tiết kết quả (dùng bundle) |

---

## 3. Tối ưu request (as-built 2026-05-20)

### Trước (nhiều hook → N authorize + lặp history)

Trang `QuizAttemptResultClient` gọi riêng: `useQuizAttemptResultData`, `useQuizDeliveryContext`, `useAssignmentQuizAction`, `useCanViewResultDetails` — mỗi hook có thể `resolveQuizRuntimeAccess` + history + eligibility.

### Sau

1. **`fetchQuizAttemptResultBundle`**: 1× `resolveQuizRuntimeAccess` → song song:
   - `GET forms/{id}/result-layout`
   - `GET attempts/{attemptPublicId}` (kèm `grading` từ Gateway)
   - eligibility CRM (nếu assignment)
   - `loadAssignmentQuizActionStateWithAccess` (không authorize lại)
2. **Cache access 60s** — entry results truyền `access` xuống child; nút bài tập gọi `pinAssignmentQuizRuntimeAccess`.
3. **`useCanViewResultDetails`** — chỉ khi cần kiểm tra quyền **không** có bundle; trang chi tiết dùng `computeCanViewResultDetails` từ dữ liệu bundle.

---

## 4. Quyền xem chi tiết đáp án (học viên)

Logic pure trong `quiz-result-view-policy.ts`:

| Kênh | Quy tắc |
|------|---------|
| **Assignment** | Attempt `submitted` / `expired` → **luôn** xem chi tiết (kể cả hết lượt) |
| **Practice** (không giới hạn lượt) | Có lần nộp → xem |
| **Practice** (có `maxAttempts`) | Xem khi hết lượt **hoặc** điểm tuyệt đối; còn lượt → thông báo khuyến khích làm tiếp |

UI chi tiết:

- Icon đúng/sai trên tiêu đề câu (`QuizResultCorrectIcon` / `QuizResultWrongIcon` — màu inline, tránh Ant Design `currentColor`).
- Chỉ đánh dấu ✓ trên **đáp án đúng**; giữ nguyên radio/checkbox học viên đã chọn.
- Giải thích CRM khi `blueprint.review.showExplanationOnReview`.

---

## 5. Gateway — grading trên attempt

`GET /api/v1/quiz-runtime/attempts/:attemptPublicId` trả về:

```typescript
grading: {
  summary?: { totalQuestions, correctCount, wrongCount, accuracy },
  items?: Array<{
    formItemId,
    isCorrect,
    selectedOptionIds,
    correctOptionIds,  // fallback gradingRules nếu thiếu answerKey Mongo
  }>
}
```

Nguồn: `quiz_question_results` + `QuizResultService.buildGradingViewFromQuestions`.

---

## 6. Authorize CRM

`QuizAuthorizeDto.intent`:

- `access` — xem layout / kết quả / danh sách (cho phép slot assignment ngay cả khi `canStart: false`).
- `start` — bắt đầu attempt mới.

`StudentPortalQuizAuthorizeService`: auto-resolve assignment trước practice khi form có assignment slot.

---

## 7. Tiêu chuẩn code UI

Tuân thủ:

- `ebest-crm-client/docs/standards/REACT_CODE_STANDARDS.md`
- `ebest-crm-client/docs/standards/STANDARD_TABLE_PAGE_PATTERN.md` (pattern hook + tách policy pure)

Component phức tạp: tách policy (`quiz-result-view-policy`), bundle loader (`quiz-attempt-result-bundle`), hook trang (`useQuizAttemptResultPage`).
