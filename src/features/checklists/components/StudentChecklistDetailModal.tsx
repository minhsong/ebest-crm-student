'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Space, Spin, Tag, Typography, Flex, Descriptions, theme } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import type { StudentChecklistDetail } from '@/types/student-checklists';
import { checklistTypeLabel } from '@/lib/checklist-labels';

const { Text } = Typography;

type Props = {
  open: boolean;
  checklistId: number | null;
  onClose: () => void;
};

export function StudentChecklistDetailModal({ open, checklistId, onClose }: Props) {
  const { token } = theme.useToken();
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<StudentChecklistDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (!detail) return 'Checklist';
    return detail.checklist.title || checklistTypeLabel(detail.checklist.typeKey);
  }, [detail]);

  const load = useCallback(async () => {
    if (!open || checklistId == null) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const res = await fetchWithAuth(`/api/checklists/${checklistId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof data?.message === 'string'
            ? data.message
            : 'Không tải được checklist.',
        );
        setLoading(false);
        return;
      }
      setDetail(data as StudentChecklistDetail);
      setLoading(false);
    } catch {
      setError('Lỗi mạng. Vui lòng thử lại.');
      setLoading(false);
    }
  }, [open, checklistId, fetchWithAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      {loading && (
        <Flex justify="center" align="center" style={{ padding: '40px 0' }}>
          <Spin tip="Đang tải..." />
        </Flex>
      )}
      {error && !loading && <Text type="danger">{error}</Text>}
      {!loading && !error && detail && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Space wrap size="small">
              <Tag color={detail.studentItem.checked ? 'green' : 'orange'}>
                {detail.studentItem.checked ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
              </Tag>
              <Tag>{checklistTypeLabel(detail.checklist.typeKey)}</Tag>
              {detail.studentItem.deadlineAt ? (
                <Tag>
                  Deadline:{' '}
                  {new Date(detail.studentItem.deadlineAt).toLocaleString('vi-VN')}
                </Tag>
              ) : null}
            </Space>
          </div>

          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 1 }}
            labelStyle={{ fontWeight: 600, width: 160 }}
          >
            <Descriptions.Item label="Tiêu đề">
              {detail.checklist.title || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {detail.checklist.note ? (
                <Text>{detail.checklist.note}</Text>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú riêng">
              {detail.studentItem.note ? (
                <Text>{detail.studentItem.note}</Text>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật">
              <Space size="small" wrap>
                {detail.studentItem.checkedAt ? (
                  <Text type="secondary">
                    Done: {new Date(detail.studentItem.checkedAt).toLocaleString('vi-VN')}
                  </Text>
                ) : (
                  <Text type="secondary">Chưa có</Text>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>

          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            Checklist được đánh dấu hoàn thành bởi quản lý trên hệ thống.
          </Text>
        </Space>
      )}
    </Modal>
  );
}

