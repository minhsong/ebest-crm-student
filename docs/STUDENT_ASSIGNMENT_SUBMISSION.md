# Student Portal — Nộp bài tập

> **Canonical API**: `ebest-crm-api/docs/modules/assignments/STUDENT_PORTAL_SUBMISSIONS_SPEC.md`  
> **Link ngoài**: `ebest-crm-api/docs/modules/assignments/EXTERNAL_LINK_EXERCISE_SPEC.md`  
> **Ngày cập nhật**: 2026-06-05

---

## Code map (portal)

| File | Vai trò |
|------|---------|
| `src/lib/student-submission-policy.ts` | MIME, max bytes, `accept` input, `isExternalLinkExerciseType` |
| `src/features/schedule/components/StudentAssignmentDetailModal.tsx` | UI nộp file / link / mở activity URL |
| `src/app/api/assignments/[id]/submission/link/route.ts` | BFF POST link nộp |
| `src/lib/student-assignment-detail-normalize.ts` | Map `submittedExternalUrl`, `externalLinkActivityUrl` |

**Deprecated**: `student-submission-mime.ts`, `external-link-submission.ts` — re-export từ `student-submission-policy.ts`.

---

## Chính sách file (mirror API)

| Chế độ | MIME | Giới hạn |
|--------|------|----------|
| Bài thường (`student_upload_enabled`) | audio, video, image | 50MB/file |
| `external_link` + upload ảnh | image only | 2MB/file |
| `external_link` + tắt upload | — | POST link (`url` http/https) |

---

## Luồng UI (tóm tắt)

1. Load detail → hiển thị link «Làm bài» nếu có `externalLinkActivityUrl`.
2. Nếu được nộp và chưa `GRADED`:
   - External + upload: chọn ảnh → `POST .../submission`.
   - External + không upload: nhập URL → `POST .../submission/link` (BFF).
   - Bài khác: file/audio record theo spec chung.
3. Sau nộp: refresh detail; CRM thấy attachment hoặc `submittedExternalUrl`.
