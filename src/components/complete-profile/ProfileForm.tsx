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
  Steps,
  Checkbox,
  ConfigProvider,
} from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ProfileByTokenResult, ProfileAddressData } from '@/types/profile';
import { PhoneInputField } from '@/components/phone-input';
import { EBEST_BRAND_ORANGE, FANPAGE_URL } from '@/lib/ui-constants';
import { ebestPublicAntdTheme } from '@/lib/ebest-public-antd-theme';
import { BrandedPublicShell } from '@/components/branding/BrandedPublicShell';
import { CompleteProfileBrandHeader } from './CompleteProfileBrandHeader';
import {
  formRules,
  buildProfilePayload,
  WELCOME,
  MESSAGES,
  FIELD_LIMITS,
  CONSENT_LABEL,
  ADDRESS_CCCD_STEP_NOTE,
} from '@/lib/complete-profile';
import { AddressSection } from './AddressSection';

const GET_VALUE_PHONE = (v: string | undefined) => v ?? undefined;

const STEP_1_FIELDS = [
  'firstName',
  'lastName',
  'nickname',
  'dateOfBirth',
  'primaryEmail',
  'primaryPhone',
  'zaloUrl',
  'facebookUrl',
] as const;

const STEP_2_FIELDS = ['emergencyContact', 'emergencyContactRelationship', 'emergencyPhone'] as const;

const STEP_4_FIELDS = ['termsAccepted'] as const;

const STEP_TITLES: Record<StepNumber, string> = {
  1: 'Thông tin cơ bản',
  2: 'Liên hệ khẩn cấp',
  3: 'Tags mô tả',
  4: 'Thông tin địa chỉ & CCCD',
  5: 'Đặt mật khẩu đăng nhập',
};

const EMERGENCY_GUIDANCE =
  'Thông tin người liên hệ khẩn cấp giúp trung tâm liên lạc với người thân của bạn trong các trường hợp khẩn cấp (ốm đau, tai nạn, v.v.). Vui lòng điền chính xác để được hỗ trợ kịp thời.';

interface ProfileFormProps {
  initialData: ProfileByTokenResult;
  token: string;
  /** 5 = chỉ bước đặt mật khẩu (đã có đủ thông tin hồ sơ). */
  initialStep?: 1 | 5;
}

function getSocialUrl(customer: ProfileByTokenResult['customer'], type: string): string {
  return customer.socialMedia?.find((s) => s.type === type)?.url ?? '';
}

type StepNumber = 1 | 2 | 3 | 4 | 5;

