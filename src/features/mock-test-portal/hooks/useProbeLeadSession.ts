'use client';

import { useEffect, useState } from 'react';
import { probeLeadSession } from '@/lib/lead-portal/client-api';
import type { LeadSessionProbe } from '@/lib/lead-portal/types';

/** Probe phiên lead/customer — dùng exam done, redirect guards. */
export function useProbeLeadSession() {
  const [probe, setProbe] = useState<LeadSessionProbe | null>(null);

  useEffect(() => {
    let cancelled = false;
    void probeLeadSession().then((next) => {
      if (!cancelled) setProbe(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return probe;
}
