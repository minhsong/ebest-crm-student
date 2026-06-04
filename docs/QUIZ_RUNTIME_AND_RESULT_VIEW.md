# Student Portal — Quiz runtime, kết quả & tối ưu request

> **Cập nhật:** 2026-06-03  
> **Tracker:** [QUIZ_WORK_TRACKER.md](../../ebest-crm-api/docs/modules/test-quiz/QUIZ_WORK_TRACKER.md)  
> **Canonical CRM/Gateway:** [TEST_FORM_SCOPE_DELIVERY_AND_ACCESS.md](../../ebest-crm-api/docs/modules/test-quiz/business/TEST_FORM_SCOPE_DELIVERY_AND_ACCESS.md)  
> **CRM xem kết quả lớp:** [QUIZ_STUDENT_RESULT_LOGIC.md](../../ebest-crm-api/docs/modules/test-quiz/business/QUIZ_STUDENT_RESULT_LOGIC.md)

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
| `src/lib/quiz-assignment-action.ts` | Nút Làm bài / Xem kết quả (modal, results); `loadAssignmentQuizActionStateWithAccess` |
| `src/lib/assignment-list-row-actions.ts` | Pure: `deriveAssignmentListRowAction` cho `/assignments` |
| `src/features/schedule/components/AssignmentOverviewRowActions.tsx` | Nút list (Làm bài / Chi tiết) không fetch async |
| `src/lib/quiz-attempt-result-bundle.ts` | **Một** resolve access + `Promise.all` form / attempt / eligibility / action |
| `src/features/quiz-test/lib/quiz-result-view-policy.ts` | Pure: `computeCanViewResultDetails`, `getCannotViewResultMessage` |
| `src/features/quiz-test/hooks/useQuizAttemptResultPage.ts` | Hook trang chi tiết kết quả (dùng bundle) |

---

## 3. Tối ưu request (as-built 2026-05-20)

### Trước (nhiều hook → N authorize + lặp history)

Trang `QuizAttemptResultClient` gọi riêng: `useQuizAttemptResultData`, `useQuizDeliveryContext`, `useAssignmentQuizAction`, `useCanViewResultDetails` — mỗi hook có thể `resolveQuizRuntimeAccess` + history + eligibility.

### Sau (2026-06 — Mongo SSOT)

1. **`GET attempts/{attemptPublicId}/review-bundle`** (Gateway): một response gồm `formPayload`, `attempt` + `grading`, `access`, `quizAttemptStats` (alias `assignmentStats` / `practiceStats`).
2. Portal `fetchQuizAttemptResultBundle`: dùng **stats embed** cho gate xem đáp án (D41) — **không** gọi thêm `assignment-quiz-stats` / CRM eligibility khi có stats.
3. **Không** gọi CRM `quiz-eligibility` / GET attempt trùng trên trang chi tiết kết quả.
4. **`examSnapshot`** trên `quiz_attempt_results` — layout slim + `grading.rules` pin lúc start; nội dung câu + `studentAnswer` SSOT tại `quiz_question_results`.
5. **BFF authorize cache 60s** — proxy `forms/*` không lặp CRM; `review-bundle` chỉ verify ownership qua `customerId`.
6. **Danh sách lần làm** (trang `/quiz-test/.../results` hoặc modal chi tiết bài): `assignment-quiz-stats` + `quiz-start-eligibility` qua `AssignmentQuizActionButtons` — **không** dùng trên list lớp.
7. **`/assignments` (danh sách lớp)**: **một** `GET overview/sessions`; nút từ `deriveAssignmentListRowAction` + `AssignmentOverviewRowActions` — **không** gọi eligibility/stats theo từng dòng (D14).

**API & troubleshooting:** [QUIZ_API_AND_OPS_REFERENCE.md](../../ebest-crm-api/docs/modules/test-quiz/runtime/QUIZ_API_AND_OPS_REFERENCE.md).

---

## 3.1 Đồng bộ điểm bài tập (lần làm gần nhất)

### Chấm lại toàn bộ khi nộp bài (2026-05)

Khi chuyển `in_progress` → `submitted`, Gateway **luôn chấm lại mọi câu** từ snapshot mới nhất:

- Module: `ebest-social-gateway/src/quiz-grading/quiz-grading.utils.ts` (`gradeAllQuestionsOnSubmit`).
- `submitAttempt` chấm từ `examSnapshot.grading.rules` + `studentAnswer` trên `quiz_question_results` (sau PATCH realtime), không chỉ closure React trên portal.
- Portal: `answersRef` + `await patchAnswersImmediately` trước `POST submit` (body kèm `answersByFormItemId`).
- Gateway `submitAttempt`: nếu có `answersByFormItemId` → `patchAnswers` rồi `gradeAllQuestionsOnSubmit` trên **toàn bộ** question rows; khóa WS khi `submitting`.

