import { useState } from 'react';
import { api } from '../api';
import { useRemoteSync } from './useRemoteSync';
export function useOverview() {
  const [data, setData] = useState(null);
  const sync = useRemoteSync({ resource: 'overview',
    load: signal => Promise.all([api('/decks', 'GET', undefined, signal), api('/stats', 'GET', undefined, signal)]),
    apply: ([d, stats]) => setData({ decks: d.decks, stats }),
  });
  return { ...data, loading: sync.loading, error: data ? '' : sync.error, reload: sync.reload, sync };
}
