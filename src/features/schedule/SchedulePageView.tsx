'use client';

import { Empty, Flex, Space, Spin, Typography } from 'antd';
import { PageHeader, PageCard } from '@/components/layout';
import { useScheduleOverview } from '@/features/schedule/hooks/useScheduleOverview';
import { ClassSessionBlock } from '@/features/schedule/components/ClassSessionBlock';

const { Text } = Typography;

export function SchedulePageView() {
  const { loading, scheduleBlocks, sessionCount } = useScheduleOverview();

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ padding: '64px 0' }}>
        <Spin size="large" tip="Đang tải lịch học..." />
      </Flex>
    );
  }

  return (
    <>
      <PageHeader
        title="Lịch học"
        description={
          <>
            Buổi đã lên kế hoạch (không gồm bản nháp và buổi đã hủy).{' '}
            <strong>Sắp diễn ra</strong> hiển thị trước, <strong>đã diễn ra</strong>{' '}
            theo sau — cùng dạng thẻ.
          </>
        }
      />

      <PageCard>
        {sessionCount === 0 ? (
          <Empty
            description="Chưa có buổi học nào được hiển thị. Khi trung tâm công bố lịch buổi học, thông tin sẽ xuất hiện tại đây."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {sessionCount} buổi
              </Text>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {scheduleBlocks.map((block) => (
                <ClassSessionBlock key={block.classId} block={block} />
              ))}
            </Space>
          </>
        )}
      </PageCard>
    </>
  );
}
