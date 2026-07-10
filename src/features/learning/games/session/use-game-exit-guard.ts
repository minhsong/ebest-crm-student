'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { useRouter } from 'next/navigation';

import { useOptionalGameExitGuardContext } from '@/features/learning/games/session/game-exit-guard.context';

type Props = {
	enabled: boolean;
	onAbandon: () => Promise<void>;
	/** Navigate sau khi user xác nhận thoát qua browser Back. */
	onPopExitNavigate?: () => void;
};

/**
 * Cảnh báo khi rời trang playing — abandon chỉ khi user xác nhận (Q3).
 * beforeunload + popstate trap (B7) + link capture qua GameExitGuardProvider (E11).
 */
export function useGameExitGuard({ enabled, onAbandon, onPopExitNavigate }: Props) {
	const router = useRouter();
	const exitGuardCtx = useOptionalGameExitGuardContext();
	const onAbandonRef = useRef(onAbandon);
	const onPopExitNavigateRef = useRef(onPopExitNavigate);

	useEffect(() => {
		onAbandonRef.current = onAbandon;
	}, [onAbandon]);

	useEffect(() => {
		onPopExitNavigateRef.current = onPopExitNavigate;
	}, [onPopExitNavigate]);

	const showExitModal = useCallback((navigate: () => void) => {
		Modal.confirm({
			title: 'Kết thúc lượt chơi?',
			content:
				'Bạn đang giữa lượt. Nếu thoát, lượt sẽ kết thúc và điểm hiện tại được ghi nhận.',
			okText: 'Kết thúc lượt',
			cancelText: 'Tiếp tục chơi',
			onOk: async () => {
				await onAbandonRef.current();
				navigate();
			},
		});
	}, []);

	const confirmExit = useCallback(
		(navigate: () => void) => {
			if (!enabled) {
				navigate();
				return;
			}
			showExitModal(navigate);
		},
		[enabled, showExitModal],
	);

	useEffect(() => {
		if (!exitGuardCtx) return;
		if (!enabled) {
			exitGuardCtx.register(null);
			return;
		}
		exitGuardCtx.register({ enabled: true, confirmExit });
		return () => exitGuardCtx.register(null);
	}, [confirmExit, enabled, exitGuardCtx]);

	useEffect(() => {
		if (!enabled) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [enabled]);

	useEffect(() => {
		if (!enabled || !onPopExitNavigateRef.current) return;

		window.history.pushState({ gameExitGuard: true }, '');

		const onPopState = () => {
			window.history.pushState({ gameExitGuard: true }, '');
			showExitModal(() => onPopExitNavigateRef.current?.());
		};

		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	}, [enabled, showExitModal]);

	return { confirmExit, router };
}
