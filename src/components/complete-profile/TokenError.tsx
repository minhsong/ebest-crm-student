'use client';

import { Alert, Card, ConfigProvider } from 'antd';
import { BrandedPublicShell } from '@/components/branding/BrandedPublicShell';
import { ebestPublicAntdTheme } from '@/lib/ebest-public-antd-theme';
import { APP_BRAND, EBEST_BRAND_ORANGE, FANPAGE_URL } from '@/lib/ui-constants';

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
                  <a
                    href={FANPAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2 hover:opacity-90"
                    style={{ color: EBEST_BRAND_ORANGE }}
                  >
                    Fanpage E-best English
                  </a>
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
