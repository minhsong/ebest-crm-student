'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Typography } from 'antd';
import type {
  MockTestOnlineCampaign,
  MockTestTypePresentationPublic,
} from '@/lib/public-mock-test-online/types';
import {
  buildSelectExamIntentPath,
  writeMtoExamIntent,
} from '@/lib/public-mock-test-online/mto-exam-intent';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlineExamMasterDetail } from '@/components/public-mock-test-online/MockTestOnlineExamMasterDetail';

const { Title, Paragraph } = Typography;

export type MockTestOnlineBrowseCampaignsProps = {
  campaigns: MockTestOnlineCampaign[];
  typePresentations?: MockTestTypePresentationPublic[] | null;
  campaignsError?: string | null;
  actor: 'guest' | 'lead' | 'customer';
};

/**
 * Landing marketing MTO — master–detail loại bài → chọn campaign → «Tiếp tục».
 */
export function MockTestOnlineBrowseCampaignsClient({
  campaigns,
  typePresentations = [],
  campaignsError = null,
  actor,
}: MockTestOnlineBrowseCampaignsProps) {
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isGuest = actor === 'guest';

  const goNext = useCallback(() => {
    if (selectedSessionId == null || !Number.isFinite(selectedSessionId) || selectedSessionId < 1) {
      return;
    }

    setSubmitting(true);
    writeMtoExamIntent({ sessionId: selectedSessionId });
    const selectPath = buildSelectExamIntentPath({ sessionId: selectedSessionId });

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
  }, [isGuest, router, selectedSessionId]);

  return (
    <MockTestOnlineFunnelShell step="register" showProgress={false}>
      <Title level={3} className="mock-test-page-title !mb-2 !mt-0">
        Hãy chọn bài thi thử
      </Title>
      <Paragraph className="mock-test-intro-text !mb-5">
        Chọn loại bài phù hợp, xem mô tả, rồi chọn đợt thi đang mở.
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

      <MockTestOnlineExamMasterDetail
        campaigns={campaigns}
        typePresentations={typePresentations}
        selectedSessionId={selectedSessionId}
        onSelect={setSelectedSessionId}
        idPrefix="mto-browse-md"
      />

      {selectedSessionId != null ? (
        <div className="mto-browse-next-bar">
          <Button
            type="primary"
            size="large"
            block
            loading={submitting}
            onClick={goNext}
          >
            Tiếp tục
          </Button>
        </div>
      ) : null}
    </MockTestOnlineFunnelShell>
  );
}
