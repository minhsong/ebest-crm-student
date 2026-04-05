import type { StudentSessionMaterial } from '@/types/student-session-material';
import type { StudentAssignmentAttachment } from '@/types/student-assignment-detail';

export function isAudioMimeType(mime?: string): boolean {
  return mime != null && mime.toLowerCase().startsWith('audio/');
}

export function isVideoMimeType(mime?: string): boolean {
  return mime != null && mime.toLowerCase().startsWith('video/');
}

/** File âm thanh / video hoặc liên kết (YouTube, v.v.) — react-player. */
export function sessionMaterialSupportsInlinePlay(
  m: StudentSessionMaterial,
): boolean {
  if (m.materialType === 'link') {
    return Boolean(m.current?.externalUrl?.trim());
  }
  return (
    (m.materialType === 'audio' || m.materialType === 'video') &&
    Boolean(m.current?.fileId || m.current?.externalUrl?.trim())
  );
}

export function assignmentAttachmentSupportsPlay(
  item: StudentAssignmentAttachment,
): boolean {
  if (item.type === 'link') {
    return Boolean(item.url?.trim());
  }
  return (
    isAudioMimeType(item.mimeType) || isVideoMimeType(item.mimeType)
  ) && Boolean(item.url?.trim());
}

export const SESSION_MATERIAL_TYPE_LABEL: Record<string, string> = {
  audio: 'Âm thanh',
  video: 'Video',
  slide: 'Slide',
  document: 'Tài liệu',
  link: 'Liên kết',
};
