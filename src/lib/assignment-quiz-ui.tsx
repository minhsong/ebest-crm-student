import {
  AppstoreOutlined,
  AudioOutlined,
  BookOutlined,
  CheckSquareOutlined,
  EditOutlined,
  FileTextOutlined,
  MessageOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';

export function assignmentResultShort(resultStatus: number | null): string {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'Đã chấm';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'Đã nộp';
  return 'Chưa nộp';
}

export function assignmentResultTagColor(
  resultStatus: number | null,
): 'blue' | 'processing' | 'default' {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'blue';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'processing';
  return 'default';
}

export function assignmentTypeShort(exerciseType: string | null | undefined): string {
  const t = String(exerciseType ?? '').trim().toLowerCase();
  if (!t) return 'Bài tập';
  if (t === 'recording') return 'Ghi âm';
  if (t === 'paper') return 'Giấy';
  if (t === 'toeic') return 'TOEIC';
  if (t === 'writing') return 'Viết';
  if (t === 'speaking') return 'Nói';
  if (t === 'homework') return 'Homework';
  if (t === 'quiz') return 'Quiz';
  if (t === 'general') return 'Bài tập';
  return 'Bài tập';
}

export function assignmentTypeIcon(exerciseType: string | null | undefined) {
  const t = String(exerciseType ?? '').trim().toLowerCase();
  if (t === 'recording') return <AudioOutlined aria-hidden />;
  if (t === 'paper') return <FileTextOutlined aria-hidden />;
  if (t === 'toeic') return <TrophyOutlined aria-hidden />;
  if (t === 'writing') return <EditOutlined aria-hidden />;
  if (t === 'speaking') return <MessageOutlined aria-hidden />;
  if (t === 'homework') return <BookOutlined aria-hidden />;
  if (t === 'quiz') return <CheckSquareOutlined aria-hidden />;
  return <AppstoreOutlined aria-hidden />;
}
