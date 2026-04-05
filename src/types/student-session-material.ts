/**
 * Khớp GET .../student/class-sessions/:id/materials/public
 */

export type StudentSessionMaterialType =
  | 'audio'
  | 'video'
  | 'slide'
  | 'document'
  | 'link';

export interface StudentSessionMaterialVersion {
  id: number;
  materialId: number;
  version: number;
  fileId?: string | null;
  externalUrl?: string | null;
  changeNote?: string | null;
  isPublishedSnapshot: boolean;
  createdBy?: number | null;
  createdAt: string;
}

export interface StudentSessionMaterial {
  id: number;
  classSessionId?: number | null;
  courseId: number;
  courseSessionId?: number | null;
  materialType: StudentSessionMaterialType;
  title: string;
  description?: string | null;
  isPublished: boolean;
  isPublic?: boolean;
  currentVersion: number;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;
  versions: StudentSessionMaterialVersion[];
  current?: StudentSessionMaterialVersion | null;
}
