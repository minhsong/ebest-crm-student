# Student Portal — Learning UI (tiêu chuẩn triển khai)

> **Cập nhật:** 2026-07-10  
> **Phạm vi:** `ebest-student-portal/src/features/learning/`  
> **SSOT nghiệp vụ:** [docs/vocabulary-learning-platform/VOCABULARY_DRILL_ENGINE_SPEC.md](../../ebest-crm-api/docs/monorepo/vocabulary-learning-platform/VOCABULARY_DRILL_ENGINE_SPEC.md)  
> **SSOT API read-model:** [docs/vocabulary-learning-platform/STUDENT_HUB_VOCABULARY_READ_MODEL.md](../../ebest-crm-api/docs/monorepo/vocabulary-learning-platform/STUDENT_HUB_VOCABULARY_READ_MODEL.md)

---

## 1. Cấu trúc feature (Container / Presentational)

Theo pattern CRM Client (`REACT_CODE_STANDARDS.md` — áp dụng tương đương cho Portal):

| Loại | Trách nhiệm | Ví dụ |
|------|-------------|--------|
| **Container / View** | Fetch data, routing, state chọn item | `SessionVocabularyDetailView`, `LearningHubView`, `FlashcardSessionView` |
| **List item** | Render 1 phần tử, không fetch | `VocabularyWordCard`, `HubMenuCard` |
| **Detail panel** | Nội dung chi tiết thuần UI | `VocabularyWordDetailPanel` |
| **Modal** | Shell Ant Design + panel/hook | `VocabularyWordDetailModal` |
| **Hook** | Data hoặc side-effect tái s dụng | `useSessionVocabulary`, `useVocabularyAudio`, `useLearningHub` |
| **Util** | Pure function hiển thị | `vocabulary-display.util.ts`, `vocabulary-session-routes.ts` |

**Quy tắc:**

- Container giữ `selectedItem` + `setSelectedItem`; modal nhận `open`, `item`, `onClose`.
- Không nhét logic fetch vào `VocabularyWordCard` / `VocabularyWordDetailPanel`.
- CSS theo route/feature: `session-vocabulary-words.css`, `vocabulary-sessions-list.css`, `flashcard-session.css`.

---

## 2. Danh sách từ buổi học (`/learning/vocabulary/sessions/:id`)

### 2.1 Route & data

| Mục | Giá trị |
|-----|---------|
| Route | `/learning/vocabulary/sessions/[classSessionId]?classId=` |
| Legacy | `/learning/sessions/:id/words` → cùng `SessionVocabularyDetailView` |
| API | `GET /api/student/learning/classes/:classId/sessions/:classSessionId/vocabulary` |
| Hook | `useSessionVocabulary({ classId, classSessionId })` |

### 2.2 UI (VD-OP-09)

- **Card grid** (`VocabularyWordCard`): nền trắng, viền `#d9d9d9`, hover nâng + viền xanh — **không** dùng list Ant Design trên nền dashboard.
- **Click card** → `VocabularyWordDetailModal` (destroyOnClose).
- Modal dùng **`VocabularyWordDetailPanel`** — có thể tái s dụng ngoài modal sau này.

### 2.3 Nội dung chi tiết từ (bắt buộc)

| Block | Nguồn field |
|-------|-------------|
| Từ + MasteryBadge | `asset.word`, `progress.masteryState` |
| Ảnh | `asset.imageUrl` |
| Nghĩa | `translation`, `meanings[]` |
| Phát âm UK/US | `ipaUk`, `ipaUs`, `audioUkUrl`, `audioUsUrl` |
| Ví dụ | `example`, `exampleTranslation` |
| Tiến độ | `timesSeen`, `accuracyRate` (0–100), `knownCount`, `unknownCount` |

---

## 3. Tái s dụng vocabulary UI

### 3.1 `vocabulary-display.util.ts`

| Hàm | Mục đích |
|-----|----------|
| `getPrimaryMeaning` | Nghĩa chính (flashcard mặt sau, modal) |
| `getPreviewTranslation` | Dòng phụ trên card list |
| `getExtraMeanings` | Nghĩa phụ trong modal |
| `hasVocabularyPronunciation` | Có hiển thị block phát âm |
| `formatAccuracyPercent` | `accuracyRate` API = 0–100 |

### 3.2 `useVocabularyAudio`

