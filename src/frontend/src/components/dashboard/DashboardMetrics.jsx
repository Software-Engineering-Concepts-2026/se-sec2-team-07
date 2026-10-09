import { Link } from 'react-router-dom';

export default function DashboardMetrics({ stats, due }) {
  return (
    <div className="metrics dashboard-metrics">
      <div className="metric">
        <div className="label">ถึงกำหนดวันนี้</div>
        <strong>
          {due} <small>ใบ</small>
        </strong>
        <small>{due ? 'พร้อมให้คุณทบทวน' : 'ยังว่างอยู่ เติมการ์ดได้เลย'}</small>
      </div>
      <div className="metric">
        <div className="label">เรียนต่อเนื่อง</div>
        <strong>
          {stats.streak} <small>วัน</small>
        </strong>
        <small>ทบทวนวันนี้เพื่อเรียนรู้อย่างต่อเนื่อง</small>
      </div>
      <div className="metric">
        <div className="label">ทบทวนวันนี้</div>
        <strong>
          {stats.today} <small>ครั้ง</small>
        </strong>
        <Link className="small" to="/schedule">
          ปรับเวลาทบทวน →
        </Link>
      </div>
    </div>
  );
}
