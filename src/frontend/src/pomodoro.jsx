import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from './context';
import { Icon, PageTitle } from './components/UI';

const durations = { focus: 25 * 60 * 1000, break: 5 * 60 * 1000 };
const phaseName = phase => phase === 'focus' ? 'ช่วงเรียน' : 'ช่วงพัก';
const clockText = milliseconds => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};
const initialTimer = () => ({ phase: 'focus', remaining: durations.focus, deadline: null, started: false, message: '' });
const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const { notify } = useApp();
  const [timer, setTimer] = useState(initialTimer);
  const current = useRef(timer);
  const update = useCallback(next => { current.current = next; setTimer(next); }, []);
  // An absolute deadline also accounts for time spent in a background tab or asleep.
  const synchronize = useCallback(() => {
    const value = current.current;
    if (value.deadline === null) return false;
    const remaining = Math.max(0, value.deadline - Date.now());
    if (remaining > 0) {
      update({ ...value, remaining });
      return false;
    }
    const phase = value.phase === 'focus' ? 'break' : 'focus';
    const message = value.phase === 'focus'
      ? 'ครบช่วงเรียนแล้ว พัก 5 นาทีได้เลย กดเริ่มจับเวลาเมื่อพร้อม'
      : 'ครบช่วงพักแล้ว พร้อมเริ่มเรียนรอบใหม่ กดเริ่มจับเวลาเมื่อพร้อม';
    // Stop at the next phase, even if several intervals elapsed while away.
    update({ phase, remaining: durations[phase], deadline: null, started: false, message });
    notify(message);
    return true;
  }, [notify, update]);
  useEffect(() => {
    const interval = window.setInterval(synchronize, 250);
    window.addEventListener('focus', synchronize);
    document.addEventListener('visibilitychange', synchronize);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', synchronize);
      document.removeEventListener('visibilitychange', synchronize);
    };
  }, [synchronize]);
  const start = () => {
    const value = current.current;
    if (value.deadline !== null) return;
    update({ ...value, deadline: Date.now() + value.remaining, started: true, message: '' });
  };
  const pause = () => {
    if (synchronize()) return;
    const value = current.current;
    if (value.deadline !== null) update({ ...value, deadline: null });
  };
  const reset = () => {
    synchronize();
    const value = current.current;
    update({ ...value, remaining: durations[value.phase], deadline: null, started: false, message: '' });
  };
  return <PomodoroContext.Provider value={{ ...timer, running: timer.deadline !== null, start, pause, reset }}>{children}</PomodoroContext.Provider>;
}

export function PomodoroBanner() {
  const timer = useContext(PomodoroContext);
  const { pathname } = useLocation();
  if (!timer || pathname === '/pomodoro' || (!timer.started && !timer.message && timer.phase === 'focus')) return null;
  return <aside className="notice pomodoro-banner" aria-label="สถานะ Pomodoro">
    <div className="row between">
      <Link to="/pomodoro"><strong>Pomodoro · {phaseName(timer.phase)} · <span aria-live="off">{clockText(timer.remaining)}</span></strong></Link>
      <span>{timer.running ? 'กำลังจับเวลา' : timer.started ? 'หยุดชั่วคราว' : 'พร้อมเริ่ม'}</span>
    </div>
    {timer.message && <p role="status">{timer.message}</p>}
    {timer.phase === 'break' && <p><Link to="/review">ทบทวน Flashcards ช่วงพัก →</Link></p>}
  </aside>;
}

export default function PomodoroPage() {
  const timer = useContext(PomodoroContext);
  return <>
    <PageTitle eyebrow="ONE FOCUSED MOMENT" title="Pomodoro" subtitle="แบ่งเวลาเรียน 25 นาที แล้วพัก 5 นาที ตามจังหวะของคุณ" />
    <section className={`panel stack pomodoro-panel ${timer.phase === 'break' ? 'is-break' : ''}`} aria-label="นาฬิกา Pomodoro">
      <div className="row between"><h2><Icon name="clock" /> {phaseName(timer.phase)}</h2><span className="badge">{timer.running ? 'กำลังจับเวลา' : timer.started ? 'หยุดชั่วคราว' : 'พร้อมเริ่ม'}</span></div>
      <div className="pomodoro-clock" role="timer" aria-label="เวลาที่เหลือ" aria-live="off">{clockText(timer.remaining)}</div>
      <p className="muted">{timer.phase === 'focus' ? 'ให้เวลากับสิ่งที่กำลังเรียนทีละเรื่อง' : 'พักสายตา ยืดเส้น หรือทบทวนการ์ดสั้น ๆ ตามสะดวก'}</p>
      <div className="row pomodoro-actions">
        {timer.running
          ? <button className="btn" onClick={timer.pause}>หยุดชั่วคราว</button>
          : <button className="btn" onClick={timer.start}>{timer.started ? 'เริ่มต่อ' : 'เริ่มจับเวลา'}</button>}
        <button className="btn secondary" onClick={timer.reset}>รีเซ็ตช่วงนี้</button>
      </div>
      {timer.message && <p className="notice" role="status">{timer.message}</p>}
      {timer.phase === 'break' && <Link className="btn secondary" to="/review">ทบทวน Flashcards ช่วงพัก</Link>}
    </section>
    <section className="panel stack"><h2>เรียนและพักอย่างพอดี</h2>
      <p>เมื่อครบเวลา ระบบจะแจ้งเตือนบนหน้าจอและเตรียมช่วงถัดไปให้ กดเริ่มจับเวลาเมื่อคุณพร้อม</p>
      <p>เปลี่ยนหน้าในแอปได้โดยเวลายังเดินต่อ หากรีเฟรช ปิดหน้า หรือออกจากระบบ นาฬิกาจะเริ่มใหม่</p>
      <p className="small muted">เวลา Pomodoro แยกจากเวลาทบทวนรายวัน และไม่นับเป็นสถิติการเรียน การทบทวน Flashcards ยังคงใช้การ์ดที่ถึงกำหนดและเวลาที่เหลือตามตารางของคุณ</p>
    </section>
  </>;
}
