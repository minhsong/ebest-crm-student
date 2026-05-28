import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/metadata';
import './embed.css';

export const metadata: Metadata = buildPageMetadata({
	title: 'Đăng ký thi thử TOEIC',
	description: 'Đăng ký thi thử TOEIC tại Ebest English.',
});

/**
 * Layout tối giản cho nhúng WordPress — không header/footer, không full-page chrome.
 */
export default function MockTestRegisterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="ebest-mock-test-embed-root">{children}</div>;
}
