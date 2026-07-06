'use client';

import { useCallback } from 'react';
import { fetchStudentMockTestResults } from '@/lib/student-mock-test-results';
import { useMockTestResultsList } from './useMockTestResultsList';

export function useStudentMockTestResultsPage() {
  const fetcher = useCallback(() => fetchStudentMockTestResults(), []);
  return useMockTestResultsList({ fetcher });
}
