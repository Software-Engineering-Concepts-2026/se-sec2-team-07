export default function SyncStatus({ sync, paused = false, reload = sync.reload, disabled = false }) {
  return <aside className="notice sync-status" aria-label="สถานะการซิงค์">
    <div className="row between"><p role="status">{sync.refreshing ? 'กำลังดึงข้อมูลล่าสุด…' : paused ? 'มีร่างที่ยังไม่บันทึก — พักการดึงข้อมูลเพื่อรักษาร่างของคุณ' : sync.lastSynced ? `ดึงข้อมูลล่าสุดเมื่อ ${sync.lastSynced.toLocaleTimeString('th-TH')}` : 'ยังไม่ได้รับข้อมูลล่าสุด'}</p>
      <button type="button" className="btn secondary" disabled={disabled || sync.refreshing} onClick={() => reload()}>ดึงข้อมูลล่าสุด</button></div>
    {sync.error && <p role="alert">ดึงข้อมูลไม่สำเร็จ: {sync.error} ข้อมูลที่แสดงอาจไม่ใช่ล่าสุด กรุณาลองอีกครั้ง</p>}
    <p className="small muted">ข้อมูลที่บันทึกใช้ร่วมกันเมื่อเข้าสู่ระบบด้วยบัญชีเดียวกันบนเว็บไซต์เดียวกัน · ตรวจข้อมูลทุก 30 วินาทีขณะเปิดหน้านี้</p>
  </aside>;
}
