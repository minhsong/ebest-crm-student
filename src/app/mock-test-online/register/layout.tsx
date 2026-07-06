import type { Metadata } from 'next';
import { buildMockTestOnlineLandingMetadata } from '@/lib/public-mock-test-online/seo/build-metadata';
import { fetchMockTestOnlineSeo } from '@/lib/public-mock-test-online/seo/fetch-seo.server';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchMockTestOnlineSeo();
  return buildMockTestOnlineLandingMetadata(seo);
}

export default function MockTestOnlineRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
