import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from './context';
import { Icon, PageTitle } from './components/UI';

const durations = { focus: 25 * 60 * 1000, break: 5 * 60 * 1000 };
const phaseName = (phase) => (phase === 'focus' ? 'ช่วงเรียน' : 'ช่วงพัก');
const clockText = (milliseconds) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};
const initialTimer = () => ({
  phase: 'focus',
  remaining: durations.focus,
  deadline: null,
  started: false,
  message: '',
});
const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const { notify } = useApp();
  const [timer, setTimer] = useState(initialTimer);
  const [widgetHidden, setWidgetHidden] = useState(false);
  const current = useRef(timer);
  const update = useCallback((next) => {
    current.current = next;
    setTimer(next);
  }, []);
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
    const message =
      value.phase === 'focus'
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
    update({
      ...value,
      remaining: durations[value.phase],
      deadline: null,
      started: false,
      message: '',
    });
  };
  const selectPhase = (phase) => {
    if (!durations[phase] || current.current.phase === phase) return;
    update({ phase, remaining: durations[phase], deadline: null, started: false, message: '' });
  };
  return (
    <PomodoroContext.Provider
      value={{
        ...timer,
        running: timer.deadline !== null,
        start,
        pause,
        reset,
        selectPhase,
        widgetHidden,
        setWidgetHidden,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function PomodoroBanner() {
  const timer = useContext(PomodoroContext);
  const { pathname } = useLocation();
  if (
    !timer ||
    timer.widgetHidden ||
    pathname === '/pomodoro' ||
    (!timer.started && !timer.message && timer.phase === 'focus')
  )
    return null;
  return (
    <aside className="pomodoro-float" aria-label="สถานะ Pomodoro">
      <div className="pomodoro-float-heading">
        <Link to="/pomodoro">
          <Icon name="clock" />
          Pomodoro
        </Link>
        <span>{phaseName(timer.phase)}</span>
        <button
          type="button"
          className="pomodoro-dismiss"
          aria-label="ซ่อนกล่อง Pomodoro"
          title="ซ่อนกล่อง โดยไม่หยุดหรือรีเซ็ตเวลา"
          onClick={() => timer.setWidgetHidden(true)}
        >
          ×
        </button>
      </div>
      <div className="pomodoro-float-controls">
        <div>
          <strong role="timer" aria-label="เวลา Pomodoro ที่เหลือ" aria-live="off">
            {clockText(timer.remaining)}
          </strong>
          <small>
            {timer.running ? 'กำลังจับเวลา' : timer.started ? 'หยุดชั่วคราว' : 'พร้อมเริ่ม'}
          </small>
        </div>
        <button className="btn" onClick={timer.running ? timer.pause : timer.start}>
          {timer.running ? 'หยุดชั่วคราว' : timer.started ? 'เริ่มต่อ' : 'เริ่มจับเวลา'}
        </button>
      </div>
      {timer.message && <p role="status">{timer.message}</p>}
      {timer.phase === 'break' && (
        <Link className="pomodoro-float-link" to="/review">
          ทบทวน Flashcards ช่วงพัก →
        </Link>
      )}
    </aside>
  );
}

export default function PomodoroPage() {
  const timer = useContext(PomodoroContext);
  const resting = timer.phase === 'break';
  const progress = Math.max(0, Math.min(1, 1 - timer.remaining / durations[timer.phase]));
  return (
    <>
      <PageTitle
        eyebrow="ONE FOCUSED MOMENT"
        title="Pomodoro"
        subtitle="แบ่งเวลาเรียน 25 นาที แล้วพัก 5 นาที ตามจังหวะของคุณ"
      />
      <div className={`focus-workspace ${resting ? 'resting' : ''}`}>
        <section className="panel pomodoro-panel focus-timer" aria-label="นาฬิกา Pomodoro">
          <div className="focus-phase">
            <button
              type="button"
              onClick={() => timer.selectPhase('focus')}
              aria-pressed={!resting}
              className={!resting ? 'current' : ''}
              aria-current={!resting ? 'step' : undefined}
            >
              01 · เรียน 25 นาที
            </button>
            <button
              type="button"
              onClick={() => timer.selectPhase('break')}
              aria-pressed={resting}
              className={resting ? 'current' : ''}
              aria-current={resting ? 'step' : undefined}
            >
              02 · พัก 5 นาที
            </button>
          </div>
          <div className="focus-ring">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <circle className="ring-track" cx="150" cy="150" r="139" />
              <circle
                className="ring-value"
                cx="150"
                cy="150"
                r="139"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 * (1 - progress)}
              />
            </svg>
            <div className="focus-ring-copy">
              <h2>{phaseName(timer.phase)}</h2>
              <div
                className="pomodoro-clock"
                role="timer"
                aria-label="เวลาที่เหลือ"
                aria-live="off"
              >
                {clockText(timer.remaining)}
              </div>
              <span className="focus-status">
                <i className={timer.running ? 'running' : ''} aria-hidden="true" />
                {timer.running
                  ? 'กำลังจับเวลา'
                  : timer.started
                    ? 'หยุดชั่วคราว'
                    : 'พร้อมเมื่อคุณพร้อม'}
              </span>
            </div>
          </div>
          <p className="focus-caption">กดสลับช่วงได้ · เปลี่ยนช่วงแล้วกดเริ่มจับเวลาใหม่</p>
          <p className="focus-intention">
            {resting ? 'พักสักนิด แล้วค่อยไปต่อ' : 'ทีละเรื่อง ก็ไปได้ไกล'}
          </p>
          <p className="muted focus-caption">
            {resting
              ? 'พักสายตา ยืดเส้น หรือดื่มน้ำสักแก้ว'
              : 'วางสิ่งรบกวน แล้วให้เวลากับสิ่งตรงหน้า'}
          </p>
          <div className="row pomodoro-actions">
            {timer.running ? (
              <button className="btn" onClick={timer.pause}>
                <span aria-hidden="true">Ⅱ</span>หยุดชั่วคราว
              </button>
            ) : (
              <button className="btn" onClick={timer.start}>
                <Icon name="clock" />
                {timer.started ? 'เริ่มต่อ' : 'เริ่มจับเวลา'}
              </button>
            )}
            <button className="btn secondary" onClick={timer.reset}>
              รีเซ็ตช่วงนี้
            </button>
          </div>
          <button
            className="btn secondary"
            onClick={() => timer.setWidgetHidden(!timer.widgetHidden)}
          >
            {timer.widgetHidden ? 'แสดงกล่องเวลาบนหน้าอื่น' : 'ซ่อนกล่องเวลาบนหน้าอื่น'}
          </button>
          {timer.message && (
            <p className="notice" role="status">
              {timer.message}
            </p>
          )}
          {timer.phase === 'break' && (
            <Link className="btn secondary" to="/review">
              ทบทวน Flashcards ช่วงพัก
            </Link>
          )}
        </section>
        <aside className="focus-guide stack">
          <section className="panel">
            <span className="editor-step">จังหวะเล็ก ๆ ที่ทำได้ทุกวัน</span>
            <h2>เรียนและพักอย่างพอดี</h2>
            <ol className="focus-steps">
              <li>
                <span>1</span>
                <div>
                  <strong>เลือกเพียงหนึ่งเรื่อง</strong>
                  <p>อ่านหนึ่งหัวข้อ สรุปโน้ต หรือทำโจทย์ที่ตั้งใจไว้</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>โฟกัส 25 นาที</strong>
                  <p>กดเริ่มเมื่อพร้อม หยุดชั่วคราวได้เมื่อจำเป็น</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>ให้ตัวเองพัก 5 นาที</strong>
                  <p>เมื่อครบเวลา ระบบเตรียมช่วงถัดไปให้ คุณเป็นคนกดเริ่มเอง</p>
                </div>
              </li>
            </ol>
          </section>
          <section className="focus-reminder">
            <Icon name={resting ? 'check' : 'notes'} />
            <p>
              {resting
                ? 'การพักก็เป็นส่วนหนึ่งของการเรียนรู้'
                : 'ไม่ต้องทำให้เสร็จทุกอย่าง แค่เริ่มจากเรื่องเดียวก็พอ'}
            </p>
          </section>
          <details className="panel focus-help">
            <summary>สิ่งที่ควรรู้เกี่ยวกับตัวจับเวลา</summary>
            <p>
              เปลี่ยนหน้าในแอปได้โดยเวลายังเดินต่อ หากรีเฟรช ปิดหน้า หรือออกจากระบบ
              นาฬิกาจะเริ่มใหม่
            </p>
            <p>
              เวลา Pomodoro แยกจากเวลาทบทวนรายวัน และไม่นับเป็นสถิติการเรียน การทบทวน Flashcards
              ยังคงใช้การ์ดที่ถึงกำหนดและเวลาที่เหลือตามตารางของคุณ
            </p>
          </details>
        </aside>
      </div>
    </>
  );
}
