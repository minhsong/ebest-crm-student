'use client';

import { useEffect, useState } from 'react';
import { fetchPublicPortalSettings } from '@/lib/public-settings-client';
import { parseStudentPortalGoogleFromPublic } from '@/lib/student-portal-google-settings';

export type PortalGoogleConfig = {
  enabled: boolean;
  clientId: string;
};

/** Shared loader cho login/register; fail-closed nếu public settings lỗi. */
export function usePortalGoogleConfig(): PortalGoogleConfig | null {
  const [config, setConfig] = useState<PortalGoogleConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicPortalSettings()
      .then((raw) => {
        if (!cancelled) setConfig(parseStudentPortalGoogleFromPublic(raw));
      })
      .catch(() => {
        if (!cancelled) setConfig({ enabled: false, clientId: '' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
