'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useFanpageContactUrl } from '@/contexts/portal-contact-links-context';

type Props = {
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
	/** Mặc định: Fanpage Ebest */
	label?: string;
};

/** Link nhắn Messenger Fanpage — URL từ CRM `portal_site_links`. */
export function FanpageContactLink({
	children,
	className,
	style,
	label = 'Fanpage Ebest',
}: Props) {
	const href = useFanpageContactUrl();
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={className}
			style={style}
		>
			{children ?? label}
		</a>
	);
}
