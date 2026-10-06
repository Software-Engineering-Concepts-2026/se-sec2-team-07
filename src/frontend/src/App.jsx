import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppContext } from './context';
import { api } from './api';
import Auth from './pages/Auth';
import { ErrorPanel } from './components/UI';

export default function App() {
  const [user, setUser] = useState(null); const [ai, setAi] = useState(false); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [modal, setModal] = useState(null);
  const timeout = useRef(); const dialog = useRef(); const resolver = useRef();
  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.content = user ? 'noindex,nofollow' : 'index,follow';
    if (!user) document.title = 'Focus Flashcards — เรียนรู้ทีละนิด จดจำได้อีกนาน';
  }, [user]);
  const drafts = useRef(new Set());
  const registerDraft = useCallback(ref => { drafts.current.add(ref); return () => drafts.current.delete(ref); }, []);
  const hasUnsavedDraft = useCallback(() => [...drafts.current].some(ref => ref.current), []);
  const notify = useCallback(text => { setMessage(text); clearTimeout(timeout.current); timeout.current = setTimeout(() => setMessage(''), 4000); }, []);
  const confirm = useCallback((title, text) => new Promise(resolve => {
    resolver.current?.(false); resolver.current = resolve; setModal({ title, text });
  }), []);
  const resolve = value => { dialog.current?.close(); setModal(null); resolver.current?.(value); resolver.current = null; };
  useEffect(() => { if (modal && !dialog.current.open) dialog.current.showModal(); }, [modal]);
  const boot = useCallback(async () => {
    setLoading(true); setError('');
    try { const me = await api('/me'); setUser(me.user); setAi(me.ai); }
    catch (e) { if (e.status !== 401) setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { boot(); const expired = () => { setUser(null); notify('หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบอีกครั้ง'); }; window.addEventListener('focus:unauthorized', expired); return () => { window.removeEventListener('focus:unauthorized', expired); clearTimeout(timeout.current); }; }, [boot, notify]);
  return <AppContext.Provider value={{ user, setUser, ai, setAi, notify, confirm, registerDraft, hasUnsavedDraft }}>{loading ? <div className="loading">กำลังเปิดพื้นที่เรียนรู้ของคุณ…</div> : error ? <div className="content"><ErrorPanel error={error} retry={boot} /></div> : user ? <Outlet /> : <Auth />}<div id="toast" className={message ? 'show' : ''} role="status" aria-live="polite">{message}</div><dialog ref={dialog} onCancel={e => { e.preventDefault(); resolve(false); }}>{modal && <><h2>{modal.title}</h2><p>{modal.text}</p><div className="row"><button className="btn danger" onClick={() => resolve(true)}>ยืนยัน</button><button className="btn secondary" onClick={() => resolve(false)}>ยกเลิก</button></div></>}</dialog></AppContext.Provider>;
}
