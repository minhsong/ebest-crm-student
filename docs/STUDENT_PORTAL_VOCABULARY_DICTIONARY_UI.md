# Student Portal — Từ điển từ vựng (UI)

> **Cập nhật:** 2026-07-13  
> **Trạng thái:** **Phase 1–2 implemented** — xem [VOCABULARY_DICTIONARY_WORK_TRACKER.md](../../ebest-crm-api/docs/monorepo/vocabulary-learning-platform/VOCABULARY_DICTIONARY_WORK_TRACKER.md)
> **Phạm vi:** `ebest-student-portal/src/features/learning/dictionary/`  
> **SSOT logic & API:** [VOCABULARY_DICTIONARY_SPEC.md](../../ebest-crm-api/docs/monorepo/vocabulary-learning-platform/VOCABULARY_DICTIONARY_SPEC.md)  
> **SSOT UI pattern:** [STUDENT_PORTAL_LEARNING_UI.md](./STUDENT_PORTAL_LEARNING_UI.md)  
> **BFF security:** [STUDENT_PORTAL_BFF_RESPONSE_SECURITY_SPEC.md](./STUDENT_PORTAL_BFF_RESPONSE_SECURITY_SPEC.md)

---

## 1. Mục tiêu UI

| Mục tiêu | Mô tả |
|----------|--------|
| Tra từ nhanh | Autocomplete ≤300ms cảm nhận (debounce + suggest API) |
| Tách luồng | Suggest dropdown ≠ trang kết quả ≠ trang chi tiết |
| An toàn dữ liệu | **Không** prefetch hàng loạt; **không** lưu corpus local |
| Tái sử dụng | `VocabularyWordCard`, `VocabularyWordDetailPanel`, `useVocabularyAudio` |

---

## 2. Routes

| Route | View | Mô tả |
|-------|------|--------|
| `/learning/dictionary` | `DictionaryLookupView` | Search bar cố định + empty / kết quả / chi tiết |
| `/learning/dictionary?q={q}` | (cùng view) | Kết quả search (paginated) — search bar giữ nguyên |
| `/learning/dictionary?q=&id=` | (cùng view) | Chi tiết từ **inline** dưới search bar — **không** đổi page |
| `/learning/dictionary/[assetId]` | redirect → `?id=` | Deep link cũ chuyển về trang lookup |

**UX:** Chọn suggest / card → chỉ cập nhật query `id` (`router.replace`); thanh search và input không mất. «Quay lại kết quả» xóa `id`, giữ `q`.

**Menu sidebar** (submenu «Học tập»): **Từ điển** — sau «Tổng quan», trước «Luyện từ vựng».

---

## 3. Cấu trúc feature

| Loại | File (dự kiến) | Trách nhiệm |
|------|------------------|-------------|
| Container | `DictionaryLookupView.tsx` | Shell + search state |
| Container | `DictionarySearchResultsView.tsx` | `search` API + pagination |
| Container | `DictionaryWordDetailView.tsx` | `detail` + optional `progress` |
| Presentational | `DictionarySearchBar.tsx` | Input + suggest dropdown |
| Presentational | `DictionarySuggestDropdown.tsx` | List ≤8 gợi ý |
| Hook | `useDictionarySuggest.ts` | Debounce 300ms → suggest |
| Hook | `useDictionarySearch.ts` | Search on submit / URL `q` |
| Hook | `useDictionaryDetail.ts` | Detail + lazy progress |
| Util | `dictionary-routes.ts` | `dictionaryHref`, `dictionaryWordHref` + `source` |
| Util | `dictionary-bff.mapper.ts` | SP-SEC-1 whitelist CRM → Portal |
| Util | `dictionary-detail.mapper.ts` | Detail → `LearningVocabularyItem` |
| Presentational | `DictionaryPracticeCta.tsx` | Flashcard / drill CTA |
| CSS | `dictionary-lookup.css` | Feature styles |

**Quy tắc:** Không fetch trong `DictionarySuggestDropdown` — nhận props từ hook cha.

---

## 4. Luồng tương tác

### 4.1 Autocomplete (Suggest)

```
User gõ → debounce 300ms
  → if q.length < 2: clear dropdown
  → GET /api/student/learning/dictionary/suggest?q=
  → hiển thị dropdown (max 8)
```

| Hành vi | Chi tiết |
|---------|----------|
| Keyboard ↑↓ | Chọn item dropdown |
| Enter (có selection) | Mở chi tiết inline (`?id=`), giữ search bar |
| Enter (không selection) | `?q=` → danh sách kết quả trên cùng trang |
| Escape | Đóng dropdown |
| Click outside | Đóng dropdown |

