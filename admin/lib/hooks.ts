'use client';
import { useCallback, useEffect, useState } from 'react';
export function useLoad<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => { setError(null); fn().then(setData).catch((e) => setError(e.message)); }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}
