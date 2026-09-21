import { Link } from 'react-router-dom';
import { useOverview } from '../hooks/useOverview';
import { PageTitle, Metrics, Metric, ActivityChart, Empty, ErrorPanel } from '../components/UI';
export default function Statistics() {
  const { decks, stats, loading, error, reload } = useOverview();
  if (loading) return <div className="loading">กำลังสรุปความก้าวหน้า…</div>;
  if (error) return <ErrorPanel error={error} retry={reload} />;
  return <><PageTitle eyebrow="LOOK HOW FAR YOU’VE COME" title="ทุกการทบทวนมีความหมาย" subtitle="ติดตามความก้าวหน้าจากการเรียนรู้จริงของคุณ" /><Metrics decks={decks} stats={stats} /><div className="lower-grid"><section className="panel chart-panel"><h2>การทบทวนใน 7 วันที่ผ่านมา</h2><p className="muted small">รวม {stats.weekly.reduce((sum, d) => sum + d.count, 0)} ครั้ง</p><ActivityChart weekly={stats.weekly} /></section><section className="panel"><h2>ระดับความจำของคุณ</h2>{[['again', 'จำไม่ได้'], ['hard', 'ยาก'], ['good', 'จำได้'], ['easy', 'ง่าย']].map(([key, label]) => <div className="dist-row" key={key}><label>{label}</label><div className="progress"><div style={{ width: `${stats.total ? stats.distribution[key] / stats.total * 100 : 0}%` }} /></div><span>{stats.distribution[key]}</span></div>)}<p className="stats-note">ความแม่นยำ = จำนวนครั้งที่เลือก “จำได้” หรือ “ง่าย” ÷ จำนวนการทบทวนทั้งหมด</p></section></div><div className="metrics"><Metric label="ทบทวนทั้งหมด" value={`${stats.total} ครั้ง`} sub="สะสมจากทุกชุดการ์ด" icon="review" /><Metric label="เวลาเรียนสะสม" value={`${Math.round(stats.seconds / 60)} นาที`} sub="เวลาที่ใช้ตอบแต่ละการ์ด" icon="clock" /><Metric label="การ์ดที่เคยทบทวน" value={`${stats.uniqueCards} ใบ`} sub="นับการ์ดไม่ซ้ำจากประวัติทั้งหมด" icon="decks" /><Metric label="การ์ดทั้งหมด" value={`${decks.reduce((n, d) => n + d.card_count, 0)} ใบ`} sub="อีกหลายโอกาสที่จะเรียนรู้" icon="plus" /></div><section className="panel stack" aria-label="สถิติรายชุดการ์ด"><h2>หัวข้อที่ควรทบทวนเพิ่มเติม</h2><p className="muted">ใช้ชุดการ์ดเป็นหัวข้อ · แนะนำเมื่อทบทวนอย่างน้อย 3 ครั้ง และเลือก “จำได้/ง่าย” ต่ำกว่า 70% จากประวัติทั้งหมด</p>
      {stats.topics.some(topic => topic.recommended) ? <p role="status">พบ {stats.topics.filter(topic => topic.recommended).length} ชุดที่ควรทบทวนเพิ่มเติม</p> : <p>ยังไม่มีชุดที่เข้าเกณฑ์แนะนำ ชุดที่ทบทวนน้อยกว่า 3 ครั้งยังมีข้อมูลไม่เพียงพอ</p>}
      {stats.topics.map(topic => <article className="panel shared-content" key={topic.id}>
        <h3>{topic.name}</h3><p>{topic.total} ครั้ง · {topic.uniqueCards} ใบไม่ซ้ำ · ความแม่นยำ {topic.accuracy}%</p>
        <p>จำไม่ได้ {topic.again} ครั้ง · ยาก {topic.hard} ครั้ง</p>
        {topic.recommended ? <p className="notice">แนะนำให้ทบทวน: ความแม่นยำต่ำกว่า 70%</p> : topic.total < 3 ? <p className="small muted">ข้อมูลยังไม่เพียงพอสำหรับคำแนะนำ</p> : null}
        <Link className="btn secondary" to={`/review/${topic.id}`}>ทบทวนชุดนี้ตามตาราง</Link>
      </article>)}<p className="small muted">แสดงเฉพาะชุดที่มีประวัติ · การทบทวนยังจำกัดตามวันครบกำหนดและเวลารายวัน</p>
    </section>
    <section className="panel stack" aria-label="ประวัติการทบทวน"><h2>ประวัติย้อนหลัง 30 วัน</h2><p className="small muted">จำนวนครั้งอาจมากกว่าจำนวนการ์ด เพราะทบทวนใบเดิมซ้ำได้</p>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>วันที่</th><th>ครั้ง</th><th>ใบไม่ซ้ำ</th><th>ความแม่นยำ</th></tr></thead><tbody>{[...stats.history].reverse().map(day => <tr key={day.date}><td>{day.date}</td><td>{day.count}</td><td>{day.uniqueCards}</td><td>{day.accuracy === null ? '—' : `${day.accuracy}%`}</td></tr>)}</tbody></table></div>
    </section>{!stats.total && <Empty title="กราฟแรกเริ่มจากการทบทวนครั้งแรก"><p>เลือกชุดการ์ด แล้วกลับมาดูความก้าวหน้าได้ที่นี่</p><Link to="/review" className="btn">เริ่มทบทวน</Link></Empty>}<p className="stats-note">นับวันตามเวลาไทย (UTC+7) · สถิติอ้างอิงการ์ดที่ยังอยู่ในคลัง · ค่าความแม่นยำเป็นการประเมินตนเอง</p></>;
}
