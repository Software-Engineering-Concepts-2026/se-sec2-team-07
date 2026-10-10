import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context';
import {
  cacheReadResource,
  isReadCacheGenerationCurrent,
  isReadCacheSessionCurrent,
  readCachedResource,
  readCacheSession,
} from './readCache';

// Read-only refreshes never replay writes or replace an unsaved draft.
export function useRemoteSync({ resource, load, apply, blocked = () => false, enabled = true }) {
  const userId = useApp()?.user?.id ?? null;
  const owner = useRef(userId);
  owner.current = userId;
  const latest = useRef({ load, apply, blocked });
  latest.current = { load, apply, blocked };
  const execute = useRef(() => {});
  const [state, setState] = useState({
    loading: enabled,
    refreshing: false,
    error: '',
    lastSynced: null,
  });
  const reload = useCallback((force = false) => execute.current(force === true), []);
  useEffect(() => {
    let active = true,
      request = null;
    setState({ loading: enabled, refreshing: false, error: '', lastSynced: null });
    const session = readCacheSession(userId);
    const cached = enabled && !latest.current.blocked() && readCachedResource(session, resource);
    if (cached && !latest.current.blocked()) {
      latest.current.apply(cached.value);
      setState({ loading: false, refreshing: false, error: '', lastSynced: cached.lastSynced });
    }
    async function refresh(force = false) {
      if (!enabled || request) return;
      if (!force && latest.current.blocked()) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const controller = new AbortController();
      request = controller;
      setState((s) => ({ ...s, refreshing: true }));
      try {
        while (active && !controller.signal.aborted) {
          const requestSession = readCacheSession(userId);
          const value = await latest.current.load(controller.signal);
          if (
            !active ||
            controller.signal.aborted ||
            owner.current !== userId ||
            (requestSession && !isReadCacheSessionCurrent(requestSession))
          )
            return;
          if (!force && latest.current.blocked()) {
            setState((s) => ({ ...s, loading: false }));
            return;
          }
          // A write completed while this read was pending. Fetch a new snapshot.
          if (requestSession && !isReadCacheGenerationCurrent(requestSession)) continue;
          latest.current.apply(value);
          cacheReadResource(requestSession, resource, value);
          setState({ loading: false, refreshing: false, error: '', lastSynced: new Date() });
          return;
        }
      } catch (e) {
        if (active && !controller.signal.aborted)
          setState((s) => ({ ...s, loading: false, error: e.message }));
      } finally {
        request = null;
        if (active) setState((s) => ({ ...s, refreshing: false }));
      }
    }
    execute.current = refresh;
    const resume = () => {
      if (document.visibilityState !== 'hidden') refresh();
    };
    refresh();
    const interval = window.setInterval(resume, 30000);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active = false;
      request?.abort();
      execute.current = () => {};
      window.clearInterval(interval);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [resource, enabled, userId]);
  return { ...state, reload };
}
