# Ebest Student Portal

Cổng học viên Ebest English (domain riêng, ví dụ: **student.ebest.edu.vn**).  
Dữ liệu load từ API server (SSR) để bảo mật; UI dùng **Ant Design** + **Tailwind CSS**.

## Tech stack

- **Next.js 14** (App Router), **React 18**
- **TypeScript**
- **Ant Design 5** (UI chuẩn)
- **Tailwind CSS**
- Data từ CRM API (SSR, không lộ token/API URL ra client)

## Cấu trúc dự án (mở rộng sau này)

```
src/
├── app/                    # App Router
│   ├── api/                # API routes (proxy / server actions)
│   │   └── profile/        # POST: forward PATCH profile-by-token
│   ├── complete-profile/   # Trang hoàn thiện thông tin (SSR)
│   ├── layout.tsx
│   ├── page.tsx            # Trang chủ
│   └── globals.css
├── components/             # UI components
│   └── complete-profile/   # TokenError, ProfileForm
├── lib/                    # Utilities, server-side API
│   ├── api.ts              # getProfileByToken (SSR)
│   └── env.ts              # getApiBaseUrl (server only)
├── types/                  # TypeScript types
│   └── profile.ts
└── styles/                 # (thêm khi cần) global / theme
```

## Cấu hình env (API URL)

Tạo `.env.local` từ `.env.local.example` và cấu hình:

| Biến | Mô tả | Ví dụ |
|------|--------|--------|
| `CRM_API_URL` | Base URL của CRM API (server-side, không lộ ra client). Dùng cho SSR và API route proxy. | `http://localhost:3001` hoặc `https://api.ebest.edu.vn` |

## Chạy dự án

1. Cài dependency:

   ```bash
   npm install
   ```

2. Tạo file env (copy từ example):

   ```bash
   cp .env.local.example .env.local
   ```

3. Sửa `.env.local`: đặt `CRM_API_URL` trỏ tới API CRM (ví dụ `http://localhost:3001`).

4. Chạy dev:

   ```bash
   npm run dev
   ```

5. Mở [http://localhost:3000](http://localhost:3000). Trang hoàn thiện thông tin:  
   `http://localhost:3000/complete-profile?token=<JWT từ CRM>`.

## Trang hiện có

- **`/`** – Trang chủ (hướng dẫn dùng link).
- **`/complete-profile?token=...`** – SSR: validate token, load profile từ CRM API; nếu token invalid → thông báo lỗi; nếu hợp lệ → form Ant Design cập nhật thông tin.

## Mở rộng sau (Student dashboard)

- Thêm route `/dashboard`, `/courses`, `/schedule`, v.v.
- Auth học viên (session / JWT từ CRM).
- Components tái dùng trong `src/components/`, layout trong `src/app/layout.tsx`.
- API routes trong `src/app/api/` cho các tính năng mới.

## Tài liệu API CRM

- Profile by token: `ebest-crm-api/docs/modules/customer/CUSTOMER_PROFILE_COMPLETION_LINK.md`
