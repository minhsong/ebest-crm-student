import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

/** Legacy `/lead/login` → unified `/login` (customer → lead fallback). */
export default async function LeadLoginRedirectPage({ searchParams }: Props) {
  const params = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value) qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const query = qs.toString();
  redirect(query ? `/login?${query}` : '/login');
}
