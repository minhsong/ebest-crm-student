import { CRM_CLASS_STATUS } from '@/lib/crm-enums';

/** Nhãn trạng thái lớp — fallback khi API chưa trả `classStatusLabel`.
 * Mirror `ebest-crm-api/src/classes/utils/class-status-label-vi.util.ts`
 */
export const PORTAL_CLASS_STATUS_LABEL: Record<number, string> = {
	[CRM_CLASS_STATUS.PLANNING]: 'Dự mở',
	[CRM_CLASS_STATUS.READY]: 'Sẵn sàng',
	[CRM_CLASS_STATUS.IN_PROGRESS]: 'Đang học',
	[CRM_CLASS_STATUS.COMPLETED]: 'Đã học',
	[CRM_CLASS_STATUS.CANCELLED]: 'Đã hủy',
	[CRM_CLASS_STATUS.DROPPED]: 'Tạm dừng',
};

export function getPortalClassStatusLabel(status?: number | null): string {
	if (status == null) return '—';
	return PORTAL_CLASS_STATUS_LABEL[status] ?? '—';
}

export function antdTagColorForClassStatus(classStatus: number): string {
	if (classStatus === CRM_CLASS_STATUS.IN_PROGRESS) return 'processing';
	if (classStatus === CRM_CLASS_STATUS.READY) return 'blue';
	if (classStatus === CRM_CLASS_STATUS.COMPLETED) return 'purple';
	if (classStatus === CRM_CLASS_STATUS.CANCELLED) return 'error';
	if (classStatus === CRM_CLASS_STATUS.DROPPED) return 'orange';
	return 'default';
}

export function getPortalInteractionTag(
	interactionMode?: 'interactive' | 'read_only',
	canInteract?: boolean,
): { label: string; color: string } {
	if (interactionMode === 'interactive' || canInteract === true) {
		return { label: 'Tương tác', color: 'processing' };
	}
	return { label: 'Chỉ xem', color: 'default' };
}
