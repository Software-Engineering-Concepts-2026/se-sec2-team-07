import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { PageTitle, Empty, ErrorPanel } from '../components/UI';

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]), [name, setName] = useState('');
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [actionError, setActionError] = useState(''), [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    api('/courses', 'GET', undefined, controller.signal).then(data => setCourses(data.courses)).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);
  async function create(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setActionError('');
    try { const result = await api('/courses', 'POST', { name: name.trim() }); navigate(`/courses/${result.id}`); }
    catch (e) { setActionError(e.message); } finally { setBusy(false); }
  }
  return <><PageTitle eyebrow="CONNECTED LEARNING" title="รายวิชาของฉัน" subtitle="เชื่อมการ์ดและโน้ตเดิมกับหลายวิชา โดยเก็บต้นฉบับและประวัติทบทวนร่วมกัน"><Link className="btn secondary" to="/notes">คลังโน้ต</Link></PageTitle>
    <form className="panel toolbar" onSubmit={create}><label htmlFor="course-name">ชื่อรายวิชาใหม่</label><input id="course-name" value={name} maxLength={120} required onChange={e => setName(e.target.value)} disabled={busy} placeholder="เช่น โครงสร้างข้อมูล" /><button className="btn" disabled={busy || !name.trim()}>{busy ? 'กำลังสร้าง…' : 'สร้างรายวิชา'}</button></form>
    {actionError && <p role="alert">{actionError}</p>}
    {loading ? <p className="loading">กำลังเปิดรายวิชา…</p> : error ? <ErrorPanel error={error} retry={() => setVersion(v => v + 1)} /> : <div className="deck-grid">{courses.length ? courses.map(course => <article className="deck-card" key={course.id}><Link to={`/courses/${course.id}`}><h2>{course.name}</h2></Link><p>{course.card_count} การ์ด · {course.note_count} โน้ต</p><Link to={`/courses/${course.id}`}>เปิดรายวิชา →</Link></article>) : <Empty title="ยังไม่มีรายวิชา"><p>สร้างวิชาแรก แล้วเลือกเนื้อหาที่บันทึกไว้จากคลัง</p></Empty>}</div>}
  </>;
}
