import { MockTestOnlineExamDoneClient } from '@/components/public-mock-test-online/MockTestOnlineExamDoneClient';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';

export default function MockTestOnlineExamDonePage() {
	return (
		<MockTestClientErrorBoundary variant="exam">
			<MockTestOnlineExamDoneClient />
		</MockTestClientErrorBoundary>
	);
}
