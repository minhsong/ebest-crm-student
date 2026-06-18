'use client';

import { SoundOutlined } from '@ant-design/icons';
import { Button, Modal, Typography } from 'antd';

export type QuizListeningPlaybackGateReason = 'section-start' | 'autoplay-blocked';

export type QuizListeningPlaybackConfirmModalProps = {
  open: boolean;
  reason?: QuizListeningPlaybackGateReason;
  sectionTitle?: string | null;
  onConfirm: () => void;
};

export function QuizListeningPlaybackConfirmModal({
  open,
  reason = 'section-start',
  sectionTitle,
  onConfirm,
}: QuizListeningPlaybackConfirmModalProps) {
  const isRetry = reason === 'autoplay-blocked';

  return (
    <Modal
      open={open}
      title={
        <span className="flex items-center gap-2">
          <SoundOutlined className="text-blue-500" />
          {isRetry ? 'Cần xác nhận phát âm thanh' : 'Bắt đầu phần nghe'}
        </span>
      }
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      centered
      destroyOnHidden
    >
      <div className="space-y-4 py-1">
        {sectionTitle ? (
          <Typography.Text type="secondary" className="block text-sm">
            {sectionTitle}
          </Typography.Text>
        ) : null}

        <Typography.Paragraph className="!mb-0">
          {isRetry ? (
            <>
              Trình duyệt chưa cho phép tự phát âm thanh. Bạn cần nhấn nút bên dưới để
              tiếp tục phần nghe.
            </>
          ) : (
            <>
              Phần này sẽ <strong>tự phát âm thanh</strong> theo cài đặt đề. Trình duyệt
              (đặc biệt Safari trên iPhone) yêu cầu bạn xác nhận trước khi phát.
            </>
          )}
        </Typography.Paragraph>

        <Typography.Paragraph type="secondary" className="!mb-0 text-sm">
          Sau khi xác nhận, hệ thống đếm ngược 10 giây rồi bắt đầu phát. Giữa các lượt
          nghe cũng có khoảng nghỉ 10 giây. Bạn không thể làm phần nghe hoặc chuyển phần
          cho đến khi xác nhận.
        </Typography.Paragraph>

        <Button
          type="primary"
          size="large"
          block
          icon={<SoundOutlined />}
          className="!h-11 !font-semibold"
          onClick={onConfirm}
        >
          {isRetry ? 'Nhấn để tiếp tục nghe' : 'Xác nhận và bắt đầu phần nghe'}
        </Button>
      </div>
    </Modal>
  );
}
