import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PageTitle, ErrorPanel } from '../components/UI';

const minutesText = seconds => {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60), rest = total % 60;
  return minutes ? `${minutes} นาที${rest ? ` ${rest} วินาที` : ''}` : `${rest} วินาที`;
};
const dateText = date => new Date(`${date}T12:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric', month: 'short' });
export default function Schedule() {
  const [plan, setPlan] = useState(null);
  const [minutes, setMinutes] = useState(10);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    api('/review/plan', 'GET', undefined, controller.signal).then(value => { setPlan(value); setMinutes(value.minutes); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  async function save(e) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setSaved(false);
    try { setPlan(await api('/review/plan', 'PUT', { minutes: Number(minutes) })); setSaved(true); }
    catch (e) { setError(e.message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  if (!plan) return error ? <ErrorPanel error={error} /> : <div className="loading">กำลังจัดตารางทบทวน…</div>;
  return <>
    <PageTitle eyebrow="MAKE ROOM FOR LEARNING" title="ตารางทบทวน" subtitle="แบ่งเวลาให้พอดีกับภาระงานของคุณ" />
    <section className="panel stack schedule-settings">
      <div className="schedule-preferences"><h2>ตั้งเวลาทบทวน</h2><p className="muted">เลือกเวลาที่ไหว แล้วค่อย ๆ เรียนรู้ทุกวัน</p>
      <form className="schedule-form" onSubmit={save}>
        <label className="field">เวลาทบทวนต่อวัน (นาที)<input type="number" min="1" max="120" step="1" required value={minutes} disabled={busy} onChange={e => { setMinutes(e.target.value); setSaved(false); }} /></label>
        <button className="btn" disabled={busy}>{busy ? 'กำลังปรับตาราง…' : 'บันทึกเวลาและปรับตาราง'}</button>
      </form>
      </div>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">บันทึกเวลาแล้ว ตารางปรับตามเวลาที่เลือก</p>}
      <div className="schedule-today"><h2>วันนี้ของคุณ</h2><dl className="schedule-today-metrics"><div><dt>พร้อมทบทวน</dt><dd>{plan.cards.length} <span>ใบ</span></dd><small>ถึงกำหนดทั้งหมด {plan.due_count} ใบ</small></div><div><dt>เวลาเหลือวันนี้</dt><dd>{minutesText(plan.remaining_seconds)}</dd><small>ทบทวนแล้ว {minutesText(plan.spent_seconds)}</small></div></dl>
      {plan.deferred_count > 0 && <p className="notice">อีก {plan.deferred_count} ใบจัดไว้รอบถัดไป เพื่อให้พอดีกับเวลาที่เหลือ</p>}
      {plan.cards.length > 0 ? <Link to="/review" className="btn">เริ่มตามแผนวันนี้</Link> : <p className="notice">{plan.remaining_seconds < plan.seconds_per_card ? 'เวลาที่เหลือไม่พอสำหรับการ์ดหนึ่งใบ พักก่อนหรือปรับเวลาได้' : 'ยังไม่มีการ์ดถึงกำหนดในตอนนี้'}</p>}
      {plan.next_due && <p>การ์ดกำหนดถัดไป: {new Date(plan.next_due * 1000).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
      </div><details className="schedule-explanation"><summary>ตารางนี้คำนวณอย่างไร?</summary><p className="small muted">ประเมินประมาณ {plan.seconds_per_card} วินาทีต่อใบจากประวัติการตอบ เวลาในวันนี้นับจากคำตอบที่บันทึกแล้ว รวมทุกชุดการ์ด ตามเวลาไทย</p></details>
    </section>
    <div className="section-heading schedule-heading"><h2>แผน 7 วัน</h2><p className="muted">เป็นแผนสำหรับการทบทวนครั้งถัดไปของแต่ละใบ ผลตอบใหม่อาจทำให้กำหนดเปลี่ยน การ์ดที่ยังไม่ถึงเวลาจะเริ่มได้เมื่อถึงกำหนด</p></div>
    <div className="deck-grid schedule-grid">{plan.days.map((day, i) => <section className={`panel stack schedule-day ${i === 0 ? 'is-today' : ''} ${day.count === 0 ? 'is-empty' : ''}`} key={day.date}>
      <h3>{i === 0 ? 'วันนี้ · ' : ''}{dateText(day.date)}</h3>
      <strong>{day.count} ใบ · ประมาณ {minutesText(day.estimated_seconds)}</strong>
      <small>เวลาว่าง {minutesText(day.budget_seconds)}</small>
      {day.count > 0 ? <details><summary>ดูการ์ดที่วางแผนไว้</summary><ul className="schedule-cards">{day.cards.map(card => <li key={card.id}><strong>{card.deck_name}</strong><p>{card.front}</p></li>)}</ul></details> : <p className="muted">ไม่มีการ์ดในแผนวันนี้</p>}
    </section>)}</div>
    {plan.beyond_week > 0 && <p className="notice">ยังมีอีก {plan.beyond_week} ใบที่อยู่นอกแผน 7 วันนี้ ระบบจะจัดใหม่เมื่อคุณกลับมา</p>}
  </>;
}
