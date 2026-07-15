'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, App, Button, Card, Form, Input } from 'antd';
import { PhoneInputField } from '@/components/phone-input';
import { leadRegister } from '@/lib/lead-portal/client-api';
import { EbestLogo } from '@/components/branding/EbestLogo';

type FormValues = {
  displayName?: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Props = {
  /**
   * `self-serve` — `/register`: tạo tài khoản không cần mã đăng ký thi.
   * `proof` — `/lead/create-account`: bắt buộc `registrationId` (sau đăng ký thi).
   */
  mode?: 'self-serve' | 'proof';
};

export function LeadCreateAccountClient({ mode = 'proof' }: Props) {
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const registrationIdRaw = Number(searchParams.get('registrationId'));
  const registrationId =
    Number.isFinite(registrationIdRaw) && registrationIdRaw >= 1
      ? registrationIdRaw
      : null;

  const isSelfServe = mode === 'self-serve';
  const canSubmit = isSelfServe || registrationId != null;

  const onFinish = useCallback(
    async (values: FormValues) => {
      if (!isSelfServe && registrationId == null) {
        message.error(
          'Thiếu mã đăng ký thi thử. Vui lòng mở lại từ trang đăng ký.',
        );
        return;
      }
      setLoading(true);
      try {
        const result = await leadRegister({
          ...(registrationId != null ? { registrationId } : {}),
          phone: values.phone.trim(),
          email: values.email.trim(),
          password: values.password,
          ...(values.displayName?.trim()
            ? { displayName: values.displayName.trim() }
            : {}),
        });
        setDone(true);
        message.success(result.message);
      } catch (e) {
        message.error(e instanceof Error ? e.message : 'Đăng ký thất bại.');
      } finally {
        setLoading(false);
      }
    },
    [message, registrationId, isSelfServe],
  );

  if (!canSubmit) {
    return (
      <Card className="mx-auto max-w-md">
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy thông tin đăng ký"
          description="Vui lòng đăng ký thi thử trước, sau đó tạo tài khoản từ liên kết trên trang xác nhận."
        />
        <div className="mt-4 flex gap-2">
          <Link href="/register">
            <Button type="primary">Đăng ký tài khoản</Button>
          </Link>
          <Link href="/mock-test-online/register">
            <Button>Thi thử online</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-md">
        <Alert
          type="success"
          showIcon
          message="Đã tạo tài khoản"
          description="Kiểm tra email để xác nhận, sau đó đăng nhập với chế độ «Chưa học tại Ebest»."
        />
        <Link href="/login?mode=lead" className="mt-4 inline-block">
          <Button type="primary">Đến trang đăng nhập</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-6 flex justify-center">
        <EbestLogo variant="login-hero" />
      </div>
      <h1 className="mb-2 text-center text-lg font-semibold text-gray-900">
        {isSelfServe ? 'Đăng ký tài khoản' : 'Tạo tài khoản theo dõi thi thử'}
      </h1>
      <p className="mb-4 text-center text-sm text-gray-600">
        {isSelfServe
          ? 'Nhập thông tin và mật khẩu để dùng cổng thi thử Ebest.'
          : `Mã đăng ký #${registrationId}. Sử dụng cùng SĐT đã đăng ký buổi thi.`}
      </p>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {isSelfServe ? (
          <Form.Item
            name="displayName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" autoComplete="name" />
          </Form.Item>
        ) : null}
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}
        >
          <PhoneInputField />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input placeholder="email@example.com" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            { min: 8, message: 'Tối thiểu 8 ký tự' },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Nhập lại mật khẩu"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu không khớp'));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          {isSelfServe ? 'Đăng ký' : 'Tạo tài khoản'}
        </Button>
      </Form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link
          href="/login?mode=lead"
          className="text-orange-600 hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </Card>
  );
}
