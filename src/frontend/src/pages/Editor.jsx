import { useRemoteSync } from '../hooks/useRemoteSync';
import { useRetryableSave } from '../hooks/useRetryableSave';
import SyncStatus from '../components/SyncStatus';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { Icon, PageTitle, Empty, ErrorPanel } from '../components/UI';

const draftCard = card => ({ ...card, draftKey: crypto.randomUUID() });
const newDeck = () => ({ name: '', category: 'ทั่วไป', description: '', color: 'purple', cards: [] });
export default function Editor() {
  const { id } = useParams(); const navigate = useNavigate(); const { ai, notify, confirm } = useApp();
  const [deck, setDeck] = useState(newDeck);
  const [actionError, setActionError] = useState('');
  const [progress, setProgress] = useState('');
  const [removedCards, setRemovedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState(''); const [fileName, setFileName] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [mode, setMode] = useState('local'); const [count, setCount] = useState(10); const [language, setLanguage] = useState('Thai');
  const [dragging, setDragging] = useState(false); const dirty = useRef(false); const cardsSection = useRef(null); const inFlight = useRef(false);
  const originalCards = useRef([]);
  useUnsavedChanges(dirty);
  const mutation = useRetryableSave(id || 'new-deck');
  useEffect(() => {
    dirty.current = false; setActionError(''); setRemovedCards([]);
    setSelectedCard(''); setDeck(newDeck()); originalCards.current = []; setSource('');
  }, [id]);
  const sync = useRemoteSync({ resource: `deck:${id}`, enabled: Boolean(id),
    blocked: () => dirty.current || inFlight.current || mutation.uncertain,
    load: signal => api(`/decks/${id}`, 'GET', undefined, signal),
    apply: value => {
      originalCards.current = value.cards;
      setDeck({ ...value, cards: value.cards.map(draftCard) });
      dirty.current = false; setRemovedCards([]); setSelectedCard(''); setActionError('');
    },
  });
  const loading = id && sync.loading;
  const locked = busy || mutation.uncertain || sync.refreshing;
  async function reload() {
    if (dirty.current && !await confirm('ดึงข้อมูลล่าสุดและแทนที่ร่าง?', 'ร่างที่ยังไม่บันทึกจะถูกแทนที่เมื่อดึงข้อมูลสำเร็จ กรุณาคัดลอกข้อความที่ต้องการเก็บก่อน')) return;
    sync.reload(true);
  }
  function change(key, value) { dirty.current = true; setDeck(d => ({ ...d, [key]: value })); }
  async function run(action) { if (inFlight.current) return; inFlight.current = true; setBusy(true); setActionError(''); try { await action(); } catch (e) { setActionError(e.message); notify(e.message); } finally { inFlight.current = false; setBusy(false); setProgress(''); } }
  async function readFile(file) {
    if (!file || locked) return;
    await run(async () => {
      if (!/\.(pdf|pptx|txt|md)$/i.test(file.name)) throw Error('รูปแบบไฟล์ไม่รองรับ กรุณาเลือก PDF, PPTX, TXT หรือ MD');
      if (!file.size) throw Error('ไฟล์ว่าง กรุณาเลือกไฟล์ที่มีข้อความ');
      if (file.size > 20 * 1024 * 1024) throw Error('ไฟล์ต้องมีขนาดไม่เกิน 20 MB');
      setProgress('กำลังอ่านเอกสาร กรุณารอสักครู่…');
      const content = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(file); });
      try {
        const result = await api('/extract', 'POST', { name: file.name, content });
        setSource(result.text); setFileName(file.name); dirty.current = true;
        setDeck(d => ({ ...d, name: d.name || file.name.replace(/\.[^.]+$/, '') })); notify('อ่านข้อความแล้ว พร้อมสร้างการ์ด');
      } catch (e) { throw Error(`${e.message} — เลือกไฟล์ใหม่หรือวางข้อความแทน เนื้อหาเดิมยังอยู่`); }
    });
  }
  async function generateCards() { await run(async () => {
    if (deck.cards.length >= 500) throw Error('ชุดการ์ดมีได้ไม่เกิน 500 ใบ กรุณาลบการ์ดก่อนสร้างเพิ่ม');
    if (source.trim().length < 5) throw Error('กรุณาเลือกไฟล์หรือวางข้อความอย่างน้อย 5 ตัวอักษร');
    setProgress(mode === 'ai' ? 'AI กำลังสร้างคำถามและคำตอบ อาจใช้เวลาสักครู่…' : 'กำลังสร้างการ์ดจากข้อความ…');
    const result = await api('/generate', 'POST', { text: source, count: Math.min(count, 500 - deck.cards.length), mode, language, ...(mode === 'ai' ? { level } : {}) });
    change('cards', [...deck.cards, ...result.cards.map(draftCard)]); notify(`เพิ่ม ${result.cards.length} การ์ดแล้ว กรุณาตรวจและแก้ไขก่อนบันทึก`);
    cardsSection.current?.scrollIntoView({ behavior: 'smooth' });
  }); }
  async function save() { await run(async () => {
    if (!deck.name.trim()) throw Error('กรุณาตั้งชื่อชุดการ์ด');
    if (!deck.cards.length) throw Error('กรุณาเพิ่มการ์ดอย่างน้อย 1 ใบก่อนบันทึก');
    const invalidIndex = deck.cards.findIndex(c => !c.front.trim() || !c.back.trim());
    if (invalidIndex !== -1) {
      setSelectedCard(deck.cards[invalidIndex].draftKey);
      cardsSection.current?.scrollIntoView({ behavior: 'smooth' });
      throw Error(`กรุณากรอกคำถามและคำตอบของการ์ดใบที่ ${invalidIndex + 1} ให้ครบ`);
    }
    const shared = deck.cards.filter(card => card.courses?.length && originalCards.current.some(old => old.id === card.id && (old.front !== card.front || old.back !== card.back)));
    if (shared.length && !await confirm('บันทึกการแก้ไขต้นฉบับ?', `การเปลี่ยนแปลงมีผลกับรายวิชา: ${[...new Set(shared.flatMap(card => card.courses.map(course => course.name)))].join(', ')}`)) return;
    dirty.current = true;
    await mutation.save(`/decks${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', { ...deck, cards: deck.cards.map(({ id, front, back }) => ({ id, front, back })), category: deck.category.trim() || 'ทั่วไป' });
    dirty.current = false; notify('บันทึกชุดการ์ดเรียบร้อย'); navigate('/decks');
  }); }
  function removeCard(index) {
    if (deck.cards[index].courses?.length) { setActionError('นำการ์ดออกจากรายวิชาที่เชื่อมทั้งหมดก่อนลบต้นฉบับ'); return; }
    setSelectedCard('');
    setRemovedCards(items => [...items, { card: deck.cards[index], index }]);
    change('cards', deck.cards.filter((_, i) => i !== index));
  }
  function undoRemove() {
    const removed = removedCards.at(-1);
    if (!removed || deck.cards.length >= 500) return;
    const cards = [...deck.cards];
    cards.splice(removed.index, 0, removed.card);
    setSelectedCard('');
    change('cards', cards);
    setRemovedCards(items => items.slice(0, -1));
  }
  async function remove() {
    const courses = [...new Set(originalCards.current.flatMap(card => (card.courses || []).map(course => course.name)))];
    if (courses.length) { setActionError(`นำการ์ดออกจากรายวิชาที่เชื่อมก่อนลบชุดต้นฉบับ: ${courses.join(', ')}`); return; }
    if (await confirm('ลบชุดการ์ดนี้?', 'การ์ดและประวัติการทบทวนของชุดนี้จะถูกลบถาวร')) await run(async () => { await api(`/decks/${id}`, 'DELETE', { revision: deck.revision }); dirty.current = false; notify('ลบชุดการ์ดแล้ว'); navigate('/decks'); });
  }
  function exportDeck() {
    const data = { name: deck.name, description: deck.description, category: deck.category, cards: deck.cards.map(({ front, back }) => ({ front, back })) };
    const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = href; a.download = `${deck.name.replace(/[^\p{L}\p{N} _-]/gu, '') || 'flashcards'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  if (loading) return <div className="loading">กำลังเปิดชุดการ์ด…</div>;
  if (id && !deck.id && sync.error) return <ErrorPanel error={sync.error} retry={sync.reload} />;
  return <><PageTitle eyebrow="TURN YOUR NOTES INTO KNOWLEDGE" title={id ? 'แก้ไขชุดการ์ด' : 'สร้างชุดการ์ดใหม่'} subtitle="ทีละคำถาม ทีละความเข้าใจ"><Link className="btn secondary" to="/decks">กลับไปคลังการ์ด</Link></PageTitle>{id && <SyncStatus sync={sync} paused={dirty.current} reload={reload} disabled={busy || mutation.uncertain} />}<div className="editor-layout"><div className="stack">{!id && <section className="panel stack"><h2>01 / เพิ่มเนื้อหาที่อยากเรียนรู้</h2><label className={`dropzone ${dragging ? 'drag' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); }}><Icon name="upload" /><strong>{fileName || 'เลือกไฟล์ หรือลากมาวางที่นี่'}</strong><small>PDF, PPTX, TXT, MD · ไม่เกิน 20 MB</small><input type="file" aria-label="อัปโหลดเอกสาร" accept=".pdf,.pptx,.txt,.md" disabled={locked} onChange={e => { readFile(e.target.files[0]); e.target.value = ''; }} hidden /></label><p className="small muted">อ่านเฉพาะข้อความ · PDF ไม่เกิน 100 หน้า · ยังไม่รองรับภาพสแกนและไฟล์ PPT รุ่นเก่า</p>{progress && <p className="notice" role="status" aria-live="polite">{progress}</p>}<label className="field">หรือวางข้อความจากโน้ต<textarea rows={6} maxLength={60000} disabled={locked} value={source} onChange={e => { dirty.current = true; setSource(e.target.value); }} placeholder={'Stack: โครงสร้างข้อมูลแบบเข้าทีหลังออกก่อน\nQueue: โครงสร้างข้อมูลแบบเข้าก่อนออกก่อน'} /></label><p className="small muted">{source.length.toLocaleString()} / 60,000 ตัวอักษร · ตรวจข้อความที่อ่านได้ก่อนสร้างการ์ด</p><div className="form-grid"><label className="field">วิธีสร้าง<select value={mode} onChange={e => setMode(e.target.value)} disabled={locked}><option value="local">แยกข้อความ (ไม่ใช้ AI)</option><option value="ai" disabled={!ai}>AI {ai ? '' : '— ยังไม่ได้ตั้งค่า'}</option></select></label><label className="field">จำนวนการ์ดสูงสุด<select value={count} onChange={e => setCount(Number(e.target.value))} disabled={locked}>{[5, 10, 20, 30].map(n => <option key={n}>{n}</option>)}</select></label></div>{mode === 'ai' && <div className="stack"><label className="field">ระดับความรู้<select aria-label="ระดับความรู้" value={level} disabled={locked} onChange={e => setLevel(e.target.value)}><option value="beginner">เริ่มต้น — จำและเข้าใจพื้นฐาน</option><option value="intermediate">กลาง — อธิบายและเปรียบเทียบ</option><option value="advanced">สูง — วิเคราะห์และประยุกต์</option></select></label><p className="small muted">{level === 'beginner' ? 'คำถามตรงประเด็นจากข้อเท็จจริงเดียว ใช้ภาษาง่าย ไม่ต้องอนุมาน' : level === 'advanced' ? 'เชื่อมโยงหลายข้อเท็จจริงในเอกสารเพื่อวิเคราะห์หรือประยุกต์ โดยไม่ใช้ความรู้นอกเอกสาร' : 'อธิบายเหตุผลหรือเปรียบเทียบความสัมพันธ์หนึ่งประเด็นจากเอกสาร'}</p><p className="small muted">ระดับนี้ใช้กับการสร้างครั้งถัดไปเท่านั้น ไม่เปลี่ยนการ์ดที่มีอยู่ หากเนื้อหาไม่พออาจได้การ์ดน้อยลง โปรดตรวจระดับความยากก่อนบันทึก</p><label className="field">ภาษาของการ์ด AI<select value={language} disabled={locked} onChange={e => setLanguage(e.target.value)}><option value="Thai">ไทย</option><option value="English">English</option><option value="Japanese">日本語</option></select></label></div>}<div className="notice">{mode === 'ai' ? 'เมื่อกดสร้าง เนื้อหานี้จะถูกส่งไปยังผู้ให้บริการ AI ที่ระบบตั้งค่าไว้ เพื่อสร้างคำถาม–คำตอบ กรุณาตรวจเนื้อหาก่อนบันทึก' : 'โหมดแยกข้อความใช้รูปแบบ “คำศัพท์: ความหมาย” หรือสร้างช่องว่างจากประโยค ไม่ได้วิเคราะห์ด้วย AI กรุณาตรวจการ์ดก่อนบันทึก'}</div><button className="btn" disabled={locked} onClick={generateCards}>{busy ? 'กำลังดำเนินการ…' : '✧ สร้างการ์ดจากเนื้อหา'}</button></section>}<div className="section-heading row between" ref={cardsSection}><h2>{id ? '' : '02 / '}ตรวจและแก้ไขการ์ด <span className="small muted">({deck.cards.length} ใบ)</span></h2><button className="btn secondary" disabled={locked || deck.cards.length >= 500} onClick={() => { setSelectedCard(''); change('cards', [...deck.cards, draftCard({ front: '', back: '' })]); }}><Icon name="plus" />เพิ่มเอง</button></div><p className="notice">การแก้ไขและการลบจะมีผลเมื่อกดบันทึกชุดการ์ดเท่านั้น</p>{id && deck.cards.length > 0 && <section className="panel stack" aria-label="เลือกการ์ดเพื่อแก้ไข"><label className="field">เลือกการ์ดที่ต้องการแก้ไข<select value={selectedCard} disabled={locked} onChange={e => setSelectedCard(e.target.value)}><option value="">แสดงการ์ดทั้งหมด ({deck.cards.length} ใบ)</option>{deck.cards.map((card, index) => <option key={card.draftKey} value={card.draftKey}>การ์ด {index + 1}: {card.front.trim().slice(0, 80) || 'ยังไม่มีคำถาม'}</option>)}</select></label><p className="small muted">สลับการ์ดได้โดยร่างที่แก้ไขยังอยู่ ปุ่มบันทึกชุดการ์ดจะบันทึกการเปลี่ยนแปลงทุกใบ รวมใบที่ไม่ได้แสดง</p></section>}{removedCards.length > 0 && <div className="notice" role="status">ลบการ์ดออกจากร่างแล้ว {removedCards.length} ใบ <button className="btn secondary" disabled={locked || deck.cards.length >= 500} onClick={undoRemove}>คืนการ์ดที่ลบล่าสุด</button></div>}<div className="stack">{deck.cards.length ? deck.cards.map((card, index) => (!id || !selectedCard || selectedCard === card.draftKey) && <article className="draft-card" key={card.draftKey}><div className="row between"><span className="draft-number">CARD {String(index + 1).padStart(2, '0')}</span><button className="icon-btn" disabled={locked} aria-label={`ลบการ์ด ${index + 1}`} onClick={() => removeCard(index)}><Icon name="trash" /></button></div>{card.archived_at && <p className="notice">เรียนจบแล้ว · ไม่อยู่ในคิวทบทวน <Link to="/archive?status=completed">จัดการการ์ดที่จัดเก็บ</Link></p>}{card.courses?.length > 0 && <p className="notice">ใช้ในรายวิชา: {card.courses.map((course, i) => <span key={course.id}>{i > 0 && ', '}<Link to={`/courses/${course.id}`}>{course.name}</Link></span>)} — การแก้ไขมีผลกับทุกวิชาที่เชื่อม</p>}{[['front', 'ด้านหน้า · คำถาม', 2000], ['back', 'ด้านหลัง · คำตอบ', 8000]].map(([side, label, max]) => <label className="field" key={side}>{label}<textarea aria-label={label} value={card[side]} maxLength={max} disabled={locked} onChange={e => change('cards', deck.cards.map((c, i) => i === index ? { ...c, [side]: e.target.value } : c))} /></label>)}</article>) : <Empty title="การ์ดของคุณจะแสดงที่นี่"><p>สร้างจากเนื้อหาด้านบน หรือกด “เพิ่มเอง”</p></Empty>}</div></div><aside className="panel stack sticky"><h2>รายละเอียดชุดการ์ด</h2><label className="field">ชื่อชุดการ์ด<input value={deck.name} maxLength={120} disabled={locked} onChange={e => change('name', e.target.value)} placeholder="เช่น Data Structures บทที่ 1" /></label><label className="field">หมวดหมู่ / แท็ก<input value={deck.category} maxLength={60} disabled={locked} onChange={e => change('category', e.target.value)} /></label><label className="field">คำอธิบาย<textarea aria-label="คำอธิบาย" value={deck.description} maxLength={1000} disabled={locked} onChange={e => change('description', e.target.value)} placeholder="ชุดการ์ดนี้เกี่ยวกับอะไร" /></label><label className="field">สีประจำชุด<select value={deck.color} disabled={locked} onChange={e => change('color', e.target.value)}>{[['purple', 'ม่วงลาเวนเดอร์'], ['blue', 'ฟ้า'], ['green', 'เขียวเซจ'], ['orange', 'ส้มพีช']].map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></label><div className="notice">✧ การ์ดที่ดีมีหนึ่งประเด็นต่อใบ<br />ตอบให้กระชับ และตรวจเนื้อหาก่อนบันทึก</div>{actionError && <p className="notice" role="alert">{actionError}</p>}<button className="btn" disabled={busy || sync.refreshing} onClick={save}><Icon name="check" />บันทึกชุดการ์ด</button>{id && <><button className="btn secondary" disabled={locked} onClick={exportDeck}>ดาวน์โหลดชุดการ์ด JSON</button><button className="btn danger" disabled={locked} onClick={remove}>ลบชุดการ์ด</button></>}</aside></div></>;
}
