import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { useRemoteSync } from '../hooks/useRemoteSync';
import SyncStatus from '../components/SyncStatus';
import { Empty, PageTitle } from '../components/UI';

export default function Archive() {
  const [params, setParams] = useSearchParams();
  const archived = params.get('status') === 'completed';
  const { confirm, notify } = useApp();
  const [result, setResult] = useState({ archived, cards: [] });
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const sync = useRemoteSync({
    resource: `archive:${archived}`,
    blocked: () => inFlight.current,
    load: signal => api(`/cards?archived=${archived}`, 'GET', undefined, signal),
    apply: data => setResult({ archived, cards: data.cards }),
  });
  const cards = result.archived === archived ? result.cards : [];
  const filtered = cards.filter(card => `${card.front} ${card.back} ${card.deck_name}`.toLowerCase().includes(query.toLowerCase()));
  async function change(card) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      if (!archived && !await confirm('จัดเก็บการ์ดที่เรียนจบแล้ว?', 'การ์ดนี้จะออกจากรายการทบทวนทุกวิชาที่เชื่อม เนื้อหาและประวัติยังอยู่ และนำกลับมาทบทวนได้')) return;
      await api(`/cards/${card.id}/archive`, 'PUT', { archived: !archived });
      setResult(value => ({ ...value, cards: value.cards.filter(item => item.id !== card.id) }));
      notify(archived ? 'นำการ์ดกลับมาทบทวนแล้ว ตามเวลารายวันที่เหลือ' : 'จัดเก็บการ์ดที่เรียนจบแล้ว');
    } catch (e) { setError(`${e.message} — ตัวเลือกเดิมยังอยู่ กรุณาลองใหม่หรือดึงข้อมูลล่าสุด`); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function select(value) {
    setError(''); setQuery('');
    setParams(value ? { status: 'completed' } : {});
  }
  return <>
    <PageTitle eyebrow="MAKE ROOM FOR YOUR NEXT CHAPTER" title="จัดเก็บการ์ด" subtitle="เลือกการ์ดที่คุณเรียนจบแล้ว เก็บไว้และนำกลับมาทบทวนได้ทุกเมื่อ"><Link to="/decks" className="btn secondary">กลับไปคลังการ์ด</Link></PageTitle>
    <p className="notice">คุณเป็นผู้ทำเครื่องหมายเรียนจบ ระบบไม่จัดเก็บจากคะแนนหรือจำนวนครั้งโดยอัตโนมัติ ประวัติและการเชื่อมรายวิชายังคงอยู่ เมื่อนำกลับ การ์ดจะพร้อมเข้าคิวตามงบเวลาทบทวนรายวัน</p>
    <div className="toolbar" aria-label="สถานะการ์ด">
      <button className={`btn ${archived ? 'secondary' : ''}`} aria-pressed={!archived} disabled={busy} onClick={() => select(false)}>ยังทบทวนอยู่</button>
      <button className={`btn ${archived ? '' : 'secondary'}`} aria-pressed={archived} disabled={busy} onClick={() => select(true)}>เรียนจบแล้ว</button>
    </div>
    <SyncStatus sync={sync} disabled={busy} />
    <div className="toolbar"><input aria-label="ค้นหาการ์ดเพื่อจัดเก็บ" placeholder="ค้นหาคำถาม คำตอบ หรือชื่อชุดการ์ด…" value={query} onChange={event => setQuery(event.target.value)} /></div>
    {error && <p className="notice" role="alert">{error}</p>}
    {sync.loading ? <p className="loading">กำลังเปิดรายการการ์ด…</p> : <>
      <p className="small muted">{archived ? 'เรียนจบแล้ว' : 'ยังทบทวนอยู่'} · {filtered.length} ใบ</p>
      {filtered.length ? <div className="archive-grid">{filtered.map(card => <article className="panel archive-card" key={card.id}>
        <div className="row between wrap"><Link to={`/edit/${card.deck_id}`}>{card.deck_name}</Link>{card.archived_at && <span className="badge">เรียนจบแล้ว</span>}</div>
        <h2 className="shared-text">{card.front}</h2><p className="shared-text">{card.back}</p>
        {card.archived_at && <p className="small muted">จัดเก็บเมื่อ {new Date(card.archived_at).toLocaleDateString('th-TH')}</p>}
        <button className="btn secondary" disabled={busy || sync.refreshing} onClick={() => change(card)}>{archived ? 'นำกลับมาทบทวน' : 'เรียนจบแล้ว · จัดเก็บ'}</button>
      </article>)}</div> : !sync.error && <Empty title={query ? 'ไม่พบการ์ดที่ค้นหา' : archived ? 'ยังไม่มีการ์ดที่เรียนจบแล้ว' : 'ไม่มีการ์ดที่ยังทบทวนอยู่'}><p>{query ? 'ลองเปลี่ยนคำค้นหา' : archived ? 'เลือกการ์ดจากรายการ “ยังทบทวนอยู่” เพื่อจัดเก็บ' : 'สร้างการ์ดใหม่ หรือนำการ์ดจากรายการ “เรียนจบแล้ว” กลับมา'}</p></Empty>}
    </>}
  </>;
}
