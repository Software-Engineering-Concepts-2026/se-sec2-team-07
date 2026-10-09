import { Link } from 'react-router-dom';
import { Art, Icon } from '../UI';
export default function DashboardHero({ user, stats, due }) {
  return (
    <section className="hero dashboard-hero">
      <div>
        <span className="pill">{stats.total ? 'เรียนรู้ต่ออีกนิด' : 'วันแรกของคุณ'}</span>
        <h1>สวัสดี, {user.name}</h1>
        <p>
          {due
            ? `วันนี้มี ${due} การ์ดรอให้คุณกลับมาทบทวน`
            : 'มาสร้างการ์ดใบแรก แล้วเริ่มจำให้ได้นานขึ้นกัน'}
        </p>
        <Link className="btn" to={due ? '/review' : '/create'}>
          <Icon name={due ? 'review' : 'plus'} />
          {due ? 'เริ่มทบทวนวันนี้' : 'สร้างชุดการ์ด'}
        </Link>
      </div>
      <Art />
    </section>
  );
}
