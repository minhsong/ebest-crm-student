'use client';

import { Tag } from 'antd';
import type { PublicRegistrationTagOption } from '@/lib/public-mock-test/types';

function toSelectedIds(value: number | number[] | undefined): number[] {
	if (value == null) return [];
	if (Array.isArray(value)) {
		return value.map((x) => Number(x)).filter((x) => Number.isFinite(x));
	}
	const n = Number(value);
	return Number.isFinite(n) ? [n] : [];
}

export interface PublicMockTestTagGroupPickerProps {
	tags: PublicRegistrationTagOption[];
	maxSelections: number;
	groupColor?: string;
	value?: number | number[];
	onChange?: (value: number | number[] | undefined) => void;
}

/**
 * Chọn tag theo nhóm — giống complete-profile: màu tag, chỉ tên, click bật/tắt.
 */
export function PublicMockTestTagGroupPicker({
	tags,
	maxSelections,
	groupColor,
	value,
	onChange,
}: PublicMockTestTagGroupPickerProps) {
	const selected = toSelectedIds(value);
	const single = maxSelections <= 1;

	const toggle = (id: number) => {
		if (single) {
			onChange?.(selected[0] === id ? undefined : id);
			return;
		}
		if (selected.includes(id)) {
			onChange?.(selected.filter((x) => x !== id));
			return;
		}
		if (selected.length >= maxSelections) {
			return;
		}
		onChange?.([...selected, id]);
	};

	if (!tags.length) {
		return <span className="text-sm text-gray-500">Chưa có lựa chọn.</span>;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{tags.map((t) => {
				const isSelected = selected.includes(t.id);
				return (
					<span
						key={t.id}
						role="button"
						tabIndex={0}
						onClick={() => toggle(t.id)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								toggle(t.id);
							}
						}}
						className="cursor-pointer"
						aria-pressed={isSelected}
					>
						<Tag color={isSelected ? (t.color ?? groupColor ?? 'orange') : 'default'}>
							{t.name}
						</Tag>
					</span>
				);
			})}
		</div>
	);
}
