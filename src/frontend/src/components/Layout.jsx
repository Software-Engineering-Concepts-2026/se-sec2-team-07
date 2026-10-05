import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
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
  const { user, setUser, notify, confirm, hasUnsavedDraft } = useApp();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      if (hasUnsavedDraft() && !await confirm('ออกจากระบบโดยไม่บันทึก?', 'มีร่างที่ยังไม่ได้บันทึก หากออกจากระบบร่างนี้จะหายไป เลือกยกเลิกเพื่อกลับไปบันทึกก่อน')) return;
      await api('/logout', 'POST', {}); setUser(null);
    } catch (e) { notify(e.message); } finally { setBusy(false); }
  }
  const logoutButton = <button className="logout" disabled={busy} onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ"><Icon name="logout" /></button>;
  const pageTitle = getPageTitle(pathname);
  useEffect(() => {
    setMoreOpen(false);
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
        {[['เรียนวันนี้', ['/', '/review', '/schedule', '/pomodoro']], ['คลังความรู้', ['/decks', '/notes', '/courses', '/archive']], ['ผลลัพธ์', ['/stats', '/export']]].map(([group, paths]) => <div className="nav-group" key={group}><span className="nav-caption">{group}</span>{paths.map(path => { const [, icon, label] = links.find(item => item[0] === path); return <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => isActive ? 'active' : ''}><Icon name={icon} />{label}</NavLink>; })}</div>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">✧ ทีละใบ ทีละความรู้<br />ความสม่ำเสมอเล็ก ๆ<br />สร้างการเปลี่ยนแปลงที่ยิ่งใหญ่</div>
        <div className="user row"><div className="avatar" aria-hidden="true">{user.name[0]}</div><div className="sidebar-profile-copy"><div className="user-name" title={user.name}>{user.name}</div><span className="small muted">บัญชีของคุณ</span></div>{logoutButton}</div>
      </div>
    </aside>
    <main className="main" id="main-content" tabIndex="-1">
      <header className="topbar">
        <time className="desktop-label" dateTime={localDate}>{today}</time>
        <div className="mobile-brand"><Brand /></div>
        <div className="row topbar-meta"><span className="status">พื้นที่เรียนรู้ของคุณ</span><time dateTime={localDate}>วันนี้ {today}</time>{logoutButton}</div>
      </header>
      <div className={`content ${pathname.startsWith('/review') ? 'review-surface' : ''}`}><PomodoroBanner /><Suspense fallback={<div className="loading" role="status">กำลังเปิดหน้า…</div>}><Outlet /></Suspense></div>
    </main>
    <nav className="mobile-dock" aria-label="เมนูมือถือ">{['/', '/decks', '/review', '/stats'].map(path => { const [, icon, label] = links.find(item => item[0] === path); return <NavLink key={path} to={path} end={path === '/'} className={path === '/review' ? 'dock-review' : ''}><Icon name={icon} /><span>{path === '/decks' ? 'ชุดการ์ด' : label}</span></NavLink>; })}<button aria-expanded={moreOpen} aria-controls="mobile-more" onClick={() => setMoreOpen(v => !v)}><span aria-hidden="true">•••</span><span>เพิ่มเติม</span></button></nav>
    {moreOpen && <section className="mobile-more" id="mobile-more" aria-label="เมนูเพิ่มเติม"><div className="row between"><h2>เมนูทั้งหมด</h2><button className="btn secondary" onClick={() => setMoreOpen(false)}>ปิด</button></div>{links.filter(([path]) => !['/', '/decks', '/review', '/stats'].includes(path)).map(([path, icon, label]) => <NavLink key={path} to={path}><Icon name={icon} />{label}</NavLink>)}</section>}
  </>;
}
