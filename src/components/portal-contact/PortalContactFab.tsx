'use client';

import { usePathname } from 'next/navigation';
import { usePortalContactLinks } from '@/contexts/portal-contact-links-context';
import './portal-contact-fab.css';

function MessengerIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="portal-contact-fab__svg">
			<path
				fill="currentColor"
				d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17V22l3.45-1.89c1.09.3 2.24.46 3.41.46 5.64 0 10-4.13 10-9.87C22 6.13 17.64 2 12 2zm1.01 13.27-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z"
			/>
		</svg>
	);
}

function ZaloIcon() {
	return (
		<svg viewBox="0 0 48 48" aria-hidden="true" className="portal-contact-fab__svg">
			<path
				fill="currentColor"
				d="M24.5 6C14.3 6 6 13.5 6 22.7c0 5.3 2.9 10 7.4 13l-.2 5.4 5.2-2.9c1.9.5 3.9.8 6.1.8 10.2 0 18.5-7.5 18.5-16.7S34.7 6 24.5 6zm8.3 22.6H28l-5.6-7.2v7.2h-3.6V16.8H23l5.6 7.2v-7.2h3.6v11.8h.6z"
			/>
		</svg>
	);
}

/** Ẩn FAB khi làm bài / phòng thi fullscreen để tránh che UI. */
function shouldHideFab(pathname: string | null): boolean {
	if (!pathname) return false;
	if (pathname.includes('/mock-test-online/exam')) return true;
	if (pathname.includes('/quiz/') && pathname.includes('/attempt')) return true;
	if (/\/forms\/[^/]+\/attempts/.test(pathname)) return true;
	return false;
}

/**
 * Icon chat cố định góc dưới phải: Messenger + Zalo OA (URL từ CRM portal_site_links).
 */
export function PortalContactFab() {
	const pathname = usePathname();
	const { messengerUrl, zaloUrl } = usePortalContactLinks();
	if (shouldHideFab(pathname)) return null;

	return (
		<nav className="portal-contact-fab" aria-label="Liên hệ hỗ trợ Ebest">
			<a
				className="portal-contact-fab__btn portal-contact-fab__btn--messenger"
				href={messengerUrl}
				target="_blank"
				rel="noopener noreferrer"
				title="Nhắn tin Fanpage Ebest (Messenger)"
				aria-label="Nhắn tin Fanpage Ebest trên Messenger"
			>
				<MessengerIcon />
			</a>
			<a
				className="portal-contact-fab__btn portal-contact-fab__btn--zalo"
				href={zaloUrl}
				target="_blank"
				rel="noopener noreferrer"
				title="Chat Zalo OA Ebest"
				aria-label="Chat Zalo OA Ebest"
			>
				<ZaloIcon />
			</a>
		</nav>
	);
}
