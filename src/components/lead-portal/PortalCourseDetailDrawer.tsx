'use client';

import { Drawer } from 'antd';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';

export type PortalCourseDetailContent = {
  title: string;
  shortDescription?: string | null;
  detailHtml?: string | null;
};

type PortalCourseDetailDrawerProps = {
  open: boolean;
  course: PortalCourseDetailContent | null;
  onClose: () => void;
};

/**
 * Chi tiết khóa học trong Portal — ưu tiên HTML CMS; không bắt buộc mở web ngoài.
 */
export function PortalCourseDetailDrawer({
  open,
  course,
  onClose,
}: PortalCourseDetailDrawerProps) {
  const html = course?.detailHtml?.trim() || '';

  return (
    <Drawer
      title={course?.title ?? 'Chi tiết khóa học'}
      open={open}
      onClose={onClose}
      width={720}
      styles={{ wrapper: { maxWidth: '100vw' } }}
      destroyOnClose
    >
      {course?.shortDescription ? (
        <p className="mb-4 text-base text-gray-700">{course.shortDescription}</p>
      ) : null}
      {html ? (
        <QaArticleHtml html={html} />
      ) : (
        <p className="text-gray-500">
          Nội dung chi tiết đang được cập nhật. Vui lòng liên hệ tư vấn viên nếu
          bạn cần thêm thông tin.
        </p>
      )}
    </Drawer>
  );
}
