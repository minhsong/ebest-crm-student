'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Space, Typography } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import type { MockTestOnlineCampaign } from '@/lib/public-mock-test-online/types';
import { groupCampaignsByTestType } from '@/lib/public-mock-test-online/exam-flow.util';
import {
  buildSelectExamIntentPath,
  writeMtoExamIntent,
} from '@/lib/public-mock-test-online/mto-exam-intent';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';

const { Title, Paragraph, Text } = Typography;

export type MockTestOnlineBrowseCampaignsProps = {
  campaigns: MockTestOnlineCampaign[];
  campaignsError?: string | null;
  actor: 'guest' | 'lead' | 'customer';
};

/**
 * Landing marketing MTO — chọn card bài thi → «Bước tiếp theo»
 * (guest → login+returnUrl; đã auth → select prefill).
 */
export function MockTestOnlineBrowseCampaignsClient({
  campaigns,
  campaignsError = null,
  actor,
}: MockTestOnlineBrowseCampaignsProps) {
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const grouped = useMemo(() => groupCampaignsByTestType(campaigns), [campaigns]);
  const isGuest = actor === 'guest';

  const selectedCampaign = useMemo(() => {
    if (selectedSessionId == null) return null;
    return campaigns.find((c) => c.sessionId === selectedSessionId) ?? null;
  }, [campaigns, selectedSessionId]);

  const goNext = useCallback(() => {
    const sessionId = selectedCampaign?.sessionId;
    if (sessionId == null || !Number.isFinite(sessionId) || sessionId < 1) return;

    setSubmitting(true);
    writeMtoExamIntent({ sessionId });
    const selectPath = buildSelectExamIntentPath({ sessionId });

    if (isGuest) {
      router.push(
        buildPortalLoginHref({
          mode: 'lead',
          returnUrl: selectPath,
        }),
      );
      return;
    }
    router.push(selectPath);
  }, [isGuest, router, selectedCampaign]);

  return (
    <MockTestOnlineFunnelShell step="register" showProgress={false}>
      <Title level={3} className="mock-test-page-title !mb-2 !mt-0">
        Thi thử online
      </Title>
      <Paragraph className="mock-test-intro-text !mb-5">
        Bạn hãy chọn bài thi mà bạn muốn thi trong danh sách dưới đây.
      </Paragraph>

      {campaignsError ? (
        <Alert type="error" showIcon message={campaignsError} className="!mb-4" />
      ) : null}

      {!campaignsError && campaigns.length === 0 ? (
        <Alert
          type="info"
          showIcon
          className="!mb-4"
          message="Hiện chưa có bài thi đang mở"
          description="Vui lòng quay lại sau."
        />
      ) : null}

      <Space direction="vertical" className="w-full" size="large">
        {grouped.map((group) => (
          <div key={group.testTypeCode} className="mto-browse-type-group">
            <Text strong className="mto-browse-type-label mb-3 block">
              {group.label}
            </Text>
            <div className="mto-browse-card-grid" role="listbox" aria-label={group.label}>
              {group.items.map((c) => {
                const selected = selectedSessionId === c.sessionId;
                return (
                  <button
                    key={c.sessionId}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`mto-browse-exam-card${
                      selected ? ' mto-browse-exam-card--selected' : ''
                    }`}
                    onClick={() => setSelectedSessionId(c.sessionId)}
                  >
                    <span className="mto-browse-exam-title">{c.title}</span>
                    {selected ? (
                      <span className="mto-browse-exam-check" aria-hidden>
                        <CheckOutlined />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Space>

      {selectedCampaign ? (
        <div className="mto-browse-next-bar">
          <Button
            type="primary"
            size="large"
            block
            loading={submitting}
            onClick={goNext}
          >
            Bước tiếp theo
          </Button>
        </div>
      ) : null}
    </MockTestOnlineFunnelShell>
  );
}
