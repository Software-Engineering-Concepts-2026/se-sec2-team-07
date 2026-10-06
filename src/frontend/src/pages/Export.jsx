import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { Empty, ErrorPanel, Icon, PageTitle } from '../components/UI';

export default function Export() {
  const { notify } = useApp();
  const [decks, setDecks] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState([]);
  const [includeCards, setIncludeCards] = useState(true);
  const [includeLearning, setIncludeLearning] = useState(false);
  const [format, setFormat] = useState('html');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const exporting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError('');
    api('/decks', 'GET', undefined, controller.signal)
      .then((data) => setDecks(data.decks))
      .catch((e) => {
        if (e.name !== 'AbortError') setLoadError(e.message);
      });
    return () => controller.abort();
  }, [attempt]);

  function toggleDeck(id) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : previous.length < 20
          ? [...previous, id]
          : previous,
    );
  }

  async function exportFile(event) {
    event.preventDefault();
    if (exporting.current || !selected.length || (!includeCards && !includeLearning)) return;
    exporting.current = true;
    setBusy(true);
    setError('');
    try {
      const file = await api('/exports', 'POST', {
        deck_ids: selected,
        include_cards: includeCards,
        include_learning: includeLearning,
        format,
      });
      const url = URL.createObjectURL(new Blob([file.content], { type: file.mime_type }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.filename;
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
        // Allow the browser to consume the download before releasing its URL.
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
      notify('สร้างไฟล์ส่งออกแล้ว');
    } catch (e) {
      setError(e.message);
    } finally {
      exporting.current = false;
      setBusy(false);
    }
  }

  if (loadError)
    return <ErrorPanel error={loadError} retry={() => setAttempt((value) => value + 1)} />;
  if (!decks) return <div className="loading">กำลังเปิดรายการสำหรับส่งออก…</div>;
  return (
    <>
      <PageTitle
        eyebrow="YOUR LEARNING PORTFOLIO"
        title="ส่งออกผลงาน"
        subtitle="รวบรวมชุดการ์ดและการทบทวนไว้เป็นไฟล์ของคุณ"
      />
      {!decks.length && (
        <section className="export-steps">
          <h2>ส่งออกได้ใน 3 ขั้น</h2>
          <div className="start-options">
            {[
              ['เลือกชุดการ์ด', 'เลือกได้สูงสุด 20 ชุดต่อไฟล์'],
              ['เลือกข้อมูล', 'เนื้อหาการ์ดและสรุปการเรียนรู้'],
              ['เลือกรูปแบบไฟล์', 'HTML สำหรับอ่าน · JSON สำหรับใช้ข้อมูลต่อ'],
            ].map(([title, detail], i) => (
              <article className="panel" key={title}>
                <span className="badge">{i + 1}</span>
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {!decks.length ? (
        <Empty title="ยังไม่มีชุดการ์ดให้ส่งออก">
          <p>สร้างและบันทึกชุดการ์ดก่อน แล้วกลับมาเลือกผลงานที่ต้องการ</p>
          <Link className="btn" to="/create">
            <Icon name="plus" />
            สร้างชุดการ์ด
          </Link>
        </Empty>
      ) : (
        <form className="export-layout" onSubmit={exportFile} aria-busy={busy}>
          <fieldset className="panel export-section" disabled={busy}>
            <legend>1. เลือกชุดการ์ด</legend>
            <div className="row between wrap">
              <p className="muted" id="export-limit">
                เลือกได้สูงสุด 20 ชุดต่อไฟล์
              </p>
              <div className="row wrap">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setSelected(decks.slice(0, 20).map((deck) => deck.id))}
                >
                  {decks.length > 20 ? 'เลือก 20 ชุดแรก' : 'เลือกทั้งหมด'}
                </button>
                <button type="button" className="btn ghost" onClick={() => setSelected([])}>
                  ล้างการเลือก
                </button>
              </div>
            </div>
            <div className="export-decks" aria-describedby="export-limit">
              {decks.map((deck) => (
                <label
                  className={`export-choice ${selected.includes(deck.id) ? 'is-selected' : ''}`}
                  key={deck.id}
                >
                  <input
                    type="checkbox"
                    aria-label={deck.name}
                    checked={selected.includes(deck.id)}
                    disabled={!selected.includes(deck.id) && selected.length >= 20}
                    onChange={() => toggleDeck(deck.id)}
                  />
                  <span>
                    <strong>{deck.name}</strong>
                    <small className="muted">
                      {deck.category} · {deck.card_count} การ์ด
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="stack">
            <fieldset className="panel export-section" disabled={busy}>
              <legend>2. เลือกข้อมูลและรูปแบบ</legend>
              <label className="export-choice">
                <input
                  type="checkbox"
                  checked={includeCards}
                  onChange={(e) => setIncludeCards(e.target.checked)}
                />
                <span>เนื้อหาแฟลชการ์ด</span>
              </label>
              <p className="muted small">คำถามและคำตอบทุกใบในชุดที่เลือก</p>
              <label className="export-choice">
                <input
                  type="checkbox"
                  checked={includeLearning}
                  onChange={(e) => setIncludeLearning(e.target.checked)}
                />
                <span>สรุปการเรียนรู้</span>
              </label>
              <p className="muted small">
                สรุปจากประวัติการทบทวนและการประเมินความจำด้วยตนเอง
                ไม่ใช่คะแนนสอบหรือหลักฐานรับรองความสามารถ
              </p>
              <label className="field" htmlFor="export-format">
                รูปแบบไฟล์
              </label>
              <select id="export-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="html">HTML — เปิดอ่านในเบราว์เซอร์</option>
                <option value="json">JSON — นำข้อมูลไปใช้ต่อ</option>
              </select>
            </fieldset>
            <section className="panel export-summary" aria-label="สรุปการส่งออก">
              <h2>ไฟล์ผลงานของคุณ</h2>
              <p aria-live="polite">
                เลือกแล้ว <strong>{selected.length} ชุด</strong> · {format.toUpperCase()}
              </p>
              <p className="muted small">
                ใช้ข้อมูลที่บันทึกแล้ว ณ เวลาส่งออก เฉพาะชุดที่คุณเลือก
                การส่งออกไม่เปลี่ยนแปลงชุดการ์ดหรือตารางทบทวน
              </p>
              {!selected.length && <p className="small">เลือกอย่างน้อย 1 ชุดเพื่อส่งออก</p>}
              {!includeCards && !includeLearning && (
                <p className="small">เลือกข้อมูลอย่างน้อย 1 ประเภทเพื่อส่งออก</p>
              )}
              {error && (
                <p role="alert" className="notice">
                  {error} คุณสามารถลองส่งออกอีกครั้งได้
                </p>
              )}
              <button
                className="btn"
                type="submit"
                disabled={busy || !selected.length || (!includeCards && !includeLearning)}
              >
                <Icon name="arrow" />
                {busy ? 'กำลังสร้างไฟล์…' : 'ส่งออกไฟล์'}
              </button>
            </section>
          </div>
        </form>
      )}
    </>
  );
}
