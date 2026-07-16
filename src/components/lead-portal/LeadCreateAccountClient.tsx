'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Space,
  Steps,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { PhoneInputField } from '@/components/phone-input';
import { LeadPortalShell } from '@/components/lead-portal/LeadPortalShell';
import { checkLoginKeyAvailability } from '@/lib/complete-profile/check-login-key';
import { leadRegister } from '@/lib/lead-portal/client-api';
import {
  clearLeadRegisterDraft,
  LEAD_REGISTER_STEP_1_FIELDS,
  LEAD_REGISTER_STEP_1_FIELDS_PROOF,
  LEAD_REGISTER_STEP_2_FIELDS,
  LEAD_REGISTER_STEP_TITLES,
  loadLeadRegisterDraft,
  saveLeadRegisterDraft,
  type LeadRegisterWizardStep,
} from '@/lib/lead-portal/register-wizard';

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

const LOGIN_KEY_CONFLICT_MSG =
  'Email hoặc số điện thoại đã được dùng trên hệ thống. Vui lòng đăng nhập hoặc dùng thông tin khác.';

/**
 * Đăng ký lead — wizard 2 bước (liên hệ → mật khẩu), kế thừa shell/Steps
 * complete-profile và field contact mock-test online.
 */
export function LeadCreateAccountClient({ mode = 'proof' }: Props) {
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LeadRegisterWizardStep | 'done'>(1);
  const [loginKeyWarning, setLoginKeyWarning] = useState<string | null>(null);
  const [loginKeyWarningAction, setLoginKeyWarningAction] = useState<
    'login' | 'contact_support' | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorAction, setSubmitErrorAction] = useState<
    'login' | 'contact_support' | null
  >(null);

  const registrationIdRaw = Number(searchParams.get('registrationId'));
  const registrationId =
    Number.isFinite(registrationIdRaw) && registrationIdRaw >= 1
      ? registrationIdRaw
      : null;

  const isSelfServe = mode === 'self-serve';
  const canSubmit = isSelfServe || registrationId != null;

  const step1Fields = useMemo(
    () =>
      (isSelfServe
        ? LEAD_REGISTER_STEP_1_FIELDS
        : LEAD_REGISTER_STEP_1_FIELDS_PROOF) as ReadonlyArray<
        keyof FormValues
      >,
    [isSelfServe],
  );

  useEffect(() => {
    if (!isSelfServe) return;
    const draft = loadLeadRegisterDraft();
    if (!draft) return;
    form.setFieldsValue({
      displayName: draft.displayName,
      phone: draft.phone,
      email: draft.email,
    });
  }, [form, isSelfServe]);

  const persistContactDraft = useCallback(() => {
    if (!isSelfServe) return;
    const values = form.getFieldsValue(true) as FormValues;
    saveLeadRegisterDraft({
      displayName: values.displayName?.trim(),
      phone: values.phone?.trim(),
      email: values.email?.trim(),
    });
  }, [form, isSelfServe]);

  const runLoginKeyPrecheck = useCallback(
    async (field: 'email' | 'phone') => {
      const email =
        field === 'email'
          ? String(form.getFieldValue('email') ?? '').trim()
          : '';
      const phone =
        field === 'phone'
          ? String(form.getFieldValue('phone') ?? '').trim()
          : '';
      if (!email && !phone) {
        setLoginKeyWarning(null);
        setLoginKeyWarningAction(null);
        return;
      }
      const result = await checkLoginKeyAvailability({
        email: email || undefined,
        phone: phone || undefined,
      });
      if (!result.available) {
        setLoginKeyWarning(LOGIN_KEY_CONFLICT_MSG);
        setLoginKeyWarningAction(result.action ?? 'login');
        return;
      }
      setLoginKeyWarning(null);
      setLoginKeyWarningAction(null);
    },
    [form],
  );

  const goNextFromContact = useCallback(async () => {
    setSubmitError(null);
    setSubmitErrorAction(null);
    try {
      await form.validateFields([...step1Fields]);
    } catch {
      return;
    }
    const email = String(form.getFieldValue('email') ?? '').trim();
    const phone = String(form.getFieldValue('phone') ?? '').trim();
    const result = await checkLoginKeyAvailability({ email, phone });
    if (!result.available) {
      setLoginKeyWarning(LOGIN_KEY_CONFLICT_MSG);
      setLoginKeyWarningAction(result.action ?? 'login');
      return;
    }
    setLoginKeyWarning(null);
    setLoginKeyWarningAction(null);
    persistContactDraft();
    setStep(2);
  }, [form, persistContactDraft, step1Fields]);

  const handleRegister = useCallback(
    async (values: FormValues) => {
      if (!isSelfServe && registrationId == null) {
        message.error(
          'Thiếu mã đăng ký thi thử. Vui lòng mở lại từ trang đăng ký.',
        );
        return;
      }
      setLoading(true);
      setSubmitError(null);
      setSubmitErrorAction(null);
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
        clearLeadRegisterDraft();
        setStep('done');
        message.success(result.message);
      } catch (e) {
        const err = e as Error & {
          action?: 'login' | 'contact_support';
          code?: string;
        };
        const msg = err.message || 'Đăng ký thất bại.';
        setSubmitError(msg);
        if (err.action === 'login' || err.action === 'contact_support') {
          setSubmitErrorAction(err.action);
        } else if (
          /đã|trùng|tồn tại|conflict|already/i.test(msg) ||
          err.code?.includes('ALREADY')
        ) {
          setSubmitErrorAction('login');
        }
        message.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [message, registrationId, isSelfServe],
  );

  const onFormFinish = useCallback(
    (values: FormValues) => {
      if (step === 1) {
        void goNextFromContact();
        return;
      }
      void handleRegister(values);
    },
    [step, goNextFromContact, handleRegister],
  );

  const title = isSelfServe
    ? 'Đăng ký tài khoản'
    : 'Tạo tài khoản theo dõi thi thử';
  const description = isSelfServe
    ? 'Tạo tài khoản cổng Ebest để thi thử online và theo dõi kết quả.'
    : `Mã đăng ký #${registrationId}. Dùng cùng SĐT đã đăng ký buổi thi.`;

  if (!canSubmit) {
    return (
      <LeadPortalShell
        title="Không tìm thấy thông tin đăng ký"
        description="Vui lòng đăng ký thi thử trước, sau đó tạo tài khoản từ liên kết trên trang xác nhận."
      >
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="Thiếu mã đăng ký thi thử"
        />
        <Space wrap>
          <Link href="/register">
            <Button type="primary">Đăng ký tài khoản</Button>
          </Link>
          <Link href="/mock-test-online/register">
            <Button>Thi thử online</Button>
          </Link>
        </Space>
      </LeadPortalShell>
    );
  }

  if (step === 'done') {
    return (
      <LeadPortalShell
        title="Đã tạo tài khoản"
        description="Bạn đã đăng ký thành công nhưng chưa hoàn thiện hồ sơ. Đăng nhập để hoàn tất và vào cổng Ebest."
      >
        <Alert
          type="success"
          showIcon
          className="mb-4"
          message="Đăng ký thành công — chưa hoàn thiện hồ sơ"
          description="Sau khi đăng nhập, hệ thống sẽ yêu cầu xác nhận thông tin trước khi mở đầy đủ menu."
        />
        <Link href="/login?mode=lead">
          <Button type="primary" block>
            Đăng nhập để hoàn thiện hồ sơ
          </Button>
        </Link>
      </LeadPortalShell>
    );
  }

  const stepItems = [
    { title: LEAD_REGISTER_STEP_TITLES[1] },
    { title: LEAD_REGISTER_STEP_TITLES[2] },
  ];

  return (
    <LeadPortalShell
      title={title}
      description={description}
      maxWidthClass="max-w-lg"
    >
      <style>{`
        .lead-register-steps .ant-steps-item-title {
          font-size: 12px;
          line-height: 1.3;
        }
      `}</style>
      <Steps
        current={step - 1}
        items={stepItems}
        size="small"
        className="lead-register-steps mb-6"
        responsive
      />

      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        {LEAD_REGISTER_STEP_TITLES[step]}
      </h2>

      {loginKeyWarning ? (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message={loginKeyWarning}
          action={
            loginKeyWarningAction === 'login' ? (
              <Link href="/login?mode=lead">
                <Button size="small" type="primary">
                  Đăng nhập
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : null}

      {submitError ? (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message={submitError}
          action={
            submitErrorAction === 'login' ? (
              <Link href="/login?mode=lead">
                <Button size="small" type="primary">
                  Đăng nhập
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFormFinish}
        requiredMark="optional"
      >
        <div
          className={
            step === 1
              ? 'rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5'
              : 'hidden'
          }
        >
          {isSelfServe ? (
            <Form.Item
              name="displayName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                maxLength={255}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}
            getValueFromEvent={(v: string | undefined) => v}
          >
            <PhoneInputField
              placeholder="0901234567"
              onBlur={() => void runLoginKeyPrecheck('phone')}
            />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              placeholder="email@example.com"
              autoComplete="email"
              maxLength={255}
              onBlur={() => void runLoginKeyPrecheck('email')}
            />
          </Form.Item>
          <p className="mb-0 text-xs text-gray-500">
            SĐT và email dùng để đăng nhập cổng thi thử — giống thông tin liên hệ
            khi đăng ký thi online.
          </p>
        </div>

        <div
          className={
            step === 2
              ? 'rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5'
              : 'hidden'
          }
        >
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
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {step === 2 ? (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setSubmitError(null);
                setStep(1);
              }}
            >
              Quay lại
            </Button>
          ) : null}
          {step === 1 ? (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              onClick={() => void goNextFromContact()}
              block
              className="sm:!w-auto"
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="sm:!flex-1"
            >
              {isSelfServe ? 'Hoàn tất đăng ký' : 'Tạo tài khoản'}
            </Button>
          )}
        </div>
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link
          href="/login?mode=lead"
          className="font-medium text-orange-600 hover:underline"
        >
          Đăng nhập
        </Link>
        {' · '}
        <Link
          href="/mock-test-online"
          className="text-orange-600 hover:underline"
        >
          Thi thử online
        </Link>
      </p>
    </LeadPortalShell>
  );
}
