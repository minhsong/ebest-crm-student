'use client';

import Link from 'next/link';
import { Button, Skeleton } from 'antd';
import {
	AudioOutlined,
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
} from '@ant-design/icons';
import type { DrillGameMode } from '@/features/learning/hooks/useDrillPracticePool';
import type {
	AssignmentDrillContextPayload,
	VocabularyPoolPayload,
	WeakWordsPayload,
} from '@/types/learning';
import { LearningAccessNotice } from '@/features/learning/components/LearningAccessNotice';
import './drill-survival.css';

type Props = {
	mode: DrillGameMode;
	onModeChange: (mode: DrillGameMode) => void;
	pool: VocabularyPoolPayload | null;
	assignmentCtx: AssignmentDrillContextPayload | null;
	canStart: boolean;
	weakWords: WeakWordsPayload | null;
	weakWordsLoading: boolean;
	classId: number | null;
	onStart: () => void;
	onRefresh?: () => void;
};

export function DrillPracticeLobby({
	mode,
	onModeChange,
	pool,
	assignmentCtx,
	canStart,
	weakWords,
	weakWordsLoading,
	classId,
	onStart,
	onRefresh,
}: Props) {
	const poolSize = pool?.poolSize ?? 0;
	const minPool = pool?.minPoolSize ?? 10;

	return (
		<div className="drill-lobby">
			{assignmentCtx ? (
				<div className="drill-lobby-hero">
					<p className="drill-lobby-hero__eyebrow">Bài tập luyện từ</p>
					<h2 className="drill-lobby-hero__title">{assignmentCtx.title}</h2>
					<p className="drill-lobby-hero__desc">
						{assignmentCtx.assignmentComplete
							? `Bạn đã đạt yêu cầu. Điểm cao nhất: ${assignmentCtx.bestScore}/${assignmentCtx.minimumScore}.`
							: `Đạt ${assignmentCtx.minimumScore} điểm trong một lượt để nộp bài. Điểm cao nhất: ${assignmentCtx.bestScore}.`}
					</p>
					<div className="drill-lobby-hero__stats">
						<div className="drill-lobby-stat">
							<span className="drill-lobby-stat__value">{assignmentCtx.minimumScore}</span>
							<span className="drill-lobby-stat__label">Mục tiêu</span>
						</div>
						<div className="drill-lobby-stat">
							<span className="drill-lobby-stat__value">{assignmentCtx.bestScore}</span>
							<span className="drill-lobby-stat__label">Cao nhất</span>
						</div>
						<div className="drill-lobby-stat">
							<span className="drill-lobby-stat__value">{assignmentCtx.assignmentPoolSize}</span>
							<span className="drill-lobby-stat__label">Từ bài</span>
						</div>
					</div>
					<Button
						type="primary"
						size="large"
						icon={<ThunderboltOutlined />}
						className="drill-lobby-cta mt-5"
						disabled={!canStart}
						onClick={onStart}
					>
						Bắt đầu chơi
					</Button>
				</div>
			) : (
				<>
					<div className="drill-lobby-hero">
						<p className="drill-lobby-hero__eyebrow">Luyện từ vựng</p>
						<h2 className="drill-lobby-hero__title">Survival Challenge</h2>
						<p className="drill-lobby-hero__desc">
							Trả lời đúng liên tiếp để ghi điểm. Một câu sai — lượt kết thúc.
						</p>
					</div>

					<div>
						<p className="drill-lobby-section-title">Chế độ chơi</p>
						<div className="drill-lobby-modes">
							<button
								type="button"
								className={`drill-lobby-mode${mode === 'survival' ? ' is-active' : ''}`}
								onClick={() => onModeChange('survival')}
							>
								<span className="drill-lobby-mode__icon">
									<ThunderboltOutlined />
								</span>
								<span className="drill-lobby-mode__name">Survival</span>
								<span className="drill-lobby-mode__desc">Nghĩa TV → chọn từ Anh</span>
							</button>
							<button
								type="button"
								className={`drill-lobby-mode${mode === 'audio_to_word' ? ' is-active' : ''}`}
								onClick={() => onModeChange('audio_to_word')}
							>
								<span className="drill-lobby-mode__icon">
									<AudioOutlined />
								</span>
								<span className="drill-lobby-mode__name">Nghe phát âm</span>
								<span className="drill-lobby-mode__desc">Nghe audio → chọn từ</span>
							</button>
						</div>
					</div>

					<Button
						type="primary"
						size="large"
						icon={<ThunderboltOutlined />}
						className="drill-lobby-cta"
						disabled={!canStart}
						onClick={onStart}
					>
						Bắt đầu lượt chơi
					</Button>
				</>
			)}

			<div className="drill-lobby-panel">
				<div className="drill-lobby-panel__title-row">
					<p className="drill-lobby-section-title">Pool từ vựng</p>
					{pool?.learningAccess?.readOnlyReason &&
					!pool.learningAccess.canRecordEvents ? (
						<LearningAccessNotice message={pool.learningAccess.readOnlyReason} />
					) : null}
				</div>
				<div className="drill-lobby-pool-row">
					<span className="drill-lobby-pool-chip">
						Tổng <strong>{poolSize}</strong> từ
					</span>
					<span className="drill-lobby-pool-chip">
						Bắt buộc <strong>{pool?.requiredCount ?? 0}</strong>
					</span>
					<span className="drill-lobby-pool-chip">
						Mở rộng <strong>{pool?.extendedCount ?? 0}</strong>
					</span>
				</div>
				{!pool?.practiceEnabled ? (
					<div className="drill-lobby-alert is-warning">
						Cần ít nhất {minPool} từ đã mở khóa để bắt đầu luyện.
					</div>
				) : null}
			</div>

			{!assignmentCtx && classId ? (
				<div className="drill-lobby-panel">
					<p className="drill-lobby-section-title">Từ cần ôn thêm</p>
					{weakWordsLoading ? (
						<Skeleton active paragraph={{ rows: 2 }} title={false} />
					) : weakWords?.rows.length ? (
						<div className="drill-lobby-weak-list">
							{weakWords.rows.map((row) => (
								<span key={row.assetId} className="drill-lobby-weak-tag">
									<span className="drill-lobby-weak-tag__word">{row.word}</span>
									<span className="drill-lobby-weak-tag__meta">
										sai {row.wrongCount}/{row.attemptCount}
									</span>
								</span>
							))}
						</div>
					) : (
						<p className="m-0 text-sm text-slate-400">
							Chơi vài lượt để hệ thống gợi ý từ hay sai.
						</p>
					)}
				</div>
			) : null}

			<div className="drill-lobby-footer">
				{onRefresh ? (
					<Button icon={<ReloadOutlined />} onClick={onRefresh}>
						Làm mới
					</Button>
				) : null}
				{classId ? (
					<Link href={`/learning/leaderboard?classId=${classId}`}>
						<Button icon={<TrophyOutlined />}>Bảng xếp hạng</Button>
					</Link>
				) : null}
			</div>
		</div>
	);
}
