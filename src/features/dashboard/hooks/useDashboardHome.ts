'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const API_CLASSES = '/api/classes';
const API_OVERVIEW_SESSIONS = '/api/overview/sessions';

export interface StudentClassItem {
  enrollmentId: number;
  classId: number;
  className: string;
  classCode: string;
  courseId: number;
  courseName: string;
  enrollmentDate?: string;
  schedule?: Array<{ dayCode: number; time: string }>;
  classStatus: number;
  startDate?: string;
}

/**
 * Dữ liệu tổng quan — CRM scope theo học viên trong Bearer token (không gửi customerId từ UI).
 */
export function useDashboardHome() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [sessionsByClass, setSessionsByClass] = useState<OverviewClassSessions[]>(
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, sessionsRes] = await Promise.all([
        fetchWithAuth(API_CLASSES),
        fetchWithAuth(API_OVERVIEW_SESSIONS),
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
    void load();
  }, [load]);

  return { loading, classes, sessionsByClass, reload: load };
}
