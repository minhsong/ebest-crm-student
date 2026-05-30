import type { Metadata } from 'next';
import { buildEmbedPageMetadata } from '@/lib/metadata';
import {
	MOCK_TEST_LANDING_CANONICAL_URL,
	MOCK_TEST_LANDING_SEO,
} from '@/lib/public-mock-test/seo.constants';
import './embed.css';

export const metadata: Metadata = buildEmbedPageMetadata({
	title: MOCK_TEST_LANDING_SEO.title,
	description: MOCK_TEST_LANDING_SEO.description,
	path: '/mock-test-register',
	canonicalUrl: MOCK_TEST_LANDING_CANONICAL_URL,
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
