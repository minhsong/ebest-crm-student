'use client';

import { BookOutlined, BulbOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Image, Spin, Tag } from 'antd';
import type { CourseRecommendationWire } from '@/lib/portal-recommendations/types';
import { usePortalExplore } from '@/contexts/portal-explore-context';

function RecommendationCard({ item }: { item: CourseRecommendationWire }) {
  const { presentation } = item;
  return (
    <Card
      className="flex h-full flex-col overflow-hidden"
      cover={
        presentation.thumbnailUrl ? (
          <div className="aspect-[16/10] overflow-hidden bg-gray-100">
            <Image
              src={presentation.thumbnailUrl}
              alt={presentation.title}
              className="!h-full !w-full object-cover"
              preview={false}
            />
          </div>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 text-4xl text-orange-400">
            <BookOutlined />
          </div>
        )
      }
      actions={[
        <Button
          key="detail"
          type="link"
          href={presentation.detailUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Xem thêm
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <span className="flex items-center gap-2">
            <Tag color="blue">#{item.rank}</Tag>
            {presentation.title}
          </span>
        }
        description={
          <div className="mt-2 space-y-2">
            <p className="line-clamp-3 text-sm text-gray-600">
              {presentation.shortDescription}
            </p>
            {item.matchReasons.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-sm text-gray-700">
                {item.matchReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            {presentation.highlights && presentation.highlights.length > 0 ? (
              <p className="text-xs text-gray-500">
                {presentation.highlights.join(' · ')}
              </p>
            ) : null}
          </div>
        }
      />
    </Card>
  );
}

export function LeadCourseRecommendationsBlock() {
  const { loading, error, recommendations } = usePortalExplore();
  const data = recommendations;

  if (loading) {
    return (
      <section id="recommendations" className="mb-8 scroll-mt-20">
        <Spin tip="Đang tải gợi ý…" className="block py-4" />
      </section>
    );
  }

  if (error) {
    return (
      <section id="recommendations" className="mb-8 scroll-mt-20">
        <Alert type="warning" message={error} showIcon />
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const hasRecommendations = data.recommendations.length > 0;

  if (!hasRecommendations && !data.proficiencySummary) {
    return null;
  }

  return (
    <section id="recommendations" className="mb-8 scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BulbOutlined className="text-lg text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900">Gợi ý cho bạn</h2>
        {data.proficiencySummary ? (
          <span className="text-sm text-gray-600">{data.proficiencySummary}</span>
        ) : null}
      </div>

      {!hasRecommendations ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Chúng tôi đã ghi nhận kết quả thi của bạn. Danh mục gợi ý đang được cập nhật — hãy xem các khóa bên dưới hoặc liên hệ tư vấn viên."
        />
      ) : null}

      {data.fallbackUsed && hasRecommendations ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Chúng tôi gợi ý thêm khóa phù hợp dựa trên danh mục chung — hãy tham khảo tư vấn viên để chọn lộ trình chi tiết."
        />
      ) : null}

      {hasRecommendations ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.recommendations.map((item) => (
            <RecommendationCard key={item.courseId} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
