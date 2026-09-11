import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
export function useOverview() {
  const [state, setState] = useState({ loading: true });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    Promise.all([api('/decks', 'GET', undefined, controller.signal), api('/stats', 'GET', undefined, controller.signal)])
      .then(([d, stats]) => setState({ decks: d.decks, stats, loading: false }))
      .catch(e => { if (!controller.signal.aborted) setState({ error: e.message, loading: false }); });
    return () => controller.abort();
  }, [revision]);
  return { ...state, reload };
}
