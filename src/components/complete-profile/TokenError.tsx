'use client';

import { Alert, Card, ConfigProvider } from 'antd';
import { BrandedPublicShell } from '@/components/branding/BrandedPublicShell';
import { ebestPublicAntdTheme } from '@/lib/ebest-public-antd-theme';
import { APP_BRAND, EBEST_BRAND_ORANGE } from '@/lib/ui-constants';
import { FanpageContactLink } from '@/components/portal-contact/FanpageContactLink';

interface TokenErrorProps {
  message: string;
}

export function TokenError({ message }: TokenErrorProps) {
  return (
    <ConfigProvider theme={ebestPublicAntdTheme}>
      <BrandedPublicShell
        maxWidthClass="max-w-md"
        logoPriority
        tagline={`Liên kết hoàn thiện hồ sơ — ${APP_BRAND}`}
      >
        <Card
          bordered={false}
          className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/10"
        >
          <Alert
            type="error"
            showIcon
            message="Link không hợp lệ"
            description={
              <div className="mt-2">
                <p>{message}</p>
                <p className="mt-3 text-neutral-600">
                  Nếu bạn cần link mới, vui lòng liên hệ trung tâm {APP_BRAND}{' '}
                  hoặc nhắn tin qua{' '}
                  <FanpageContactLink
                    label="Fanpage E-best English"
                    className="font-medium underline underline-offset-2 hover:opacity-90"
                    style={{ color: EBEST_BRAND_ORANGE }}
                  />
                  .
                </p>
              </div>
            }
          />
        </Card>
      </BrandedPublicShell>
    </ConfigProvider>
  );
}
