'use client';

import { useCallback } from 'react';
import { useLearningAssignmentsDue } from '@/features/learning/hooks/useLearningAssignmentsDue';
import { useLearningClassSelection } from '@/features/learning/hooks/useLearningClassSelection';
import { useLearningHubCore } from '@/features/learning/hooks/useLearningHubCore';

/**
 * Orchestrator hub learning — hub core + lazy assignments + chọn lớp.
 * Container view nên render shell ngay; truyền `loading`/`secondaryLoading` xuống view parts.
 */
export function useLearningHub() {
	const { data, loading: hubLoading, error, refresh: refreshHub } = useLearningHubCore();
	const {
		assignmentsDue,
		loading: secondaryLoading,
		refresh: refreshAssignments,
	} = useLearningAssignmentsDue(Boolean(data) && !hubLoading);
	const { selectedClassId, setSelectedClassId, selectedClass } =
		useLearningClassSelection(data);

	const refresh = useCallback(() => {
		void refreshHub();
		void refreshAssignments();
	}, [refreshAssignments, refreshHub]);

	return {
		data: data ? { ...data, assignmentsDue } : null,
		assignmentsDue,
		loading: hubLoading,
		hubLoading,
		secondaryLoading,
		error,
		refresh,
		selectedClassId,
		setSelectedClassId,
		selectedClass,
	};
}
