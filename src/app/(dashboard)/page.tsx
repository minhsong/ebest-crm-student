'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, Card, Alert, Spin, Tag } from 'antd';
import { BookOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader, PageCard } from '@/components/layout';

/** Điểm danh: 1=Có mặt, 2=Vắng, 3=Vắng có phép */
const ATTENDANCE = { PRESENT: 1, ABSENT: 2, EXCUSED: 3 } as const;
/** Bài tập: 1=Chờ chấm, 2=Đã chấm */
const ASSIGNMENT_RESULT_STATUS = { PENDING: 1, GRADED: 2 } as const;

/** ClassStatus từ CRM: 1=PLANNING, 2=READY, 3=IN_PROGRESS, 4=COMPLETED, 5=CANCELLED, 6=DROPPED */
const CLASS_STATUS = {
  PLANNING: 1,
  READY: 2,
  IN_PROGRESS: 3,
} as const;

interface ScheduleItem {
  dayCode: number;
  time: string;
}

interface StudentClassItem {
  enrollmentId: number;
  classId: number;
  className: string;
  classCode: string;
  courseId: number;
  courseName: string;
  enrollmentDate?: string;
  schedule?: ScheduleItem[];
  classStatus: number;
  startDate?: string;
}

interface OverviewSessionRow {
  sessionId: number;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  title: string;
  teacherDisplayName: string | null;
  assistantTeacherDisplayNames: string[];
  classroomName: string | null;
  attendanceStatus: number | null;
  attendanceLabel: string | null;
  assignments: Array<{
    assignmentId: number;
    title: string;
    resultStatus: number | null;
    scoreDisplay: string | null;
  }>;
}

interface OverviewClassSessions {
  classId: number;
  className: string;
  classCode: string;
  courseName: string;
  sessions: OverviewSessionRow[];
}

const QUICK_LINKS = [
  {
    href: '/classes',
    icon: <BookOutlined className="text-2xl text-blue-600" />,
    iconBg: 'bg-blue-100',
    title: 'Lớp học của tôi',
    description: 'Xem danh sách lớp đang học và lịch học',
  },
  {
    href: '/invoices',
    icon: <FileTextOutlined className="text-2xl text-green-600" />,
    iconBg: 'bg-green-100',
    title: 'Hóa đơn',
    description: 'Tra cứu hóa đơn và thanh toán',
  },
];

function formatTime(t: string): string {
  if (typeof t !== 'string') return '—';
  const part = t.split(':').slice(0, 2).join(':');
  return part || '—';
}

function AttendanceCell({ status, label }: { status: number | null; label: string | null }) {
  if (status == null) {
    return <span className="text-gray-500">{label ?? 'Chưa điểm danh'}</span>;
  }
  const text = label ?? '—';
  if (status === ATTENDANCE.PRESENT) {
    return <Tag color="success">{text}</Tag>;
  }
  if (status === ATTENDANCE.EXCUSED) {
    return <Tag color="orange">{text}</Tag>;
  }
  if (status === ATTENDANCE.ABSENT) {
    return <Tag color="error">{text}</Tag>;
  }
  return <span>{text}</span>;
}

function AssignmentStatusLabel(resultStatus: number | null): string {
  if (resultStatus === ASSIGNMENT_RESULT_STATUS.GRADED) return 'Đã chấm';
  return 'Chờ chấm';
}

