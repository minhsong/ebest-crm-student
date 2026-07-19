'use client';

import { useCallback } from 'react';
import { App, Button } from 'antd';
import { CopyOutlined, MessageOutlined } from '@ant-design/icons';

type Props = {
	message: string;
	zaloDeepLink?: string;
	zaloOaChatUrl?: string;
	zaloOaId?: string;
};

function resolveZaloOpenUrl(
	message: string,
	zaloDeepLink?: string,
	zaloOaChatUrl?: string,
	zaloOaId?: string,
): string | null {
	if (zaloDeepLink?.trim()) return zaloDeepLink.trim();
	const oa =
		zaloOaId?.trim() ||
		zaloOaChatUrl?.replace(/^https?:\/\/zalo\.me\//i, '').split(/[?#]/)[0];
	if (!oa || !message.trim()) return zaloOaChatUrl?.trim() || null;
	return `https://zalo.me/${oa}?msg=${encodeURIComponent(message.trim())}`;
}

export function ZaloConfirmMessageBlock({
	message,
	zaloDeepLink,
	zaloOaChatUrl,
	zaloOaId,
}: Props) {
	const { message: toast } = App.useApp();
	const openUrl = resolveZaloOpenUrl(message, zaloDeepLink, zaloOaChatUrl, zaloOaId);

	const copyMessage = useCallback(async () => {
		if (!message.trim()) return;
		try {
			await navigator.clipboard.writeText(message.trim());
			toast.success('Đã sao chép tin nhắn.');
		} catch {
			toast.warning('Không sao chép được. Hãy chọn và copy thủ công.');
		}
	}, [message, toast]);

	const openZalo = useCallback(() => {
		if (!openUrl) {
			toast.warning('Chưa có liên kết Zalo. Vui lòng sao chép tin nhắn và gửi thủ công.');
			return;
		}
		window.open(openUrl, '_blank', 'noopener,noreferrer');
	}, [openUrl, toast]);

	if (!message.trim()) {
		return (
			<div className="mock-test-zalo-message-block">
				<p className="mock-test-zalo-message-hint !text-red-600">
					Chưa có nội dung tin nhắn Zalo. Vui lòng quay lại chọn bài thi để hệ
					thống tạo mã xác minh mới.
				</p>
			</div>
		);
	}

	return (
		<div className="mock-test-zalo-message-block">
			<div className="mock-test-zalo-message-toolbar">
				<Button
					size="middle"
					icon={<CopyOutlined />}
					onClick={() => void copyMessage()}
					block
					className="!flex-1 sm:!flex-none"
				>
					Sao chép tin nhắn
				</Button>
				<Button
					type="primary"
					size="middle"
					className="mock-test-online-zalo-btn !flex-1 sm:!flex-none"
					icon={<MessageOutlined />}
					onClick={openZalo}
					block
				>
					Mở Zalo và gửi
				</Button>
			</div>
			<pre className="mock-test-zalo-message-code">
				<code>{message.trim()}</code>
			</pre>
			<p className="mock-test-zalo-message-hint">
				Nếu Zalo không tự điền sẵn, hãy dán nội dung đã sao chép vào khung chat OA
				Ebest.
			</p>
		</div>
	);
}
