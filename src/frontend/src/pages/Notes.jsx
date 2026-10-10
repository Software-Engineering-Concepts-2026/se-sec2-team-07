import { useRemoteSync } from '../hooks/useRemoteSync';
import { useRetryableSave } from '../hooks/useRetryableSave';
import SearchField from '../components/SearchField';
import SyncStatus from '../components/SyncStatus';
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
  const { confirm, notify } = useApp(),
    [params, setParams] = useSearchParams();
  const [notes, setNotes] = useState([]),
    [draft, setDraft] = useState(blank),
    [editing, setEditing] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [fileStatus, setFileStatus] = useState('');
  const [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState('');
  const dirty = useRef(false),
    inFlight = useRef(false);
  useUnsavedChanges(dirty);
  const target = params.get('edit');
  const mutation = useRetryableSave(target || 'new-note');
  useEffect(() => {
    dirty.current = false;
    setEditing(null);
    setDraft(blank());
    setActionError('');
    setConflict(false);
    setFileStatus('');
  }, [target]);
  const sync = useRemoteSync({
    resource: `notes:${target}`,
    blocked: () => dirty.current || inFlight.current || mutation.uncertain,
    load: (signal) => api('/notes', 'GET', undefined, signal),
    apply: (data) => {
      setNotes(data.notes);
      const note = data.notes.find((item) => String(item.id) === target);
      if (target && note) {
        setEditing(note);
        setDraft({ title: note.title, body: note.body });
      } else {
        setEditing(null);
        setDraft(blank());
      }
      dirty.current = false;
      setActionError(target && !note ? 'ไม่พบโน้ตที่เลือก หรือโน้ตถูกลบแล้ว' : '');
    },
  });
  const { loading, error } = sync;
  const locked = busy || mutation.uncertain || sync.refreshing;
  async function reload() {
    if (
      dirty.current &&
      !(await confirm(
        'ดึงข้อมูลล่าสุดและแทนที่ร่าง?',
        'ร่างที่ยังไม่บันทึกจะถูกแทนที่เมื่อดึงข้อมูลสำเร็จ กรุณาคัดลอกข้อความที่ต้องการเก็บก่อน',
      ))
    )
      return;
    sync.reload(true);
  }
  function change(key, value) {
    dirty.current = true;
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function run(action) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setActionError('');
    setConflict(false);
    try {
      await action();
    } catch (e) {
      setFileStatus('');
      setConflict(e.status === 409);
      setActionError(e.message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    const data = await api('/notes');
    setNotes(data.notes);
  }
  async function select(note) {
    if (
      dirty.current &&
      !(await confirm('เปลี่ยนโน้ตที่กำลังแก้ไข?', 'ข้อความที่ยังไม่ได้บันทึกจะหายไป'))
    )
      return;
    dirty.current = false;
    setEditing(note);
    setDraft(note ? { title: note.title, body: note.body } : blank());
    setFileStatus('');
    setActionError('');
    setConflict(false);
    setParams(note ? { edit: note.id } : {});
    requestAnimationFrame(() => document.getElementById('note-title')?.focus());
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (
      editing?.courses?.length &&
      !(await confirm(
        'บันทึกการแก้ไขต้นฉบับ?',
        `การเปลี่ยนแปลงมีผลกับรายวิชา: ${editing.courses.map((c) => c.name).join(', ')}`,
      ))
    )
      return;
    await run(async () => {
      dirty.current = true;
      await mutation.save(`/notes${editing ? `/${editing.id}` : ''}`, editing ? 'PUT' : 'POST', {
        title: draft.title.trim(),
        body: draft.body.trim(),
        ...(editing ? { revision: editing.revision } : {}),
      });
      dirty.current = false;
      setDraft(blank());
      setFileStatus('');
      setEditing(null);
      setParams({});
      notify('บันทึกโน้ตแล้ว');
      await refresh();
    });
  }
  async function remove(note) {
    if (!(await confirm('ลบโน้ตต้นฉบับ?', `ลบ “${note.title}” ออกจากคลังอย่างถาวร`))) return;
    await run(async () => {
      await api(`/notes/${note.id}`, 'DELETE', { revision: note.revision });
      if (editing?.id === note.id) {
        dirty.current = false;
        setDraft(blank());
        setEditing(null);
        setParams({});
      }
      await refresh();
      notify('ลบโน้ตแล้ว');
    });
  }
  async function readFile(file) {
    // Returning from the file picker can trigger a background refresh.
    // A selected file must still be handled while that read-only request runs.
    if (!file || busy || mutation.uncertain || inFlight.current) return;
    if (
      draft.body.trim() &&
      !(await confirm('แทนที่ข้อความโน้ต?', 'ข้อความที่อ่านจากไฟล์จะแทนที่ข้อความในช่องเนื้อหา'))
    )
      return;
    await run(async () => {
      setFileStatus('');
      if (!/\.(pdf|pptx|txt|md)$/i.test(file.name))
        throw Error('รูปแบบไฟล์ไม่รองรับ กรุณาเลือก PDF, PPTX, TXT หรือ MD');
      if (!file.size) throw Error('ไฟล์ว่าง กรุณาเลือกไฟล์ที่มีข้อความ');
      if (file.size > 20 * 1024 * 1024) throw Error('ไฟล์ต้องมีขนาดไม่เกิน 20 MB');
      setFileStatus(`กำลังอ่านข้อความจาก ${file.name} — หากต้องใช้ OCR อาจใช้เวลา 1–3 นาที`);
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(Error('อ่านไฟล์ไม่สำเร็จ'));
        reader.readAsDataURL(file);
      });
      const result = await api('/extract', 'POST', { name: file.name, content });
      if (typeof result?.text !== 'string' || !result.text.trim())
        throw Error('เซิร์ฟเวอร์ส่งข้อความจากไฟล์ไม่ครบ กรุณาลองอัปโหลดอีกครั้ง');
      dirty.current = true;
      setDraft((d) => ({
        title: d.title || file.name.replace(/\.[^.]+$/, '').slice(0, 120),
        body: result.text,
      }));
      setFileStatus(
        `อ่าน ${file.name} สำเร็จ — ข้อความอยู่ในช่องเนื้อหาโน้ตด้านบน ยังไม่ได้บันทึก${
          result.requiresReview ? ' · ใช้ OCR กรุณาตรวจสระ วรรณยุกต์ และลำดับข้อความก่อนบันทึก' : ''
        }`,
      );
      notify('อ่านข้อความแล้ว กรุณาตรวจและบันทึกโน้ต');
    });
  }
  const filtered = notes.filter((note) =>
    `${note.title} ${note.body}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="SHARED NOTES"
        title="คลังโน้ต"
        subtitle="เอกสารและโน้ตในที่เดียว ค้นหาและเปิดอ่านได้ทุกเมื่อ"
      >
        <Link to="/courses" className="btn secondary">
          รายวิชาของฉัน
        </Link>
      </PageTitle>
      <SyncStatus
        sync={sync}
        recoveryError={conflict ? actionError : undefined}
        paused={dirty.current}
        reload={reload}
        disabled={busy || mutation.uncertain}
      />
      <div className="toolbar">
        <SearchField
          label="ค้นหาโน้ต"
          placeholder="ค้นหาเอกสารหรือโน้ตจากชื่อและเนื้อหา…"
          value={query}
          onChange={setQuery}
        />
      </div>
      <nav className="note-shortcuts" aria-label="ทางลัดคลังโน้ต">
        <a
          href="#note-title"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('note-title')?.focus();
          }}
        >
          เขียนโน้ต ↓
        </a>
        <a
          href="#saved-notes"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('saved-notes')?.focus();
          }}
        >
          ดูโน้ตที่บันทึก ({notes.length}) ↓
        </a>
      </nav>
      <div className="notes-reference-layout">
        <div className="notes-reference-documents">
          <Documents query={query} />
        </div>
        <form className="panel note-editor" onSubmit={save}>
          <h2>{editing ? 'แก้ไขโน้ตต้นฉบับ' : 'สร้างโน้ต'}</h2>
          {editing && (
            <>
              <CourseLinks courses={editing.courses} />
              {editing.courses?.length > 0 && (
                <p role="note">การแก้ไขมีผลกับทุกวิชาที่เชื่อม ระบบจะให้ยืนยันก่อนบันทึก</p>
              )}
            </>
          )}
          <label htmlFor="note-title">ชื่อโน้ต</label>
          <input
            id="note-title"
            value={draft.title}
            maxLength={120}
            required
            disabled={locked || loading}
            onChange={(e) => change('title', e.target.value)}
          />
          <label htmlFor="note-body">เนื้อหาโน้ต</label>
          <textarea
            id="note-body"
            rows={6}
            value={draft.body}
            maxLength={60000}
            required
            disabled={locked || loading}
            onChange={(e) => change('body', e.target.value)}
          />
          <p className="small muted">
            {draft.body.length.toLocaleString()} / 60,000 ตัวอักษร ·{' '}
            {dirty.current ? 'มีการแก้ไขที่ยังไม่บันทึก' : 'กรอกชื่อและเนื้อหา แล้วกดบันทึกโน้ต'}
          </p>
          <label htmlFor="note-file">
            อ่านข้อความจากไฟล์ PDF, PPTX, TXT หรือ Markdown (ไม่เก็บไฟล์ต้นฉบับ)
          </label>
          <input
            id="note-file"
            type="file"
            accept=".pdf,.pptx,.txt,.md"
            disabled={busy || mutation.uncertain || loading}
            onChange={(e) => {
              const file = e.target.files[0];
              e.target.value = '';
              readFile(file);
            }}
          />
          {fileStatus && (
            <p className="notice" role="status">
              {fileStatus}
            </p>
          )}
          {actionError && <p role="alert">{actionError}</p>}
          <div className="toolbar">
            <button
              className="btn"
              disabled={
                busy || sync.refreshing || loading || !draft.title.trim() || !draft.body.trim()
              }
            >
              {busy ? 'กำลังดำเนินการ…' : 'บันทึกโน้ต'}
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={locked || loading}
              onClick={() => select(null)}
            >
              เริ่มโน้ตใหม่
            </button>
          </div>
        </form>
      </div>
      <h2 id="saved-notes" tabIndex={-1}>
        โน้ตที่บันทึก <span className="small muted">({filtered.length} รายการ)</span>
      </h2>
      {loading ? (
        <p className="loading">กำลังเปิดคลังโน้ต…</p>
      ) : error && !notes.length ? (
        <ErrorPanel error={error} retry={reload} />
      ) : filtered.length ? (
        filtered.map((note) => (
          <article key={note.id} className="panel shared-content">
            <h2>{note.title}</h2>
            <p className="shared-text">{note.body}</p>
            <CourseLinks courses={note.courses} />
            <div className="toolbar">
              <button
                className="btn secondary"
                disabled={locked || loading}
                onClick={() => select(note)}
              >
                แก้ไขโน้ต
              </button>
              <button
                className="btn danger"
                disabled={locked || note.courses?.length > 0}
                onClick={() => remove(note)}
              >
                ลบโน้ต
              </button>
            </div>
            {note.courses?.length > 0 && (
              <p className="small muted">นำโน้ตออกจากรายวิชาที่เชื่อมทั้งหมดก่อนลบต้นฉบับ</p>
            )}
          </article>
        ))
      ) : (
        <Empty title="ไม่พบโน้ต">
          <p>สร้างโน้ตใหม่หรือเปลี่ยนคำค้นหา</p>
        </Empty>
      )}
    </>
  );
}
