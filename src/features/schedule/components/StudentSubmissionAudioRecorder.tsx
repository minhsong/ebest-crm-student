'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Flex, Space, Typography, message, theme } from 'antd';
import {
  AudioOutlined,
  CloseCircleOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';

const MIN_RECORDING_BYTES = 256;
const ELAPSED_TICK_MS = 500;
const MEDIA_RECORDER_TIMESLICE_MS = 200;

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

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      // ignore
    }
  }
  return undefined;
}

function extensionForMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  return 'webm';
}

function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function buildRecordingFile(blob: Blob, mimeFallback: string): File {
  const type = blob.type || mimeFallback || 'audio/webm';
  const ext = extensionForMime(type);
  const name = `ghi-am-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
  return new File([blob], name, { type });
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
  const [submitting, setSubmitting] = useState(false);

  const chunksRef = useRef<Blob[]>([]);
  /** Tránh hai lần bấm “Ghi âm” trước khi `phase` kịp thành `recording`. */
  const acquiringMicRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopIntentRef = useRef<'finalize' | 'discard'>('finalize');
  const recordingStartedAtRef = useRef(0);
  const previewObjectUrlRef = useRef<string | null>(null);

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
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopIntentRef.current = 'discard';
      const r = recorderRef.current;
      recorderRef.current = null;
      if (r && r.state !== 'inactive') {
        try {
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
      const mimeType = pickRecorderMime();
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
        recorderRef.current = null;
        stopTracks();

        if (intent === 'discard') {
          chunksRef.current = [];
          setPhaseSafe('idle');
          return;
        }

        const type = rec.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];

        if (!mountedRef.current) {
          return;
        }

        if (blob.size < MIN_RECORDING_BYTES) {
          message.warning('Bản ghi quá ngắn hoặc không có dữ liệu.');
          setPhaseSafe('idle');
          return;
        }

        const file = buildRecordingFile(blob, type);
        const url = URL.createObjectURL(blob);
        if (previewObjectUrlRef.current) {
          URL.revokeObjectURL(previewObjectUrlRef.current);
        }
        previewObjectUrlRef.current = url;
        setPreviewUrl(url);
        setPreviewFile(file);
        setPhaseSafe('preview');
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
  }, [clearPreview, phase, setPhaseSafe, stopTracks]);

  const stopRecordingDiscard = useCallback(() => {
    const r = recorderRef.current;
    if (!r || r.state === 'inactive') return;
    stopIntentRef.current = 'discard';
    try {
      r.stop();
    } catch {
      recorderRef.current = null;
      stopTracks();
      chunksRef.current = [];
      setPhaseSafe('idle');
    }
  }, [setPhaseSafe, stopTracks]);

  const stopRecordingToPreview = useCallback(() => {
    const r = recorderRef.current;
    if (!r || r.state === 'inactive') return;
    stopIntentRef.current = 'finalize';
    try {
      r.stop();
    } catch {
      message.error('Không dừng được bản ghi.');
      recorderRef.current = null;
      stopTracks();
      chunksRef.current = [];
      setPhaseSafe('idle');
    }
  }, [setPhaseSafe, stopTracks]);

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
        <audio
          controls
          src={previewUrl}
          style={{ width: '100%', maxHeight: 44 }}
          aria-label="Nghe lại bản ghi"
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
