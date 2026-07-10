'use client';

import type { ReactNode } from 'react';

export type GameTileOption<T extends string | number> = {
	value: T;
	title: string;
	description?: string;
	icon?: ReactNode;
};

type Props<T extends string | number> = {
	label: string;
	value: T;
	options: GameTileOption<T>[];
	columns?: 2 | 3;
	onChange: (value: T) => void;
};

/** Tile picker gaming — mode, duration, … */
export function GameTilePicker<T extends string | number>({
	label,
	value,
	options,
	columns = 2,
	onChange,
}: Props<T>) {
	return (
		<section className="game-tile-section">
			<p className="game-tile-section__label">{label}</p>
			<div className={`game-tile-grid game-tile-grid--${columns}`}>
				{options.map((opt) => {
					const active = opt.value === value;
					return (
						<button
							key={String(opt.value)}
							type="button"
							className={`game-tile${active ? ' is-active' : ''}`}
							onClick={() => onChange(opt.value)}
						>
							{opt.icon ? <span className="game-tile__icon">{opt.icon}</span> : null}
							<span className="game-tile__title">{opt.title}</span>
							{opt.description ? (
								<span className="game-tile__desc">{opt.description}</span>
							) : null}
						</button>
					);
				})}
			</div>
		</section>
	);
}
