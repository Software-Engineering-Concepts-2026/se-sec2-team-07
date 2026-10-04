import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { api } from '../api';
import { Brand, Icon } from './UI';
import { PomodoroProvider, PomodoroBanner } from '../pomodoro';

const links = [
  ['/', 'home', 'ภาพรวม'],
  ['/decks', 'decks', 'ชุดการ์ดของฉัน'],
  ['/archive', 'check', 'จัดเก็บการ์ด'],
  ['/courses', 'courses', 'รายวิชา'],
  ['/notes', 'notes', 'โน้ต'],
  ['/review', 'review', 'ทบทวนการ์ด'],
  ['/pomodoro', 'clock', 'Pomodoro'],
  ['/schedule', 'schedule', 'ตารางทบทวน'],
  ['/stats', 'stats', 'สถิติการเรียน'],
  ['/export', 'arrow', 'ส่งออกผลงาน'],
];

function getPageTitle(pathname) {
  if (pathname === '/') return 'ภาพรวม';
  if (pathname === '/create') return 'สร้างชุดการ์ด';
  if (/^\/edit\/[^/]+$/.test(pathname)) return 'แก้ไขชุดการ์ด';
  if (/^\/courses\/[^/]+$/.test(pathname)) return 'รายละเอียดรายวิชา';
  if (/^\/review\/[^/]+$/.test(pathname)) return 'ทบทวนชุดการ์ด';
  return links.find(([path]) => pathname === path)?.[2] || 'พื้นที่เรียนรู้';
}

export default function Layout() {
  return <PomodoroProvider><WorkspaceLayout /></PomodoroProvider>;
}

function WorkspaceLayout() {
  const { user, setUser, notify } = useApp();
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  async function logout() { setBusy(true); try { await api('/logout', 'POST', {}); setUser(null); } catch (e) { notify(e.message); } finally { setBusy(false); } }
  const logoutButton = <button className="logout" disabled={busy} onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ"><Icon name="logout" /></button>;
  const pageTitle = getPageTitle(pathname);
  useEffect(() => {
    document.title = `${pageTitle} · focus.`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, pageTitle]);
  const now = new Date();
  const today = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const skipToContent = event => {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  };

  return <>
    <a className="skip-link" href="#main-content" onClick={skipToContent}>ข้ามไปยังเนื้อหาหลัก</a>
    <aside className="sidebar">
      <Brand />
      <div className="brand-note">MAKE KNOWLEDGE STICK</div>
      <nav className="nav" aria-label="เมนูหลัก">
        {links.map(([path, icon, label]) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => isActive ? 'active' : ''}><Icon name={icon} />{label}</NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">✧ ทีละใบ ทีละความรู้<br />ความสม่ำเสมอเล็ก ๆ<br />สร้างการเปลี่ยนแปลงที่ยิ่งใหญ่</div>
        <div className="user row"><div className="avatar" aria-hidden="true">{user.name[0]}</div><div><div className="user-name">{user.name}</div><span className="small muted">พื้นที่เรียนรู้ของคุณ</span></div>{logoutButton}</div>
      </div>
    </aside>
    <main className="main" id="main-content" tabIndex="-1">
      <header className="topbar">
        <span className="desktop-label">พื้นที่เรียนรู้ / <b>{pageTitle}</b></span>
        <div className="mobile-brand"><Brand /></div>
        <div className="row topbar-meta"><span className="status">พื้นที่เรียนรู้ของคุณ</span><time dateTime={localDate}>วันนี้ {today}</time>{logoutButton}</div>
      </header>
      <div className="content"><PomodoroBanner /><Outlet /></div>
    </main>
  </>;
}
