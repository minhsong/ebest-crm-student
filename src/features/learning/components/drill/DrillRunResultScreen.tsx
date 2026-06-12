'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { FireOutlined, TrophyOutlined } from '@ant-design/icons';
import './drill-survival.css';

type Props = {
	score: number;
	bestScore?: number;
	wasWrongEnd: boolean;
	onReplay: () => void;
	leaderboardHref?: string | null;
};

export function DrillRunResultScreen({
	score,
	bestScore,
	wasWrongEnd,
	onReplay,
	leaderboardHref,
}: Props) {
	const beatBest = bestScore != null && score > bestScore;

	return (
		<div className="drill-run-result">
			<div className={`drill-run-result__icon${wasWrongEnd ? ' is-end' : ' is-win'}`}>
				{wasWrongEnd ? '💫' : '🏆'}
			</div>
			<p className="drill-run-result__score-label">Điểm lượt này</p>
			<p className="drill-run-result__score">{score}</p>
			<h2 className="drill-run-result__title">
				{wasWrongEnd ? 'Hết lượt rồi!' : 'Xuất sắc!'}
			</h2>
			<p className="drill-run-result__sub">
				{wasWrongEnd
					? 'Một câu trả lời sai kết thúc lượt chơi. Thử lại và giữ chuỗi điểm dài hơn nhé.'
					: 'Bạn đã hoàn thành lượt chơi.'}
				{bestScore != null ? (
					<>
						{' '}
						{beatBest
							? `Kỷ lục mới — vượt ${bestScore} điểm!`
							: `Kỷ lục bài: ${bestScore} điểm.`}
					</>
				) : null}
			</p>
			<div className="drill-run-result__actions">
				<Button type="primary" size="large" block onClick={onReplay}>
					<FireOutlined /> Chơi lại
				</Button>
				<Link href="/learning">
					<Button size="large" block>
						Về Học tập
					</Button>
				</Link>
			</div>
			{leaderboardHref ? (
				<p className="drill-run-result__hint">
					<Link
						href={`${leaderboardHref}&refresh=${Date.now()}`}
						className="text-blue-600 hover:underline"
					>
						<TrophyOutlined /> Xem bảng xếp hạng lớp
					</Link>
				</p>
			) : null}
		</div>
	);
}
