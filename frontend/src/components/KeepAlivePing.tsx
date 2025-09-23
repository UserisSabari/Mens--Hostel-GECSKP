"use client";
import { useEffect } from 'react';

// Periodically ping the backend to mitigate cold starts on free/scale-to-zero plans.
export default function KeepAlivePing() {
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const ping = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      if (!baseUrl) return;
      try {
        await fetch(`${baseUrl}/`, { method: 'GET', cache: 'no-store' });
      } catch {
        // ignore network errors
      }
    };

    // initial slight delay to avoid competing with first paint
    const start = () => {
      ping();
      timerId = setInterval(ping, 5 * 60 * 1000); // every 5 minutes
    };

    const startId = setTimeout(start, 2000);

    return () => {
      clearTimeout(startId);
      if (timerId) clearInterval(timerId);
    };
  }, []);

  return null;
}


