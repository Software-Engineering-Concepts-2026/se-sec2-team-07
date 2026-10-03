import { useState } from 'react';
import { api } from '../api';
import { useApp } from '../context';
import { Art, Brand, Icon } from '../components/UI';
export default function Auth() {
  const { setUser, setAi } = useApp();
  const [register, setRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await api(register ? '/register' : '/login', 'POST', data); const me = await api('/me'); setAi(me.ai); setUser(me.user); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="auth"><section className="auth-story"><Brand /><div className="eyebrow" style={{ marginTop: 45 }}>A LITTLE FOCUS. A LOT OF POSSIBILITIES.</div><h1>เรียนรู้ทีละนิด<br />จดจำได้อีกนาน</h1><p>เปลี่ยนโน้ตที่กองอยู่ ให้เป็นความรู้ที่อยู่กับคุณ<br />สร้างแฟลชการ์ด ทบทวน และเติบโตในทุกวัน</p><Art /><p className="small">ออกแบบมาเพื่อจังหวะการเรียนรู้ของคุณ</p></section><section className="auth-form"><div className="auth-box"><div className="eyebrow">YOUR LEARNING SPACE</div><h2>{register ? 'เริ่มต้นบทใหม่ของคุณ' : 'ยินดีต้อนรับกลับมา'}</h2><p className="muted small">{register ? 'สร้างบัญชีเพื่อเก็บชุดการ์ดและความก้าวหน้าของคุณ' : 'เข้าสู่ระบบ แล้วมาเรียนรู้อีกนิดด้วยกัน'}</p><form onSubmit={submit}>{register && <label className="field">ชื่อที่อยากให้เราเรียก<input name="name" required maxLength={80} autoComplete="name" placeholder="ชื่อของคุณ" /></label>}<label className="field">อีเมล<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" /></label><label className="field">รหัสผ่าน<div className="password-control"><input name="password" aria-label="รหัสผ่าน" type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={256} autoComplete={register ? 'new-password' : 'current-password'} placeholder="อย่างน้อย 8 ตัวอักษร" /><button type="button" aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>{showPassword ? 'ซ่อน' : 'แสดง'}</button></div></label>{error && <p className="error" role="alert">{error}</p>}<button className="btn" type="submit" disabled={busy}>{busy ? 'กำลังดำเนินการ…' : register ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}<Icon name="arrow" /></button></form><div className="auth-switch">{register ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'} <button disabled={busy} onClick={() => { setRegister(v => !v); setShowPassword(false); setError(''); }}>{register ? 'เข้าสู่ระบบ' : 'สร้างบัญชีฟรี'}</button></div><p className="footer-note">FOCUS FLASHCARDS · NEX4</p></div></section></main>;
}
