# `features/mock-test-online` — Shell chuẩn hóa (re-export)

Không đổi App Router URL. Thư mục này là **ranh giới logical** + re-export ổn định.

```text
features/mock-test-online/
  public/          → guest UI/hooks (components/public-mock-test-online)
  hub/             → features/portal-mock-test (Lead/Customer hub)
  shared/server/   → ownership + shared server helpers
```

Import ưu tiên:

```ts
import { resolveConfirmSessionOwnership } from '@/features/mock-test-online/shared/server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/mock-test-online/hub';
```

Path cũ (`@/features/portal-mock-test/...`, `@/components/public-mock-test-online/...`) vẫn hợp lệ.
