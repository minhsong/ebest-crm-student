'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Button,
	Dropdown,
	List,
	Skeleton,
	Space,
	Typography,
} from 'antd';
import {
	ArrowLeftOutlined,
	PlayCircleOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { MasteryBadge } from '@/features/learning/components/MasteryBadge';
import { useSessionVocabulary } from '@/features/learning/hooks/useSessionVocabulary';
import {
	flashcardSessionHref,
	vocabularyHomeHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';

const { Text } = Typography;

type Props = {
	classSessionId: number;
	backHref?: string;
	backLabel?: string;
};

export function SessionVocabularyDetailView({
	classSessionId,
	backHref = '/learning/vocabulary',
	backLabel = 'Luyện từ vựng',
}: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const classId = Number(searchParams.get('classId'));

	const { items, canRecordEvents, readOnlyReason, loading, error } = useSessionVocabulary({
		classId,
		classSessionId,
	});

	const flashcardHref =
		classId && classSessionId ? flashcardSessionHref(classId, classSessionId) : null;
	const gamesHref = classId ? vocabularyPracticeHref(classId) : null;
	const vocabularyHomeHrefValue = vocabularyHomeHref(classId, backHref);

	return (
		<div>
			<PageHeader
				title={`Từ vựng · Buổi ${classSessionId}`}
				description={
					items.length > 0 ? `${items.length} từ trong buổi này` : undefined
				}
				leading={
					<Button
						type="text"
						icon={<ArrowLeftOutlined />}
						onClick={() => router.push(vocabularyHomeHrefValue)}
					>
						{backLabel}
					</Button>
				}
				extra={
					<Space wrap>
						{gamesHref && canRecordEvents ? (
							<Link href={gamesHref}>
								<Button icon={<ThunderboltOutlined />}>Games</Button>
							</Link>
						) : null}
						{canRecordEvents ? (
							<Dropdown
								menu={{
									items: [
										{
											key: 'flashcard',
											label: 'Flashcard',
											disabled: !flashcardHref,
											onClick: () => {
												if (flashcardHref) router.push(flashcardHref);
											},
										},
									],
								}}
							>
								<Button type="primary" icon={<PlayCircleOutlined />}>
									Luyện từ vựng
								</Button>
							</Dropdown>
						) : null}
					</Space>
				}
			/>

			{readOnlyReason ? (
				<Alert type="info" showIcon message={readOnlyReason} className="mb-4" />
			) : null}

			{loading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}
			{error ? <Alert type="warning" showIcon message={error} className="mb-4" /> : null}

			{!loading && !error ? (
				<List
					dataSource={items}
					rowKey={(row) => row.asset.id}
					locale={{ emptyText: 'Buổi học chưa có từ vựng.' }}
					renderItem={(row) => (
						<List.Item>
							<List.Item.Meta
								title={
									<span>
										<Text strong>{row.asset.word}</Text>
										{' · '}
										<MasteryBadge
											state={row.progress.masteryState}
											label={row.progress.masteryLabel}
										/>
									</span>
								}
								description={row.asset.translation || '—'}
							/>
						</List.Item>
					)}
				/>
			) : null}
		</div>
	);
}
