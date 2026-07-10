'use client';

import type { ReactNode } from 'react';
import { Button } from 'antd';

export type GameActionBarItem = {
	key: string;
	label: string;
	onClick: () => void;
	type?: 'primary' | 'default' | 'dashed';
	danger?: boolean;
	icon?: ReactNode;
	block?: boolean;
};

type Props = {
	actions: GameActionBarItem[];
	layout?: 'stack' | 'row';
};

/** Nút điều hướng full-width — mobile gaming CTA. */
export function GameActionBar({ actions, layout = 'stack' }: Props) {
	return (
		<div
			className={`games-hub-action-bar${layout === 'row' ? ' games-hub-action-bar--row' : ''}`}
		>
			{actions.map((action) => (
				<Button
					key={action.key}
					type={action.type ?? 'default'}
					danger={action.danger}
					icon={action.icon}
					block={action.block ?? layout === 'stack'}
					size="large"
					onClick={action.onClick}
				>
					{action.label}
				</Button>
			))}
		</div>
	);
}
