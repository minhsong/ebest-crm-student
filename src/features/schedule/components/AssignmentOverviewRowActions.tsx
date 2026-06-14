'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import type { AssignmentOverviewRow } from '@/lib/assignments-overview-grouping';
import {
  buildQuizStartHref,
  buildVocabularyDrillStartHref,
  deriveAssignmentListRowAction,
} from '@/lib/assignment-list-row-actions';
import { pinAssignmentQuizRuntimeAccess } from '@/lib/quiz-runtime-access';

type Props = {
  row: AssignmentOverviewRow;
  onOpenDetail: () => void;
  canInteract?: boolean;
  size?: 'small' | 'middle';
};

/**
 * Hành động một dòng trên /assignments — sync từ overview, không fetch eligibility/stats.
 */
export function AssignmentOverviewRowActions({
  row,
  onOpenDetail,
  canInteract = true,
  size = 'small',
}: Props) {
  const action = deriveAssignmentListRowAction(row, { canInteract });

  if (action.kind === 'vocabulary_drill_start') {
    const href = buildVocabularyDrillStartHref(action.classId, action.assignmentId);
    return (
      <Link href={href} prefetch={false}>
        <Button type="primary" size={size} icon={<PlayCircleOutlined />}>
          Chơi game
        </Button>
      </Link>
    );
  }

  if (action.kind === 'quiz_start') {
    const href = buildQuizStartHref(action.formPublicId, action.assignmentId);
    return (
      <Link
        href={href}
        prefetch={false}
        onClick={() =>
          pinAssignmentQuizRuntimeAccess(action.formPublicId, action.assignmentId, {
            quizMaxAttempts: action.quizMaxAttempts,
          })
        }
      >
        <Button type="primary" size={size} icon={<PlayCircleOutlined />}>
          Làm bài
        </Button>
      </Link>
    );
  }

  return (
    <Button size={size} onClick={onOpenDetail}>
      Chi tiết
    </Button>
  );
}
