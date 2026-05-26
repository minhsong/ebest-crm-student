'use client';

import { Collapse, Flex, Space, Typography, theme } from 'antd';
import type { CourseAssignmentGroup } from '@/lib/assignments-overview-grouping';
import { SessionAssignmentsCard } from '@/features/assignments/components/SessionAssignmentsCard';

const { Text } = Typography;

type Props = {
  groups: CourseAssignmentGroup[];
  onOpenAssignment: (assignmentId: number) => void;
};

function countAssignments(course: CourseAssignmentGroup): number {
  return course.classes.reduce(
    (n, c) => n + c.sessions.reduce((s, ses) => s + ses.assignments.length, 0),
    0,
  );
}

export function AssignmentsCourseTree({ groups, onOpenAssignment }: Props) {
  const { token } = theme.useToken();

  const items = groups.map((course) => ({
    key: course.courseName,
    label: (
      <span>
        <Text strong>{course.courseName}</Text>
        <Text type="secondary" style={{ marginLeft: token.marginXS, fontSize: token.fontSizeSM }}>
          ({countAssignments(course)} bài)
        </Text>
      </span>
    ),
    children: (
      <Space direction="vertical" size={token.marginLG} style={{ width: '100%' }}>
        {course.classes.map((cls) => (
          <Flex key={cls.classId} vertical gap={token.margin} style={{ width: '100%' }}>
            <Text
              type="secondary"
              style={{
                fontSize: token.fontSizeSM,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Lớp {cls.className}
              {cls.classCode ? ` · ${cls.classCode}` : ''}
            </Text>
            <Space direction="vertical" size={token.margin} style={{ width: '100%' }}>
              {cls.sessions.map((session) => (
                <SessionAssignmentsCard
                  key={session.sessionId}
                  session={session}
                  onOpenAssignment={onOpenAssignment}
                />
              ))}
            </Space>
          </Flex>
        ))}
      </Space>
    ),
  }));

  return (
    <Collapse items={items} defaultActiveKey={items.map((i) => i.key)} />
  );
}
