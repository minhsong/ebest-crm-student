'use client';

import { Alert, Form, Input, InputNumber, Typography } from 'antd';
import type { PublicRegistrationOptions, PublicRegistrationTagGroup } from '@/lib/public-mock-test/types';
import { publicMockTestFormRules } from '@/lib/public-mock-test/validation';
import { PublicMockTestTagGroupPicker } from './PublicMockTestTagGroupPicker';

const { Text } = Typography;

const UNIVERSITY_TAG_CATEGORY = 'education_institution';

interface Props {
	options: PublicRegistrationOptions | null;
	optionsError?: string | null;
}

function TagGroupField({ group }: { group: PublicRegistrationTagGroup }) {
	return (
		<Form.Item
			name={['tagsByCategory', group.category]}
			label={
				<span className="inline-flex items-center gap-2">
					<span
						className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
						style={{ background: group.groupColor ?? '#9ca3af' }}
					/>
					<span>{group.label}</span>
				</span>
			}
			extra={
				group.hint ??
				(group.maxSelections > 1 ? `Chọn tối đa ${group.maxSelections} mục` : undefined)
			}
			rules={
				group.required
					? [
							{
								required: true,
								message: `Vui lòng chọn ít nhất một mục: ${group.label}`,
							},
						]
					: undefined
			}
		>
			<PublicMockTestTagGroupPicker
				tags={group.tags}
				maxSelections={group.maxSelections}
				groupColor={group.groupColor}
			/>
		</Form.Item>
	);
}

function UniversityOtherField() {
	return (
		<Form.Item
			name="universityOther"
			label="Tên trường (nếu không có trong danh sách)"
			rules={publicMockTestFormRules.universityOther}
		>
			<Input placeholder="VD: Đại học …" maxLength={200} />
		</Form.Item>
	);
}

export function PublicMockTestProfileFields({ options, optionsError = null }: Props) {
	if (optionsError && !options?.groups?.length) {
		return (
			<Alert type="warning" showIcon message={optionsError} className="!mb-4" />
		);
	}

	if (!options?.groups?.length) {
		return null;
	}

	return (
		<>
			<Text strong className="mock-test-section-title">
				Thông tin bổ sung (hỗ trợ tốt hơn cho bạn)
			</Text>
			<Alert
				type="info"
				showIcon
				className="!mb-4"
				message="Chọn tag mô tả về bạn theo từng nhóm — tất cả đều tùy chọn."
			/>
			{optionsError ? (
				<Alert type="warning" showIcon message={optionsError} className="!mb-4" />
			) : null}

			<div className="space-y-4">
				{options.groups.map((group) => (
					<div key={group.category}>
						<TagGroupField group={group} />
						{group.category === UNIVERSITY_TAG_CATEGORY ? (
							<UniversityOtherField />
						) : null}
					</div>
				))}
			</div>

			<Form.Item
				name="expectedScore"
				label="Điểm kỳ vọng (TOEIC L/R)"
				extra="Điểm bạn muốn đạt trong lần thi này — tùy chọn, giúp hỗ trợ bạn tốt hơn."
				rules={publicMockTestFormRules.expectedScore}
			>
				<InputNumber
					className="!w-full"
					min={10}
					max={990}
					step={5}
					placeholder="VD: 650"
				/>
			</Form.Item>

			<Form.Item name="consultationNote" label="Ghi chú thêm (tùy chọn)">
				<Input.TextArea
					rows={3}
					maxLength={500}
					showCount
					placeholder="Mục tiêu TOEIC, thời gian dự kiến thi, ghi chú thêm…"
				/>
			</Form.Item>
		</>
	);
}
