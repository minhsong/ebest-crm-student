'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Flex, Space, Typography, message, theme } from 'antd';
import {
  AudioOutlined,
  CloseCircleOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  buildStudentRecordingFile,
  canPlayAudioMimeInElement,
  flushMediaRecorderBeforeStop,
  pickStudentRecorderMime,
} from '@/lib/student-audio-recorder';

const MIN_RECORDING_BYTES = 256;
const ELAPSED_TICK_MS = 500;
const MEDIA_RECORDER_TIMESLICE_MS = 200;
/** Chờ chunk cuối sau `stop()` trước khi ghép blob. */
const FINALIZE_BLOB_DELAY_MS = 50;

type RecorderPhase = 'idle' | 'recording' | 'preview';

export type StudentSubmissionAudioRecorderProps = {
  disabled?: boolean;
  /**
   * Nộp bản ghi sau khi người dùng xác nhận ở bước preview.
   * Component cha xử lý cảnh báo ghi đè bài cũ và upload API.
   * @returns true nếu upload thành công (component reset về idle).
   */
  onSubmitRecording: (file: File) => Promise<boolean>;
};

function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function StudentSubmissionAudioRecorder({
  disabled,
  onSubmitRecording,
}: StudentSubmissionAudioRecorderProps) {
  const { token } = theme.useToken();
  const mountedRef = useRef(true);
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewPlayable, setPreviewPlayable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const chunksRef = useRef<Blob[]>([]);
  const acquiringMicRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopIntentRef = useRef<'finalize' | 'discard'>('finalize');
  const recordingStartedAtRef = useRef(0);
  const previewObjectUrlRef = useRef<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeMimeTypeRef = useRef<string>('audio/webm');

  const setPhaseSafe = useCallback((next: RecorderPhase) => {
    if (mountedRef.current) setPhase(next);
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearPreview = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewFile(null);
    setPreviewPlayable(true);
  }, []);

  const applyPreviewBlob = useCallback(
    (blob: Blob, mimeType: string) => {
      if (!mountedRef.current) return;

      if (blob.size < MIN_RECORDING_BYTES) {
        message.warning('Bản ghi quá ngắn hoặc không có dữ liệu.');
        setPhaseSafe('idle');
        return;
      }

      const file = buildStudentRecordingFile(blob, mimeType);
      const url = URL.createObjectURL(blob);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      previewObjectUrlRef.current = url;

      const playable = canPlayAudioMimeInElement(blob.type || mimeType);
      setPreviewPlayable(playable);
      setPreviewUrl(url);
      setPreviewFile(file);
      setPhaseSafe('preview');

      if (!playable) {
        message.warning(
          'Trình duyệt có thể không nghe được bản ghi trước khi nộp. Bạn vẫn có thể nộp bài; sau khi nộp sẽ nghe được từ danh sách bài nộp.',
        );
      }
    },
    [setPhaseSafe],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopIntentRef.current = 'discard';
      const r = recorderRef.current;
      recorderRef.current = null;
      if (r && r.state !== 'inactive') {
        try {
          flushMediaRecorderBeforeStop(r);
          r.stop();
        } catch {
          // ignore
        }
      }
      stopTracks();
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, [stopTracks]);

  useEffect(() => {
    if (phase !== 'recording') {
      setElapsedSec(0);
      return;
    }
    const tick = () => {
      setElapsedSec(
        Math.floor((Date.now() - recordingStartedAtRef.current) / 1000),
      );
    };
    tick();
    const id = window.setInterval(tick, ELAPSED_TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  /** Tải lại `<audio>` khi blob URL đổi (tránh nút play không phản hồi). */
  useEffect(() => {
    if (phase !== 'preview' || !previewUrl) return;
    const el = previewAudioRef.current;
    if (!el) return;
    el.load();
  }, [phase, previewUrl]);

  const startRecording = useCallback(async () => {
    if (phase !== 'idle' || acquiringMicRef.current) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      message.error('Trình duyệt không hỗ trợ ghi âm.');
      return;
    }
    acquiringMicRef.current = true;
    clearPreview();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickStudentRecorderMime();
      activeMimeTypeRef.current = mimeType || 'audio/webm';
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onerror = () => {
        message.error('Lỗi ghi âm.');
        recorderRef.current = null;
        stopTracks();
        setPhaseSafe('idle');
      };
      rec.onstop = () => {
        const intent = stopIntentRef.current;
        const recordedMime =
          rec.mimeType || activeMimeTypeRef.current || 'audio/webm';
        recorderRef.current = null;
        stopTracks();

        if (intent === 'discard') {
          chunksRef.current = [];
          setPhaseSafe('idle');
          return;
        }

        window.setTimeout(() => {
          const type = recordedMime;
          const blob = new Blob(chunksRef.current, { type });
          chunksRef.current = [];
          applyPreviewBlob(blob, type);
        }, FINALIZE_BLOB_DELAY_MS);
      };

      recordingStartedAtRef.current = Date.now();
      stopIntentRef.current = 'finalize';
      rec.start(MEDIA_RECORDER_TIMESLICE_MS);
      setPhaseSafe('recording');
    } catch {
      message.error('Không bật được micro hoặc bị từ chối quyền.');
      stopTracks();
      setPhaseSafe('idle');
    } finally {
      acquiringMicRef.current = false;
    }
  }, [applyPreviewBlob, clearPreview, phase, setPhaseSafe, stopTracks]);

  const stopRecorder = useCallback(
    (intent: 'finalize' | 'discard') => {
      const r = recorderRef.current;
      if (!r || r.state === 'inactive') return;
      stopIntentRef.current = intent;
      try {
        flushMediaRecorderBeforeStop(r);
        r.stop();
      } catch {
        recorderRef.current = null;
        stopTracks();
        chunksRef.current = [];
        setPhaseSafe('idle');
        if (intent === 'finalize') {
          message.error('Không dừng được bản ghi.');
        }
      }
    },
    [setPhaseSafe, stopTracks],
  );

  const stopRecordingDiscard = useCallback(() => {
    stopRecorder('discard');
  }, [stopRecorder]);

  const stopRecordingToPreview = useCallback(() => {
    stopRecorder('finalize');
  }, [stopRecorder]);

  const cancelPreview = useCallback(() => {
    clearPreview();
    setPhaseSafe('idle');
  }, [clearPreview, setPhaseSafe]);

  const submitPreview = useCallback(async () => {
    if (!previewFile) return;
    setSubmitting(true);
    try {
      const ok = await onSubmitRecording(previewFile);
      if (ok) {
        clearPreview();
        setPhaseSafe('idle');
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [clearPreview, onSubmitRecording, previewFile, setPhaseSafe]);

  const busy = disabled || submitting;
  const { Text } = Typography;

  if (phase === 'recording') {
    return (
      <Flex vertical gap={token.marginXS} style={{ minWidth: 200 }}>
        <Flex align="center" gap={token.marginSM}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: token.colorError,
              flexShrink: 0,
              boxShadow: `0 0 0 4px ${token.colorErrorBg}`,
            }}
          />
          <Text strong style={{ color: token.colorError }}>
            Đang ghi âm
          </Text>
          <Text
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: token.fontSizeHeading4,
              fontWeight: 700,
              marginLeft: 'auto',
            }}
          >
            {formatElapsed(elapsedSec)}
          </Text>
        </Flex>
        <Space size="small" wrap>
          <Button
            icon={<CloseCircleOutlined />}
            disabled={busy}
            onClick={stopRecordingDiscard}
          >
            Huỷ ghi
          </Button>
          <Button
            type="primary"
            icon={<StopOutlined />}
            disabled={busy}
            onClick={stopRecordingToPreview}
          >
            Dừng & nghe lại
          </Button>
        </Space>
      </Flex>
    );
  }

  if (phase === 'preview' && previewUrl && previewFile) {
    return (
      <Flex vertical gap={token.marginSM} style={{ minWidth: 260 }}>
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          Nghe lại trước khi nộp. Huỷ để ghi lại từ đầu (chưa gửi lên hệ thống).
        </Text>
        {!previewPlayable ? (
          <Text type="warning" style={{ fontSize: token.fontSizeSM }}>
            Trình duyệt có thể không phát được định dạng ghi âm này trước khi nộp.
            Vẫn có thể bấm «Nộp bản ghi» — sau khi nộp, dùng «Phát» trong danh sách
            bài nộp.
          </Text>
        ) : null}
        <audio
          ref={previewAudioRef}
          controls
          playsInline
          preload="auto"
          src={previewUrl}
          style={{ width: '100%', maxHeight: 44 }}
          aria-label="Nghe lại bản ghi"
          onError={() => {
            setPreviewPlayable(false);
            message.error(
              'Không phát được bản ghi trên thiết bị này. Thử Chrome/Edge hoặc nộp bài để nghe từ server.',
            );
          }}
        />
        <Space size="small" wrap>
          <Button
            icon={<CloseCircleOutlined />}
            disabled={busy}
            onClick={cancelPreview}
          >
            Huỷ bản ghi
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submitting}
            disabled={disabled}
            onClick={() => void submitPreview()}
          >
            Nộp bản ghi
          </Button>
        </Space>
      </Flex>
    );
  }

  return (
    <Button
      icon={<AudioOutlined />}
      disabled={busy}
      onClick={() => void startRecording()}
    >
      Ghi âm
    </Button>
  );
}
