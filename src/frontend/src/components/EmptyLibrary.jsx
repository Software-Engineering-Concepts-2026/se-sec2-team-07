import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { Empty, Icon } from './UI';
const sample = {
  name: 'เรียนรู้ให้จำได้นาน',
  description: 'เทคนิคเล็ก ๆ เพื่อการเรียนรู้ที่มีประสิทธิภาพ',
  category: 'การเรียนรู้',
  color: 'green',
  cards: [
    {
      front: 'Active Recall คืออะไร?',
      back: 'การเรียกคืนความรู้จากความจำ โดยไม่เปิดดูคำตอบก่อน เช่น การตอบแฟลชการ์ด',
    },
    {
      front: 'Spaced Repetition คืออะไร?',
      back: 'การทบทวนโดยเว้นช่วงเวลา แล้วปรับระยะห่างตามความสามารถในการจดจำ',
    },
    { front: 'Pomodoro แบบดั้งเดิมใช้เวลาเท่าไร?', back: 'จดจ่อทำงาน 25 นาที แล้วพัก 5 นาที' },
    {
      front: 'ทำไมควรตรวจคำตอบที่ AI สร้าง?',
      back: 'AI อาจตีความผิดหรือสร้างข้อมูลที่ไม่ตรงกับเอกสาร จึงควรตรวจเทียบต้นฉบับก่อนบันทึก',
    },
    {
      front: 'แฟลชการ์ดที่ดีควรถามกี่ประเด็น?',
      back: 'หนึ่งประเด็นต่อใบ เพื่อให้ตอบและประเมินความจำได้ชัดเจน',
    },
    {
      front: 'เมื่อจำคำตอบไม่ได้ ควรทำอย่างไร?',
      back: 'อ่านเฉลยให้เข้าใจ แล้วกลับมาทบทวนอีกในช่วงเวลาที่สั้นลง',
    },
  ],
};
export default function EmptyLibrary({ reload }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useApp();
  async function addSample() {
    setBusy(true);
    try {
      await api('/decks', 'POST', sample);
      notify('เพิ่มชุดตัวอย่างแล้ว');
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
          {busy ? 'กำลังเพิ่มชุดตัวอย่าง…' : 'ลองชุดการ์ดตัวอย่าง'}
        </button>
      </div>
    </Empty>
  );
}
