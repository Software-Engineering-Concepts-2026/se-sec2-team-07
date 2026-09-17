import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../context';
import { api } from '../api';
import { Brand, Icon } from './UI';
const links = [['/', 'home', 'ภาพรวม'], ['/decks', 'decks', 'ชุดการ์ดของฉัน'], ['/review', 'review', 'ทบทวนการ์ด'], ['/schedule', 'review', 'ตารางทบทวน'], ['/stats', 'stats', 'สถิติการเรียน']];
export default function Layout() {
  const { user, setUser, notify } = useApp();
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  async function logout() { setBusy(true); try { await api('/logout', 'POST', {}); setUser(null); } catch (e) { notify(e.message); } finally { setBusy(false); } }
  const logoutButton = <button className="logout" disabled={busy} onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ"><Icon name="logout" /></button>;
  return <><aside className="sidebar"><Brand /><div className="brand-note">MAKE KNOWLEDGE STICK</div><nav className="nav" aria-label="เมนูหลัก">{links.map(([path, icon, label]) => <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => isActive ? 'active' : ''}><Icon name={icon} />{label}</NavLink>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip">✧ ทีละใบ ทีละความรู้<br />ความสม่ำเสมอเล็ก ๆ<br />สร้างการเปลี่ยนแปลงที่ยิ่งใหญ่</div><div className="user row"><div className="avatar">{user.name[0]}</div><div><div className="user-name">{user.name}</div><span className="small muted">พื้นที่เรียนรู้ของคุณ</span></div>{logoutButton}</div></div></aside><main className="main"><header className="topbar"><span className="desktop-label">พื้นที่เรียนรู้ / <b>{links.find(([path]) => path === pathname)?.[2] || 'ชุดการ์ด'}</b></span><div className="mobile-brand"><Brand /></div><div className="row"><span className="status">บันทึกความก้าวหน้าอัตโนมัติ</span><span>{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>{logoutButton}</div></header><div className="content"><Outlet /></div></main></>;
}
