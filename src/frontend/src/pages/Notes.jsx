import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { PageTitle, Empty, ErrorPanel } from '../components/UI';
import CourseLinks from '../components/CourseLinks';
import Documents from '../components/Documents';

const blank = () => ({ title: '', body: '' });
export default function Notes() {
  const { confirm, notify } = useApp(), [params, setParams] = useSearchParams();
  const [notes, setNotes] = useState([]), [draft, setDraft] = useState(blank), [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [actionError, setActionError] = useState(''), [busy, setBusy] = useState(false), [query, setQuery] = useState('');
  const [version, setVersion] = useState(0); const dirty = useRef(false), inFlight = useRef(false); useUnsavedChanges(dirty);
  const target = params.get('edit');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    api('/notes', 'GET', undefined, controller.signal).then(data => {
      setNotes(data.notes);
      const note = data.notes.find(item => String(item.id) === target);
      if (target && note) { setEditing(note); setDraft({ title: note.title, body: note.body }); dirty.current = false; }
      else if (target) { setEditing(null); setDraft(blank()); dirty.current = false; setActionError('ไม่พบโน้ตที่เลือก หรือโน้ตถูกลบแล้ว'); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version, target]);
  function change(key, value) { dirty.current = true; setDraft(d => ({ ...d, [key]: value })); }
  async function run(action) {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setActionError('');
    try { await action(); } catch (e) { setActionError(e.message); } finally { inFlight.current = false; setBusy(false); }
  }
  async function refresh() { const data = await api('/notes'); setNotes(data.notes); }
  async function select(note) {
    if (dirty.current && !await confirm('เปลี่ยนโน้ตที่กำลังแก้ไข?', 'ข้อความที่ยังไม่ได้บันทึกจะหายไป')) return;
    dirty.current = false; setEditing(note); setDraft(note ? { title: note.title, body: note.body } : blank()); setActionError(''); setParams(note ? { edit: note.id } : {});
  }
  async function save(event) {
    event.preventDefault(); if (busy) return;
    if (editing?.courses?.length && !await confirm('บันทึกการแก้ไขต้นฉบับ?', `การเปลี่ยนแปลงมีผลกับรายวิชา: ${editing.courses.map(c => c.name).join(', ')}`)) return;
    await run(async () => {
      await api(`/notes${editing ? `/${editing.id}` : ''}`, editing ? 'PUT' : 'POST', { title: draft.title.trim(), body: draft.body.trim() });
      dirty.current = false; setDraft(blank()); setEditing(null); setParams({}); notify('บันทึกโน้ตแล้ว'); await refresh();
    });
  }
  async function remove(note) {
    if (!await confirm('ลบโน้ตต้นฉบับ?', `ลบ “${note.title}” ออกจากคลังอย่างถาวร`)) return;
    await run(async () => { await api(`/notes/${note.id}`, 'DELETE', {}); if (editing?.id === note.id) { dirty.current = false; setDraft(blank()); setEditing(null); setParams({}); } await refresh(); notify('ลบโน้ตแล้ว'); });
  }
  async function readFile(file) {
    if (!file) return;
    if (draft.body.trim() && !await confirm('แทนที่ข้อความโน้ต?', 'ข้อความที่อ่านจากไฟล์จะแทนที่ข้อความในช่องเนื้อหา')) return;
    await run(async () => {
      if (file.size > 20 * 1024 * 1024) throw Error('ไฟล์ต้องมีขนาดไม่เกิน 20 MB');
      const content = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(file); });
      const result = await api('/extract', 'POST', { name: file.name, content }); dirty.current = true;
      setDraft(d => ({ title: d.title || file.name.replace(/\.[^.]+$/, '').slice(0, 120), body: result.text })); notify('อ่านข้อความแล้ว กรุณาตรวจและบันทึกโน้ต');
    });
  }
  const filtered = notes.filter(note => `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageTitle eyebrow="SHARED NOTES" title="คลังโน้ต" subtitle="เอกสารและโน้ตในที่เดียว ค้นหาและเปิดอ่านได้ทุกเมื่อ"><Link to="/courses" className="btn secondary">รายวิชาของฉัน</Link></PageTitle>
    <div className="toolbar"><input aria-label="ค้นหาโน้ต" placeholder="ค้นหาเอกสารหรือโน้ตจากชื่อและเนื้อหา…" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <Documents query={query} />
    <form className="panel note-editor" onSubmit={save}><h2>{editing ? 'แก้ไขโน้ตต้นฉบับ' : 'สร้างโน้ต'}</h2>{editing && <><CourseLinks courses={editing.courses} />{editing.courses?.length > 0 && <p role="note">การแก้ไขมีผลกับทุกวิชาที่เชื่อม ระบบจะให้ยืนยันก่อนบันทึก</p>}</>}
      <label htmlFor="note-title">ชื่อโน้ต</label><input id="note-title" value={draft.title} maxLength={120} required disabled={busy || loading} onChange={e => change('title', e.target.value)} />
      <label htmlFor="note-body">เนื้อหาโน้ต</label><textarea id="note-body" rows={10} value={draft.body} maxLength={60000} required disabled={busy || loading} onChange={e => change('body', e.target.value)} />
      <label htmlFor="note-file">อ่านข้อความจากไฟล์ PDF, PPTX, TXT หรือ Markdown (ไม่เก็บไฟล์ต้นฉบับ)</label><input id="note-file" type="file" accept=".pdf,.pptx,.txt,.md" disabled={busy || loading} onChange={e => { const file = e.target.files[0]; e.target.value = ''; readFile(file); }} />
      {actionError && <p role="alert">{actionError}</p>}<div className="toolbar"><button className="btn" disabled={busy || loading || !draft.title.trim() || !draft.body.trim()}>{busy ? 'กำลังดำเนินการ…' : 'บันทึกโน้ต'}</button><button type="button" className="btn secondary" disabled={busy || loading} onClick={() => select(null)}>เริ่มโน้ตใหม่</button></div>
    </form>
    {loading ? <p className="loading">กำลังเปิดคลังโน้ต…</p> : error ? <ErrorPanel error={error} retry={() => setVersion(v => v + 1)} /> : filtered.length ? filtered.map(note => <article key={note.id} className="panel shared-content"><h2>{note.title}</h2><p className="shared-text">{note.body}</p><CourseLinks courses={note.courses} /><div className="toolbar"><button className="btn secondary" disabled={busy || loading} onClick={() => select(note)}>แก้ไขโน้ต</button><button className="btn danger" disabled={busy || note.courses?.length > 0} onClick={() => remove(note)}>ลบโน้ต</button></div>{note.courses?.length > 0 && <p className="small muted">นำโน้ตออกจากรายวิชาที่เชื่อมทั้งหมดก่อนลบต้นฉบับ</p>}</article>) : <Empty title="ไม่พบโน้ต"><p>สร้างโน้ตใหม่หรือเปลี่ยนคำค้นหา</p></Empty>}
  </>;
}
