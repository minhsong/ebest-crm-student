'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Input, Skeleton, Space } from 'antd';
import {
	ArrowLeftOutlined,
	PlayCircleOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningAccessNoticeInline } from '@/features/learning/components/LearningAccessNotice';
import { VocabularyWordCard } from '@/features/learning/components/VocabularyWordCard';
import { VocabularyWordDetailModal } from '@/features/learning/components/VocabularyWordDetailModal';
import { useSessionVocabulary } from '@/features/learning/hooks/useSessionVocabulary';
import {
	flashcardSessionHref,
	vocabularyHomeHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { resolveReadOnlyNoticeMessage } from '@/features/learning/utils/learning-access';
import {
	filterSessionVocabularyItems,
	sortSessionVocabularyItems,
} from '@/features/learning/utils/vocabulary-display.util';
import type { LearningVocabularyItem } from '@/types/learning';
import './session-vocabulary-words.css';

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
	const [selectedItem, setSelectedItem] = useState<LearningVocabularyItem | null>(
		null,
	);
	const [searchQuery, setSearchQuery] = useState('');

	const { items, sessionTitle, canRecordEvents, readOnlyReason, loading, error } =
		useSessionVocabulary({
			classId,
			classSessionId,
		});

	const visibleItems = useMemo(() => {
		const sorted = sortSessionVocabularyItems(items);
		return filterSessionVocabularyItems(sorted, searchQuery);
	}, [items, searchQuery]);

	const pageTitle = sessionTitle
		? `Từ vựng · ${sessionTitle}`
		: loading
			? 'Từ vựng'
			: 'Từ vựng buổi học';

	const flashcardHref =
		classId && classSessionId ? flashcardSessionHref(classId, classSessionId) : null;
	const gamesHref = classId ? vocabularyPracticeHref(classId) : null;
	const vocabularyHomeHrefValue = vocabularyHomeHref(classId, backHref);
	const accessNotice = resolveReadOnlyNoticeMessage(readOnlyReason);

	return (
		<div className="session-vocabulary-page">
			<PageHeader
				title={
					<LearningAccessNoticeInline message={accessNotice}>
						{pageTitle}
					</LearningAccessNoticeInline>
				}
				description={
					items.length > 0
						? `${visibleItems.length}/${items.length} từ · chạm thẻ để xem chi tiết và nghe phát âm`
						: undefined
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
						{flashcardHref && canRecordEvents ? (
							<Link href={flashcardHref}>
								<Button type="primary" icon={<PlayCircleOutlined />}>
									Flashcard
								</Button>
							</Link>
						) : null}
					</Space>
				}
			/>

			{loading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}
			{error ? <Alert type="warning" showIcon message={error} className="mb-4" /> : null}

			{!loading && !error ? (
				<div className="session-vocabulary-words">
					{items.length > 0 ? (
						<Input.Search
							allowClear
							placeholder="Tìm từ, loại từ hoặc nghĩa..."
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							className="session-vocabulary-words__search"
						/>
					) : null}
					{items.length === 0 ? (
						<p className="session-vocabulary-words__empty">
							Buổi học chưa có từ vựng.
						</p>
					) : visibleItems.length === 0 ? (
						<p className="session-vocabulary-words__empty">
							Không có từ nào khớp «{searchQuery.trim()}».
						</p>
					) : (
						<div className="session-vocabulary-words__grid">
							{visibleItems.map((row) => (
								<VocabularyWordCard
									key={row.asset.id}
									item={row}
									onSelect={setSelectedItem}
								/>
							))}
						</div>
					)}

					<VocabularyWordDetailModal
						open={selectedItem != null}
						item={selectedItem}
						allItems={items}
						onClose={() => setSelectedItem(null)}
						onSelectItem={setSelectedItem}
					/>
				</div>
			) : null}
		</div>
	);
}
