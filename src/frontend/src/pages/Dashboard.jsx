import SyncStatus from '../components/SyncStatus';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import { useOverview } from '../hooks/useOverview';
import { Art, Icon, DeckCard, ErrorPanel } from '../components/UI';
export default function Dashboard() {
  const { user } = useApp(); const { decks, stats, loading, error, reload, sync } = useOverview();
  if (loading) return <div className="loading">กำลังจัดพื้นที่เรียนรู้…</div>;
  if (error) return <ErrorPanel error={error} retry={reload} />;
  const due = decks.reduce((sum, d) => sum + d.due_count, 0);
  const missions = [
    { done: decks.length > 0, title: 'สร้างชุดการ์ดชุดแรก', detail: 'จากไฟล์ PDF, PPTX, TXT, MD หรือพิมพ์เอง', to: '/create' },
    { done: stats.total > 0, title: 'ทบทวนรอบแรก', detail: 'นึกคำตอบก่อนพลิก แล้วบอกว่าจำได้แค่ไหน', to: '/review' },
    { done: stats.streak >= 3, title: 'ทบทวนครบ 3 วันติด', detail: 'กลับมาทบทวนวันละนิดให้เป็นนิสัย', to: '/schedule' },
  ];
  return <><SyncStatus sync={sync} /><section className="hero dashboard-hero"><div><span className="pill">{stats.total ? 'เรียนรู้ต่ออีกนิด' : 'วันแรกของคุณ'}</span><h1>สวัสดี, {user.name}</h1><p>{due ? `วันนี้มี ${due} การ์ดรอให้คุณกลับมาทบทวน` : 'มาสร้างการ์ดใบแรก แล้วเริ่มจำให้ได้นานขึ้นกัน'}</p><Link className="btn" to={due ? '/review' : '/create'}><Icon name={due ? 'review' : 'plus'} />{due ? 'เริ่มทบทวนวันนี้' : 'สร้างชุดการ์ด'}</Link></div><Art /></section>
    <div className="metrics dashboard-metrics"><div className="metric"><div className="label">ถึงกำหนดวันนี้</div><strong>{due} <small>ใบ</small></strong><small>{due ? 'พร้อมให้คุณทบทวน' : 'ยังว่างอยู่ เติมการ์ดได้เลย'}</small></div><div className="metric"><div className="label">เรียนต่อเนื่อง</div><strong>{stats.streak} <small>วัน</small></strong><small>ทบทวนวันนี้เพื่อเรียนรู้อย่างต่อเนื่อง</small></div><div className="metric"><div className="label">ทบทวนวันนี้</div><strong>{stats.today} <small>ครั้ง</small></strong><Link className="small" to="/schedule">ปรับเวลาทบทวน →</Link></div></div>
    <div className="dashboard-start"><section className="panel"><div className="row between"><h2>ภารกิจเริ่มต้น</h2><span className="badge">{missions.filter(m => m.done).length} / 3</span></div><div className="mission-list">{missions.map((mission, i) => <Link className={mission.done ? 'mission done' : 'mission'} key={mission.to} to={mission.to}><span className="mission-number">{mission.done ? '✓' : i + 1}</span><div><strong>{mission.title}</strong><small>{mission.detail}</small></div><Icon name="arrow" /></Link>)}</div></section><section className="panel"><h2>สัปดาห์นี้</h2><div className="week-dots">{stats.weekly.map(day => <div key={day.date}><span className={day.count ? 'studied' : ''}>{day.count ? '✓' : ''}</span><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('th-TH', { weekday: 'short' })}</small></div>)}</div><p className="notice">ทบทวนวันไหน วงกลมวันนั้นจะเปลี่ยนเป็นสีเขียว</p><Link className="small" to="/stats">ดูสถิติทั้งหมด →</Link></section></div>
    {decks.length > 0 && <><div className="section-heading row between"><h2>ชุดการ์ดของคุณ</h2><Link to="/decks">ดูทั้งหมด →</Link></div><div className="deck-grid">{decks.slice(0, 3).map(d => <DeckCard key={d.id} deck={d} />)}</div></>}
  </>;
}
