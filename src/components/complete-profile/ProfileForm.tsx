'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
import { PhoneInputField } from '@/components/phone-input';
import {
  formRules,
  buildProfilePayload,
  WELCOME,
  MESSAGES,
  FIELD_LIMITS,
} from '@/lib/complete-profile';

const GET_VALUE_PHONE = (v: string | undefined) => v ?? undefined;

interface ProfileFormProps {
  initialData: ProfileByTokenResult;
  token: string;
}

function getSocialUrl(customer: ProfileByTokenResult['customer'], type: string): string {
  return customer.socialMedia?.find((s) => s.type === type)?.url ?? '';
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
    dateOfBirth: customer.dateOfBirth ? dayjs(customer.dateOfBirth) : undefined,
    occupation: customer.occupation ?? '',
    emergencyContact: customer.emergencyContact ?? '',
    emergencyPhone: customer.emergencyPhone ?? '',
    facebookUrl: getSocialUrl(customer, 'facebook'),
    zaloUrl: getSocialUrl(customer, 'zalo'),
  };

  const tagGroups = useMemo(() => {
    type Group = {
      key: string;
      name: string;
      color?: string;
      tags: typeof availableTags;
    };
    const groups: Group[] = [];
    const map = new Map<string, Group>();
    for (const t of availableTags) {
      const key = t.groupKey ?? 'other';
      const existing = map.get(key);
      if (existing) {
        existing.tags.push(t);
        continue;
      }
      const g: Group = {
        key,
        name: t.groupName ?? key,
        color: t.groupColor,
        tags: [t],
      };
      map.set(key, g);
      groups.push(g);
    }
    return groups;
  }, [availableTags]);

  const toggleTag = useCallback((id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      setSubmitError(null);
      setSubmitting(true);
      try {
        const payload = buildProfilePayload(
          token,
          values as Parameters<typeof buildProfilePayload>[1],
          selectedTagIds
        );
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitError(json?.message ?? MESSAGES.updateFailed);
          return;
        }
        setSuccess(true);
        antMessage.success(MESSAGES.updateSuccess);
      } catch {
        setSubmitError(MESSAGES.networkError);
        antMessage.error(MESSAGES.networkError);
      } finally {
        setSubmitting(false);
      }
    },
    [token, selectedTagIds, antMessage]
  );

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-sm">
          <Alert
            type="success"
            showIcon
            message={MESSAGES.successTitle}
            description={MESSAGES.successDescription}
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
            {WELCOME.title}
          </h1>
          <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
            {WELCOME.bullets.map((text, i) => (
              <p key={i} className="mb-2">
                🔸 {text}
              </p>
            ))}
            <p className="mb-0">{WELCOME.closing}</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={handleSubmit}
          >
            <Form.Item name="firstName" label="Họ" rules={formRules.firstName}>
              <Input
                placeholder="Nhập họ"
                maxLength={FIELD_LIMITS.firstName}
                showCount
              />
            </Form.Item>
            <Form.Item name="lastName" label="Tên" rules={formRules.lastName}>
              <Input
                placeholder="Nhập tên"
                maxLength={FIELD_LIMITS.lastName}
                showCount
              />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
              />
            </Form.Item>
            <Form.Item
              name="primaryEmail"
              label="Email"
              rules={formRules.primaryEmail}
            >
              <Input
                type="email"
                placeholder="Nhập email"
                maxLength={FIELD_LIMITS.primaryEmail}
              />
            </Form.Item>
            <Form.Item
              name="primaryPhone"
              label="Số điện thoại"
              rules={formRules.primaryPhone}
              getValueFromEvent={GET_VALUE_PHONE}
            >
              <PhoneInputField
                placeholder="Nhập số điện thoại"
                className="w-full"
              />
            </Form.Item>
            <Form.Item name="zaloUrl" label="Zalo">
              <Input
                placeholder="Số Zalo hoặc link Zalo"
                maxLength={FIELD_LIMITS.socialUrl}
              />
            </Form.Item>
            <Form.Item
              name="facebookUrl"
              label="Link Facebook"
              rules={formRules.facebookUrl}
            >
              <Input type="url" placeholder="https://facebook.com/..." />
            </Form.Item>
            <Form.Item
              name="occupation"
              label="Nghề nghiệp"
              rules={formRules.occupation}
            >
              <Input
                placeholder="Nhập nghề nghiệp"
                maxLength={FIELD_LIMITS.occupation}
              />
            </Form.Item>
            <Form.Item
              name="emergencyContact"
              label="Người liên hệ khẩn cấp"
              rules={formRules.emergencyContact}
            >
              <Input
                placeholder="Nhập họ tên người liên hệ khẩn cấp"
                maxLength={FIELD_LIMITS.emergencyContact}
              />
            </Form.Item>
            <Form.Item
              name="emergencyPhone"
              label="SĐT liên hệ khẩn cấp"
              rules={formRules.emergencyPhone}
              getValueFromEvent={GET_VALUE_PHONE}
            >
              <PhoneInputField
                placeholder="Nhập số điện thoại"
                className="w-full"
              />
            </Form.Item>

            {tagGroups.length > 0 && (
              <Form.Item label="Tags mô tả (tùy chọn)">
                <div className="space-y-4">
                  {tagGroups.map((g) => (
                    <div key={g.key}>
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: g.color ?? '#9ca3af' }}
                        />
                        <span>{g.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {g.tags.map((t) => (
                          <span
                            key={t.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleTag(t.id)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && toggleTag(t.id)
                            }
                            className="cursor-pointer"
                          >
                            <Tag
                              color={
                                selectedTagIds.includes(t.id)
                                  ? t.color ?? 'blue'
                                  : 'default'
                              }
                            >
                              {t.name}
                            </Tag>
                          </span>
                        ))}
                      </div>
                    </div>
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
