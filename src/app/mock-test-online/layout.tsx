import type { Metadata } from 'next';
import '../mock-test-register/embed.css';
import './mock-test-online.css';
import { PortalChromeGate } from '@/components/portal/PortalChromeGate';
import { buildMockTestOnlineEmbedMetadata } from '@/lib/public-mock-test-online/seo/build-metadata';
import { fetchMockTestOnlineSeo } from '@/lib/public-mock-test-online/seo/fetch-seo.server';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchMockTestOnlineSeo();
  return buildMockTestOnlineEmbedMetadata(seo, '/mock-test-online');
}

export default function MockTestOnlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ebest-mock-test-embed-root">
      <PortalChromeGate>{children}</PortalChromeGate>
    </div>
  );
}
