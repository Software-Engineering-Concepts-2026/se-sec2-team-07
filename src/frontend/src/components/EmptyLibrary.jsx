import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { Empty, Icon } from './UI';
const sample = {
  name: 'คำศัพท์อังกฤษพื้นฐาน',
  description: 'คำศัพท์อังกฤษพร้อมความหมายภาษาไทย สำหรับเริ่มฝึกทบทวน',
  category: 'ภาษาอังกฤษ',
  color: 'green',
  cards: [
    { front: 'apple', back: 'แอปเปิล' },
    { front: 'book', back: 'หนังสือ' },
    { front: 'school', back: 'โรงเรียน' },
    { front: 'friend', back: 'เพื่อน' },
    { front: 'beautiful', back: 'สวยงาม' },
    { front: 'learn', back: 'เรียนรู้' },
  ],
};
export default function EmptyLibrary({ reload }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useApp();
  async function addSample() {
    setBusy(true);
    try {
      await api('/decks', 'POST', sample);
      notify('เพิ่มชุดคำศัพท์ตัวอย่างแล้ว');
      reload();
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Empty title="เริ่มจากความรู้เรื่องที่คุณสนใจ">
      <p>สร้างชุดการ์ดแรกจากโน้ต หรือเพิ่มคำถามด้วยตัวเอง</p>
      <div className="empty-library-actions">
        <Link className="btn" to="/create">
          <Icon name="plus" />
          สร้างชุดการ์ดแรก
        </Link>
        <button className="btn secondary" disabled={busy} onClick={addSample}>
          {busy ? 'กำลังเพิ่มชุดคำศัพท์…' : 'ลองชุดคำศัพท์ตัวอย่าง'}
        </button>
      </div>
    </Empty>
  );
}
