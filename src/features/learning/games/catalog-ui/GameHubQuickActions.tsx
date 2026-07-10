'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { FileTextOutlined, TrophyOutlined } from '@ant-design/icons';

import {
	vocabularyGameAssignmentsHref,
	vocabularyLeaderboardHref,
} from '@/features/learning/utils/vocabulary-session-routes';

type Props = {
	classId: number | null;
};

/** Toolbar nút — thay Link wrapper, touch-friendly. */
export function GameHubQuickActions({ classId }: Props) {
	const router = useRouter();

	return (
		<div className="games-hub-quick-actions">
			<Button
				icon={<FileTextOutlined />}
				onClick={() => router.push(vocabularyGameAssignmentsHref())}
			>
				Bài tập
			</Button>
			<Button
				icon={<TrophyOutlined />}
				disabled={!classId}
				onClick={() => {
					if (classId) router.push(vocabularyLeaderboardHref(classId));
				}}
			>
				BXH lớp
			</Button>
		</div>
	);
}
