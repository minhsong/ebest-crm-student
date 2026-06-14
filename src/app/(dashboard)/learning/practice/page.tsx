import { redirect } from 'next/navigation';

type Props = {
	searchParams?: Record<string, string | string[] | undefined>;
};

function buildQueryString(searchParams: Props['searchParams']): string {
	if (!searchParams) return '';
	const qs = new URLSearchParams();
	for (const [key, value] of Object.entries(searchParams)) {
		if (value == null) continue;
		if (Array.isArray(value)) {
			for (const item of value) qs.append(key, item);
		} else {
			qs.set(key, value);
		}
	}
	return qs.toString();
}

/** @deprecated Dùng `/learning/games` — giữ redirect tương thích bookmark cũ. */
export default function LearningPracticeRedirectPage({ searchParams }: Props) {
	const suffix = buildQueryString(searchParams);
	redirect(suffix ? `/learning/games?${suffix}` : '/learning/games');
}
