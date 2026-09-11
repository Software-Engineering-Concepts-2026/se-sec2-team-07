import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useApp } from '../context';
export function useUnsavedChanges(dirtyRef) {
  const { confirm } = useApp();
  const blocker = useBlocker(() => dirtyRef.current);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let active = true;
    confirm('ออกจากหน้านี้?', 'การแก้ไขที่ยังไม่ได้บันทึกจะหายไป').then(ok => {
      if (active) { if (ok) blocker.proceed(); else blocker.reset(); }
    });
    return () => { active = false; };
  }, [blocker.state, confirm]);
  useEffect(() => {
    const handler = event => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyRef]);
}
