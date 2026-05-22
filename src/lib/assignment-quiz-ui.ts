import type { ComponentType, ReactNode } from 'react';
import { createElement } from 'react';
import {
  AudioOutlined,
  BookOutlined,
  FileOutlined,
  FileTextOutlined,
  FormOutlined,
  ReadOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';

/** Nhãn ngắn loại bài (khớp ExerciseType CRM). */
const EXERCISE_TYPE_SHORT: Record<string, string> = {
  recording: 'Ghi âm',
  paper: 'Giấy',
  toeic: 'TOEIC',
  writing: 'Viết',
  speaking: 'Nói',
  homework: 'VN nhà',
  quiz: 'Trắc nghiệm',
  general: 'Chung',
};

const EXERCISE_TYPE_ICON: Record<string, ComponentType> = {
  recording: AudioOutlined,
  paper: FileOutlined,
  toeic: ReadOutlined,
  writing: FileTextOutlined,
  speaking: SoundOutlined,
  homework: BookOutlined,
  quiz: FormOutlined,
  general: FileOutlined,
};

export function assignmentTypeShort(
  exerciseType: string | null | undefined,
): string {
  const key = String(exerciseType ?? '').trim().toLowerCase();
  return EXERCISE_TYPE_SHORT[key] ?? (key ? key : 'Bài tập');
}

export function assignmentTypeIcon(
  exerciseType: string | null | undefined,
): ReactNode {
  const key = String(exerciseType ?? '').trim().toLowerCase();
  const Icon = EXERCISE_TYPE_ICON[key] ?? FileOutlined;
  return createElement(Icon);
}

/** Nhãn ngắn trạng thái bài tập trên danh sách. */
export function assignmentResultShort(resultStatus: number | null): string {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'Đã chấm';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'Đã nộp';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.PENDING) return 'Chưa nộp';
  return '—';
}

export function assignmentResultTagColor(
  resultStatus: number | null,
): 'blue' | 'processing' | 'default' {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'blue';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'processing';
  return 'default';
}
