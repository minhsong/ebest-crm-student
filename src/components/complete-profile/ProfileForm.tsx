'use client';

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  DatePicker,
  Tag,
  Card,
  Alert,
  App,
} from 'antd';
import dayjs from 'dayjs';
import type { ProfileByTokenResult } from '@/types/profile';

interface ProfileFormProps {
  initialData: ProfileByTokenResult;
  token: string;
}

export function ProfileForm({ initialData, token }: ProfileFormProps) {
  const { customer, availableTags } = initialData;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    customer.tags?.map((t) => t.id) ?? []
  );
  const { message: antMessage } = App.useApp();

  const initialValues = {
    firstName: customer.firstName ?? '',
    lastName: customer.lastName ?? '',
    primaryEmail: customer.primaryEmail ?? '',
    primaryPhone: customer.primaryPhone ?? '',
    dateOfBirth: customer.dateOfBirth
      ? dayjs(customer.dateOfBirth)
      : undefined,
    occupation: customer.occupation ?? '',
    emergencyContact: customer.emergencyContact ?? '',
    emergencyPhone: customer.emergencyPhone ?? '',
    facebookUrl: customer.socialMedia?.find((s) => s.type === 'facebook')?.url ?? '',
    zaloUrl: customer.socialMedia?.find((s) => s.type === 'zalo')?.url ?? '',
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: (values.firstName as string)?.trim() || undefined,
          lastName: (values.lastName as string)?.trim() || undefined,
          primaryEmail: (values.primaryEmail as string)?.trim() || undefined,
          primaryPhone: (values.primaryPhone as string)?.trim() || undefined,
          dateOfBirth: values.dateOfBirth
            ? dayjs(values.dateOfBirth as dayjs.Dayjs).format('YYYY-MM-DD')
            : undefined,
          occupation: (values.occupation as string)?.trim() || undefined,
          emergencyContact: (values.emergencyContact as string)?.trim() || undefined,
          emergencyPhone: (values.emergencyPhone as string)?.trim() || undefined,
          tagIds:
            selectedTagIds.length > 0 ? selectedTagIds : undefined,
          socialMedia: [
            ...((values.facebookUrl as string)?.trim()
              ? [{ type: 'facebook', url: (values.facebookUrl as string).trim() }]
              : []),
            ...((values.zaloUrl as string)?.trim()
              ? [{ type: 'zalo', url: (values.zaloUrl as string).trim() }]
              : []),
          ].filter(Boolean).length
            ? [
                ...((values.facebookUrl as string)?.trim()
                  ? [
                      {
                        type: 'facebook',
                        url: (values.facebookUrl as string).trim(),
                      },
                    ]
                  : []),
                ...((values.zaloUrl as string)?.trim()
                  ? [{ type: 'zalo', url: (values.zaloUrl as string).trim() }]
                  : []),
              ]
            : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json?.message ?? 'Cập nhật thất bại. Vui lòng thử lại.');
        return;
      }
      setSuccess(true);
      antMessage.success('Cập nhật thông tin thành công.');
    } catch {
      setSubmitError('Không thể kết nối. Vui lòng thử lại.');
      antMessage.error('Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-sm">
          <Alert
            type="success"
            showIcon
            message="Cập nhật thành công"
            description="Bạn đã hoàn thành cập nhật thông tin. Cảm ơn bạn và chúc bạn có một khoảng thời gian tuyệt vời tại Ebest. 💖"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">
            Chào mừng bạn đến với Ebest English
          </h1>
          <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
            <p className="mb-2">
              🔸 Để thủ tục ghi danh khóa học diễn ra thuận lợi, bạn vui lòng
              đọc kỹ và điền đúng thông tin vào form bên dưới nhé.
            </p>
            <p className="mb-2">
              🔸 Mọi thắc mắc khi đăng ký, bạn vui lòng nhắn tin qua Fanpage
              E-best English để được hỗ trợ sớm nhất.
            </p>
            <p>Cảm ơn bạn và chúc bạn có một khoảng thời gian tuyệt vời tại Ebest. 💖</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={handleSubmit}
          >
            <Form.Item
              name="firstName"
              label="Họ"
              rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
            >
              <Input placeholder="Họ" maxLength={100} />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Tên"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="Tên" maxLength={100} />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="primaryEmail"
              label="Email"
              rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
            >
              <Input type="email" placeholder="email@example.com" />
            </Form.Item>
            <Form.Item name="primaryPhone" label="Số điện thoại">
              <Input placeholder="0901234567" />
            </Form.Item>
            <Form.Item name="zaloUrl" label="Zalo">
              <Input placeholder="Số Zalo hoặc link" />
            </Form.Item>
            <Form.Item name="facebookUrl" label="Link Facebook">
              <Input type="url" placeholder="https://facebook.com/..." />
            </Form.Item>
            <Form.Item name="occupation" label="Nghề nghiệp">
              <Input placeholder="Nghề nghiệp" />
            </Form.Item>
            <Form.Item name="emergencyContact" label="Người liên hệ khẩn cấp">
              <Input placeholder="Họ tên" />
            </Form.Item>
            <Form.Item name="emergencyPhone" label="SĐT liên hệ khẩn cấp">
              <Input placeholder="Số điện thoại" />
            </Form.Item>

            {availableTags.length > 0 && (
              <Form.Item label="Tags mô tả (tùy chọn)">
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((t) => (
                    <span
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleTag(t.id)}
                      onKeyDown={(e) => e.key === 'Enter' && toggleTag(t.id)}
                      className="cursor-pointer"
                    >
                      <Tag
                        color={selectedTagIds.includes(t.id) ? t.color ?? 'blue' : 'default'}
                      >
                        {t.name}
                      </Tag>
                    </span>
                  ))}
                </div>
              </Form.Item>
            )}

            {submitError && (
              <Alert
                type="error"
                message={submitError}
                className="mb-4"
                showIcon
              />
            )}

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                block
              >
                Xác nhận và hoàn thành
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
