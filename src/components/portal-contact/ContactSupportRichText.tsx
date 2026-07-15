'use client';

import type { ReactNode } from 'react';
import { usePortalContactLinks } from '@/contexts/portal-contact-links-context';

/**
 * Các cụm từ trong copy lỗi/UX cần mở chat Messenger Fanpage.
 * Ưu tiên match dài trước (Fanpage… trước «liên hệ Ebest»).
 */
const CONTACT_PHRASE_RE =
	/(liên hệ Fanpage E-?best(?: English)?|Fanpage E-?best(?: English)?|liên hệ Ebest)/gi;

type Props = {
	text: string;
	className?: string;
};

function linkify(text: string, href: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	let last = 0;
	const re = new RegExp(CONTACT_PHRASE_RE.source, CONTACT_PHRASE_RE.flags);
	let match: RegExpExecArray | null;
	let i = 0;
	while ((match = re.exec(text)) != null) {
		const start = match.index;
		const label = match[0];
		if (start > last) {
			nodes.push(text.slice(last, start));
		}
		nodes.push(
			<a
				key={`c-${i}-${start}`}
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className="font-medium underline underline-offset-2"
			>
				{label}
			</a>,
		);
		last = start + label.length;
		i += 1;
	}
	if (last < text.length) {
		nodes.push(text.slice(last));
	}
	return nodes.length > 0 ? nodes : [text];
}

/** Rich text: tự gắn link Messenger cho «Fanpage Ebest» / «liên hệ Ebest». */
export function ContactSupportRichText({ text, className }: Props) {
	const { messengerUrl } = usePortalContactLinks();
	return <span className={className}>{linkify(text, messengerUrl)}</span>;
}
