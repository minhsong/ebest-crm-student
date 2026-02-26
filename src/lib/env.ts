/**
 * Server-side env: API base URL của CRM.
 * Không dùng NEXT_PUBLIC_ để không lộ ra client.
 */

function getApiBaseUrl(): string | null {
  const url = process.env.CRM_API_URL;
  return url?.trim() ?? null;
}

export { getApiBaseUrl };
