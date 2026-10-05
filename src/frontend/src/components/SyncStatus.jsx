export default function SyncStatus({ sync, recoveryError = '', reload = sync.reload, disabled = false }) {
  if (!sync.error && !recoveryError) return null;
  return <aside className="notice sync-status" aria-label="สถานะการซิงค์">
    <div className="row between"><p role={sync.error ? 'alert' : undefined}>{sync.error ? `ดึงข้อมูลไม่สำเร็จ: ${sync.error} ข้อมูลที่แสดงอาจไม่ใช่ล่าสุด` : 'ข้อมูลมีการเปลี่ยนแปลง กรุณาคัดลอกร่างที่ต้องการเก็บก่อนดึงข้อมูลล่าสุด'}</p>
      <button type="button" className="btn secondary" disabled={disabled || sync.refreshing} onClick={() => reload()}>ดึงข้อมูลล่าสุด</button></div>
  </aside>;
}
