'use client';

import type { SessionKnowledgeSection } from '@/types/learning';
import {
	isSafeHttpUrl,
	safeKuPreviewHtml,
} from '@/features/learning/utils/ku-html-safe';

const SECTION_TYPE_LABEL: Record<SessionKnowledgeSection['type'], string> = {
	theory: 'Lý thuyết',
	example: 'Ví dụ',
	image: 'Hình ảnh',
	tip: 'Mẹo',
};

type Props = {
	sections: SessionKnowledgeSection[];
};

/**
 * Render sections KU bản published cho HV.
 * HTML theory/tip theo cùng pattern QA (nội dung CRM TipTap đã review trước publish).
 */
export function SessionKnowledgeSectionList({ sections }: Props) {
	const sorted = [...sections].sort((a, b) => a.order - b.order);

	if (!sorted.length) {
		return <p className="session-knowledge-empty">Chưa có nội dung trong đơn vị kiến thức này.</p>;
	}

	return (
		<div className="session-knowledge-sections">
			{sorted.map((section) => (
				<section key={section.id} className="session-knowledge-section">
					<span className="session-knowledge-section__type">
						{SECTION_TYPE_LABEL[section.type] ?? section.type}
					</span>
					{(section.type === 'theory' || section.type === 'tip') && (
						<div
							className="session-knowledge-section__html"
							// eslint-disable-next-line react/no-danger -- nội dung CRM đã publish
							dangerouslySetInnerHTML={{
								__html: safeKuPreviewHtml(String(section.payload.bodyHtml ?? '')),
							}}
						/>
					)}
					{section.type === 'example' && (
						<ul className="session-knowledge-section__examples">
							{((section.payload.cases as { text: string; translation?: string }[]) ?? []).map(
								(item, index) => (
									// eslint-disable-next-line react/no-array-index-key -- case chưa có id ổn định
									<li key={index}>
										<span>{item.text}</span>
										{item.translation ? (
											<span className="session-knowledge-section__translation">
												{' '}
												— {item.translation}
											</span>
										) : null}
									</li>
								),
							)}
						</ul>
					)}
					{section.type === 'image' && (
						<div className="session-knowledge-section__image">
							{isSafeHttpUrl(section.payload.url) ? (
								// eslint-disable-next-line @next/next/no-img-element -- URL CRM asset http(s)
								<img
									src={section.payload.url}
									alt={String(section.payload.caption ?? '')}
								/>
							) : (
								<p>{String(section.payload.caption ?? 'Hình ảnh (chưa có URL công khai)')}</p>
							)}
						</div>
					)}
				</section>
			))}
		</div>
	);
}