export function ProfileForm({
  initialData,
  token,
  initialStep = 1,
}: ProfileFormProps) {
  const { customer, availableTags } = initialData;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<StepNumber | 'done'>(() =>
    initialStep === 5 ? 5 : 1,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    customer.tags?.map((t) => t.id) ?? []
  );
  const { message: antMessage } = App.useApp();

  const addressData = customer.addressData as ProfileAddressData | undefined;

  const initialValues = useMemo(
    () => ({
      firstName: customer.firstName ?? '',
      lastName: customer.lastName ?? '',
      nickname: customer.nickname ?? '',
      primaryEmail: customer.primaryEmail ?? '',
      primaryPhone: customer.primaryPhone ?? '',
      dateOfBirth: customer.dateOfBirth ? dayjs(customer.dateOfBirth) : undefined,
      identityCardNumber: customer.identityCardNumber ?? '',
      streetAddress: addressData?.streetAddress ?? '',
      provinceCode: undefined as number | undefined,
      provinceName: addressData?.province?.name ?? '',
      provinceCodename: addressData?.province?.codename ?? '',
      wardCode: undefined as number | undefined,
      wardName: addressData?.ward?.name ?? '',
      wardCodename: addressData?.ward?.codename ?? '',
      emergencyContact: customer.emergencyContact ?? '',
      emergencyContactRelationship: customer.emergencyContactRelationship ?? '',
      emergencyPhone: customer.emergencyPhone ?? '',
      facebookUrl: getSocialUrl(customer, 'facebook'),
      zaloUrl: getSocialUrl(customer, 'zalo'),
      termsAccepted: false,
    }),
    [customer, addressData]
  );

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

  const saveProfileAndNext = useCallback(
    async (nextStep: StepNumber) => {
      setSubmitError(null);
      if (step === 1) {
        try {
          await form.validateFields(STEP_1_FIELDS as unknown as string[]);
        } catch {
          return;
        }
      }
      if (step === 2) {
        try {
          await form.validateFields(STEP_2_FIELDS as unknown as string[]);
        } catch {
          return;
        }
      }
      if (step === 4) {
        try {
          await form.validateFields(STEP_4_FIELDS as unknown as string[]);
        } catch {
          return;
        }
      }

      setSubmitting(true);
      try {
        const values = form.getFieldsValue();
        const stepNum = step === 'done' ? 0 : step;
        const fullPayload = buildProfilePayload(
          token,
          values as Parameters<typeof buildProfilePayload>[1],
          stepNum >= 3 ? selectedTagIds : []
        );
        const payload: Record<string, unknown> = { token: fullPayload.token };
        if (stepNum >= 1) {
          Object.assign(payload, {
            firstName: fullPayload.firstName,
            lastName: fullPayload.lastName,
            nickname: fullPayload.nickname,
            primaryEmail: fullPayload.primaryEmail,
            primaryPhone: fullPayload.primaryPhone,
            dateOfBirth: fullPayload.dateOfBirth,
            socialMedia: fullPayload.socialMedia,
          });
        }
        if (stepNum >= 2) {
          Object.assign(payload, {
            emergencyContact: fullPayload.emergencyContact,
            emergencyContactRelationship: fullPayload.emergencyContactRelationship,
            emergencyPhone: fullPayload.emergencyPhone,
          });
        }
        if (stepNum >= 3) {
          payload.tagIds = fullPayload.tagIds;
        }
        if (stepNum >= 4) {
          Object.assign(payload, {
            identityCardNumber: fullPayload.identityCardNumber,
            addressData: fullPayload.addressData,
            termsAccepted: true,
          });
        }
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload as Record<string, unknown>),
        });
        const json = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
        if (!res.ok) {
          setSubmitError(
            json?.code === 'DUPLICATE_EMAIL' ? MESSAGES.duplicateEmail : (json?.message ?? MESSAGES.updateFailed)
          );
          return;
        }
        setStep(nextStep);
        antMessage.success(MESSAGES.updateSuccess);
      } catch (e) {
        if (e && typeof e === 'object' && 'errorFields' in e) return;
        setSubmitError(MESSAGES.networkError);
        antMessage.error(MESSAGES.networkError);
      } finally {
        setSubmitting(false);
      }
    },
    [token, step, form, selectedTagIds, antMessage]
  );

  const handleStepNext = useCallback(() => {
    if (step === 1) saveProfileAndNext(2);
    else if (step === 2) saveProfileAndNext(3);
    else if (step === 3) saveProfileAndNext(4);
    else if (step === 4) saveProfileAndNext(5);
  }, [step, saveProfileAndNext]);

  const handleCreateAccount = useCallback(
    async (values: { password: string }) => {
      setSubmitError(null);
      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/register-by-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: values.password }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSubmitError(json?.message ?? 'Tạo tài khoản thất bại.');
          return;
        }
        setStep('done');
        antMessage.success(MESSAGES.createAccountSuccess);
      } catch {
        setSubmitError(MESSAGES.networkError);
        antMessage.error(MESSAGES.networkError);
      } finally {
        setSubmitting(false);
      }
    },
    [token, antMessage]
  );

  if (step === 'done') {
    return (
      <ConfigProvider theme={ebestPublicAntdTheme}>
        <BrandedPublicShell maxWidthClass="max-w-md" logoPriority>
          <Card
            bordered={false}
            className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/10"
          >
            <Alert
              type="success"
              showIcon
              message={MESSAGES.createAccountSuccess}
              description={
                <>
                  {MESSAGES.createAccountDescription}
                  <br />
                  <a
                    href="/login"
                    className="mt-2 inline-block font-semibold hover:underline"
                    style={{ color: EBEST_BRAND_ORANGE }}
                  >
                    Đi đến trang đăng nhập →
                  </a>
                </>
              }
            />
          </Card>
        </BrandedPublicShell>
      </ConfigProvider>
    );
  }

  if (step === 5) {
    const loginKey =
      (customer.primaryEmail?.trim() || customer.primaryPhone?.trim()) ?? '';
    const loginKeyType = customer.primaryEmail?.trim()
      ? 'Email'
      : customer.primaryPhone?.trim()
        ? 'Số điện thoại'
        : '';

    return (
      <ConfigProvider theme={ebestPublicAntdTheme}>
        <BrandedPublicShell maxWidthClass="max-w-md" logoPriority>
          <Card
            bordered={false}
            className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/10"
            styles={{ body: { padding: 0 } }}
          >
            <CompleteProfileBrandHeader />
            <div className="px-4 py-5 sm:px-6">
          {initialStep === 5 && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="Thông tin hồ sơ đã được lưu"
              description="Bạn chỉ cần đặt mật khẩu để tạo tài khoản đăng nhập cổng học viên."
            />
          )}
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            {STEP_TITLES[5]}
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Tạo mật khẩu để sau này đăng nhập vào cổng học viên.
          </p>

          {loginKey && (
            <div className="mb-6 rounded-lg border-2 border-orange-200 bg-orange-50/70 p-4">
              <div className="mb-2 text-sm font-medium text-gray-600">
                Tên đăng nhập của bạn
              </div>
              <div className="mb-2 text-sm text-gray-600">
                Loại: <span className="font-bold text-gray-800">{loginKeyType}</span>
              </div>
              <div
                className="rounded border border-orange-100 bg-white px-3 py-2.5 text-xl font-bold text-gray-900"
                role="textbox"
                aria-readonly="true"
              >
                {loginKey}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Bạn sẽ dùng thông tin này cùng mật khẩu để đăng nhập.
              </p>
            </div>
          )}

          <Form
            layout="vertical"
            onFinish={handleCreateAccount}
            initialValues={{ password: '', confirmPassword: '' }}
          >
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Ít nhất 6 ký tự' },
              ]}
            >
              <Input.Password placeholder="Mật khẩu" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
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
              <Input.Password placeholder="Nhập lại mật khẩu" />
            </Form.Item>
            {submitError && (
              <Alert type="error" message={submitError} className="mb-4" showIcon />
            )}
            <div className="mt-8 flex justify-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<SafetyCertificateOutlined />}
                className="min-w-[200px]"
              >
                Tạo tài khoản
              </Button>
            </div>
          </Form>
            </div>
          </Card>
        </BrandedPublicShell>
      </ConfigProvider>
    );
  }

  const stepItems = [
    { title: '' },
    { title: '' },
    { title: '' },
    { title: '' },
    { title: '' },
  ];

  return (
    <ConfigProvider theme={ebestPublicAntdTheme}>
      <BrandedPublicShell maxWidthClass="max-w-4xl" logoPriority>
        <Card
          bordered={false}
          className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/10"
          styles={{ body: { padding: 0 } }}
        >
          <CompleteProfileBrandHeader />
          <div className="px-4 py-5 md:px-6 md:py-6">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">{WELCOME.title}</h1>
          <div className="mb-6 rounded-lg border border-orange-100 bg-orange-50/40 p-4 text-sm leading-relaxed text-gray-700">
            {WELCOME.bullets.map((text, i) => (
              <p key={i} className="mb-2">
                🔸{' '}
                {i === 1 ? (
                  <>
                    Mọi thắc mắc khi đăng ký, bạn vui lòng nhắn tin qua{' '}
                    <a
                      href={FANPAGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                      style={{ color: EBEST_BRAND_ORANGE }}
                    >
                      Fanpage E-best English
                    </a>{' '}
                    để được hỗ trợ sớm nhất.
                  </>
                ) : (
                  text
                )}
              </p>
            ))}
            <p className="mb-0">{WELCOME.closing}</p>
          </div>

          <style>{`
            .complete-profile-steps .ant-steps-item-title { font-size: 0; line-height: 0; overflow: hidden; }
            .complete-profile-steps .ant-steps-item-description { display: none; }
          `}</style>
          <Steps
            current={step - 1}
            items={stepItems}
            className="complete-profile-steps complete-profile-steps--numbers mb-0"
            responsive={false}
            size="small"
          />

          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            {STEP_TITLES[step]}
          </h2>

          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={() => handleStepNext()}
          >
            {/* Step content area - spacing for clarity */}
            <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/50 p-6">
              {/* Step 1: Basic info */}
              {step === 1 && (
              <div className="space-y-4">
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
                <Form.Item name="nickname" label="Tên gọi / Tên tiếng Anh" rules={formRules.nickname}>
                  <Input
                    placeholder="VD: Alex, Mary — để giáo viên nước ngoài dễ gọi tên bạn"
                    maxLength={FIELD_LIMITS.nickname}
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
              </div>
            )}

            {/* Step 2: Emergency contact */}
            {step === 2 && (
              <div className="space-y-4">
                <Alert
                  type="info"
                  showIcon
                  message="Vì sao cần thông tin người liên hệ khẩn cấp?"
                  description={EMERGENCY_GUIDANCE}
                  className="mb-4"
                />
                <Form.Item
                  name="emergencyContact"
                  label="Họ tên người liên hệ khẩn cấp"
                  rules={formRules.emergencyContact}
                >
                  <Input
                    placeholder="Nhập họ tên người liên hệ khẩn cấp"
                    maxLength={FIELD_LIMITS.emergencyContact}
                  />
                </Form.Item>
                <Form.Item
                  name="emergencyContactRelationship"
                  label="Mối quan hệ"
                  rules={formRules.emergencyContactRelationship}
                >
                  <Input
                    placeholder="VD: Bố, mẹ, vợ/chồng, anh/chị em..."
                    maxLength={FIELD_LIMITS.emergencyContactRelationship}
                  />
                </Form.Item>
                <Form.Item
                  name="emergencyPhone"
                  label="Số điện thoại liên hệ khẩn cấp"
                  rules={formRules.emergencyPhone}
                  getValueFromEvent={GET_VALUE_PHONE}
                >
                  <PhoneInputField
                    placeholder="Nhập số điện thoại"
                    className="w-full"
                  />
                </Form.Item>
              </div>
            )}

            {/* Step 3: Tags */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Chọn các tag mô tả cơ bản về bạn (tùy chọn). Giúp trung tâm hỗ trợ bạn tốt hơn.
                </p>
                {tagGroups.length > 0 ? (
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
                              onKeyDown={(e) => e.key === 'Enter' && toggleTag(t.id)}
                              className="cursor-pointer"
                            >
                              <Tag
                                color={
                                  selectedTagIds.includes(t.id)
                                    ? (t.color ?? 'orange')
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
                ) : (
                  <p className="text-sm text-gray-500">Không có tag nào để chọn.</p>
                )}
              </div>
            )}

            {/* Step 4: Địa chỉ, CCCD và xác nhận đồng ý */}
            {step === 4 && (
              <div className="space-y-4">
                <Alert
                  type="info"
                  showIcon
                  message={ADDRESS_CCCD_STEP_NOTE.title}
                  description={ADDRESS_CCCD_STEP_NOTE.description}
                  className="mb-4"
                />
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="mb-3 text-sm font-medium text-gray-700">Địa chỉ</div>
                  <AddressSection
                    form={form}
                    initialStreetAddress={addressData?.streetAddress}
                    initialProvinceCodename={addressData?.province?.codename}
                    initialProvinceName={addressData?.province?.name}
                    initialWardCodename={addressData?.ward?.codename}
                    initialWardName={addressData?.ward?.name}
                  />
                </div>
                <Form.Item
                  name="identityCardNumber"
                  label="Số CCCD/CMND"
                  rules={formRules.identityCardNumber}
                >
                  <Input
                    placeholder="Nhập số căn cước công dân (dùng để xuất hóa đơn theo quy định)"
                    maxLength={FIELD_LIMITS.identityCardNumber}
                    showCount
                  />
                </Form.Item>
                <Form.Item
                  name="termsAccepted"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(new Error('Bạn cần tick xác nhận đồng ý để hoàn thành bước này.')),
                    },
                  ]}
                >
                  <Checkbox>{CONSENT_LABEL}</Checkbox>
                </Form.Item>
              </div>
            )}
            </div>

            {submitError && (
              <Alert type="error" message={submitError} className="mb-4" showIcon />
            )}

            {step <= 4 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                {step > 1 && (
                  <Button
                    size="large"
                    onClick={() => setStep((step - 1) as StepNumber)}
                    disabled={submitting}
                    icon={<ArrowLeftOutlined />}
                    className="min-w-[180px]"
                  >
                    Quay lại
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  icon={step === 4 ? <SafetyCertificateOutlined /> : <ArrowRightOutlined />}
                  iconPosition="end"
                  className="min-w-[200px]"
                >
                  {step === 4 ? 'Xác nhận và tiếp tục' : 'Lưu và tiếp tục'}
                </Button>
              </div>
            )}
          </Form>
          </div>
        </Card>
      </BrandedPublicShell>
    </ConfigProvider>
  );
}
