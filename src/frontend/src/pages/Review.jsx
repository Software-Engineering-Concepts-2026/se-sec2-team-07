import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { PageTitle, ErrorPanel, Icon } from '../components/UI';

const ratings = [['again', 'จำไม่ได้', '10 นาที'], ['hard', 'ยาก', '≥ 1 วัน'], ['good', 'จำได้', '≥ 2 วัน'], ['easy', 'ง่าย', '≥ 4 วัน']];
export default function Review() {
  const { id } = useParams(); const { notify } = useApp();
  const [cards, setCards] = useState(null); const [error, setError] = useState(''); const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false); const [answers, setAnswers] = useState([]); const [remaining, setRemaining] = useState(600);
  const [paused, setPaused] = useState(false); const [finished, setFinished] = useState(false); const [busy, setBusy] = useState(false);
  const saving = useRef(false); const requestId = useRef(crypto.randomUUID()); const elapsed = useRef(0); const pending = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setCards(null); setError(''); setIndex(0); setAnswers([]); setFinished(false); setRemaining(600); setFlipped(false); pending.current = null;
    api(`/review${id ? `?deck=${id}` : ''}`, 'GET', undefined, controller.signal).then(r => setCards(r.cards)).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    if (!cards?.length || paused || finished || busy) return;
    let last = Date.now();
    const timer = setInterval(() => { const now = Date.now(); const delta = (now - last) / 1000; last = now; elapsed.current += delta; setRemaining(value => Math.max(0, value - delta)); }, 250);
    return () => clearInterval(timer);
  }, [cards, paused, finished, busy]);
  useEffect(() => { if (remaining === 0 && !busy) setFinished(true); }, [remaining, busy]);
  async function rate(rating) {
    if (saving.current || !flipped || finished || paused) return;
    saving.current = true; setBusy(true);
    const body = pending.current || { id: requestId.current, card_id: cards[index].id, rating, seconds: Math.min(3600, Math.round(elapsed.current)) };
    pending.current = body;
    try {
      await api('/review', 'POST', body);
      setAnswers(value => [...value, body.rating]); setFlipped(false); setIndex(value => value + 1);
      pending.current = null; requestId.current = crypto.randomUUID(); elapsed.current = 0;
      if (index + 1 >= cards.length) setFinished(true);
    } catch (e) { notify(`${e.message} — กดระดับเดิมเพื่อลองบันทึกอีกครั้ง`); }
    finally { saving.current = false; setBusy(false); }
  }
  useEffect(() => {
    const handler = e => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || !cards?.length || busy || finished || paused) return;
      if (e.code === 'Space' && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); setFlipped(v => !v); }
      if (ratings[Number(e.key) - 1]) { e.preventDefault(); rate(ratings[Number(e.key) - 1][0]); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  });
  if (error) return <ErrorPanel error={error} />;
  if (!cards) return <div className="loading">กำลังเตรียมการ์ด…</div>;
  if (!cards.length) return <section className="panel finish"><div className="success-circle">✓</div><h1>ทบทวนครบสำหรับตอนนี้แล้ว</h1><p className="muted">กลับมาทบทวนเมื่อถึงรอบถัดไป<br />การ์ดที่เลือก “จำไม่ได้” จะกลับมาในอีก 10 นาที</p><Link to="/decks" className="btn">กลับไปคลังการ์ด</Link></section>;
  if (finished) { const good = answers.filter(r => ['good', 'easy'].includes(r)).length; return <section className="review-wrap panel finish"><div className="success-circle">✧</div><div className="eyebrow">A LITTLE BETTER THAN BEFORE</div><h1>วันนี้คุณก้าวไปอีกขั้นแล้ว</h1><p className="muted">ทบทวน {answers.length} ใบ · จำได้ {answers.length ? Math.round(good / answers.length * 100) : 0}%<br />บันทึกผลและกำหนดรอบทบทวนถัดไปเรียบร้อย</p><div className="row wrap" style={{ justifyContent: 'center' }}><Link to="/stats" className="btn">ดูความก้าวหน้า<Icon name="arrow" /></Link><Link to="/" className="btn secondary">กลับหน้าหลัก</Link></div></section>; }
  const card = cards[index]; const seconds = Math.ceil(remaining);
  return <div className="review-wrap"><PageTitle eyebrow="ONE CARD CLOSER TO YOUR GOAL" title="เวลาของความรู้" subtitle={card.deck_name} /><div className="row between review-top"><span className="small muted">การ์ด {index + 1} จาก {cards.length} ใบ</span><div className="row"><span className="timer" aria-label="เวลาที่เหลือ">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span><button className="btn ghost" disabled={busy} onClick={() => setPaused(v => !v)}>{paused ? 'เริ่มเวลาต่อ' : 'พักเวลา'}</button><button className="btn secondary" disabled={busy} onClick={() => setFinished(true)}>จบรอบนี้</button></div></div><div className="progress"><div style={{ width: `${index / cards.length * 100}%` }} /></div><button className="review-card" disabled={busy || paused} onClick={() => setFlipped(v => !v)}><span className="face-label">{paused ? 'PAUSED' : flipped ? 'ANSWER' : 'QUESTION'}</span><span className="card-text">{paused ? 'พักสักครู่ แล้วค่อยกลับมาเรียนรู้' : flipped ? card.back : card.front}</span><span className="hint">{flipped ? 'จำได้แค่ไหน? เลือกระดับด้านล่าง' : 'คลิกเพื่อเปิดคำตอบ · Space'}</span></button>{flipped && !paused && <div className="ratings">{ratings.map(([value, label, time], i) => <button className="rating" key={value} disabled={busy} onClick={() => rate(value)}><strong>{i + 1} · {label}</strong><small>{time}</small></button>)}</div>}<p className="session-note">ลองนึกคำตอบก่อนพลิกการ์ด แล้วประเมินความจำอย่างตรงไปตรงมา</p></div>;
}
