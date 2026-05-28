'use client';

import { Alert, Form, Input, Typography } from 'antd';
import type { PublicRegistrationOptions } from '@/lib/public-mock-test/types';
import { publicMockTestFormRules } from '@/lib/public-mock-test/validation';
import { PublicMockTestTagGroupPicker } from './PublicMockTestTagGroupPicker';

const { Text } = Typography;

interface Props {
	options: PublicRegistrationOptions | null;
	optionsError?: string | null;
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
			<Text strong className="mb-2 block">
				Thông tin bổ sung (giúp tư vấn phù hợp hơn)
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
					<Form.Item
						key={group.category}
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
							(group.maxSelections > 1
								? `Chọn tối đa ${group.maxSelections} mục`
								: undefined)
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
				))}
			</div>

			<Form.Item
				name="universityOther"
				label="Tên trường (nếu không có trong danh sách)"
				rules={publicMockTestFormRules.universityOther}
			>
				<Input placeholder="VD: Đại học …" maxLength={200} />
			</Form.Item>

			<Form.Item name="consultationNote" label="Ghi chú thêm (tùy chọn)">
				<Input.TextArea
					rows={3}
					maxLength={500}
					showCount
					placeholder="Mục tiêu TOEIC, thời gian dự kiến thi, câu hỏi cho tư vấn viên…"
				/>
			</Form.Item>
		</>
	);
}
