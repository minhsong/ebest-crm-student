'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
	Alert,
	Button,
	Card,
	Flex,
	List,
	Result,
	Segmented,
	Skeleton,
	Space,
	Statistic,
	Typography,
} from 'antd';
import { ReloadOutlined, SoundOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { useDrillPracticePool } from '@/features/learning/hooks/useDrillPracticePool';
import { useDrillPracticeSession } from '@/features/learning/hooks/useDrillPracticeSession';
import type { DrillGameMode } from '@/features/learning/hooks/useDrillPracticePool';

const { Text, Title } = Typography;

export function DrillPracticeView() {
	const searchParams = useSearchParams();
	const classIdParam = searchParams.get('classId');
	const assignmentIdParam = searchParams.get('assignmentId');
	const classId = classIdParam ? Number(classIdParam) : null;
	const assignmentId = assignmentIdParam ? Number(assignmentIdParam) : null;

	const {
		assignmentCtx,
		gameMode,
		setGameMode,
		pool,
		poolLoading,
		poolError,
		loadPool,
		effectiveClassId,
		resolvedGameMode,
		canStart,
		weakWords,
		weakWordsLoading,
		refreshWeakWords,
		refreshAssignmentContext,
	} = useDrillPracticePool({ classId, assignmentId });

	const {
		question,
		scoreInRun,
		submitting,
		finished,
		lastCorrect,
		actionError,
		handleStart,
		handleAnswer,
	} = useDrillPracticeSession({
		effectiveClassId,
		assignmentId,
		resolvedGameMode,
		onSessionCompleted: () => {
			if (assignmentId && !Number.isNaN(assignmentId)) {
				void refreshAssignmentContext();
			} else if (classId && !Number.isNaN(classId)) {
				void refreshWeakWords();
			}
		},
	});

	if (poolLoading) {
		return (
			<div>
				<PageHeader title="Luyện từ vựng" />
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (poolError) {
		return (
			<div>
				<PageHeader title="Luyện từ vựng" />
				<Alert type="error" message={poolError} showIcon />
				<Link href="/learning" className="mt-4 inline-block">
					<Button>Quay lại Học tập</Button>
				</Link>
			</div>
		);
	}

	const modeLabel = resolvedGameMode === 'audio_to_word' ? 'Nghe phát âm' : 'Survival';

	return (
		<div>
			<PageHeader
				title={
					assignmentCtx
						? `Bài luyện: ${assignmentCtx.title}`
						: `Luyện từ vựng — ${modeLabel}`
				}
				extra={
					<Flex gap="small">
						<Button icon={<ReloadOutlined />} onClick={() => void loadPool()}>
							Làm mới pool
						</Button>
						{classId ? (
							<Link href={`/learning/leaderboard?classId=${classId}`}>
								<Button icon={<TrophyOutlined />}>Bảng xếp hạng</Button>
							</Link>
						) : null}
					</Flex>
				}
			/>

			<Card className="mb-4">
				{assignmentCtx ? (
					<Alert
						className="mb-4"
						type={assignmentCtx.assignmentComplete ? 'success' : 'info'}
						showIcon
						message={
							assignmentCtx.assignmentComplete
								? `Đã đạt yêu cầu (${assignmentCtx.bestScore}/${assignmentCtx.minimumScore}). Bạn vẫn có thể chơi tiếp để ghi điểm cao hơn.`
								: `Đạt ${assignmentCtx.minimumScore} điểm trong một lượt để hoàn thành bài. Best: ${assignmentCtx.bestScore}.`
						}
					/>
				) : null}
				<Flex gap="large" wrap="wrap">
					<Statistic title="Từ trong pool" value={pool?.poolSize ?? 0} />
					<Statistic title="Required" value={pool?.requiredCount ?? 0} />
					<Statistic title="Extended" value={pool?.extendedCount ?? 0} />
				</Flex>
				{!pool?.practiceEnabled ? (
					<Alert
						className="mt-4"
						type="warning"
						showIcon
						message={`Cần ít nhất ${pool?.minPoolSize ?? 10} từ đã mở khóa để bắt đầu luyện.`}
					/>
				) : null}
				{pool?.learningAccess?.readOnlyReason && !pool.learningAccess.canRecordEvents ? (
					<Alert
						className="mt-4"
						type="info"
						showIcon
						message={pool.learningAccess.readOnlyReason}
					/>
				) : null}
			</Card>

			{!assignmentCtx && classId && !question && !finished ? (
				<Card className="mb-4" title="Từ hay sai (30 ngày gần đây)">
					{weakWordsLoading ? (
						<Skeleton active paragraph={{ rows: 3 }} />
					) : weakWords?.rows.length ? (
						<List
							size="small"
							dataSource={weakWords.rows}
							renderItem={(row) => (
								<List.Item>
									<Text strong>{row.word}</Text>
									<Text type="secondary">
										{' '}
										— sai {row.wrongCount}/{row.attemptCount} lần
									</Text>
								</List.Item>
							)}
						/>
					) : (
						<Text type="secondary">Chưa có dữ liệu từ hay sai. Hãy chơi vài lượt drill.</Text>
					)}
				</Card>
			) : null}

			{actionError ? (
				<Alert className="mb-4" type="error" message={actionError} showIcon />
			) : null}

			{finished ? (
				<Result
					status={lastCorrect === false ? 'warning' : 'success'}
					title="Kết thúc lượt"
					subTitle={`Điểm lượt: ${scoreInRun}. Lượt chỉ dừng khi trả lời sai.`}
					extra={
						<Space>
							<Button type="primary" onClick={() => void handleStart()}>
								Chơi lại
							</Button>
							<Link href="/learning">
								<Button>Về Học tập</Button>
							</Link>
						</Space>
					}
				/>
			) : question ? (
				<Card title={`Điểm lượt: ${scoreInRun}`}>
					{lastCorrect === true ? (
						<Alert className="mb-4" type="success" message="Đúng! +1 điểm" showIcon />
					) : null}
					{question.promptType === 'audio' && question.promptAudioUrl ? (
						<>
							<Flex align="center" gap="small" className="mb-2">
								<SoundOutlined />
								<Text strong>Nghe phát âm và chọn từ đúng</Text>
							</Flex>
							<audio
								controls
								src={question.promptAudioUrl}
								className="mb-4 w-full max-w-md"
							/>
						</>
					) : (
						<>
							<Title level={4}>{question.prompt}</Title>
							<Text type="secondary" className="block mb-4">
								Chọn từ tiếng Anh đúng với nghĩa trên.
							</Text>
						</>
					)}
					<Flex vertical gap="small">
						{question.options.map((opt) => (
							<Button
								key={opt.id}
								size="large"
								block
								loading={submitting}
								onClick={() => void handleAnswer(opt.id)}
							>
								{opt.label}
							</Button>
						))}
					</Flex>
				</Card>
			) : (
				<Card>
					<ParagraphIntro mode={resolvedGameMode} />
					{!assignmentCtx ? (
						<div className="mb-4">
							<Text type="secondary" className="block mb-2">
								Chế độ chơi
							</Text>
							<Segmented
								value={gameMode}
								onChange={(v) => setGameMode(v as DrillGameMode)}
								options={[
									{ label: 'Survival', value: 'survival' },
									{ label: 'Nghe phát âm', value: 'audio_to_word' },
								]}
							/>
						</div>
					) : null}
					<Button
						type="primary"
						size="large"
						icon={<ThunderboltOutlined />}
						disabled={!canStart}
						onClick={() => void handleStart()}
					>
						Bắt đầu {modeLabel}
					</Button>
				</Card>
			)}
		</div>
	);
}

function ParagraphIntro({ mode }: { mode: DrillGameMode }) {
	return (
		<Text type="secondary" className="block mb-4">
			{mode === 'audio_to_word'
				? 'Nghe phát âm và chọn từ tiếng Anh đúng. Mỗi câu đúng +1 điểm; lượt kết thúc khi trả lời sai.'
				: 'Mỗi câu đúng +1 điểm. Lượt chỉ kết thúc khi bạn trả lời sai — tiếp tục chơi sau khi đạt ngưỡng bài bắt buộc (khi có assignment).'}
		</Text>
	);
}
