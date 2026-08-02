'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, Collapse, Skeleton, Space } from 'antd';
import { ArrowLeftOutlined, ReadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningAccessNoticeInline } from '@/features/learning/components/LearningAccessNotice';
import { SessionKnowledgeSectionList } from '@/features/learning/components/SessionKnowledgeSectionList';
import { useSessionRuntimeContent } from '@/features/learning/hooks/useSessionRuntimeContent';
import {
	vocabularyHomeHref,
	vocabularySessionDetailHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { resolveReadOnlyNoticeMessage } from '@/features/learning/utils/learning-access';
import './session-knowledge-content.css';

type Props = {
	classSessionId: number;
};

export function SessionKnowledgeContentView({ classSessionId }: Props) {
	const searchParams = useSearchParams();
	const classId = Number(searchParams.get('classId'));

	const { lessons, sessionTitle, emptyReason, readOnlyReason, loading, error } =
		useSessionRuntimeContent({ classId, classSessionId });

	const pageTitle = sessionTitle
		? `Bài học · ${sessionTitle}`
		: loading
			? 'Bài học'
			: 'Nội dung bài học';

	const accessNotice = resolveReadOnlyNoticeMessage(readOnlyReason);
	const vocabHref =
		classId && classSessionId ? vocabularySessionDetailHref(classId, classSessionId) : null;
	const backHref = vocabularyHomeHref(classId);

	const hasContent = lessons.some((lesson) => lesson.knowledgeUnits.length > 0);

	return (
		<div className="session-knowledge-page">
			<PageHeader
				title={
					<LearningAccessNoticeInline message={accessNotice}>
						{pageTitle}
					</LearningAccessNoticeInline>
				}
				extra={
					<Space wrap>
						<Link href={backHref}>
							<Button icon={<ArrowLeftOutlined />}>Học tập</Button>
						</Link>
						{vocabHref ? (
							<Link href={vocabHref}>
								<Button icon={<ReadOutlined />}>Từ vựng buổi này</Button>
							</Link>
						) : null}
					</Space>
				}
			/>

			{loading ? <Skeleton active paragraph={{ rows: 8 }} /> : null}
			{error ? <Alert type="warning" showIcon message={error} className="mb-4" /> : null}

			{!loading && !error ? (
				!hasContent ? (
					<Alert
						type="info"
						showIcon
						message={emptyReason ?? 'Buổi học chưa có nội dung bài học đã xuất bản.'}
					/>
				) : (
					<Collapse
						defaultActiveKey={lessons.map((l) => String(l.lessonId))}
						items={lessons.map((lesson) => ({
							key: String(lesson.lessonId),
							label: (
								<span className="session-knowledge-lesson-label">
									{lesson.sortOrder}. {lesson.lessonTitle ?? `Bài học #${lesson.lessonId}`}
									{lesson.durationMin != null ? (
										<span className="session-knowledge-lesson-meta">
											{' '}
											· {lesson.durationMin} phút
										</span>
									) : null}
								</span>
							),
							children: (
								<div className="session-knowledge-kus">
									{lesson.knowledgeUnits.length === 0 ? (
										<p className="session-knowledge-empty">
											Bài học chưa có đơn vị kiến thức đã xuất bản.
										</p>
									) : (
										lesson.knowledgeUnits.map((ku) => (
											<article key={ku.knowledgeUnitId} className="session-knowledge-ku">
												<h3 className="session-knowledge-ku__title">
													{ku.sortOrder}. {ku.title}
												</h3>
												<SessionKnowledgeSectionList sections={ku.sections} />
											</article>
										))
									)}
								</div>
							),
						}))}
					/>
				)
			) : null}
		</div>
	);
}
