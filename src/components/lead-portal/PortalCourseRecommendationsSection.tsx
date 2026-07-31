'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOutlined, BulbOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Image, Spin, Tag } from 'antd';
import {
  PortalCourseDetailDrawer,
  type PortalCourseDetailContent,
} from '@/components/lead-portal/PortalCourseDetailDrawer';
import type {
  CourseRecommendationGuidanceWire,
  CourseRecommendationResponseWire,
  CourseRecommendationWire,
} from '@/lib/portal-recommendations/types';

function RecommendationCard({
  item,
  onOpenDetail,
}: {
  item: CourseRecommendationWire;
  onOpenDetail: (course: PortalCourseDetailContent) => void;
}) {
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
          <div className="flex aspect-[16/10] items-center justify-center bg-orange-50 text-4xl text-orange-400">
            <BookOutlined />
          </div>
        )
      }
      actions={[
        <Button
          key="detail"
          type="link"
          onClick={() =>
            onOpenDetail({
              title: presentation.title,
              shortDescription: presentation.shortDescription,
              detailHtml: presentation.detailHtml,
            })
          }
        >
          Xem chi tiết khóa học
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <span className="flex items-center gap-2">
            <Tag color={item.source === 'staff' ? 'green' : 'blue'}>
              {item.source === 'staff' ? 'Tư vấn' : `#${item.rank}`}
            </Tag>
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

function GuidanceAlert({
  guidance,
}: {
  guidance: CourseRecommendationGuidanceWire;
}) {
  const alertType =
    guidance.code === 'catalog_unavailable' ? 'info' : 'warning';
  return (
    <Alert
      type={alertType}
      showIcon
      className="mb-4"
      message={guidance.message}
      description={
        guidance.actions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {guidance.actions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button type="primary" size="small">
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        ) : null
      }
    />
  );
}

export type PortalCourseRecommendationsSectionProps = {
  data: CourseRecommendationResponseWire | null;
  loading?: boolean;
  error?: string | null;
  /** id neo URL #recommendations */
  sectionId?: string;
  title?: string;
  className?: string;
  /** compact trên màn done / results */
  compact?: boolean;
};

/**
 * Presentational — CRE Top-2 (SSOT chọn khóa).
 * Container: usePortalCourseRecommendations / explore.
 */
export function PortalCourseRecommendationsSection({
  data,
  loading = false,
  error = null,
  sectionId = 'recommendations',
  title = 'Khóa học gợi ý cho bạn',
  className = '',
  compact = false,
}: PortalCourseRecommendationsSectionProps) {
  const [detail, setDetail] = useState<PortalCourseDetailContent | null>(null);

  if (loading) {
    return (
      <section
        id={sectionId}
        className={`scroll-mt-20 ${compact ? 'mt-4' : 'mb-8'} ${className}`}
      >
        <Spin tip="Đang chọn khóa phù hợp…" className="block py-4" />
      </section>
    );
  }

  if (error) {
    return (
      <section
        id={sectionId}
        className={`scroll-mt-20 ${compact ? 'mt-4' : 'mb-8'} ${className}`}
      >
        <Alert type="warning" message={error} showIcon />
      </section>
    );
  }

  if (!data) return null;

  const hasRecommendations = data.recommendations.length > 0;
  const guidance = data.guidance ?? null;
  if (!hasRecommendations && !data.proficiencySummary && !guidance) {
    return null;
  }

  return (
    <section
      id={sectionId}
      className={`scroll-mt-20 ${compact ? 'mt-4' : 'mb-8'} ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BulbOutlined className="text-lg text-orange-500" />
        <h2
          className={
            compact
              ? 'text-base font-semibold text-gray-900'
              : 'text-lg font-semibold text-gray-900'
          }
        >
          {title}
        </h2>
        {data.proficiencySummary ? (
          <span className="text-sm text-gray-600">{data.proficiencySummary}</span>
        ) : null}
      </div>

      {guidance ? <GuidanceAlert guidance={guidance} /> : null}

      {!hasRecommendations && !guidance ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Chúng tôi đã ghi nhận kết quả thi của bạn. Danh mục gợi ý đang được cập nhật — hãy xem các khóa trên trang Khóa học hoặc liên hệ tư vấn viên."
        />
      ) : null}

      {hasRecommendations ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.recommendations.map((item) => (
            <RecommendationCard
              key={item.courseId}
              item={item}
              onOpenDetail={setDetail}
            />
          ))}
        </div>
      ) : null}

      <PortalCourseDetailDrawer
        open={detail != null}
        course={detail}
        onClose={() => setDetail(null)}
      />
    </section>
  );
}
