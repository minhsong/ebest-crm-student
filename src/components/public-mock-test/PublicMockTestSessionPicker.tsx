'use client';

import { Form } from 'antd';
import type { PublicLocationGroup } from '@/lib/public-mock-test/types';
import { formatDateTimeDisplay } from '@/lib/date-formatter';
import { publicMockTestFormRules } from '@/lib/public-mock-test/validation';
import { MockTestSelectableCard } from './MockTestSelectableCard';

export function locationKeyFromGroup(loc: PublicLocationGroup): string {
	return loc.locationId != null ? String(loc.locationId) : 'none';
}

interface Props {
	locations: PublicLocationGroup[];
	selectedLocationKey?: string;
	onLocationChange: () => void;
}

export function PublicMockTestSessionPicker({
	locations,
	selectedLocationKey,
	onLocationChange,
}: Props) {
	const form = Form.useFormInstance();
	const selectedSessionId = Form.useWatch('sessionId', form) as number | undefined;
	const selectedLocation = locations.find(
		(l) => locationKeyFromGroup(l) === selectedLocationKey,
	);
	const sessions = selectedLocation?.sessions ?? [];

	return (
		<>
			<Form.Item
				name="locationKey"
				label="Chọn cơ sở"
				rules={publicMockTestFormRules.locationKey}
			>
				<div className="mock-test-select-grid">
					{locations.map((loc) => {
						const key = locationKeyFromGroup(loc);
						const selected = key === selectedLocationKey;
						return (
							<MockTestSelectableCard
								key={key}
								selected={selected}
								onClick={() => {
									form.setFieldValue('locationKey', key);
									onLocationChange();
								}}
								title={loc.locationName}
								subtitle={loc.locationAddress || undefined}
							/>
						);
					})}
				</div>
			</Form.Item>

			{selectedLocation ? (
				<Form.Item
					name="sessionId"
					label="Chọn lịch thi"
					rules={publicMockTestFormRules.sessionId}
				>
					<div className="mock-test-select-grid">
						{sessions.map((s) => {
							const selected = selectedSessionId === s.id;
							const subtitle = [
								formatDateTimeDisplay(s.scheduledStartAt),
								s.code ? `Mã: ${s.code}` : '',
							]
								.filter(Boolean)
								.join(' · ');
							return (
								<MockTestSelectableCard
									key={s.id}
									selected={selected}
									onClick={() => form.setFieldValue('sessionId', s.id)}
									title={s.title}
									subtitle={subtitle}
								/>
							);
						})}
					</div>
				</Form.Item>
			) : null}
		</>
	);
}
