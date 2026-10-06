import WeeklyActivity from '../components/dashboard/WeeklyActivity';
import StarterMissions from '../components/dashboard/StarterMissions';
import DashboardMetrics from '../components/dashboard/DashboardMetrics';
import DashboardHero from '../components/dashboard/DashboardHero';
import SyncStatus from '../components/SyncStatus';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import { useOverview } from '../hooks/useOverview';
import { DeckCard, ErrorPanel } from '../components/UI';
export default function Dashboard() {
  const { user } = useApp();
  const { decks, stats, loading, error, reload, sync } = useOverview();
  if (loading) return <div className="loading">กำลังจัดพื้นที่เรียนรู้…</div>;
  if (error) return <ErrorPanel error={error} retry={reload} />;
  const due = decks.reduce((sum, d) => sum + d.due_count, 0);
  const missions = [
    {
      done: decks.length > 0,
      title: 'สร้างชุดการ์ดชุดแรก',
      detail: 'จากไฟล์ PDF, PPTX, TXT, MD หรือพิมพ์เอง',
      to: '/create',
    },
    {
      done: stats.total > 0,
      title: 'ทบทวนรอบแรก',
      detail: 'นึกคำตอบก่อนพลิก แล้วบอกว่าจำได้แค่ไหน',
      to: '/review',
    },
    {
      done: stats.streak >= 3,
      title: 'ทบทวนครบ 3 วันติด',
      detail: 'กลับมาทบทวนวันละนิดให้เป็นนิสัย',
      to: '/schedule',
    },
  ];
  return (
    <>
      <SyncStatus sync={sync} />
      <DashboardHero user={user} stats={stats} due={due} />
      <DashboardMetrics stats={stats} due={due} />
      <div className="dashboard-start">
        <StarterMissions missions={missions} />
        <WeeklyActivity weekly={stats.weekly} />
      </div>
      {decks.length > 0 && (
        <>
          <div className="section-heading row between">
            <h2>ชุดการ์ดของคุณ</h2>
            <Link to="/decks">ดูทั้งหมด →</Link>
          </div>
          <div className="deck-grid">
            {decks.slice(0, 3).map((d) => (
              <DeckCard key={d.id} deck={d} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
