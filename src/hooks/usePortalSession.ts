/**
 * Re-export SSOT — mọi consumer dùng PortalSessionProvider.
 * @deprecated Import từ `@/contexts/portal-session-context` khi refactor callers.
 */
export {
	usePortalSession,
	getPortalActor,
	type PortalSessionState,
	type PortalSessionReadyState,
} from '@/contexts/portal-session-context';
