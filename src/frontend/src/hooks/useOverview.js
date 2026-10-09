import { useState } from 'react';
import { api } from '../api';
import { useRemoteSync } from './useRemoteSync';
import { useApp } from '../context';
import { cacheReadResource, readCacheSession } from './readCache';
export function useOverview({ includeStats = true } = {}) {
  const userId = useApp()?.user?.id;
  const [data, setData] = useState(null);
  const sync = useRemoteSync({
    resource: includeStats ? 'overview' : 'decks',
    load: (signal) => api(includeStats ? '/stats/overview' : '/decks', 'GET', undefined, signal),
    apply: (value) => {
      setData({ decks: value.decks, stats: value.stats ?? null });
      if (includeStats)
        cacheReadResource(readCacheSession(userId), 'decks', { decks: value.decks });
    },
  });
  return {
    ...data,
    loading: sync.loading,
    error: data ? '' : sync.error,
    reload: sync.reload,
    sync,
  };
}
