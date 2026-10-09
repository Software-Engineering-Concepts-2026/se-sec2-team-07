import { Link } from 'react-router-dom';

export default function WeeklyActivity({ weekly }) {
  const studiedDays = weekly.filter((day) => day.count > 0).length;
  return (
    <section className="panel weekly-activity">
      <div className="weekly-heading">
        <h2>จังหวะการเรียนรู้ของคุณ</h2>
        <span>7 วันที่ผ่านมา</span>
      </div>
      <p className="weekly-summary">
        ทบทวนแล้ว{' '}
        <strong>
          {studiedDays}
          <span> / {weekly.length} วัน</span>
        </strong>
      </p>
      <div className="week-dots">
        {weekly.map((day) => (
          <div key={day.date}>
            <span className={day.count ? 'studied' : ''}>{day.count ? '✓' : ''}</span>
            <small>
              {new Date(`${day.date}T12:00:00`).toLocaleDateString('th-TH', { weekday: 'short' })}
            </small>
          </div>
        ))}
      </div>
      <p className="weekly-encouragement">
        {studiedDays
          ? 'ทีละนิดทุกวัน ช่วยให้จำได้นานขึ้น'
          : 'เริ่มทบทวนวันนี้ แล้วค่อย ๆ สร้างความต่อเนื่อง'}
      </p>
      <div className="weekly-footer">
        <span className="weekly-legend">
          <i aria-hidden="true" />
          วันที่ทบทวนแล้ว
        </span>
        <Link to="/stats">
          ดูสถิติทั้งหมด <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
