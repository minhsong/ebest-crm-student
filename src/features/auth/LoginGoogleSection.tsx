'use client';

import { GoogleLogin } from '@react-oauth/google';
import { App } from 'antd';

import { useAuth } from '@/contexts/auth-context';

const COMPLETE_PROFILE_MODAL = {
  passwordOnly: {
    title: 'Tạo tài khoản đăng nhập',
    content:
      'Trung tâm đã lưu đủ thông tin với email Google này. Bạn chỉ cần đặt mật khẩu để tạo tài khoản cổng học viên. Chuyển tới trang đặt mật khẩu?',
  },
  fullForm: {
    title: 'Hoàn thiện hồ sơ học viên',
    content:
      'Trung tâm đã tạo hồ sơ với email này nhưng chưa đủ thông tin. Bạn có muốn mở trang hoàn thiện hồ sơ không?',
  },
} as const;

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
  const { message: antMessage, modal } = App.useApp();
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
              if (!r.ok) {
                antMessage.error(r.message ?? 'Đăng nhập Google thất bại.');
                return;
              }
              if (r.kind === 'complete_profile') {
                const copy =
                  r.reason === 'needs_password'
                    ? COMPLETE_PROFILE_MODAL.passwordOnly
                    : COMPLETE_PROFILE_MODAL.fullForm;
                modal.confirm({
                  title: copy.title,
                  content: copy.content,
                  okText: 'Đồng ý',
                  cancelText: 'Hủy',
                  onOk: () => {
                    window.location.assign(r.completeProfileUrl);
                  },
                });
                return;
              }
              antMessage.success('Đăng nhập thành công.');
              onLoggedIn();
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
        Dùng Gmail trùng email hồ sơ tại trung tâm hoặc tài khoản đã đăng ký cổng học viên.
      </p>
    </div>
  );
}
