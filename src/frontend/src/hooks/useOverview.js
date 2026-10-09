import { useState } from 'react';
import { api } from '../api';
import { useRemoteSync } from './useRemoteSync';
export function useOverview({ includeStats = true } = {}) {
  const [data, setData] = useState(null);
  const sync = useRemoteSync({
    resource: includeStats ? 'overview' : 'decks',
    load: (signal) => api(includeStats ? '/stats/overview' : '/decks', 'GET', undefined, signal),
    apply: (value) => setData({ decks: value.decks, stats: value.stats ?? null }),
  });
  return {
    ...data,
    loading: sync.loading,
    error: data ? '' : sync.error,
    reload: sync.reload,
    sync,
  };
}
