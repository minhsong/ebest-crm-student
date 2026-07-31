'use client';

import { useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'antd';
import type {
	MockTestOnlineCampaign,
	MockTestTypePresentationPublic,
} from '@/lib/public-mock-test-online/types';
import { buildSelectExamTypeRows } from '@/lib/public-mock-test-online/select-exam-type-rows.util';
import { MockTestOnlineTypeList } from './MockTestOnlineTypeList';
import { MockTestOnlineTypeDetailPanel } from './MockTestOnlineTypeDetailPanel';

export type MockTestOnlineExamMasterDetailProps = {
	campaigns: MockTestOnlineCampaign[];
	typePresentations?: MockTestTypePresentationPublic[] | null;
	/** Form.Item injects `value` — selectedSessionId. */
	value?: number | null;
	selectedSessionId?: number | null;
	/** null = clear selection (đổi type không còn campaign hợp lệ). */
	onChange?: (sessionId: number | null) => void;
	onSelect?: (sessionId: number | null) => void;
	idPrefix?: string;
};

/**
 * Select-exam / browse — master–detail theo testTypeCode (SX-01…SX-09).
 * Tương thích Ant Design Form.Item (`value` / `onChange`).
 */
export function MockTestOnlineExamMasterDetail({
	campaigns,
	typePresentations,
	value,
	selectedSessionId,
	onChange,
	onSelect,
	idPrefix = 'mto-exam-md',
}: MockTestOnlineExamMasterDetailProps) {
	const selected = value ?? selectedSessionId ?? null;

	const rows = useMemo(
		() => buildSelectExamTypeRows(campaigns, typePresentations),
		[campaigns, typePresentations],
	);

	const [selectedTypeCode, setSelectedTypeCode] = useState<string | null>(
		() => {
			if (selected != null) {
				const hit = campaigns.find((c) => c.sessionId === selected);
				if (hit) return hit.testTypeCode;
			}
			return rows[0]?.testTypeCode ?? null;
		},
	);

	useEffect(() => {
		if (!rows.length) {
			setSelectedTypeCode(null);
			return;
		}
		setSelectedTypeCode((prev) => {
			if (prev && rows.some((r) => r.testTypeCode === prev)) return prev;
			if (selected != null) {
				const hit = campaigns.find((c) => c.sessionId === selected);
				if (hit && rows.some((r) => r.testTypeCode === hit.testTypeCode)) {
					return hit.testTypeCode;
				}
			}
			return rows[0]?.testTypeCode ?? null;
		});
	}, [rows, campaigns, selected]);

	/** Khi chọn campaign thuộc type khác — đồng bộ list trái. */
	useEffect(() => {
		if (selected == null) return;
		const hit = campaigns.find((c) => c.sessionId === selected);
		if (!hit) return;
		setSelectedTypeCode(hit.testTypeCode);
	}, [selected, campaigns]);

	const activeRow =
		rows.find((r) => r.testTypeCode === selectedTypeCode) ?? null;

	const emitSession = (sessionId: number | null) => {
		onChange?.(sessionId);
		onSelect?.(sessionId);
	};

	const handleSelectType = (code: string) => {
		setSelectedTypeCode(code);
		const row = rows.find((r) => r.testTypeCode === code);
		if (!row?.campaigns.length) {
			emitSession(null);
			return;
		}
		if (row.campaigns.length === 1) {
			emitSession(row.campaigns[0]!.sessionId);
			return;
		}
		const stillValid =
			selected != null &&
			row.campaigns.some((c) => c.sessionId === selected);
		if (!stillValid) {
			emitSession(null);
		}
	};

	if (campaigns.length === 0) return null;

	return (
		<div className="mto-exam-master-detail" style={{ maxWidth: 1000 }}>
			<Row gutter={[16, 16]}>
				<Col xs={24} md={8}>
					<MockTestOnlineTypeList
						rows={rows}
						selectedCode={selectedTypeCode}
						onSelect={handleSelectType}
						idPrefix={`${idPrefix}-list`}
					/>
				</Col>
				<Col xs={24} md={16}>
					<MockTestOnlineTypeDetailPanel
						row={activeRow}
						selectedSessionId={selected}
						onSelectCampaign={(sessionId) => emitSession(sessionId)}
						idPrefix={`${idPrefix}-detail`}
					/>
				</Col>
			</Row>
		</div>
	);
}
