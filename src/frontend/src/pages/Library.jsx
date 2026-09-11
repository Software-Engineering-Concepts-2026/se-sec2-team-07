import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOverview } from '../hooks/useOverview';
import { PageTitle, Icon, DeckCard, Empty, ErrorPanel } from '../components/UI';
import EmptyLibrary from '../components/EmptyLibrary';
export default function Library() {
  const { decks, loading, error, reload } = useOverview(); const [query, setQuery] = useState(''); const [category, setCategory] = useState('');
  if (loading) return <div className="loading">กำลังเปิดคลังการ์ด…</div>;
  if (error) return <ErrorPanel error={error} retry={reload} />;
  const filtered = decks.filter(d => `${d.name} ${d.description} ${d.category}`.toLowerCase().includes(query.toLowerCase()) && (!category || d.category === category));
  return <><PageTitle eyebrow="YOUR PERSONAL KNOWLEDGE LIBRARY" title="ชุดการ์ดของฉัน" subtitle="เก็บทุกเรื่องที่อยากจำ ไว้ในที่เดียว"><Link to="/create" className="btn"><Icon name="plus" />สร้างชุดการ์ด</Link></PageTitle><div className="toolbar"><input className="search" aria-label="ค้นหาชุดการ์ด" value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาชุดการ์ดหรือหัวข้อ…" /><select aria-label="หมวดหมู่" style={{ width: 'auto' }} value={category} onChange={e => setCategory(e.target.value)}><option value="">ทุกหมวดหมู่</option>{[...new Set(decks.map(d => d.category))].map(c => <option key={c}>{c}</option>)}</select></div><div className="deck-grid">{filtered.length ? filtered.map(d => <DeckCard deck={d} key={d.id} />) : decks.length ? <Empty title="ไม่พบชุดการ์ดที่ค้นหา"><p>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p></Empty> : <EmptyLibrary reload={reload} />}</div></>;
}
