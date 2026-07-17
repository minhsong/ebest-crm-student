'use client';

import { GoogleLogin } from '@react-oauth/google';
import { App } from 'antd';

import { useAuth } from '@/contexts/auth-context';
import { usePortalSession } from '@/contexts/portal-session-context';
import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';

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
  /** `customer` = HV; `lead` = thí sinh (auto xác nhận email). */
  mode?: 'customer' | 'lead';
  /** Phải nằm trong `<GoogleOAuthProvider clientId={...}>` (xem trang login). */
  onLoggedIn: () => void;
  /** Bọc ngoài (spacing, canh lề). */
  className?: string;
  /** Class cho dòng ghi chú dưới nút Google. */
  noteClassName?: string;
};

/**
 * Nút Google Identity Services → ID token → HV hoặc Lead Google login.
 */
export function LoginGoogleSection({
  mode = 'customer',
  onLoggedIn,
  className = '',
  noteClassName = '',
}: Props) {
  const { message: antMessage, modal } = App.useApp();
  const { loginWithGoogle } = useAuth();
  const { refresh: refreshPortalSession } = usePortalSession();

  const note =
    mode === 'lead'
      ? 'Dùng Gmail trùng email đã đăng ký tài khoản thí sinh — hệ thống xác nhận email tự động.'
      : 'Dùng Gmail trùng email hồ sơ tại trung tâm hoặc tài khoản đã đăng ký cổng học viên.';

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
              if (mode === 'lead') {
                const res = await fetch('/api/auth/lead/google/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken: t }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  const code =
                    typeof data?.code === 'string'
                      ? data.code
                      : typeof data?.errorCode === 'string'
                        ? data.errorCode
                        : '';
                  const action =
                    typeof data?.action === 'string' ? data.action : undefined;
                  antMessage.error(
                    getMessageFromClientApiJson(data) ??
                      'Đăng nhập Google thất bại.',
                  );
                  if (
                    action === 'register' ||
                    code === 'LEAD_ACCOUNT_NOT_FOUND'
                  ) {
                    window.setTimeout(() => {
                      window.location.assign('/register');
                    }, 1200);
                  }
                  return;
                }
                await refreshPortalSession();
                antMessage.success('Đăng nhập thành công.');
                onLoggedIn();
                return;
              }

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
        {note}
      </p>
    </div>
  );
}
