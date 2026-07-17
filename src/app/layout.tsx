import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider } from 'antd';
import { AuthProvider } from '@/contexts/auth-context';
import { PortalSessionProvider } from '@/contexts/portal-session-context';
import { PortalContactLinksProvider } from '@/contexts/portal-contact-links-context';
import { PortalContactFab } from '@/components/portal-contact/PortalContactFab';
import { CannotConnectToServerPanel } from '@/components/errors/CannotConnectToServerPanel';
import { ebestPublicAntdTheme } from '@/lib/ebest-public-antd-theme';
import { defaultMetadata } from '@/lib/metadata';
import { toClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { isUpstreamConnectionFailure } from '@/lib/student-safe-errors';
import './globals.css';

export const metadata = defaultMetadata;

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	let portalSession;
	try {
		portalSession = await resolvePortalSessionFromCookies();
	} catch (error) {
		if (isUpstreamConnectionFailure(error)) {
			return (
				<html lang="vi">
					<body className="min-h-screen m-0 p-0 bg-gray-50 antialiased">
						<AntdRegistry>
							<ConfigProvider theme={ebestPublicAntdTheme}>
								<CannotConnectToServerPanel />
							</ConfigProvider>
						</AntdRegistry>
					</body>
				</html>
			);
		}
		throw error;
	}

	const initialPortalSession = toClientPortalSessionPayload(portalSession);

	const initialCustomer =
		portalSession.actor === 'customer' ? portalSession.customer : null;

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
