'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Card,
  Space,
  Typography,
  Button,
  Spin,
  Tag,
  Flex,
  theme,
  Empty,
} from 'antd';
import {
  PlayCircleOutlined,
  ExportOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import type { StudentSessionMaterial } from '@/types/student-session-material';
import {
  SESSION_MATERIAL_TYPE_LABEL,
  sessionMaterialSupportsInlinePlay,
} from '@/lib/media-play-utils';
import { StudentMediaPlayModal } from '@/features/schedule/components/StudentMediaPlayModal';

const { Text, Paragraph } = Typography;

type Props = {
  open: boolean;
  sessionId: number | null;
  sessionTitle?: string;
  onClose: () => void;
};

export function StudentSessionMaterialsModal({
  open,
  sessionId,
  sessionTitle,
  onClose,
}: Props) {
  const { token } = theme.useToken();
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StudentSessionMaterial[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const [playOpen, setPlayOpen] = useState(false);
  const [playTitle, setPlayTitle] = useState('');
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [playVariant, setPlayVariant] = useState<'audio' | 'video'>('video');
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || sessionId == null) {
      setItems([]);
      setListError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setListError(null);
    setItems([]);

    void (async () => {
      try {
        const res = await fetchWithAuth(
          `/api/class-sessions/${sessionId}/materials/public`,
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            typeof data?.message === 'string'
              ? data.message
              : 'Không tải được danh sách tài liệu.';
          if (!cancelled) {
            setListError(msg);
            setLoading(false);
          }
          return;
        }
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setItems(list);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setListError('Lỗi mạng. Vui lòng thử lại.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, sessionId, fetchWithAuth]);

  const closePlay = useCallback(() => {
    setPlayOpen(false);
    setPlayUrl(null);
    setPlayError(null);
    setPlayLoading(false);
  }, []);

  const resolveAccessUrl = useCallback(
    async (materialId: number): Promise<string | null> => {
      if (sessionId == null) return null;
      const res = await fetchWithAuth(
        `/api/class-sessions/${sessionId}/materials/${materialId}/access`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof data?.message === 'string'
            ? data.message
            : 'Không lấy được đường dẫn.';
        throw new Error(msg);
      }
      const url =
        (typeof data?.signedUrl === 'string' && data.signedUrl) ||
        (typeof data?.externalUrl === 'string' && data.externalUrl) ||
        null;
      return url;
    },
    [sessionId, fetchWithAuth],
  );

  const openPlay = useCallback(
    async (m: StudentSessionMaterial) => {
      if (sessionId == null) return;
      setPlayTitle(m.title || 'Phát');
      setPlayOpen(true);
      setPlayLoading(true);
      setPlayError(null);
      setPlayUrl(null);

      try {
        if (m.materialType === 'link') {
          const u = m.current?.externalUrl?.trim() ?? '';
          if (!u) {
            setPlayError('Không có URL để phát.');
            setPlayLoading(false);
            return;
          }
          setPlayVariant('video');
          setPlayUrl(u);
          setPlayLoading(false);
          return;
        }

        if (m.materialType === 'audio') {
          setPlayVariant('audio');
        } else {
          setPlayVariant('video');
        }

        const url = await resolveAccessUrl(m.id);
        if (!url) {
          setPlayError('Không lấy được đường dẫn phát.');
        } else {
          setPlayUrl(url);
        }
      } catch (e) {
        setPlayError(
          e instanceof Error ? e.message : 'Không tải được liên kết phát.',
        );
      } finally {
        setPlayLoading(false);
      }
    },
    [sessionId, resolveAccessUrl],
  );

  const openInNewTab = useCallback(
    async (m: StudentSessionMaterial) => {
      if (sessionId == null) return;
      try {
        if (m.materialType === 'link') {
          const u = m.current?.externalUrl?.trim();
          if (u) {
            window.open(u, '_blank', 'noopener,noreferrer');
            return;
          }
        }
        const url = await resolveAccessUrl(m.id);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch {
        // noop — user có thể thử Phát nếu là media
      }
    },
    [sessionId, resolveAccessUrl],
  );

  const modalTitle = sessionTitle?.trim()
    ? `Tài liệu buổi: ${sessionTitle.trim()}`
    : 'Tài liệu buổi học';

  return (
    <>
      <Modal
        title={
          <Space>
            <FolderOpenOutlined />
            <span>{modalTitle}</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Paragraph type="secondary" style={{ marginTop: 0, marginBottom: token.marginMD }}>
          Chỉ hiển thị tài liệu CRM đánh dấu công khai cho học viên (công khai trên chi tiết buổi).
        </Paragraph>
        {loading && (
          <Flex justify="center" style={{ padding: '40px 0' }}>
            <Spin tip="Đang tải..." />
          </Flex>
        )}
        {listError && !loading && (
          <Text type="danger">{listError}</Text>
        )}
        {!loading && !listError && items.length === 0 && (
          <Empty description="Chưa có tài liệu công khai cho buổi này" />
        )}
        {!loading && !listError && items.length > 0 && (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {items.map((m) => {
              const typeLabel =
                SESSION_MATERIAL_TYPE_LABEL[m.materialType] ?? m.materialType;
              const canPlay = sessionMaterialSupportsInlinePlay(m);
              return (
                <Card
                  key={m.id}
                  size="small"
                  type="inner"
                  styles={{
                    body: {
                      paddingBlock: token.paddingSM,
                    },
                  }}
                >
                  <Flex wrap="wrap" gap={token.marginSM} align="center">
                    <Tag color="blue">{typeLabel}</Tag>
                    <Text strong style={{ flex: '1 1 200px', minWidth: 0 }}>
                      {m.title}
                    </Text>
                    <Space wrap>
                      {canPlay ? (
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => void openPlay(m)}
                        >
                          Phát
                        </Button>
                      ) : null}
                      <Button
                        icon={<ExportOutlined />}
                        onClick={() => void openInNewTab(m)}
                      >
                        Mở tab mới
                      </Button>
                    </Space>
                  </Flex>
                  {m.description?.trim() ? (
                    <Text
                      type="secondary"
                      style={{
                        display: 'block',
                        marginTop: token.marginXS,
                        fontSize: token.fontSizeSM,
                      }}
                    >
                      {m.description.trim()}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </Space>
        )}
      </Modal>

      <StudentMediaPlayModal
        open={playOpen}
        title={playTitle}
        playUrl={playUrl}
        loading={playLoading}
        error={playError}
        variant={playVariant}
        onClose={closePlay}
      />
    </>
  );
}
