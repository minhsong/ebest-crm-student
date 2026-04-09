'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Alert, Modal, Spin, theme } from 'antd';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

type Props = {
  open: boolean;
  title: string;
  playUrl: string | null;
  loading?: boolean;
  error?: string | null;
  /** audio → <audio>; image → <img>; video → react-player (file, YouTube, …) */
  variant: 'audio' | 'video' | 'image';
  onClose: () => void;
};

export function StudentMediaPlayModal({
  open,
  title,
  playUrl,
  loading = false,
  error = null,
  variant,
  onClose,
}: Props) {
  const { token } = theme.useToken();
  const shouldPlay = open && Boolean(playUrl) && !error && !loading;
  const url = useMemo(() => (playUrl ? playUrl.trim() : ''), [playUrl]);

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={null}
      width={840}
      destroyOnClose
      styles={{ body: { paddingTop: 16 } }}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spin size="large" tip="Đang chuẩn bị phát..." />
        </div>
      )}
      {!loading && error && (
        <Alert type="warning" showIcon message={error} />
      )}
      {!loading && !error && url && variant === 'audio' ? (
        <audio
          key={url}
          src={url}
          controls
          controlsList="nodownload"
          autoPlay
          style={{ width: '100%', minHeight: 48 }}
        />
      ) : null}
      {!loading && !error && url && variant === 'image' ? (
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          <img
            key={url}
            src={url}
            alt=""
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: token.borderRadiusLG,
            }}
            draggable={false}
          />
        </div>
      ) : null}
      {!loading && !error && url && variant === 'video' ? (
        <div
          style={{
            width: '100%',
            borderRadius: token.borderRadiusLG,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          <ReactPlayer
            key={url}
            src={url}
            playing={shouldPlay}
            controls
            width="100%"
            height="auto"
            style={{ aspectRatio: '16 / 9', maxHeight: '70vh' }}
          />
        </div>
      ) : null}
    </Modal>
  );
}
