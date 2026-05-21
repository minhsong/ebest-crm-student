'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { setQuizFormContext } from '@/lib/quiz-form-context';
import { Alert, Card, Collapse, List, Skeleton, Tag, Typography } from 'antd';

type PracticeItem = {
  formPublicId: string;
  name: string;
  className: string;
  courseId: number;
  classId: number;
  courseName: string;
  practiceMaxAttempts: number | null;
};

type CourseGroup = {
  courseId: number;
  courseName: string;
  classes: Array<{
    classId: number;
    className: string;
    items: PracticeItem[];
  }>;
};

function groupPracticeItems(items: PracticeItem[]): CourseGroup[] {
  const byCourse = new Map<number, CourseGroup>();
  for (const row of items) {
    let course = byCourse.get(row.courseId);
    if (!course) {
      course = {
        courseId: row.courseId,
        courseName: row.courseName,
        classes: [],
      };
      byCourse.set(row.courseId, course);
    }
    let cls = course.classes.find((c) => c.classId === row.classId);
    if (!cls) {
      cls = { classId: row.classId, className: row.className, items: [] };
      course.classes.push(cls);
    }
    cls.items.push(row);
  }
  return [...byCourse.values()].sort((a, b) =>
    a.courseName.localeCompare(b.courseName, 'vi'),
  );
}

export default function PracticeQuizzesPage() {
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => groupPracticeItems(items), [items]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/student/learning/practice-quizzes', {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data?.message === 'string'
              ? data.message
              : 'Không tải được danh sách ôn luyện.',
          );
        }
        const raw = (data?.items ?? data) as PracticeItem[];
        if (!cancelled) setItems(Array.isArray(raw) ? raw : []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Lỗi không xác định.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const collapseItems = groups.map((course) => ({
    key: String(course.courseId),
    label: (
      <span>
        <Typography.Text strong>{course.courseName}</Typography.Text>
        <Typography.Text type="secondary" className="ml-2 text-xs">
          ({course.classes.reduce((n, c) => n + c.items.length, 0)} đề)
        </Typography.Text>
      </span>
    ),
    children: (
      <div className="space-y-4">
        {course.classes.map((cls) => (
          <div key={cls.classId}>
            <Typography.Text type="secondary" className="text-xs block mb-2">
              Lớp: {cls.className}
            </Typography.Text>
            <List
              size="small"
              dataSource={cls.items}
              renderItem={(row) => (
                <List.Item
                  actions={[
                    <Link
                      key="start"
                      href={`/quiz-test/${encodeURIComponent(row.formPublicId)}?mode=practice`}
                      onClick={() =>
                        setQuizFormContext(row.formPublicId, { mode: 'practice' })
                      }
                    >
                      Làm bài
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    title={row.name}
                    description={
                      row.practiceMaxAttempts != null ? (
                        <Tag className="m-0">Tối đa {row.practiceMaxAttempts} lượt</Tag>
                      ) : (
                        <Tag className="m-0">Không giới hạn lượt</Tag>
                      )
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <Card title="Ôn luyện">
      <Typography.Paragraph type="secondary">
        Đề hiển thị theo khóa học và lớp bạn đang học. Hệ thống tự xác định đề ôn luyện từ phạm vi
        đề và bài tập thực tế — điểm không tính vào bảng điểm lớp.
      </Typography.Paragraph>
      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : groups.length === 0 ? (
        <Typography.Text type="secondary">
          Chưa có đề ôn luyện phù hợp. Hoàn thành bài tập gắn đề trước, hoặc kiểm tra phạm vi đề
          trên CRM.
        </Typography.Text>
      ) : (
        <Collapse items={collapseItems} defaultActiveKey={collapseItems.map((i) => i.key)} />
      )}
    </Card>
  );
}
