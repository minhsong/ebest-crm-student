'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Space, Typography } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

type Props = {
	checked: boolean;
	onCheckedChange: (next: boolean) => void;
};

/**
 * Kiểm tra loa trước khi vào thi — Web Audio tone (không phụ thuộc file CDN).
 */
export function MockTestOnlineSpeakerTest({ checked, onCheckedChange }: Props) {
	const [playing, setPlaying] = useState(false);
	const [playError, setPlayError] = useState<string | null>(null);
	const ctxRef = useRef<AudioContext | null>(null);

	useEffect(() => {
		return () => {
			void ctxRef.current?.close().catch(() => undefined);
			ctxRef.current = null;
		};
	}, []);

	const playTestTone = useCallback(async () => {
		setPlayError(null);
		setPlaying(true);
		try {
			const Ctx =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext;
			if (!Ctx) {
				setPlayError('Trình duyệt không hỗ trợ phát âm thanh thử. Hãy kiểm tra loa thủ công.');
				return;
			}
			const ctx = ctxRef.current ?? new Ctx();
			ctxRef.current = ctx;
			if (ctx.state === 'suspended') {
				await ctx.resume();
			}

			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = 880;
			gain.gain.value = 0.0001;
			osc.connect(gain);
			gain.connect(ctx.destination);

			const now = ctx.currentTime;
			gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
			osc.start(now);
			osc.stop(now + 0.9);
			await new Promise((r) => setTimeout(r, 950));
		} catch {
			setPlayError('Không phát được âm thanh thử. Kiểm tra loa / tai nghe và quyền trình duyệt.');
		} finally {
			setPlaying(false);
		}
	}, []);

	return (
		<div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
			<Typography.Text strong className="block">
				Kiểm tra loa / tai nghe
			</Typography.Text>
			<Typography.Paragraph type="secondary" className="!mb-0 text-sm">
				Bài thi có thể có phần nghe. Hãy bấm phát thử và xác nhận bạn nghe rõ trước khi
				bắt đầu.
			</Typography.Paragraph>
			<Space wrap>
				<Button
					icon={<SoundOutlined />}
					loading={playing}
					onClick={() => void playTestTone()}
				>
					Phát âm thanh thử
				</Button>
			</Space>
			{playError ? <Alert type="warning" showIcon message={playError} /> : null}
			<Checkbox
				checked={checked}
				onChange={(e) => onCheckedChange(e.target.checked)}
			>
				Tôi đã nghe thấy âm thanh và loa/tai nghe hoạt động bình thường.
			</Checkbox>
		</div>
	);
}
