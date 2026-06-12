'use client';

import { useRouter } from 'next/navigation';
import { Alert, Button, Empty, Skeleton } from 'antd';
import { BookOutlined, RightOutlined } from '@ant-design/icons';
import { useClassVocabularySessionsList } from '@/features/learning/hooks/useClassVocabularySessionsList';
import {
	flashcardSessionHref,
	vocabularySessionDetailHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import './vocabulary-sessions-list.css';

function formatSessionDate(ymd: string): string {
	const d = new Date(`${ymd}T12:00:00+07:00`);
	if (Number.isNaN(d.getTime())) return ymd;
	return d.toLocaleDateString('vi-VN', {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

type Props = {
	classId: number;
	compact?: boolean;
	/** actions: flashcard trên card; navigate: cả card mở chi tiết */
	mode?: 'actions' | 'navigate';
};

export function LearningClassVocabularySessions({
	classId,
	compact,
	mode = 'navigate',
}: Props) {
	const router = useRouter();
	const { loading, error, sessions, canRecordEvents } =
		useClassVocabularySessionsList(classId);

	if (loading) {
		return <Skeleton active paragraph={{ rows: compact ? 2 : 4 }} />;
	}

	if (error) {
		return <Alert type="warning" showIcon message={error} />;
	}

	return renderGrid();

	function renderGrid() {
		if (!sessions.length) {
			return (
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description="Chưa có buổi nào có từ vựng để xem."
				/>
			);
		}

		return (
			<div className="vocabulary-sessions-grid">
				{sessions.map((row) => {
					const href = vocabularySessionDetailHref(classId, row.classSessionId);

					if (mode === 'navigate') {
						return (
							<button
								key={row.classSessionId}
								type="button"
								className="vocabulary-session-card"
								onClick={() => router.push(href)}
							>
								<p className="vocabulary-session-card__title">{row.title}</p>
								<div className="vocabulary-session-card__meta">
									<span>{formatSessionDate(row.scheduledDate)}</span>
									<span className="vocabulary-session-card__badge">
										{row.assetCount} từ
									</span>
									<RightOutlined className="vocabulary-session-card__chevron" />
								</div>
							</button>
						);
					}

					return (
						<div
							key={row.classSessionId}
							className="vocabulary-session-card vocabulary-session-card--with-actions"
						>
							<div
								className="vocabulary-session-card__main"
								role="button"
								tabIndex={0}
								onClick={() => router.push(href)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										router.push(href);
									}
								}}
							>
								<p className="vocabulary-session-card__title">{row.title}</p>
								<div className="vocabulary-session-card__meta">
									<span>{formatSessionDate(row.scheduledDate)}</span>
									<span className="vocabulary-session-card__badge">
										{row.assetCount} từ
									</span>
								</div>
							</div>
							<div className="vocabulary-session-card__actions">
								<Button block size="large" onClick={() => router.push(href)}>
									Xem từ
								</Button>
								{canRecordEvents ? (
									<Button
										block
										size="large"
										type="primary"
										icon={<BookOutlined />}
										onClick={() =>
											router.push(
												flashcardSessionHref(classId, row.classSessionId),
											)
										}
									>
										Flashcard
									</Button>
								) : null}
							</div>
						</div>
					);
				})}
			</div>
		);
	}
}
