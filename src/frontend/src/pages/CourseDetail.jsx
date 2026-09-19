import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { PageTitle, Empty, ErrorPanel } from '../components/UI';
import CourseLinks from '../components/CourseLinks';

export default function CourseDetail() {
  const { id } = useParams(), navigate = useNavigate(), { confirm, notify } = useApp();
  const [course, setCourse] = useState(null), [name, setName] = useState(''), [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [actionError, setActionError] = useState(''), [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(''), [kind, setKind] = useState('cards'), [version, setVersion] = useState(0);
  const dirty = useRef(false), inFlight = useRef(false); useUnsavedChanges(dirty);
  dirty.current = Boolean(course && name !== course.name);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setLibrary(null);
    api(`/courses/${id}`, 'GET', undefined, controller.signal).then(data => { setCourse(data); setName(data.name); }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, version]);
  async function run(action) {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setActionError('');
    try { await action(); } catch (e) { setActionError(e.message); } finally { inFlight.current = false; setBusy(false); }
  }
  async function refresh() { const data = await api(`/courses/${id}`); setCourse(data); }
  async function rename(event) { event.preventDefault(); await run(async () => { await api(`/courses/${id}`, 'PUT', { name: name.trim() }); setCourse(c => ({ ...c, name: name.trim() })); setName(name.trim()); dirty.current = false; notify('บันทึกชื่อรายวิชาแล้ว'); }); }
  async function removeCourse() {
    if (!await confirm('ลบรายวิชานี้?', 'การ์ด โน้ต และประวัติทบทวนยังอยู่ในคลัง จะนำออกเฉพาะรายวิชาและการเชื่อมของวิชานี้')) return;
    await run(async () => { await api(`/courses/${id}`, 'DELETE', {}); dirty.current = false; notify('ลบรายวิชาแล้ว'); navigate('/courses'); });
  }
  async function changeLink(type, itemId, linked) { await run(async () => { await api(`/courses/${id}/${type}/${itemId}`, linked ? 'DELETE' : 'PUT', {}); await refresh(); notify(linked ? 'นำออกจากวิชาแล้ว ต้นฉบับยังอยู่ในคลัง' : 'เชื่อมเนื้อหาแล้ว'); }); }
  if (loading) return <p className="loading">กำลังเปิดรายวิชา…</p>;
  if (error) return <ErrorPanel error={error} retry={() => setVersion(v => v + 1)} />;
  const items = library ? library[kind].filter(item => `${item.front || ''} ${item.back || ''} ${item.title || ''} ${item.body || ''} ${item.deck_name || ''}`.toLowerCase().includes(query.toLowerCase())) : [];
  return <><PageTitle eyebrow="COURSE" title={course.name} subtitle="เนื้อหาต้นฉบับเดียวกัน ใช้งานข้ามวิชาได้"><Link to="/courses" className="btn secondary">รายวิชาทั้งหมด</Link><Link to={`/review?course=${id}`} className="btn">ทบทวนวิชานี้</Link></PageTitle>
    <form onSubmit={rename} className="panel toolbar"><label htmlFor="rename-course">ชื่อรายวิชา</label><input id="rename-course" value={name} maxLength={120} required disabled={busy} onChange={e => setName(e.target.value)} /><button className="btn secondary" disabled={busy || !name.trim() || name === course.name}>บันทึกชื่อ</button><button type="button" className="btn danger" onClick={removeCourse} disabled={busy}>ลบรายวิชา</button></form>
    {actionError && <p role="alert">{actionError}</p>}
    <div className="toolbar"><button className="btn" disabled={busy} onClick={() => run(async () => { setLibrary(await api('/courses/library')); })}>เพิ่มจากคลัง</button><Link className="btn secondary" to="/notes">สร้างโน้ตในคลัง</Link></div>
    {library && <section className="panel" aria-label="เพิ่มจากคลัง"><div className="row between"><h2>เพิ่มจากคลัง</h2><button className="btn secondary" disabled={busy} onClick={() => setLibrary(null)}>ปิดคลัง</button></div><div className="toolbar"><select aria-label="ประเภทเนื้อหา" value={kind} disabled={busy} onChange={e => setKind(e.target.value)}><option value="cards">การ์ด</option><option value="notes">โน้ต</option></select><input aria-label="ค้นหาเนื้อหาในคลัง" placeholder="ค้นหาเนื้อหา…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      {items.length ? items.map(item => { const linked = course[kind].some(current => current.id === item.id); return <article className="shared-content" key={item.id}><h3>{item.front || item.title}</h3><p className="shared-text">{item.back || item.body}</p><button className="btn secondary" disabled={busy || linked} onClick={() => changeLink(kind, item.id, false)}>{linked ? 'เชื่อมแล้ว' : 'เชื่อมกับวิชานี้'}</button></article>; }) : <p>ไม่พบเนื้อหา ลองเปลี่ยนคำค้นหรือสร้างเนื้อหาในคลังก่อน</p>}
    </section>}
    {['cards', 'notes'].map(type => <section className="panel" key={type}><h2>{type === 'cards' ? 'การ์ด' : 'โน้ต'} ({course[type].length})</h2>{course[type].length ? course[type].map(item => <article className="shared-content" key={item.id}><h3>{item.front || item.title}</h3><p className="shared-text">{item.back || item.body}</p>{item.deck_name && <p className="small muted">ชุดต้นฉบับ: {item.deck_name}</p>}<CourseLinks courses={item.courses} /><p className="small muted">การแก้ต้นฉบับมีผลกับทุกวิชาที่เชื่อม</p><div className="toolbar"><Link className="btn secondary" to={type === 'cards' ? `/edit/${item.deck_id}` : `/notes?edit=${item.id}`}>แก้ต้นฉบับ</Link><button className="btn secondary" disabled={busy} onClick={() => changeLink(type, item.id, true)}>นำออกจากวิชา</button></div></article>) : <Empty title={type === 'cards' ? 'ยังไม่มีการ์ดในวิชานี้' : 'ยังไม่มีโน้ตในวิชานี้'}><p>กดเพิ่มจากคลังเพื่อเลือกเนื้อหาเดิม</p></Empty>}</section>)}
  </>;
}
