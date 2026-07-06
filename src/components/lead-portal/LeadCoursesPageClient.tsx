'use client';

import { BookOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Image, Spin } from 'antd';
import { PageCard, PageHeader } from '@/components/layout';
import { LeadConsultCta } from '@/components/lead-portal/LeadConsultCta';
import { usePortalCourseCatalog } from '@/hooks/use-portal-course-catalog';
import { usePortalSiteLinks } from '@/hooks/use-portal-site-links';

export function LeadCoursesPageClient() {
  const { loading, error, courses } = usePortalCourseCatalog();
  const { siteLinks } = usePortalSiteLinks();

  if (loading) {
    return <Spin tip="Đang tải…" className="block py-12" />;
  }

  return (
    <>
      <PageHeader
        title="Các khóa học"
        description="Khám phá chương trình học tại Ebest English."
      />
      <PageCard>
        {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}
        {courses.length === 0 ? (
          <p className="text-gray-600">Danh mục khóa học đang được cập nhật.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.code}
                className="flex h-full flex-col overflow-hidden"
                cover={
                  course.thumbnailUrl ? (
                    <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
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
                    href={course.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem thêm
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={course.title}
                  description={
                    <p className="mt-1 line-clamp-4 text-sm text-gray-600">
                      {course.shortDescription}
                    </p>
                  }
                />
              </Card>
            ))}
          </div>
        )}

        <LeadConsultCta siteLinks={siteLinks} />
      </PageCard>
    </>
  );
}
