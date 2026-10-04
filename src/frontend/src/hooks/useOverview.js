import { useState } from 'react';
import { api } from '../api';
import { useRemoteSync } from './useRemoteSync';
export function useOverview({ includeStats = true } = {}) {
  const [data, setData] = useState(null);
  const sync = useRemoteSync({ resource: includeStats ? 'overview' : 'decks',
    load: signal => Promise.all([api('/decks', 'GET', undefined, signal), includeStats ? api('/stats', 'GET', undefined, signal) : Promise.resolve(null)]),
    apply: ([d, stats]) => setData({ decks: d.decks, stats }),
  });
  return { ...data, loading: sync.loading, error: data ? '' : sync.error, reload: sync.reload, sync };
}