**Không** gọi `search` hoặc `detail` khi chỉ gõ suggest.

### 4.2 Search results

- Trigger: Enter trên search bar (không chọn suggest) · click nút «Tìm»
- API: `GET .../dictionary/search?q=&page=`
- UI: grid `VocabularyWordCard` (variant compact — không mastery badge bắt buộc)
- Pagination: Ant Design `Pagination`, max 20/trang — **không** infinite scroll (tránh scrape UX)

### 4.3 Detail (inline trên trang search)

- Trigger: click card · chọn suggest · deep link `/dictionary/[assetId]` (redirect `?id=`)
- UI: thay khối kết quả bằng `DictionaryWordDetailView` — **search bar sticky vẫn hiện**
- API: `GET .../dictionary/[assetId]`
- Panel: `VocabularyWordDetailPanel` mở rộng (synonyms, meaningEn, domain tags)
- Progress: lazy `GET .../progress` — skeleton khi load
- Practice CTA: hiện nút flashcard/drill **chỉ khi** `practice.canPractice === true`
- Quay lại kết quả: xóa `id`, giữ `q` / pagination

---

## 5. Component reuse & mở rộng panel

### 5.1 `VocabularyWordDetailPanel` — bổ sung block

| Block | Field API |
|-------|-----------|
| Nghĩa EN | `meaningEn` |
| Đồng nghĩa | `synonyms[]` |
| Trái nghĩa | `antonyms[]` |
| Domain tags | `domainTags[]` |
| CTA luyện | `practice` |

Giữ nguyên: phát âm, ví dụ, family panel, audio hook.

### 5.2 `VocabularyWordCard` — mode dictionary

Prop `variant="dictionary"`:

- Hiện: word, POS, `translationPreview`, icon audio/ảnh nếu có
- **Ẩn:** `MasteryBadge` (hoặc optional từ progress lazy)

---

## 6. Bảo mật phía client

| Quy tắc | Lý do |
|---------|--------|
| **Không** `localStorage` cache toàn list kết quả | Giảm exfil footprint |
| **Không** prefetch `assetId+1` | Chống sequential scan |
| **Không** loop pagination tự động | Chống scrape |
| Chỉ lưu `recentQueries` ≤10 chuỗi (optional Phase 2) — **không** lưu full detail |
| Không log `q` ra console prod | |

---

## 7. Empty & error states

| Trạng thái | Copy (vi-VN) |
|------------|--------------|
| `q` quá ngắn | «Nhập ít nhất 2 ký tự» |
| Không có kết quả | «Không tìm thấy từ phù hợp trong từ điển Ebest» |
| 429 | «Bạn tra cứu quá nhanh. Vui lòng thử lại sau vài phút.» |
| 403 learning disabled | «Tính năng học tập chưa được bật cho tài khoản này.» |
| Detail 404 | «Từ này không còn trong từ điển.» |

---

## 8. Responsive

| Breakpoint | Layout |
|------------|--------|
| Desktop | Search bar centered max-width 720px; grid 3 cột |
| Tablet | Grid 2 cột |
| Mobile | Grid 1 cột; suggest dropdown full width; sticky search top |

---

## 9. i18n

- Locale mặc định `vi-VN`
- Label UI: tiếng Việt
- Nội dung từ: `translations.vi` + `meaningEn` (toggle «Hiện tiếng Anh» Phase 2)

---

## 10. E2E checklist (dự kiến)

| # | Case |
|---|------|
| 1 | Gõ 2 ký tự → dropdown suggest ≤8 |
| 2 | Enter → trang search có `q` trên URL |
| 3 | Click card → detail URL `/dictionary/[id]` |
| 4 | Detail không render `notes` |
| 5 | `canPractice=false` → không nút drill |
| 6 | Rate limit → toast 429 |

---

## 11. File CSS tokens

Reuse tokens từ `session-vocabulary-words.css`:

- Card border `#d9d9d9`, hover xanh
- Search input height 44px mobile
- Dropdown shadow `0 4px 12px rgba(0,0,0,0.08)`

File riêng: `dictionary-lookup.css` — không duplicate toàn bộ session CSS.

---

**Changelog**

| Ngày | Nội dung |
|------|----------|
| 2026-07-13 | v1.0 — UI spec; tách suggest/search/detail; anti-scrape client rules |
