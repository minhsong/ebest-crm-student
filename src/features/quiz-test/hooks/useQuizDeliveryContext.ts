'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  resolveQuizRuntimeAccess,
  type QuizRuntimeAccess,
} from '@/lib/quiz-runtime-access';

export function useQuizDeliveryContext(
  formPublicId: string,
  options?: {
    attemptPublicId?: string;
    preferPractice?: boolean;
    enabled?: boolean;
  },
) {
  const [access, setAccess] = useState<QuizRuntimeAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enabled = options?.enabled !== false;

  const reload = useCallback(async () => {
    const fid = formPublicId.trim();
    if (!fid || !enabled) {
      setAccess(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await resolveQuizRuntimeAccess(fid, {
        attemptPublicId: options?.attemptPublicId,
        preferPractice: options?.preferPractice,
        intent: 'access',
      });
      if (!next) {
        setError('Không xác định được quyền truy cập đề thi.');
        setAccess(null);
      } else {
        setAccess(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải ngữ cảnh đề.');
      setAccess(null);
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    formPublicId,
    options?.attemptPublicId,
    options?.preferPractice,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    access,
    loading,
    error,
    reload,
    assignmentId:
      access?.mode === 'assignment' ? access.assignmentId : undefined,
    practiceMode: access?.practiceMode ?? false,
  };
}
