'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select, Typography } from 'antd';

import { fetchClassVocabularySessions } from '@/lib/learning-api';

type ScopeKind = 'class' | 'session';

type Props = {
	classId: number;
	classSessionId: number | null;
	onScopeChange: (next: { classSessionId: number | null }) => void;
	onScopeKindChange?: (kind: ScopeKind) => void;
};

/** Best of — chọn nguồn pool: cả lớp hoặc một buổi (E6). */
export function GameBestOfPoolScopePicker({
	classId,
	classSessionId,
	onScopeChange,
	onScopeKindChange,
}: Props) {
	const [scope, setScope] = useState<ScopeKind>(classSessionId ? 'session' : 'class');
	const [sessions, setSessions] = useState<
		Array<{ classSessionId: number; title: string; assetCount: number }>
	>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const next = classSessionId ? 'session' : 'class';
		setScope(next);
		onScopeKindChange?.(next);
	}, [classSessionId, onScopeKindChange]);

	useEffect(() => {
		if (!classId) return;
		setLoading(true);
		void fetchClassVocabularySessions(classId)
			.then((payload) => setSessions(payload.sessions ?? []))
			.catch(() => setSessions([]))
			.finally(() => setLoading(false));
	}, [classId]);

	const sessionOptions = useMemo(
		() =>
			sessions.map((session) => ({
				value: session.classSessionId,
				label: `${session.title} (${session.assetCount} từ)`,
			})),
		[sessions],
	);

	return (
		<section className="games-hub-panel mb-4">
			<Typography.Text strong className="mb-2 block">
				Nguồn từ (Best of)
			</Typography.Text>
			<div className="flex flex-col gap-2">
				<Select<ScopeKind>
					style={{ maxWidth: 360, width: '100%' }}
					value={scope}
					onChange={(value) => {
						setScope(value);
						onScopeKindChange?.(value);
						if (value === 'class') {
							onScopeChange({ classSessionId: null });
						}
					}}
					options={[
						{ value: 'class', label: 'Cả lớp — toàn bộ từ đã unlock' },
						{ value: 'session', label: 'Buổi học — từ một buổi' },
					]}
				/>
				{scope === 'session' ? (
					<Select
						showSearch
						allowClear
						loading={loading}
						placeholder="Chọn buổi học"
						style={{ maxWidth: 360, width: '100%' }}
						value={classSessionId ?? undefined}
						options={sessionOptions}
						onChange={(value) =>
							onScopeChange({
								classSessionId: value != null ? Number(value) : null,
							})
						}
						onClear={() => onScopeChange({ classSessionId: null })}
						optionFilterProp="label"
					/>
				) : null}
			</div>
		</section>
	);
}
