import { resolveLegacyGamesUrl } from '@/features/learning/games/session/game-route.utils';

type SearchParamsRecord = Record<string, string | string[] | undefined>;

export function nextJsSearchParamsToUrlSearchParams(
	searchParams: SearchParamsRecord | undefined,
): URLSearchParams {
	const qs = new URLSearchParams();
	if (!searchParams) return qs;
	for (const [key, value] of Object.entries(searchParams)) {
		if (value == null) continue;
		if (Array.isArray(value)) {
			for (const item of value) qs.append(key, item);
		} else {
			qs.set(key, value);
		}
	}
	return qs;
}

/** Legacy `/learning/games?…`, `/learning/practice`, `/learning/drill` → slug routes. */
export function resolveLegacyGamesRedirectHref(
	searchParams: SearchParamsRecord | undefined,
	fallback = '/learning/games',
): string {
	return resolveLegacyGamesUrl(nextJsSearchParamsToUrlSearchParams(searchParams)) ?? fallback;
}
