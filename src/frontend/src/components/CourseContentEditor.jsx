import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { useRetryableSave } from '../hooks/useRetryableSave';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

export default function CourseContentEditor({ item, kind, onClose, onSaved }) {
  const dialog = useRef(null);
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const { confirm } = useApp();
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mutation = useRetryableSave(`${kind}:${item.id}`);
  useUnsavedChanges(dirty);
  useEffect(() => {
    dialog.current.showModal();
    const controller = new AbortController();
    const load =
      kind === 'cards'
        ? api(`/decks/${item.deck_id}`, 'GET', undefined, controller.signal)
        : api('/notes', 'GET', undefined, controller.signal);
    load
      .then((value) => {
        if (controller.signal.aborted) return;
        const source =
          kind === 'cards'
            ? value.cards.find((card) => card.id === item.id)
            : value.notes.find((note) => note.id === item.id);
        if (!source) throw Error('ไม่พบต้นฉบับ กรุณาปิดแล้วเปิดใหม่');
        setOriginal(kind === 'cards' ? value : source);
        setDraft(
          kind === 'cards'
            ? { front: source.front, back: source.back }
            : { title: source.title, body: source.body },
        );
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [item.id, item.deck_id, kind]);
  async function close() {
    if (inFlight.current || mutation.uncertain) return;
    if (
      dirty.current &&
      !(await confirm('ปิดโดยไม่บันทึก?', 'ข้อความที่แก้ไขในหน้าต่างนี้จะหายไป'))
    )
      return;
    onClose();
  }
  async function save(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const body =
        kind === 'cards'
          ? {
              ...original,
              cards: original.cards.map((card) => ({
                id: card.id,
                front: card.id === item.id ? draft.front : card.front,
                back: card.id === item.id ? draft.back : card.back,
              })),
            }
          : { ...draft, revision: original.revision };
      await mutation.save(
        kind === 'cards' ? `/decks/${item.deck_id}` : `/notes/${item.id}`,
        'PUT',
        body,
      );
      dirty.current = false;
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="course-edit-dialog"
      aria-label={kind === 'cards' ? 'แก้ไขการ์ด' : 'แก้ไขโน้ต'}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <form className="stack" onSubmit={save}>
        <div className="row between">
          <h2 id="course-edit-title">{kind === 'cards' ? 'แก้ไขการ์ด' : 'แก้ไขโน้ต'}</h2>
          <button
            type="button"
            className="btn secondary"
            disabled={busy || mutation.uncertain}
            onClick={close}
          >
            ปิด
          </button>
        </div>
        <p className="notice">บันทึกแล้วต้นฉบับและทุกวิชาที่เชื่อมจะเปลี่ยนตาม</p>
        {!draft && !error && <p role="status">กำลังเปิดต้นฉบับ…</p>}
        {draft &&
          (kind === 'cards'
            ? [
                ['front', 'คำถาม', 2000],
                ['back', 'คำตอบ', 8000],
              ]
            : [
                ['title', 'ชื่อโน้ต', 120],
                ['body', 'เนื้อหาโน้ต', 60000],
              ]
          ).map(([field, label, max]) => (
            <label className="field" key={field}>
              {label}
              <textarea
                aria-label={label}
                required
                maxLength={max}
                rows={field === 'title' ? 2 : 5}
                value={draft[field]}
                disabled={busy || mutation.uncertain}
                onChange={(event) => {
                  dirty.current = true;
                  setDraft({ ...draft, [field]: event.target.value });
                }}
              />
            </label>
          ))}
        {error && <p role="alert">{error}</p>}
        <button
          className="btn"
          disabled={!draft || busy || Object.values(draft).some((value) => !value.trim())}
        >
          {busy ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
        </button>
      </form>
    </dialog>
  );
}
