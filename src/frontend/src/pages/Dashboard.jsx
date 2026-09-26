import SyncStatus from '../components/SyncStatus';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import { useOverview } from '../hooks/useOverview';
import { PageTitle, Art, Icon, Metrics, DeckCard, ActivityChart, ErrorPanel } from '../components/UI';
import EmptyLibrary from '../components/EmptyLibrary';
export default function Dashboard() {
  const { user } = useApp(); const { decks, stats, loading, error, reload, sync } = useOverview();
  if (loading) return <div className="loading">กำลังจัดพื้นที่เรียนรู้…</div>;
  if (error) return <ErrorPanel error={error} retry={reload} />;
  const due = decks.reduce((sum, d) => sum + d.due_count, 0);
  return <><PageTitle eyebrow="LET’S MAKE TODAY A LEARNING DAY" title={`สวัสดี, ${user.name} ☀`} subtitle="พร้อมเติมความรู้ให้ตัวเองอีกนิดหรือยัง?"><Link className="btn" to="/create"><Icon name="plus" />สร้างชุดการ์ด</Link></PageTitle><SyncStatus sync={sync} /><section className="hero"><div><span className="pill">✧ YOUR DAILY DOSE OF KNOWLEDGE</span><h2>{due ? 'ความรู้ที่รอคุณกลับไปทบทวน' : 'ทุกความรู้ เริ่มต้นจากใบแรก'}</h2><p>{due ? `วันนี้มี ${due} การ์ดพร้อมให้คุณฝึกความจำ` : 'เปลี่ยนโน้ตเป็นการ์ด แล้วเริ่มเรียนรู้ในแบบของคุณ'}<br />ใช้เวลาอีกนิด เพื่อจดจำได้อีกนาน</p><Link className="btn" to={due ? '/review' : '/create'}>{due ? 'เริ่มทบทวนวันนี้' : 'สร้างชุดการ์ดแรก'}<Icon name="arrow" /></Link></div><Art /></section><Metrics decks={decks} stats={stats} /><div className="section-heading row between"><h2>ชุดการ์ดของคุณ <span className="muted small"> / {decks.length} ชุด</span></h2><Link to="/decks">ดูทั้งหมด →</Link></div><div className="deck-grid">{decks.length ? decks.slice(0, 3).map(d => <DeckCard key={d.id} deck={d} />) : <EmptyLibrary reload={reload} />}</div><div className="lower-grid"><section className="panel chart-panel"><div className="row between"><h2>จังหวะการเรียนรู้ของคุณ</h2><span className="small muted">7 วันที่ผ่านมา</span></div><ActivityChart weekly={stats.weekly} /></section><section className="panel quote"><div className="eyebrow">A GENTLE REMINDER</div><p>“ไม่ต้องรู้ทุกอย่างในวันนี้<br />แค่รู้มากกว่าเมื่อวานอีกนิดก็พอ”</p><small>ให้เวลากับตัวเอง และสนุกกับการเรียนรู้</small></section></div><div className="footer-note">SMALL STEPS. LASTING KNOWLEDGE.</div></>;
}
