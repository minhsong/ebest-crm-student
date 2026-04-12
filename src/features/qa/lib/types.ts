/** Payload từ `GET /api/v1/student/qa` (sau unwrap interceptor CRM). */

export type StudentPortalQaVisibility = 'staff_only' | 'student' | 'public';

export type StudentPortalQaTag = {
  id: number;
  name: string;
  color: string | null;
};

export type StudentPortalQaListItem = {
  id: number;
  title: string;
  slug: string;
  visibility: StudentPortalQaVisibility;
  /** Lượt đọc từ cổng học viên (API đã +1 cho lần tải hiện tại). */
  portalReadCount?: number;
  tags: StudentPortalQaTag[];
};

export type StudentPortalQaListResponse = {
  data: StudentPortalQaListItem[];
  pagination: {
    total: number;
    current: number;
    pageSize: number;
    totalPages: number;
  };
};

export type StudentPortalQaDetail = StudentPortalQaListItem & {
  content: string;
};

export function isQaListResponse(v: unknown): v is StudentPortalQaListResponse {
  if (!v || typeof v !== 'object') return false;
  const o = v as StudentPortalQaListResponse;
  return (
    Array.isArray(o.data) &&
    o.pagination != null &&
    typeof o.pagination.total === 'number'
  );
}

export function isQaDetail(v: unknown): v is StudentPortalQaDetail {
  if (!v || typeof v !== 'object') return false;
  const o = v as StudentPortalQaDetail;
  return typeof o.slug === 'string' && typeof o.content === 'string';
}
