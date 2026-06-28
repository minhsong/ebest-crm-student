'use client';

import { useMemo } from 'react';
import { Button, Modal } from 'antd';
import type { LearningVocabularyItem } from '@/types/learning';
import { VocabularyWordDetailPanel } from '@/features/learning/components/VocabularyWordDetailPanel';
import { useVocabularyAudio } from '@/features/learning/hooks/useVocabularyAudio';
import { getVocabularyHeadword } from '@/features/learning/utils/vocabulary-display.util';
import './session-vocabulary-words.css';

type Props = {
	open: boolean;
	item: LearningVocabularyItem | null;
	allItems?: LearningVocabularyItem[];
	onClose: () => void;
	onSelectItem?: (item: LearningVocabularyItem) => void;
};

export function VocabularyWordDetailModal({
	open,
	item,
	allItems = [],
	onClose,
	onSelectItem,
}: Props) {
	const { playingLocale, playAudio } = useVocabularyAudio({ active: open });

	const sessionAssetIds = useMemo(
		() => new Set(allItems.map((row) => row.asset.id)),
		[allItems],
	);

	const handleSelectFamilyMember = (assetId: number) => {
		const next = allItems.find((row) => row.asset.id === assetId);
		if (next) {
			onSelectItem?.(next);
		}
	};

	if (!item) {
		return null;
	}

	const modalTitle = `Chi tiết: ${getVocabularyHeadword(item.asset)}`;

	return (
		<Modal
			className="vocab-word-detail-modal"
			title={modalTitle}
			open={open}
			onCancel={onClose}
			footer={
				<Button type="primary" size="large" block onClick={onClose}>
					Đóng
				</Button>
			}
			width={520}
			centered
			destroyOnClose
		>
			<VocabularyWordDetailPanel
				item={item}
				playingLocale={playingLocale}
				onPlayAudio={playAudio}
				sessionAssetIds={sessionAssetIds}
				onSelectFamilyMember={handleSelectFamilyMember}
			/>
		</Modal>
	);
}
