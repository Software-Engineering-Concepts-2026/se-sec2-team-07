import { Link } from 'react-router-dom';
import { PageTitle, ErrorPanel, Icon } from '../components/UI';
import { ratings } from '../components/review/ratings';
import { useReviewSession } from '../hooks/useReviewSession';
export default function Review() {
  const {
    cards,
    error,
    index,
    flipped,
    setFlipped,
    answers,
    remaining,
    paused,
    setPaused,
    finished,
    setFinished,
    busy,
    plan,
    rate,
  } = useReviewSession();
  if (error)
    return (
      <>
        <ErrorPanel error={error} />
        <Link to="/schedule" className="btn">
          ดูตารางทบทวน
        </Link>
      </>
    );
  if (!cards) return <div className="loading">กำลังเตรียมการ์ด…</div>;
  if (!cards.length)
    return (
      <section className="panel finish">
        <div className="success-circle">✓</div>
        <h1>{plan?.due_count ? 'พักก่อน แล้วค่อยทบทวนต่อ' : 'ทบทวนครบสำหรับตอนนี้แล้ว'}</h1>
        <p className="muted">
          {plan?.due_count
            ? 'เวลาที่เหลือวันนี้ไม่พอสำหรับการ์ดหนึ่งใบ ดูแผนหรือปรับเวลาได้'
            : 'กลับมาทบทวนเมื่อถึงรอบถัดไป'}
        </p>
        <Link to="/schedule" className="btn">
          ดูตารางทบทวน
        </Link>
      </section>
    );
  if (finished) {
    const good = answers.filter((r) => ['good', 'easy'].includes(r)).length;
    return (
      <section className="review-wrap panel finish">
        <div className="success-circle">✧</div>
        <div className="eyebrow">A LITTLE BETTER THAN BEFORE</div>
        <h1>วันนี้คุณก้าวไปอีกขั้นแล้ว</h1>
        <p className="muted">
          ทบทวน {answers.length} ใบ · จำได้{' '}
          {answers.length ? Math.round((good / answers.length) * 100) : 0}%<br />
          บันทึกผลและกำหนดรอบทบทวนถัดไปเรียบร้อย
        </p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <Link to="/stats" className="btn">
            ดูความก้าวหน้า
            <Icon name="arrow" />
          </Link>
          <Link to="/schedule" className="btn secondary">
            ดูตารางทบทวน
          </Link>
        </div>
      </section>
    );
  }
  const card = cards[index];
  const seconds = Math.ceil(remaining);
  return (
    <div className="review-wrap">
      <PageTitle
        eyebrow="ONE CARD CLOSER TO YOUR GOAL"
        title="เวลาของความรู้"
        subtitle={card.deck_name}
      />
      <div className="row between review-top">
        <span className="small muted">
          การ์ด {index + 1} จาก {cards.length} ใบ
        </span>
        <div className="row">
          <span className="timer" aria-label="เวลาที่เหลือ">
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </span>
          <button className="btn ghost" disabled={busy} onClick={() => setPaused((v) => !v)}>
            {paused ? 'เริ่มเวลาต่อ' : 'พักเวลา'}
          </button>
          <button className="btn secondary" disabled={busy} onClick={() => setFinished(true)}>
            จบรอบนี้
          </button>
        </div>
      </div>
      <div className="progress">
        <div style={{ width: `${(index / cards.length) * 100}%` }} />
      </div>
      <button
        className="review-card"
        disabled={busy || paused}
        onClick={() => setFlipped((v) => !v)}
      >
        <span className="face-label">{paused ? 'PAUSED' : flipped ? 'คำตอบ' : 'คำถาม'}</span>
        <span className="card-text">
          {paused ? 'พักสักครู่ แล้วค่อยกลับมาเรียนรู้' : flipped ? card.back : card.front}
        </span>
        <span className="hint">
          {flipped ? 'จำได้แค่ไหน? เลือกระดับด้านล่าง' : 'คลิกเพื่อเปิดคำตอบ · Space'}
        </span>
      </button>
      {!flipped && !paused && (
        <button className="btn review-flip" disabled={busy} onClick={() => setFlipped(true)}>
          พลิกดูคำตอบ · Space
        </button>
      )}
      {flipped && !paused && (
        <div className="ratings">
          {ratings.map(([value, label, time], i) => (
            <button className="rating" key={value} disabled={busy} onClick={() => rate(value)}>
              <strong>
                {i + 1} · {label}
              </strong>
              <small>{time}</small>
            </button>
          ))}
        </div>
      )}
      <p className="session-note">
        เลือกการ์ดตามเวลาที่เหลือวันนี้แล้ว · <Link to="/schedule">ดูหรือปรับตาราง</Link>
      </p>
      <p className="session-note">ลองนึกคำตอบก่อนพลิกการ์ด แล้วประเมินความจำอย่างตรงไปตรงมา</p>
    </div>
  );
}
