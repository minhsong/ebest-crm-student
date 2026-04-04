'use client';

import { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { App } from 'antd';

import { useAuth } from '@/contexts/auth-context';

type Props = {
  clientId: string;
  onLinked: () => void;
};

/**
 * Liên kết Google khi đã đăng nhập — email Google phải trùng email hồ sơ (API kiểm tra).
 */
export function ProfileGoogleLink({ clientId, onLinked }: Props) {
  const { message: antMessage } = App.useApp();
  const { linkGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="inline-flex flex-col items-start gap-2">
        <GoogleLogin
          onSuccess={async (cred) => {
            const t = cred.credential;
            if (!t) {
              antMessage.error('Liên kết Google thất bại.');
              return;
            }
            setBusy(true);
            try {
              const r = await linkGoogle(t);
              if (r.ok) {
                antMessage.success(r.message ?? 'Đã liên kết Google.');
                onLinked();
              } else {
                antMessage.error(r.message ?? 'Liên kết thất bại.');
              }
            } finally {
              setBusy(false);
            }
          }}
          onError={() => {
            antMessage.error('Liên kết Google thất bại.');
          }}
          useOneTap={false}
          text="continue_with"
          shape="rectangular"
          size="medium"
        />
        {busy ? <span className="text-sm text-blue-600">Đang xử lý...</span> : null}
      </div>
    </GoogleOAuthProvider>
  );
}
