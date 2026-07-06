import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

/** Legacy `/lead/register` → unified `/login` (LP-D1 self-declaration). */
export default async function LeadRegisterRedirectPage({ searchParams }: Props) {
  const params = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const qs = new URLSearchParams();
  qs.set('mode', 'lead');
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value) qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  redirect(`/login?${qs.toString()}`);
}
