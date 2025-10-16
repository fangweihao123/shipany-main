'use client';

import { useEffect } from 'react';
import { init } from '@plausible-analytics/tracker'

export default function Plausible() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
      const scriptUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL;
      if (domain && scriptUrl) {
        init({ domain });
      }
    }
  }, []);

  return null;
}
