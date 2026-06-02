import type { StudentSessionMaterial } from '@/types/student-session-material';

/** Route Next.js: cookie auth → CRM access → redirect signed/external URL. */
export function studentSessionMaterialOpenApiPath(
  sessionId: number,
  materialId: number,
): string {
  return `/api/class-sessions/${sessionId}/materials/${materialId}/open`;
}

/**
 * URL cho thẻ `<a target="_blank">`:
 * - link / youtube: externalUrl trực tiếp (nếu có)
 * - file / slide / …: proxy GET (tránh popup blocker sau fetch async)
 */
export function resolveStudentSessionMaterialOpenHref(
  sessionId: number,
  material: StudentSessionMaterial,
): string | null {
  if (sessionId < 1 || material.id < 1) return null;
  if (material.materialType === 'link' || material.materialType === 'youtube') {
    const external = material.current?.externalUrl?.trim();
    if (external) return external;
  }
  return studentSessionMaterialOpenApiPath(sessionId, material.id);
}
