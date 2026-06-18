'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Flex, Spin, Typography } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import type { StudentChecklistDetail } from '@/types/student-checklists';
import { checklistTypeLabel } from '@/lib/checklist-labels';
import { StudentChecklistDetailBody } from '@/features/checklists/components/StudentChecklistDetailBody';

const { Text } = Typography;

type Props = {
  open: boolean;
  checklistId: number | null;
  onClose: () => void;
};

export function StudentChecklistDetailModal({ open, checklistId, onClose }: Props) {
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
      maskClosable={false}
      footer={null}
      width={720}
      destroyOnHidden
    >
      {loading && (
        <Flex justify="center" align="center" style={{ padding: '40px 0' }}>
          <Spin tip="Đang tải..." />
        </Flex>
      )}
      {error && !loading && <Text type="danger">{error}</Text>}
      {!loading && !error && detail ? <StudentChecklistDetailBody detail={detail} /> : null}
    </Modal>
  );
}
