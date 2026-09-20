import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';

export default function Documents({ query }) {
  const { confirm, notify } = useApp();
  const [documents, setDocuments] = useState([]), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null), [title, setTitle] = useState('');
  const inFlight = useRef(false);
  async function refresh() { const data = await api('/documents'); setDocuments(data.documents); }
  useEffect(() => {
    const controller = new AbortController();
    api('/documents', 'GET', undefined, controller.signal).then(data => setDocuments(data.documents))
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function run(action) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e.message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function upload(file) {
    if (!file) return;
    await run(async () => {
      if (!/\.(pdf|pptx|txt|md)$/i.test(file.name)) throw Error('รองรับ PDF, PPTX, TXT และ MD เท่านั้น');
      if (!file.size || file.size > 20 * 1024 * 1024) throw Error('เลือกไฟล์ที่มีข้อความและขนาดไม่เกิน 20 MB');
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(Error('อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่'));
        reader.readAsDataURL(file);
      });
      await api('/documents', 'POST', { name: file.name, content });
      await refresh(); notify('จัดเก็บเอกสารต้นฉบับแล้ว');
    });
  }
  async function remove(document) {
    if (!await confirm('ลบเอกสารต้นฉบับ?', `ลบ “${document.title}” และไฟล์ต้นฉบับออกจากคลังอย่างถาวร`)) return;
    await run(async () => { await api(`/documents/${document.id}`, 'DELETE', {}); await refresh(); notify('ลบเอกสารแล้ว'); });
  }
  const filtered = documents.filter(document => `${document.title} ${document.name} ${document.body}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section aria-label="เอกสารต้นฉบับ" className="stack">
    <div className="panel stack"><h2>เอกสารต้นฉบับ</h2>
      <p className="muted">เก็บไฟล์และข้อความไว้ในบัญชีของคุณ เปิดอ่านหรือดาวน์โหลดกลับได้</p>
      <label className="field">เพิ่มเอกสารต้นฉบับ<input type="file" accept=".pdf,.pptx,.txt,.md" disabled={busy || loading} onChange={e => { const file = e.target.files[0]; e.target.value = ''; upload(file); }} /></label>
      <p className="small muted">PDF, PPTX, TXT, MD · ไม่เกิน 20 MB · PDF ไม่เกิน 100 หน้า · ข้อความไม่เกิน 60,000 ตัวอักษร · ไม่รองรับภาพสแกน</p>
      {busy && <p role="status">กำลังดำเนินการกับเอกสาร…</p>}
      {error && <div role="alert"><p>{error}</p><button className="btn secondary" disabled={busy} onClick={() => run(refresh)}>โหลดรายการใหม่</button></div>}
    </div>
    {loading ? <p>กำลังเปิดคลังเอกสาร…</p> : filtered.length ? filtered.map(document => <article className="panel shared-content" key={document.id}>
      <h3>{document.title}</h3><p className="small muted">{document.name}</p>
      <details><summary>เปิดอ่านข้อความ</summary><p className="shared-text">{document.body}</p></details>
      <div className="toolbar"><a className="btn secondary" href={`/api/documents/${document.id}/download`}>ดาวน์โหลดต้นฉบับ</a>
        <button className="btn secondary" disabled={busy} onClick={() => { setEditing(document.id); setTitle(document.title); }}>เปลี่ยนชื่อเอกสาร</button>
        <button className="btn danger" disabled={busy} onClick={() => remove(document)}>ลบเอกสาร</button></div>
      {editing === document.id && <form className="stack" onSubmit={e => { e.preventDefault(); run(async () => { await api(`/documents/${document.id}`, 'PUT', { title: title.trim() }); setEditing(null); await refresh(); }); }}>
        <label className="field">ชื่อเอกสาร<input value={title} maxLength={120} required disabled={busy} onChange={e => setTitle(e.target.value)} /></label>
        <div className="toolbar"><button className="btn" disabled={busy || !title.trim()}>บันทึกชื่อเอกสาร</button><button type="button" className="btn secondary" disabled={busy} onClick={() => setEditing(null)}>ยกเลิก</button></div>
      </form>}
    </article>) : <p className="muted">{query ? 'ไม่พบเอกสารที่ตรงกับคำค้นหา' : 'ยังไม่มีเอกสาร เพิ่มไฟล์ต้นฉบับเพื่อเริ่มต้น'}</p>}
  </section>;
}