- Hook chung cho **flashcard** và **modal chi tiết từ**.
- Option `active: false` khi đóng modal → dừng audio.
- Flashcard: gọi `stopAudio()` khi đổi index / flip.

### 3.3 `VocabularyPronunciationRow`

- Prop `variant`: `'flashcard' \| 'detail'` — map class CSS tương ứng.
- Dùng bởi `FlashcardFlipCard` và `VocabularyWordDetailPanel`.

---

## 4. Vocabulary Drill (Game Engine)

> SSOT runtime: [GAME_ENGINE_END_TO_END_SPEC.md](../../ebest-crm-api/docs/monorepo/learning-platform/GAME_ENGINE_END_TO_END_SPEC.md) · Gateway ADR [DRILL_RUNTIME_GATEWAY_ADR.md](../../ebest-crm-api/docs/monorepo/vocabulary-learning-platform/DRILL_RUNTIME_GATEWAY_ADR.md)

### 4.1 Route & luồng

| Mục | Giá trị |
|-----|---------|
| Route luyện tự do | `/learning/drill?classId=` |
| Route bài tập | `/learning/drill?assignmentId=` (classId optional) |
| Resume | `?playId=` — `useGameSession` + `resumeGameSession` |
| Authorize (lobby) | `POST /api/student/learning/drill/authorize` |
| Start play | `POST /api/learning-drill-runtime/plays` — BFF gửi `context` từ lobby (GAP-UI-06, không authorize lần 2) |
| Answer | WS primary (`drill-runtime-ws`) · HTTP fallback |
| Timer | `sessionConfig.rules.answerTimeoutSec` — server TIMER_SYNC |

### 4.2 Container / hooks

| Thành phần | Vai trò |
|------------|---------|
| `GameReadyView` / `GamePlayingView` / `GameResultView` | Orchestration theo route segment |
| `useDrillPracticePool` | Pool, assignment context, **authorize + `authorizeContext`** |
| `useDrillPracticeSession` | `useGameSession` adapter — answer UX, pool progress |
| `DrillGameLayout` | HUD + MCQ — presentation registry |
| `VocabularyDrillRunResultScreen` | Router result profile (survival / pool_coverage) |

**Quy tắc:**

- Presentation qua `getVocabularyDrillPresentation(sessionConfig)` — **không** branch `modeId` string trong JSX layout.
- Authorize denied → `sessionConfigError` + Alert (GAP-UI-01) — không skeleton vô hạn.
- `canStart === false` → disable nút Bắt đầu + copy từ `learningAccess`.

### 4.3 CSS & theme

- `drill-survival.css` + `drillAntdCssVars(token)` — token Ant Design, không hardcode màu ngoài theme drill.

---

## 5. Flashcard

| Component | Vai trò |
|-----------|---------|
| `FlashcardSessionView` | Orchestration: authorize → start với `context`, progress, rating |
| `FlashcardFlipCard` | UI flip 3D + pronunciation rows |
| `FlashcardSessionResultScreen` | Result theo presentation profile |
| `getFlashcardReviewPresentation` | Registry mapper từ `sessionConfig` |
| `flashcard-authorize-client.ts` | Prefetch authorize (parity single-authorize với drill) |
| `useVocabularyAudio` | Phát audio UK/US |

Layout CSS: `flashcard-session.css` + class `flashcard-layout--{coreLayoutProfileId}`.

---

## 6. Hub & menu

> **Games Hub:** Route tree mới + reconcile + exit guard — [GAMES_HUB_UX_ARCHITECTURE_SPEC.md](./GAMES_HUB_UX_ARCHITECTURE_SPEC.md) · [GAMES_HUB_IMPLEMENTATION_PLAN.md](./GAMES_HUB_IMPLEMENTATION_PLAN.md). Bảng **as-built** (mục tiêu) bên dưới.

Pattern **dashboard → action → màn chi tiết** (không xử lý nghiệp vụ ngay khi vào route gốc):

| Route gốc | Dashboard | Màn chi tiết |
|-----------|-----------|--------------|
| `/learning` | `LearningHubView` | card → vocabulary / games / assignments |
| `/learning/vocabulary` | `VocabularyDashboardView` | `?classId=&view=sessions` → `VocabularySessionsBrowseView` |
| `/learning/games` | `GameCatalogView` | `[gameSlug]/ready\|playing\|result` |
| `/learning/games/leaderboard` | `LeaderboardDashboardView` | `?classId=` → `DrillLeaderboardView` |
| `/assignments` | dashboard Bài tập | «Duyệt tất cả bài» → cây khóa/lớp/buổi |

