import SearchField from '../components/SearchField';
import SyncStatus from '../components/SyncStatus';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOverview } from '../hooks/useOverview';
import { PageTitle, Icon, DeckCard, Empty, ErrorPanel } from '../components/UI';
import EmptyLibrary from '../components/EmptyLibrary';
export default function Library() {
  const { decks, loading, error, reload, sync } = useOverview({ includeStats: false });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  if (loading) return <div className="loading">กำลังเปิดคลังการ์ด…</div>;
  if (error) return <ErrorPanel error={error} retry={reload} />;
  const filtered = decks.filter(
    (d) =>
      `${d.name} ${d.description} ${d.category}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (!category || d.category === category),
  );
  return (
    <>
      <PageTitle
        eyebrow="YOUR PERSONAL KNOWLEDGE LIBRARY"
        title="ชุดการ์ดของฉัน"
        subtitle="เก็บทุกเรื่องที่อยากจำ ไว้ในที่เดียว"
      >
        <Link to="/create" className="btn">
          <Icon name="plus" />
          สร้างชุดการ์ด
        </Link>
        <Link to="/archive" className="btn secondary">
          จัดเก็บการ์ดที่เรียนจบ
        </Link>
      </PageTitle>
      <SyncStatus sync={sync} />
      <section className="library-start">
        <h2>เริ่มชุดแรกแบบไหนดี?</h2>
        <div className="start-options">
          <Link to="/create" className="start-option">
            <Icon name="upload" />
            <h3>จากไฟล์หรือโน้ต</h3>
            <p>อัปโหลด PDF, PPTX หรือวางข้อความ แล้วเปลี่ยนเป็นการ์ด</p>
            <strong>เริ่มสร้าง →</strong>
          </Link>
          <Link to="/create" className="start-option">
            <Icon name="notes" />
            <h3>พิมพ์คำถามเอง</h3>
            <p>เขียนคำถามและคำตอบที่อยากจำด้วยตัวเอง</p>
            <strong>เริ่มเขียน →</strong>
          </Link>
          <Link to="/review" className="start-option">
            <Icon name="review" />
            <h3>ลองทบทวน</h3>
            <p>กลับไปฝึกความจำจากชุดการ์ดที่บันทึกไว้</p>
            <strong>เริ่มทบทวน →</strong>
          </Link>
        </div>
      </section>
      <div className="toolbar">
        <SearchField
          label="ค้นหาชุดการ์ด"
          value={query}
          onChange={setQuery}
          placeholder="ค้นหาชุดการ์ดหรือหัวข้อ…"
        />
        <select
          aria-label="หมวดหมู่"
          style={{ width: 'auto' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">ทุกหมวดหมู่</option>
          {[...new Set(decks.map((d) => d.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {(query || category) && (
          <button
            className="btn secondary"
            onClick={() => {
              setQuery('');
              setCategory('');
            }}
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>
      <p className="small muted" role="status">
        {filtered.length} จาก {decks.length} ชุดการ์ด
      </p>
      <div className="deck-grid">
        {filtered.length ? (
          filtered.map((d) => <DeckCard deck={d} key={d.id} />)
        ) : decks.length ? (
          <Empty title="ไม่พบชุดการ์ดที่ค้นหา">
            <p>ลองใช้คำสั้น ๆ หรือกด “ล้างตัวกรอง” ด้านบนเพื่อดูทุกชุด</p>
          </Empty>
        ) : (
          <EmptyLibrary reload={reload} />
        )}
      </div>
    </>
  );
}
