import type { StudentSessionMaterial } from '@/types/student-session-material';
import type { StudentAssignmentAttachment } from '@/types/student-assignment-detail';

export function isAudioMimeType(mime?: string): boolean {
  return mime != null && mime.toLowerCase().startsWith('audio/');
}

export function isVideoMimeType(mime?: string): boolean {
  return mime != null && mime.toLowerCase().startsWith('video/');
}

export function isImageMimeType(mime?: string): boolean {
  return mime != null && mime.toLowerCase().startsWith('image/');
}

function isUrlOnlySessionMaterialType(
  t: StudentSessionMaterial['materialType'],
): boolean {
  return t === 'link' || t === 'youtube';
}

/** Phát / xem trong modal — theo loại CRM, không đoán từ URL. */
export function sessionMaterialSupportsInlinePlay(
  m: StudentSessionMaterial,
): boolean {
  const cur = m.current;
  const ext = cur?.externalUrl?.trim();
  const hasFile = Boolean(cur?.fileId);
  switch (m.materialType) {
    case 'youtube':
      return Boolean(ext);
    case 'link':
      return false;
    case 'audio':
    case 'video':
      return Boolean(hasFile || ext);
    case 'image':
      return Boolean(hasFile);
    default:
      return false;
  }
}

/** Modal phát: audio | video(youtube/file) | ảnh */
export type SessionMaterialPlayVariant = 'audio' | 'video' | 'image';

export function getSessionMaterialPlayVariant(
  m: StudentSessionMaterial,
): SessionMaterialPlayVariant {
  if (m.materialType === 'audio') return 'audio';
  if (m.materialType === 'image') return 'image';
  return 'video';
}

export function sessionMaterialOpenInNewTabLabel(
  m: StudentSessionMaterial,
): string {
  if (isUrlOnlySessionMaterialType(m.materialType)) {
    return m.materialType === 'youtube' ? 'Mở YouTube / tab mới' : 'Mở liên kết';
  }
  return 'Mở tab mới';
}

export function sessionMaterialPrimaryActionLabel(
  m: StudentSessionMaterial,
): string {
  return m.materialType === 'image' ? 'Xem' : 'Phát';
}

const PLAY_RESOURCE_KINDS: ReadonlySet<
  NonNullable<StudentAssignmentAttachment['resourceKind']>
> = new Set(['audio', 'video', 'youtube']);

/** Chỉ audio / video / youtube được phát trong modal; link web dùng tab mới. */
export function assignmentAttachmentSupportsPlay(
  item: StudentAssignmentAttachment,
): boolean {
  const url = item.url?.trim();
  if (!url) return false;
  const kind = item.resourceKind;

  /**
   * Đồng nhất với tài liệu buổi học:
   * - File upload: ưu tiên MIME để quyết định phát media (audio/video),
   *   tránh phụ thuộc tuyệt đối vào resourceKind bị nhập sai hoặc dữ liệu cũ.
   * - Link ngoài: bám theo resourceKind đã chọn (youtube/audio/video).
   */
  if (item.type === 'file') {
    if (isAudioMimeType(item.mimeType) || isVideoMimeType(item.mimeType)) {
      return true;
    }
    return kind != null && PLAY_RESOURCE_KINDS.has(kind);
  }

  if (kind) {
    return PLAY_RESOURCE_KINDS.has(kind);
  }
  return false;
}

export function assignmentAttachmentSupportsImagePreview(
  item: StudentAssignmentAttachment,
): boolean {
  const url = item.url?.trim();
  if (!url) return false;
  const kind = item.resourceKind;
  if (item.type === 'file') {
    if (isImageMimeType(item.mimeType)) return true;
    return kind === 'image';
  }
  if (kind) {
    return kind === 'image';
  }
  return false;
}

export function assignmentAttachmentPlayVariant(
  item: StudentAssignmentAttachment,
): 'audio' | 'video' | 'image' {
  const kind = item.resourceKind;
  if (kind === 'audio') return 'audio';
  if (kind === 'image') return 'image';
  if (kind === 'youtube' || kind === 'video') return 'video';
  if (item.type === 'file' && isAudioMimeType(item.mimeType)) return 'audio';
  if (item.type === 'file' && isImageMimeType(item.mimeType)) return 'image';
  return 'video';
}

export function assignmentAttachmentOpenTabLabel(
  item: StudentAssignmentAttachment,
): string {
  if (item.type === 'link') {
    if (item.resourceKind === 'youtube') return 'Mở YouTube / tab mới';
    return 'Mở liên kết';
  }
  return 'Mở tab mới';
}

export const SESSION_MATERIAL_TYPE_LABEL: Record<string, string> = {
  audio: 'Âm thanh',
  video: 'Video',
  slide: 'Slide',
  document: 'Tài liệu',
  link: 'Liên kết web',
  youtube: 'YouTube / video nhúng',
  image: 'Hình ảnh',
  powerpoint: 'PowerPoint',
};
