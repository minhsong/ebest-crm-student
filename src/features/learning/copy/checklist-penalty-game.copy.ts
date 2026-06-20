/** Copy lobby / kết quả — checklist phạt chơi game (góc nhìn Cô – trò, không thuật ngữ kỹ thuật). */

export function checklistPenaltyLobbyCopy(vars: {
	minimumScore: number;
	poolSize: number;
	bestScore: number;
	bestTotal: number;
	complete: boolean;
}) {
	const { minimumScore, poolSize, bestScore, bestTotal, complete } = vars;

	return {
		eyebrow: 'Thông báo từ lớp',
		title: 'Bạn đã bị Cô phạt chơi game',
		description: complete
			? `Bạn đã hoàn thành nhiệm vụ rồi — kết quả tốt nhất của bạn là ${bestScore}/${bestTotal} từ đúng. Cố gắng học chăm để không bị phạt lần sau nhé!`
			: `Hãy hoàn thành nhiệm vụ của bạn như sau: chơi và trả lời đúng ít nhất ${minimumScore} trong số ${poolSize} từ Cô đã giao. Trả lời hết danh sách từ trong một lượt chơi.`,
		footerHint: 'Chúc bạn may mắn — cố lên, bạn làm được!',
		statMinimumLabel: 'Cần đạt',
		statBestLabel: 'Kết quả tốt nhất',
		statPoolLabel: 'Số từ',
		ctaLabel: complete ? 'Chơi thêm một lượt' : 'Bắt đầu làm bài',
	};
}

export function checklistPenaltyPoolResultCopy(vars: {
	correct: number;
	total: number | undefined;
	wrong: number;
	minimumScore: number | undefined;
	passed: boolean;
	bestScore?: number;
	bestTotal?: number;
}) {
	const { correct, total, wrong, minimumScore, passed, bestScore, bestTotal } = vars;

	if (passed) {
		return {
			icon: '🎉' as const,
			iconTone: 'win' as const,
			scoreLabel: 'Kết quả của bạn',
			title: 'Chúc mừng bạn!',
			subtitleParts: [
				total != null
					? `Bạn đã trả lời đúng ${correct}/${total} từ`
					: `Bạn đã trả lời đúng ${correct} từ`,
				minimumScore != null
					? ` và đạt yêu cầu (${minimumScore} từ đúng).`
					: '.',
				' Cô rất vui vì bạn đã hoàn thành nhiệm vụ!',
				' Hãy cố gắng học tập chăm chỉ để không bị phạt lần sau nhé.',
				bestScore != null && bestTotal != null
					? ` Kết quả tốt nhất của bạn: ${bestScore}/${bestTotal}.`
					: '',
			],
			replayLabel: 'Chơi thêm',
		};
	}

	return {
		icon: '💪' as const,
		iconTone: 'end' as const,
		scoreLabel: 'Kết quả của bạn',
		title: 'Cố lên, bạn sắp làm được rồi!',
		subtitleParts: [
			total != null
				? `Lần này bạn trả lời đúng ${correct}/${total} từ`
				: `Lần này bạn trả lời đúng ${correct} từ`,
			wrong > 0 ? ` (sai ${wrong} từ)` : '',
			minimumScore != null
				? ` — cần đạt ${minimumScore} từ đúng để hoàn thành nhiệm vụ.`
				: '.',
			' Đừng nản lòng, hãy thử lại — bạn đang tiến bộ đấy!',
		],
		replayLabel: 'Thử lại',
	};
}
