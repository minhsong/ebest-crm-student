'use client';

import { Button, Modal } from 'antd';
import type { LearningVocabularyItem } from '@/types/learning';
import { VocabularyWordDetailPanel } from '@/features/learning/components/VocabularyWordDetailPanel';
import { useVocabularyAudio } from '@/features/learning/hooks/useVocabularyAudio';
import './session-vocabulary-words.css';

type Props = {
	open: boolean;
	item: LearningVocabularyItem | null;
	onClose: () => void;
};

export function VocabularyWordDetailModal({ open, item, onClose }: Props) {
	const { playingLocale, playAudio } = useVocabularyAudio({ active: open });

	if (!item) {
		return null;
	}

	return (
		<Modal
			className="vocab-word-detail-modal"
			title="Chi tiết từ vựng"
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
			/>
		</Modal>
	);
}