### 6.1 Games Hub — route *(Phase B–E3)*

| Route | View | Ghi chú |
|-------|------|---------|
| `/learning/games` | `GameCatalogView` | 4 game; eligibility audio/image; legacy redirect |
| `/learning/games/[gameSlug]/ready` | `GameReadyView` | Mode picker, duration, BXH snapshot top 10, active play banner |
| `/learning/games/[gameSlug]/playing` | `GamePlayingView` | Exit guard (HUD + popstate); image/audio widgets |
| `/learning/games/[gameSlug]/result` | `GameResultView` | CTA chơi lại + game khác |
| `/learning/games/leaderboard` | *(giữ)* | BXH đầy đủ |
| `/learning/games/assignments` | *(giữ)* | |

Redirect: `/learning/games?classId=` → `/meaning-to-word/ready?classId=`; `modeId=best_of` ↔ engine `pool_coverage`.

**Catalog eligibility:** card `audio_to_word` / image games disabled khi pool thiếu media (≥4 từ có file) — counts từ CRM pool summary.

**Exit guard:** HUD + popstate + chặn `<Link>` sidebar khi `in_progress` (`GameExitGuardProvider`).

**Gaming UI (mobile):** `games-hub.css` — catalog card + nút «Chơi ngay», tile picker mode/duration, action bar; padding compact + `safe-area`.

**Legacy (deprecated, không còn route):** `GamesDashboardView`, `DrillPracticeView` — thay bằng catalog + slug routes.

Component dùng chung: `LearningDashboardActionCard` + `learning-dashboard-shared.css`.

| Route | View | API |
|-------|------|-----|
| `/learning` | `LearningHubView` | `GET /api/student/learning/hub` |
| `/learning/vocabulary` | `VocabularyDashboardView` | hub + vocabulary-sessions |
| `/learning/games` | `GameCatalogView` → `[slug]/ready\|playing\|result` | GE vocabulary_drill |
| `/learning/games/leaderboard` | `LeaderboardDashboardView` → `DrillLeaderboardView` | LB-V2 |

**Alias (redirect):** `/learning/practice` → `/learning/games`; `/learning/leaderboard` → `/learning/games/leaderboard`.

**Sidebar:** một mục gốc «Học tập» (submenu) — Tổng quan, Luyện từ vựng, Game luyện từ, Bảng xếp hạng, Bài tập.

Helper route: `vocabulary-session-routes.ts` (`vocabularyPracticeHref`, `vocabularyLeaderboardHref`, `vocabularySessionsBrowseHref`, …).

Hub load thêm `/api/overview/sessions` cho bài sắp hạn (client merge vào `assignmentsDue`).

---

## 7. i18n & copy

- Label UI cố định: **tiếng Việt** (`vi-VN` default).
- Identifier code / API: English.

---

## 8. Ghi chú nghiệp vụ (read-only / lớp kết thúc)

**Quy tắc UX (VD-OP-10):** Không dùng `Alert` full-width lặp trên cùng trang.

| Pattern | Component |
|---------|-----------|
| Icon + Popover (hover/chạm) | `LearningAccessNotice` |
| Icon cạnh tiêu đề / nhãn lớp | `LearningAccessNoticeInline` |
| Một lần / trang | Gắn ở PageHeader hoặc hàng chọn lớp — **không** lặp ở tab con / list con |

Helper: `resolveReadOnlyNoticeMessage(readOnlyReason)` trong `learning-access.ts`.

Các nút bị disable (flashcard, Survival) **đủ** gợi ý trực quan; chi tiết lý do qua icon ℹ️.

---

## 9. Checklist khi thêm màn vocabulary mới

- [ ] Dùng `useSessionVocabulary` hoặc API typed trong `learning-api.ts`
- [ ] Hiển thị từ qua `VocabularyWordCard` + modal/panel — không duplicate pronunciation UI
- [ ] `accuracyRate` format qua `formatAccuracyPercent`
- [ ] Card có contrast với nền trang (nền `#fff`, viền rõ)
- [ ] Cập nhật doc này + `IMPLEMENTATION_STATUS.md` nếu đổi contract UX
