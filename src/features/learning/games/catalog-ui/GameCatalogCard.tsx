'use client';

import { useRef, type KeyboardEvent, type ReactNode, type PointerEvent } from 'react';
import { Tag } from 'antd';
import { PlayCircleOutlined, RightOutlined } from '@ant-design/icons';

import {
	playGameCardClickSound,
	playGameCardHoverSound,
	primeGameAudio,
} from '@/features/learning/utils/game-sfx';

function gameCatalogSfxEnabled(): boolean {
	if (typeof window === 'undefined') return false;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type Props = {
	title: string;
	description: string;
	icon: ReactNode;
	disabled?: boolean;
	disabledReason?: string;
	shipped?: boolean;
	onPlay: () => void;
};

export function GameCatalogCard({
	title,
	description,
	icon,
	disabled = false,
	disabledReason,
	shipped = true,
	onPlay,
}: Props) {
	const hoverPlayedRef = useRef(false);

	const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
		if (disabled || !gameCatalogSfxEnabled()) return;
		if (event.pointerType === 'touch') return;
		if (hoverPlayedRef.current) return;
		hoverPlayedRef.current = true;
		primeGameAudio();
		playGameCardHoverSound();
	};

	const handlePointerLeave = () => {
		hoverPlayedRef.current = false;
	};

	const handleActivate = () => {
		if (disabled) return;
		primeGameAudio();
		if (gameCatalogSfxEnabled()) {
			playGameCardClickSound();
		}
		onPlay();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (disabled) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleActivate();
		}
	};

	return (
		<article
			className={`game-catalog-card${disabled ? ' is-disabled' : ' is-clickable'}`}
			role={disabled ? undefined : 'button'}
			tabIndex={disabled ? -1 : 0}
			aria-disabled={disabled || undefined}
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
		>
			<div className="game-catalog-card__accent" aria-hidden />
			<div className="game-catalog-card__head">
				<div className="game-catalog-card__icon">{icon}</div>
				<div className="game-catalog-card__body">
					<h3 className="game-catalog-card__title">
						{title}
						{!shipped ? (
							<Tag className="ml-2" style={{ fontSize: 10 }}>
								Sắp ra mắt
							</Tag>
						) : null}
					</h3>
					<p className="game-catalog-card__desc">{description}</p>
					{disabled && disabledReason ? (
						<p className="game-catalog-card__hint">{disabledReason}</p>
					) : null}
				</div>
			</div>
			<div className="game-catalog-card__cta" aria-hidden>
				<PlayCircleOutlined />
				<span>Chơi ngay</span>
				<RightOutlined className="game-catalog-card__cta-arrow" />
			</div>
		</article>
	);
}
