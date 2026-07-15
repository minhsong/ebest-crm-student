import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App } from 'antd';
import { AuthProvider } from '@/contexts/auth-context';
import { PortalSessionProvider } from '@/contexts/portal-session-context';
import { PortalContactLinksProvider } from '@/contexts/portal-contact-links-context';
import { PortalContactFab } from '@/components/portal-contact/PortalContactFab';
import { defaultMetadata } from '@/lib/metadata';
import { parseStudentMeCustomerBrief } from '@/lib/parse-student-me-customer';
import { toClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { fetchStudentMeForSsr } from '@/lib/server/student-me';
import './globals.css';

export const metadata = defaultMetadata;

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const portalSession = await resolvePortalSessionFromCookies();
	const initialPortalSession = toClientPortalSessionPayload(portalSession);

	const me =
		portalSession.actor === 'customer' ? await fetchStudentMeForSsr() : null;
	const initialCustomer = parseStudentMeCustomerBrief(me?.customer ?? null);

	return (
		<html lang="vi">
			<body className="min-h-screen m-0 p-0 bg-gray-50 antialiased">
				<AntdRegistry>
					<App>
						<PortalSessionProvider initialSession={initialPortalSession}>
							<AuthProvider initialCustomer={initialCustomer}>
								<PortalContactLinksProvider>
									{children}
									<PortalContactFab />
								</PortalContactLinksProvider>
							</AuthProvider>
						</PortalSessionProvider>
					</App>
				</AntdRegistry>
			</body>
		</html>
	);
}
