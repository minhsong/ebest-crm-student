'use client';

import { memo, useCallback, useRef } from 'react';
import { SoundOutlined } from '@ant-design/icons';
import type { DrillQuestionClient } from '@/types/learning';

type Props = {
	question: Pick<DrillQuestionClient, 'prompt' | 'promptType' | 'promptAudioUrl'>;
};

function DrillPromptCardInner({ question }: Props) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const isAudio = question.promptType === 'audio' && question.promptAudioUrl;

	const replayAudio = useCallback(() => {
		const el = audioRef.current;
		if (!el) return;
		el.currentTime = 0;
		void el.play();
	}, []);

	return (
		<div className="drill-prompt-card">
			<p className="drill-prompt-card__eyebrow">
				{isAudio ? 'Nghe và chọn' : 'Nghĩa tiếng Việt'}
			</p>
			{isAudio ? (
				<>
					<button
						type="button"
						className="drill-prompt-card__audio-btn"
						onClick={replayAudio}
						aria-label="Phát lại âm thanh"
					>
						<SoundOutlined />
					</button>
					<div className="drill-prompt-card__audio-wrap">
						<audio ref={audioRef} autoPlay src={question.promptAudioUrl} />
					</div>
				</>
			) : (
				<p className="drill-prompt-card__text">{question.prompt}</p>
			)}
		</div>
	);
}

export const DrillPromptCard = memo(DrillPromptCardInner);
