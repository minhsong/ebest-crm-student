'use client';

import { GoogleLogin } from '@react-oauth/google';
import { App } from 'antd';

import { useAuth } from '@/contexts/auth-context';

type Props = {
  /** Phải nằm trong `<GoogleOAuthProvider clientId={...}>` (xem trang login). */
  onLoggedIn: () => void;
  /** Bọc ngoài (spacing, canh lề). */
  className?: string;
  /** Class cho dòng ghi chú dưới nút Google. */
  noteClassName?: string;
};

/**
 * Nút Google Identity Services (`@react-oauth/google`) → ID token → API `auth/google/login`.
 */
export function LoginGoogleSection({
  onLoggedIn,
  className = '',
  noteClassName = '',
}: Props) {
  const { message: antMessage } = App.useApp();
  const { loginWithGoogle } = useAuth();

  return (
    <div
      className={`flex w-full max-w-sm flex-col items-stretch ${className}`.trim()}
    >
      <div className="flex w-full justify-center [&_iframe]:!max-w-full">
        <GoogleLogin
          type="standard"
          onSuccess={async (cred) => {
            const t = cred.credential;
            if (!t) {
              antMessage.error('Đăng nhập Google thất bại.');
              return;
            }
            try {
              const r = await loginWithGoogle(t);
              if (r.ok) {
                antMessage.success('Đăng nhập thành công.');
                onLoggedIn();
              } else {
                antMessage.error(r.message ?? 'Đăng nhập Google thất bại.');
              }
            } catch {
              antMessage.error('Đăng nhập Google thất bại.');
            }
          }}
          onError={() => {
            antMessage.error('Đăng nhập Google thất bại.');
          }}
          useOneTap={false}
          text="signin_with"
          shape="rectangular"
          size="large"
          theme="filled_blue"
          width={384}
        />
      </div>
      <p
        className={`mt-1.5 text-center text-xs text-gray-500 ${noteClassName}`.trim()}
      >
        Dùng Gmail trùng email đã đăng ký trên cổng học viên.
      </p>
    </div>
  );
}