export default function DashboardHomePage() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [sessionsByClass, setSessionsByClass] = useState<OverviewClassSessions[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, sessionsRes] = await Promise.all([
        fetchWithAuth('/api/classes'),
        fetchWithAuth('/api/overview/sessions'),
      ]);
      const classesData = await classesRes.json().catch(() => []);
      const sessionsData = await sessionsRes.json().catch(() => []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSessionsByClass(Array.isArray(sessionsData) ? sessionsData : []);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  const isUpcoming = (c: StudentClassItem) =>
    c.classStatus === CLASS_STATUS.PLANNING || c.classStatus === CLASS_STATUS.READY;
  const isInProgress = (c: StudentClassItem) => c.classStatus === CLASS_STATUS.IN_PROGRESS;

  const upcomingClasses = classes.filter(isUpcoming);
  const inProgressClasses = classes.filter(isInProgress);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Chào mừng bạn đến với cổng học viên. Xem lớp sắp khai giảng và lịch học đang diễn ra."
      />

      {/* 1. Lớp sắp khai giảng — trên cùng */}
      {upcomingClasses.length > 0 && (
        <div className="mb-6 space-y-4">
          {upcomingClasses.map((c) => (
            <Card key={c.classId} className="border-amber-200 bg-amber-50/50">
              <Alert
                type="info"
                showIcon
                icon={<CalendarOutlined />}
                message="Lớp sắp khai giảng"
                description={
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-gray-800">
                      {c.className} ({c.classCode})
                    </p>
                    <p className="text-gray-600">Khóa học: {c.courseName}</p>
                    {c.startDate && (
                      <p className="mt-1 text-gray-600">
                        Ngày dự kiến khai giảng:{' '}
                        <span className="font-medium">
                          {new Date(c.startDate).toLocaleDateString('vi-VN')}
                        </span>
                      </p>
                    )}
                    <p className="mt-2 text-gray-500">
                      Lớp của bạn sắp được mở, hãy vui lòng đợi.
                    </p>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}

      {/* 2. Lớp đang diễn ra — mỗi lớp một bảng (card) */}
      {sessionsByClass.length > 0 && (
        <div className="mb-8 space-y-6">
          {sessionsByClass.map((block) => (
            <Card
              key={block.classId}
              title={
                <span>
                  {block.className} ({block.classCode}) – {block.courseName}
                </span>
              }
              className="overflow-hidden"
            >
              <Table
                size="small"
                rowKey="sessionId"
                dataSource={block.sessions}
                pagination={false}
                scroll={{ x: 900 }}
                columns={[
                  {
                    title: 'Ngày học',
                    key: 'date',
                    width: 120,
                    render: (_, row: OverviewSessionRow) => (
                      <span>
                        {new Date(row.scheduledDate).toLocaleDateString('vi-VN')}
                        <br />
                        <span className="text-gray-500 text-xs">
                          {formatTime(row.scheduledStartTime)} –{' '}
                          {formatTime(row.scheduledEndTime)}
                        </span>
                      </span>
                    ),
                  },
                  {
                    title: 'Bài học',
                    dataIndex: 'title',
                    key: 'title',
                    ellipsis: true,
                  },
                  {
                    title: 'Giáo viên & trợ giảng',
                    key: 'teachers',
                    width: 180,
                    render: (_, row: OverviewSessionRow) => (
                      <span className="text-sm">
                        {row.teacherDisplayName || '—'}
                        {row.assistantTeacherDisplayNames?.length > 0 && (
                          <>
                            <br />
                            <span className="text-gray-500">
                              Trợ giảng: {row.assistantTeacherDisplayNames.join(', ')}
                            </span>
                          </>
                        )}
                      </span>
                    ),
                  },
                  {
                    title: 'Phòng học',
                    dataIndex: 'classroomName',
                    key: 'classroomName',
                    width: 100,
                    render: (v: string | null) => v || '—',
                  },
                  {
                    title: 'Điểm danh',
                    key: 'attendance',
                    width: 120,
                    render: (_: unknown, row: OverviewSessionRow) => (
                      <AttendanceCell
                        status={row.attendanceStatus}
                        label={row.attendanceLabel}
                      />
                    ),
                  },
                  {
                    title: 'Bài tập',
                    key: 'assignments',
                    width: 260,
                    render: (_: unknown, row: OverviewSessionRow) => {
                      const list = row.assignments ?? [];
                      if (list.length === 0) return <span className="text-gray-400">—</span>;
                      return (
                        <div className="space-y-1.5 text-sm">
                          {list.map((a) => (
                            <div
                              key={a.assignmentId}
                              className="rounded border border-gray-100 bg-gray-50/80 px-2 py-1.5"
                            >
                              <div className="font-medium text-gray-800">
                                {a.title || 'Bài tập'}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <Tag
                                  color={
                                    a.resultStatus === ASSIGNMENT_RESULT_STATUS.GRADED
                                      ? 'blue'
                                      : 'default'
                                  }
                                  className="m-0"
                                >
                                  {AssignmentStatusLabel(a.resultStatus)}
                                </Tag>
                                {a.scoreDisplay != null && a.scoreDisplay !== '' && (
                                  <span className="text-gray-700">
                                    Điểm: <strong>{a.scoreDisplay}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    },
                  },
                ]}
              />
            </Card>
          ))}
        </div>
      )}

      {/* 3. Không có lớp nào */}
      {classes.length === 0 && (
        <Card className="mb-6">
          <p className="text-gray-600">
            Bạn chưa có lớp nào. Liên hệ trung tâm để được xếp lớp.
          </p>
        </Card>
      )}

      {/* 4. Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            <PageCard className="transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-3 ${item.iconBg}`}>{item.icon}</div>
                <div>
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            </PageCard>
          </Link>
        ))}
      </div>
    </>
  );
}
