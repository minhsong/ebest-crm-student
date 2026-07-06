import { redirect } from 'next/navigation';



/** Legacy URL sau intake cũ — chuyển về đăng ký mới. */

export default function MockTestOnlineWaitingPage() {

	redirect('/mock-test-online/register');

}