Sau `POST attempts/:id/submit` thành công (bài tập có `assignmentId`):

1. Gateway chấm + lưu Mongo → `saveQuizResult` → CRM internal sync (nếu `participant.snapshot.assignmentId` hợp lệ).
2. Portal `useQuizAttemptRuntime`: **`await`** `postQuizResultSync(assignmentId, attemptPublicId)` → BFF → CRM `syncAfterQuizSubmit` (đọc attempt từ Gateway `with-questions`).

CRM `upsertQuizGradedSync` chỉ cập nhật khi `submittedAt` attempt **≥** bản ghi hiện có — tránh race hai đường sync hoặc retry muộn ghi đè lần mới hơn.

**Quy tắc điểm trên lớp:** luôn phản ánh **lần nộp gần nhất** (không lấy điểm cao nhất). Spec: [ASSIGNMENT_TEST_ONLINE_LINK_SPEC.md §10.5](../../ebest-crm-api/docs/modules/assignments/ASSIGNMENT_TEST_ONLINE_LINK_SPEC.md).

### Timer & hết giờ (2026-06-03)

- **SSOT:** server — [QUIZ_RUNTIME_TIMER_AND_EXPIRE.md](../../ebest-crm-api/docs/modules/test-quiz/runtime/QUIZ_RUNTIME_TIMER_AND_EXPIRE.md).
- **Mục tiêu:** auto-submit + chấm tại `deadlineAt` trên Gateway; Portal đồng bộ countdown qua WS khi reconnect tab.
- **As-built:** countdown client + auto-submit khi tab active; server scheduler chỉ `expired` tại `expiresAt` (chưa chấm) — tracker **R4/R5**.
- **Nháp đáp án:** Mongo `quiz_question_results` (không Redis). Pattern `quiz:attempt:*` trên Gateway chỉ dọn ephemeral khi finalize.

---

## 3.2 Trang `/assignments` — nút hành động

| Hàm / component | Vai trò |
|-----------------|--------|
| `assignmentHasGradedSummary(row)` | `GRADED` hoặc có `scoreDisplay` |
| `deriveAssignmentListRowAction(row)` | `quiz_start` \| `detail` |
| `AssignmentOverviewRowActions` | Render Link Làm bài hoặc mở modal Chi tiết |

```text
QUIZ + formPublicId + chưa có điểm CRM → Làm bài
còn lại → Chi tiết (modal có AssignmentQuizActionButtons)
```

File: `src/lib/assignment-list-row-actions.ts`, `src/lib/assignment-quiz-ui.ts`.

---

## 4. Quyền xem chi tiết đáp án (học viên) — **D41 / SSOT**

> **Quyết định đã chốt:** không phân biệt assignment vs practice cho rule xem đáp án.  
> Tracker cũ ghi nhầm “assignment đã nộp → luôn xem” — **không** áp dụng.

Logic pure trong `quiz-result-view-policy.ts`:

| Kênh | Quy tắc (thống nhất) |
|------|----------------------|
| **Assignment** & **Practice** | Chỉ xem chi tiết đáp án khi thỏa **một trong hai**: (1) `submittedCount >= maxAttempts` (**hết lượt thử**), **hoặc** (2) `hasPerfectScore` (**có bài 100%**). Còn lượt và chưa 100% → ẩn đáp án. |
| **maxAttempts** | Bài tập: ưu tiên `quizMaxAttempts` từ assignment (authorize / snapshot). Ôn luyện: `practiceMaxAttempts` trên đề publish (authorize / snapshot). Không giới hạn (`null`): chỉ mở chi tiết khi `hasPerfectScore`. |

| Module | Vai trò |
|--------|---------|
| `quiz-result-view-policy.ts` | SSOT pure: `isQuizResultDetailEligible`, `buildQuizEligibilityFromGatewayStats`, `resolveQuizMaxAttempts` |
| `QuizAttemptHistoryList` | `allowDetailLinks={false}` khi chưa đủ D41 — **không** bọc `Link` tới `/attempts/{id}` |
| `quiz-runtime-eligibility.ts` | `fetchQuizEligibilityForAccess` — gọi Gateway (+ CRM fallback assignment) |
| `quiz-gateway-stats.ts` | `fetchGatewayQuizStats({ channel })` |
| `useQuizResultViewGate` | Hook UI: `allowDetailLinks` cho list / nút |
| Gateway `review-bundle` | `quizAttemptStats` (+ alias `assignmentStats` / `practiceStats`) |

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
