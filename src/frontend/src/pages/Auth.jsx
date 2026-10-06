import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context';
import { Brand, Icon } from '../components/UI';
export default function Auth() {
  const { setUser, setAi } = useApp();
  const [register, setRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (!authenticated) {
        await api(register ? '/register' : '/login', 'POST', data);
        setAuthenticated(true);
      }
      const me = await api('/me');
      setAi(me.ai);
      setUser(me.user);
    } catch (e) {
      if (e.status === 401) setAuthenticated(false);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth welcome-page">
      <section className="auth-story welcome-story">
        <Brand />
        <div className="welcome-copy">
          <span className="welcome-tag">
            <Icon name="decks" />
            พื้นที่เล็ก ๆ สำหรับความรู้ของคุณ
          </span>
          <h1>
            เปลี่ยนสิ่งที่อ่าน
            <br />
            เป็นสิ่งที่<span>จำได้</span>
          </h1>
          <p>
            จากโน้ตเลกเชอร์ถึงวันสอบ
            <br />
            ให้ focus. ช่วยจัดจังหวะการเรียนรู้ของคุณ
          </p>
        </div>
        <div className="welcome-preview" aria-label="ตัวอย่างการเรียนด้วยแฟลชการ์ด">
          <div className="preview-top">
            <span>
              <Icon name="notes" />
              การเรียนรู้ที่ยั่งยืน
            </span>
            <span>ตัวอย่างการ์ด</span>
          </div>
          <span className="preview-label">ลองนึกคำตอบก่อนอ่าน</span>
          <h2>
            จำให้ได้นานขึ้น
            <br />
            เริ่มจากอะไร?
          </h2>
          <div className="preview-answer">
            <Icon name="check" />
            <p>
              ลองเรียกความรู้จากความจำ
              <br />
              <strong>แล้วกลับมาทบทวนเป็นระยะ</strong>
            </p>
          </div>
          <div className="preview-footer">
            <span>ทีละใบ ทีละความเข้าใจ</span>
            <Icon name="arrow" />
          </div>
        </div>
        <div className="welcome-features">
          <span>
            <Icon name="notes" />
            สร้างจากโน้ต
          </span>
          <span>
            <Icon name="review" />
            ทบทวนตามรอบ
          </span>
          <span>
            <Icon name="stats" />
            เห็นความก้าวหน้า
          </span>
        </div>
      </section>
      <section className="auth-form welcome-form" aria-labelledby="auth-heading">
        <div className="auth-box">
          <div
            className="auth-mode-switch"
            role="tablist"
            aria-label="เลือกเข้าสู่ระบบหรือสมัครใหม่"
          >
            {[
              [false, 'เข้าสู่ระบบ'],
              [true, 'สมัครใหม่'],
            ].map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={register === value}
                tabIndex={register === value ? 0 : -1}
                onKeyDown={(e) => {
                  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                    e.preventDefault();
                    const next = e.key === 'Home' ? false : e.key === 'End' ? true : !register;
                    setRegister(next);
                    setShowPassword(false);
                    setError('');
                    e.currentTarget.parentElement.children[next ? 1 : 0].focus();
                  }
                }}
                disabled={busy || authenticated}
                onClick={() => {
                  setRegister(value);
                  setShowPassword(false);
                  setError('');
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <h2 id="auth-heading">{register ? 'เริ่มต้นบทใหม่ของคุณ' : 'ยินดีต้อนรับกลับมา'}</h2>
          <p className="muted small">
            {register
              ? 'สร้างบัญชีเพื่อเก็บชุดการ์ดและความก้าวหน้าของคุณ'
              : 'เข้าสู่ระบบเพื่อเรียนต่อจากที่ค้างไว้'}
          </p>
          <form onSubmit={submit} aria-busy={busy}>
            {authenticated && (
              <p className="notice" role="status">
                ยืนยันบัญชีแล้ว แต่ยังเปิดข้อมูลไม่สำเร็จ
                กดลองอีกครั้งได้โดยไม่ต้องสมัครหรือเข้าสู่ระบบซ้ำ
              </p>
            )}
            <fieldset className="auth-fields" disabled={authenticated || busy}>
              {register && (
                <label className="field">
                  ชื่อที่อยากให้เราเรียก
                  <input
                    name="name"
                    required
                    maxLength={80}
                    autoComplete="name"
                    placeholder="ชื่อของคุณ"
                    disabled={busy}
                  />
                </label>
              )}
              <label className="field">
                อีเมล
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={busy}
                />
              </label>
              <div className="field auth-password">
                <label htmlFor="auth-password">รหัสผ่าน</label>
                <div className="password-control">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={256}
                    autoComplete={register ? 'new-password' : 'current-password'}
                    placeholder={
                      register ? 'ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร' : 'กรอกรหัสผ่านของคุณ'
                    }
                    disabled={busy}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} aria-hidden="true" />
                    ) : (
                      <Eye size={20} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="btn" type="submit" disabled={busy}>
              {busy
                ? 'กำลังดำเนินการ…'
                : authenticated
                  ? 'ลองเปิดบัญชีอีกครั้ง'
                  : register
                    ? 'สร้างบัญชี'
                    : 'เข้าสู่ระบบ'}
              <Icon name="arrow" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
