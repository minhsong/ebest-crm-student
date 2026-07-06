import { Suspense } from 'react';
import ForgotPasswordPageClient from './ForgotPasswordPageClient';

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-gray-100 text-gray-500">
          Đang tải…
        </div>
      }
    >
      <ForgotPasswordPageClient />
    </Suspense>
  );
}
