import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { PageTitle, Empty, ErrorPanel } from '../components/UI';
import CourseLinks from '../components/CourseLinks';

export default function CourseDetail() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { confirm, notify } = useApp();
  const [course, setCourse] = useState(null),
    [name, setName] = useState(''),
    [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(''),
    [kind, setKind] = useState('cards'),
    [version, setVersion] = useState(0);
  const [page, setPage] = useState(0);
  const dirty = useRef(false),
    inFlight = useRef(false);
  useUnsavedChanges(dirty);
  dirty.current = Boolean(course && name !== course.name);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setLibrary(null);
    api(`/courses/${id}`, 'GET', undefined, controller.signal)
      .then((data) => {
        setCourse(data);
        setName(data.name);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, version]);
  async function run(action) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setActionError('');
    try {
      await action();
    } catch (e) {
      setActionError(e.message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    const data = await api(`/courses/${id}`);
    setCourse(data);
  }
  async function rename(event) {
    event.preventDefault();
    await run(async () => {
      await api(`/courses/${id}`, 'PUT', { name: name.trim() });
      setCourse((c) => ({ ...c, name: name.trim() }));
      setName(name.trim());
      dirty.current = false;
      notify('บันทึกชื่อรายวิชาแล้ว');
    });
  }
  async function removeCourse() {
    if (
      !(await confirm(
        'ลบรายวิชานี้?',
        'การ์ด โน้ต และประวัติทบทวนยังอยู่ในคลัง จะนำออกเฉพาะรายวิชาและการเชื่อมของวิชานี้',
      ))
    )
      return;
    await run(async () => {
      await api(`/courses/${id}`, 'DELETE', {});
      dirty.current = false;
      notify('ลบรายวิชาแล้ว');
      navigate('/courses');
    });
  }
  async function changeLink(type, itemId, linked) {
    await run(async () => {
      await api(`/courses/${id}/${type}/${itemId}`, linked ? 'DELETE' : 'PUT', {});
      await refresh();
      notify(linked ? 'นำออกจากวิชาแล้ว ต้นฉบับยังอยู่ในคลัง' : 'เชื่อมเนื้อหาแล้ว');
    });
  }
  if (loading) return <p className="loading">กำลังเปิดรายวิชา…</p>;
  if (error) return <ErrorPanel error={error} retry={() => setVersion((v) => v + 1)} />;
  const items = library
    ? library[kind].filter((item) =>
        `${item.front || ''} ${item.back || ''} ${item.title || ''} ${item.body || ''} ${item.deck_name || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : [];
  const decks = library
    ? [
        ...new Map(
          library.cards.map((card) => [card.deck_id, { id: card.deck_id, name: card.deck_name }]),
        ).values(),
      ].filter((deck) => deck.name.toLowerCase().includes(query.toLowerCase()))
    : [];
  return (
    <>
      <PageTitle
        eyebrow="COURSE"
        title={course.name}
        subtitle="เนื้อหาต้นฉบับเดียวกัน ใช้งานข้ามวิชาได้"
      >
        <Link to="/courses" className="btn secondary">
          รายวิชาทั้งหมด
        </Link>
        <Link to={`/review?course=${id}`} className="btn">
          ทบทวนวิชานี้
        </Link>
      </PageTitle>
      <form onSubmit={rename} className="panel toolbar">
        <label htmlFor="rename-course">ชื่อรายวิชา</label>
        <input
          id="rename-course"
          value={name}
          maxLength={120}
          required
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn secondary" disabled={busy || !name.trim() || name === course.name}>
          บันทึกชื่อ
        </button>
        <button type="button" className="btn danger" onClick={removeCourse} disabled={busy}>
          ลบรายวิชา
        </button>
      </form>
      {actionError && <p role="alert">{actionError}</p>}
      <div className="toolbar">
        <button
          className="btn"
          disabled={busy}
          onClick={() =>
            run(async () => {
              setLibrary(await api('/courses/library'));
              setPage(0);
            })
          }
        >
          เพิ่มจากคลัง
        </button>
        <Link className="btn secondary" to="/notes">
          สร้างโน้ตในคลัง
        </Link>
      </div>
      {library && (
        <section className="panel" aria-label="เพิ่มจากคลัง">
          <div className="row between course-library-heading">
            <h2>เพิ่มจากคลัง</h2>
            <button className="btn secondary" disabled={busy} onClick={() => setLibrary(null)}>
              ปิดคลัง
            </button>
          </div>
          <div className="toolbar">
            <div className="toolbar" role="group" aria-label="ประเภทเนื้อหา">
              {['cards', 'notes'].map((type) => (
                <button
                  key={type}
                  className={`btn ${kind === type ? '' : 'secondary'}`}
                  aria-pressed={kind === type}
                  disabled={busy}
                  onClick={() => {
                    setKind(type);
                    setPage(0);
                  }}
                >
                  {type === 'cards' ? 'การ์ด' : 'โน้ต'} ({library[type].length})
                </button>
              ))}
            </div>
            <input
              aria-label="ค้นหาเนื้อหาในคลัง"
              placeholder="ค้นหาเนื้อหา…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="library-picker-grid">
            {kind === 'cards' &&
              decks.map((deck) => {
                const cards = library.cards.filter((card) => card.deck_id === deck.id);
                const linkedCount = cards.filter((card) =>
                  course.cards.some((current) => current.id === card.id),
                ).length;
                return (
                  <article className="shared-content library-picker-item" key={`deck-${deck.id}`}>
                    <div className="library-picker-copy">
                      <small>ชุดการ์ด</small>
                      <h3>{deck.name}</h3>
                      <p>
                        {cards.length} ใบ · เชื่อมแล้ว {linkedCount} ใบ
                      </p>
                    </div>
                    <button
                      className="btn"
                      disabled={busy || linkedCount === cards.length}
                      onClick={() =>
                        run(async () => {
                          await api(`/courses/${id}/decks/${deck.id}`, 'PUT', {});
                          await refresh();
                          notify('เชื่อมชุดการ์ดแล้ว');
                        })
                      }
                    >
                      {linkedCount === cards.length ? 'เชื่อมครบแล้ว' : 'เชื่อมทั้งชุด'}
                    </button>
                  </article>
                );
              })}
          </div>
          {kind === 'cards' && (
            <p className="small muted">
              เชื่อมการ์ดทุกใบที่มีในชุดตอนนี้ รวมการ์ดที่เรียนจบแล้ว หากเพิ่มใบใหม่ภายหลัง
              กดเชื่อมทั้งชุดอีกครั้งได้
            </p>
          )}
          <div className="library-picker-grid">
            {items.length ? (
              items.slice(page * 8, page * 8 + 8).map((item) => {
                const linked = course[kind].some((current) => current.id === item.id);
                return (
                  <article className="shared-content library-picker-item" key={item.id}>
                    <div className="library-picker-copy">
                      <h3>{item.front || item.title}</h3>
                      {item.archived_at && (
                        <p className="small muted">เรียนจบแล้ว · ไม่อยู่ในคิวทบทวน</p>
                      )}
                      <p className="shared-text">{item.back || item.body}</p>
                      {item.deck_name && <small>ชุดการ์ด: {item.deck_name}</small>}
                    </div>
                    <button
                      className="btn secondary"
                      disabled={busy || linked}
                      onClick={() => changeLink(kind, item.id, false)}
                    >
                      {linked ? 'เชื่อมแล้ว' : 'เชื่อมกับวิชานี้'}
                    </button>
                  </article>
                );
              })
            ) : (
              <p>ไม่พบเนื้อหา ลองเปลี่ยนคำค้นหรือสร้างเนื้อหาในคลังก่อน</p>
            )}
          </div>
          {items.length > 8 && (
            <div className="toolbar" aria-label="หน้ารายการในคลัง">
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                ก่อนหน้า
              </button>
              <span role="status">
                หน้า {page + 1} / {Math.ceil(items.length / 8)} · {items.length} รายการ
              </span>
              <button
                className="btn secondary"
                disabled={(page + 1) * 8 >= items.length}
                onClick={() => setPage(page + 1)}
              >
                ถัดไป
              </button>
            </div>
          )}
        </section>
      )}
      {['cards', 'notes'].map((type) => (
        <section className="panel" key={type}>
          <h2>
            {type === 'cards' ? 'การ์ด' : 'โน้ต'} ({course[type].length})
          </h2>
          <p className="small muted">การแก้ต้นฉบับมีผลกับทุกวิชาที่เชื่อม</p>
          {course[type].length ? (
            <div className="course-content-grid">
              {course[type].map((item) => (
                <article className="shared-content course-content-card" key={item.id}>
                  <h3>{item.front || item.title}</h3>
                  {item.archived_at && (
                    <p className="small muted">เรียนจบแล้ว · ไม่อยู่ในคิวทบทวน</p>
                  )}
                  <p className="shared-text">{item.back || item.body}</p>
                  <div className="course-content-details">
                    {item.deck_name && <p className="small muted">ชุดต้นฉบับ: {item.deck_name}</p>}
                    <CourseLinks courses={item.courses} />
                  </div>
                  <div className="toolbar">
                    <Link
                      className="btn secondary"
                      to={type === 'cards' ? `/edit/${item.deck_id}` : `/notes?edit=${item.id}`}
                    >
                      แก้ต้นฉบับ
                    </Link>
                    <button
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => changeLink(type, item.id, true)}
                    >
                      นำออกจากวิชา
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty title={type === 'cards' ? 'ยังไม่มีการ์ดในวิชานี้' : 'ยังไม่มีโน้ตในวิชานี้'}>
              <p>กดเพิ่มจากคลังเพื่อเลือกเนื้อหาเดิม</p>
            </Empty>
          )}
        </section>
      ))}
    </>
  );
}
