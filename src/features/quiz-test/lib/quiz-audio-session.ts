/**
 * Mở khóa phiên phát âm thanh cho quiz listening.
 *
 * Safari/iOS **không** có API xin quyền autoplay (không như mic/camera).
 * Chỉ có thể gọi `HTMLMediaElement.play()` trong chuỗi user gesture.
 * Pattern chuẩn: phát clip im lặng ngay khi học viên nhấn «Bắt đầu làm bài» —
 * sau đó các lần `play()` theo chương trình (countdown, ended, lượt 2+) thường hoạt động
 * trong cùng phiên tab.
 *
 * @see SECTION_LISTENING_POLICY.md §3.1
 */

/** Clip WAV im lặng tối thiểu — dùng một lần để unlock session. */
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARSAAABAAAAABAAgAZGF0YQAAAAA=';

let sessionUnlocked = false;
let unlockAudioElement: HTMLAudioElement | null = null;

export function isQuizAudioSessionUnlocked(): boolean {
  return sessionUnlocked;
}

export function resetQuizAudioSessionUnlock(): void {
  sessionUnlocked = false;
  if (unlockAudioElement) {
    unlockAudioElement.pause();
    unlockAudioElement.removeAttribute('src');
  }
}

/**
 * Gọi **đồng bộ trong handler click** (trước mọi `await`) khi form có section auto-play.
 * Trả về promise; thất bại → caller vẫn có fallback nút «Nhấn để nghe» khi vào section.
 */
export function unlockQuizAudioSession(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }
  if (sessionUnlocked) {
    return Promise.resolve(true);
  }

  try {
    if (!unlockAudioElement) {
      unlockAudioElement = new Audio();
      unlockAudioElement.setAttribute('playsinline', '');
      unlockAudioElement.preload = 'auto';
    }
    unlockAudioElement.src = SILENT_WAV_DATA_URI;
    unlockAudioElement.volume = 0.001;

    const pending = unlockAudioElement.play();
    if (!pending || typeof pending.then !== 'function') {
      sessionUnlocked = true;
      return Promise.resolve(true);
    }

    return pending
      .then(() => {
        unlockAudioElement?.pause();
        if (unlockAudioElement) {
          unlockAudioElement.currentTime = 0;
        }
        sessionUnlocked = true;
        return true;
      })
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}
