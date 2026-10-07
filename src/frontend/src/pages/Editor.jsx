import { Link } from 'react-router-dom';
import SyncStatus from '../components/SyncStatus';
import { Icon, PageTitle, Empty, ErrorPanel } from '../components/UI';
import { useDeckEditor } from '../hooks/useDeckEditor';
export default function Editor() {
  const {
    draftCard,
    id,
    ai,
    deck,
    conflict,
    actionError,
    progress,
    removedCards,
    selectedCard,
    setSelectedCard,
    busy,
    source,
    setSource,
    fileName,
    level,
    setLevel,
    mode,
    setMode,
    count,
    setCount,
    language,
    setLanguage,
    ocrPages,
    reviewed,
    setReviewed,
    sourceType,
    setSourceType,
    dragging,
    setDragging,
    dirty,
    cardsSection,
    mutation,
    sync,
    loading,
    locked,
    reload,
    change,
    readFile,
    generateCards,
    save,
    removeCard,
    undoRemove,
    remove,
    exportDeck,
  } = useDeckEditor();
  if (loading) return <div className="loading">กำลังเปิดชุดการ์ด…</div>;
  if (id && !deck.id && sync.error) return <ErrorPanel error={sync.error} retry={sync.reload} />;
  return (
    <>
      <PageTitle
        eyebrow={id ? 'ชุดการ์ดของคุณ' : 'เริ่มทบทวนทีละนิด'}
        title={id ? 'แก้ไขชุดการ์ด' : 'สร้างชุดการ์ดใหม่'}
        subtitle={
          id ? 'แก้ไขการ์ด แล้วบันทึกเมื่อพร้อม' : 'ใส่เนื้อหา ตรวจการ์ด แล้วบันทึกไว้ทบทวน'
        }
      >
        <Link className="btn secondary" to="/decks">
          กลับไปคลังการ์ด
        </Link>
      </PageTitle>
      {id && (
        <SyncStatus
          sync={sync}
          recoveryError={conflict ? actionError : undefined}
          paused={dirty.current}
          reload={reload}
          disabled={busy || mutation.uncertain}
        />
      )}
      {actionError && (
        <p className="error" role="alert">
          {actionError}
        </p>
      )}
      <div className={`editor-layout editor-workspace ${!id ? 'creation-simple' : ''}`}>
        <div className="stack">
          {!id && (
            <section className="panel stack source-panel">
              <div>
                <span className="editor-step">ขั้นตอนที่ 1</span>
                <h2>เริ่มจากเนื้อหาของคุณ</h2>
                <p className="small muted">เลือกเพียงวิธีเดียวเพื่อเริ่มต้น ไม่ต้องกรอกทุกช่อง</p>
              </div>
              <div className="source-choices" aria-label="วิธีเพิ่มเนื้อหา">
                {[
                  ['text', 'notes', 'วางข้อความ', 'คัดลอกจากโน้ต'],
                  ['file', 'upload', 'อัปโหลดไฟล์', 'PDF หรือสไลด์'],
                  ['manual', 'plus', 'เขียนเอง', 'เพิ่มคำถาม–คำตอบ'],
                ].map(([value, icon, title, detail]) => (
                  <button
                    key={value}
                    className={sourceType === value ? 'source-choice active' : 'source-choice'}
                    aria-pressed={sourceType === value}
                    disabled={locked}
                    onClick={() => setSourceType(value)}
                  >
                    <Icon name={icon} />
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </button>
                ))}
              </div>
              <div hidden={sourceType !== 'file'} className="stack">
                <label
                  className={`dropzone ${dragging ? 'drag' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    readFile(e.dataTransfer.files[0]);
                  }}
                >
                  <Icon name="upload" />
                  <strong>{fileName || 'เลือกไฟล์ หรือลากมาวางที่นี่'}</strong>
                  <small>PDF, PPTX, TXT, MD · ไม่เกิน 20 MB</small>
                  <input
                    type="file"
                    aria-label="อัปโหลดเอกสาร"
                    accept=".pdf,.pptx,.txt,.md"
                    disabled={locked}
                    onChange={(e) => {
                      readFile(e.target.files[0]);
                      e.target.value = '';
                    }}
                    className="upload-input"
                  />
                </label>
                <p className="small muted">
                  PDF ไม่เกิน 100 หน้า · อ่านภาพสแกนและข้อความเสียด้วย OCR ได้ไม่เกิน 10 หน้าต่อไฟล์
                  · ภาษาไทยและอังกฤษ
                </p>
              </div>
              {progress && (
                <p className="notice" role="status" aria-live="polite">
                  {progress}
                </p>
              )}
              <div
                hidden={sourceType === 'manual' || (sourceType === 'file' && !source)}
                className="source-text stack"
              >
                <label className="field">
                  {sourceType === 'file' ? 'ตรวจข้อความจากไฟล์' : 'วางเนื้อหาที่ต้องการจำ'}
                  <textarea
                    aria-label="หรือวางข้อความจากโน้ต"
                    rows={6}
                    maxLength={60000}
                    disabled={locked}
                    value={source}
                    onChange={(e) => {
                      dirty.current = true;
                      setSource(e.target.value);
                      setReviewed(false);
                    }}
                    placeholder={
                      'วางโน้ต สรุปบทเรียน หรือคำศัพท์ที่ต้องการทำเป็นการ์ดที่นี่\n\nตัวอย่างคำศัพท์\napple: แอปเปิล\nbeautiful: สวยงาม'
                    }
                  />
                </label>
                <p className="small muted">
                  {source.length.toLocaleString()} / 60,000 ตัวอักษร · ตรวจข้อความก่อนสร้างการ์ด
                </p>
              </div>
              <div hidden={sourceType === 'manual'} className="stack">
                {ocrPages.length > 0 && (
                  <div className="notice" role="status">
                    <strong>ตรวจข้อความที่อ่านจากภาพ</strong>
                    <p>
                      ใช้ OCR ในหน้า {ocrPages.join(', ')} กรุณาตรวจสระ วรรณยุกต์ คำอ่าน IPA
                      และลำดับตารางให้ถูกต้อง แก้ไขข้อความด้านบนได้ก่อนสร้างการ์ด
                    </p>
                    <label className="ocr-review-check">
                      <input
                        type="checkbox"
                        checked={reviewed}
                        disabled={locked}
                        onChange={(e) => setReviewed(e.target.checked)}
                      />
                      <span>ฉันตรวจและแก้ไขข้อความแล้ว</span>
                    </label>
                  </div>
                )}
                <details className="creation-settings">
                  <summary>
                    ตัวเลือกการสร้าง · {mode === 'ai' ? 'AI' : 'แยกข้อความ'} · สูงสุด {count} ใบ
                  </summary>
                  <div className="form-grid">
                    <label className="field">
                      วิธีสร้าง
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        disabled={locked}
                      >
                        <option value="local">แยกข้อความ (ไม่ใช้ AI)</option>
                        <option value="ai" disabled={!ai}>
                          AI {ai ? '' : '— ยังไม่ได้ตั้งค่า'}
                        </option>
                      </select>
                    </label>
                    <label className="field">
                      จำนวนการ์ดสูงสุด
                      <select
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        disabled={locked}
                      >
                        {[5, 10, 20, 30].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {mode === 'ai' && (
                    <details className="generation-options">
                      <summary>ปรับระดับความรู้และภาษา</summary>
                      <div className="stack">
                        <label className="field">
                          ระดับความรู้
                          <select
                            aria-label="ระดับความรู้"
                            value={level}
                            disabled={locked}
                            onChange={(e) => setLevel(e.target.value)}
                          >
                            <option value="beginner">เริ่มต้น</option>
                            <option value="intermediate">กลาง</option>
                            <option value="advanced">สูง</option>
                          </select>
                        </label>
                        <label className="field">
                          ภาษาของการ์ด AI
                          <select
                            value={language}
                            disabled={locked}
                            onChange={(e) => setLanguage(e.target.value)}
                          >
                            <option value="Thai">ไทย</option>
                            <option value="English">English</option>
                            <option value="Japanese">日本語</option>
                          </select>
                        </label>
                      </div>
                    </details>
                  )}
                </details>
                <div className="notice">
                  {mode === 'ai'
                    ? 'เมื่อกดสร้าง เนื้อหานี้จะถูกส่งไปยังผู้ให้บริการ AI ที่ระบบตั้งค่าไว้ เพื่อสร้างคำถาม–คำตอบ กรุณาตรวจเนื้อหาก่อนบันทึก'
                    : 'โหมดแยกข้อความใช้รูปแบบ “คำศัพท์: ความหมาย” หรือสร้างช่องว่างจากประโยค ไม่ได้วิเคราะห์ด้วย AI กรุณาตรวจการ์ดก่อนบันทึก'}
                </div>
                <button
                  className="btn generate-action"
                  disabled={
                    locked ||
                    (ocrPages.length > 0 && !reviewed) ||
                    source.trim().length < 5 ||
                    deck.cards.length >= 500
                  }
                  onClick={generateCards}
                >
                  {busy ? 'กำลังดำเนินการ…' : '✧ สร้างการ์ดจากเนื้อหา'}
                </button>
                {source.trim().length < 5 && (
                  <small className="muted">เพิ่มเนื้อหาอย่างน้อย 5 ตัวอักษรเพื่อเริ่มสร้าง</small>
                )}
              </div>
              {sourceType === 'manual' && (
                <div className="manual-hint">
                  <Icon name="notes" />
                  <div>
                    <strong>เริ่มจากคำถามหนึ่งข้อ</strong>
                    <p>กด “เพิ่มเอง” ด้านล่าง แล้วใส่คำถามและคำตอบได้เลย</p>
                  </div>
                </div>
              )}
            </section>
          )}
          <section
            hidden={!id && !deck.cards.length && sourceType !== 'manual'}
            className="stack creation-review"
          >
            <div className="section-heading row between card-review-heading" ref={cardsSection}>
              <h2>
                {id ? '' : '2. '}ตรวจและแก้ไขการ์ด{' '}
                <span className="small muted">({deck.cards.length} ใบ)</span>
              </h2>
              <button
                className="btn secondary"
                disabled={locked || deck.cards.length >= 500}
                onClick={() => {
                  setSelectedCard('');
                  change('cards', [...deck.cards, draftCard({ front: '', back: '' })]);
                }}
              >
                <Icon name="plus" />
                เพิ่มเอง
              </button>
            </div>
            <p className="notice">การแก้ไขและการลบจะมีผลเมื่อกดบันทึกชุดการ์ดเท่านั้น</p>
            {id && deck.cards.length > 0 && (
              <section className="panel stack" aria-label="เลือกการ์ดเพื่อแก้ไข">
                <label className="field">
                  เลือกการ์ดที่ต้องการแก้ไข
                  <select
                    value={selectedCard}
                    disabled={locked}
                    onChange={(e) => setSelectedCard(e.target.value)}
                  >
                    <option value="">แสดงการ์ดทั้งหมด ({deck.cards.length} ใบ)</option>
                    {deck.cards.map((card, index) => (
                      <option key={card.draftKey} value={card.draftKey}>
                        การ์ด {index + 1}: {card.front.trim().slice(0, 80) || 'ยังไม่มีคำถาม'}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="small muted">
                  สลับการ์ดได้โดยร่างที่แก้ไขยังอยู่ ปุ่มบันทึกชุดการ์ดจะบันทึกการเปลี่ยนแปลงทุกใบ
                  รวมใบที่ไม่ได้แสดง
                </p>
              </section>
            )}
            {removedCards.length > 0 && (
              <div className="notice" role="status">
                ลบการ์ดออกจากร่างแล้ว {removedCards.length} ใบ{' '}
                <button
                  className="btn secondary"
                  disabled={locked || deck.cards.length >= 500}
                  onClick={undoRemove}
                >
                  คืนการ์ดที่ลบล่าสุด
                </button>
              </div>
            )}
            <div className="stack">
              {deck.cards.length ? (
                deck.cards.map(
                  (card, index) =>
                    (!id || !selectedCard || selectedCard === card.draftKey) && (
                      <article className="draft-card" key={card.draftKey}>
                        <div className="row between">
                          <span className="draft-number">
                            CARD {String(index + 1).padStart(2, '0')}
                          </span>
                          <button
                            className="icon-btn"
                            disabled={locked}
                            aria-label={`ลบการ์ด ${index + 1}`}
                            onClick={() => removeCard(index)}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                        {card.archived_at && (
                          <p className="notice">
                            เรียนจบแล้ว · ไม่อยู่ในคิวทบทวน{' '}
                            <Link to="/archive?status=completed">จัดการการ์ดที่จัดเก็บ</Link>
                          </p>
                        )}
                        {card.courses?.length > 0 && (
                          <p className="notice">
                            ใช้ในรายวิชา:{' '}
                            {card.courses.map((course, i) => (
                              <span key={course.id}>
                                {i > 0 && ', '}
                                <Link to={`/courses/${course.id}`}>{course.name}</Link>
                              </span>
                            ))}{' '}
                            — การแก้ไขมีผลกับทุกวิชาที่เชื่อม
                          </p>
                        )}
                        {[
                          ['front', 'ด้านหน้า · คำถาม', 2000],
                          ['back', 'ด้านหลัง · คำตอบ', 8000],
                        ].map(([side, label, max]) => (
                          <label className="field" key={side}>
                            {label}
                            <textarea
                              aria-label={label}
                              value={card[side]}
                              maxLength={max}
                              disabled={locked}
                              onChange={(e) =>
                                change(
                                  'cards',
                                  deck.cards.map((c, i) =>
                                    i === index ? { ...c, [side]: e.target.value } : c,
                                  ),
                                )
                              }
                            />
                          </label>
                        ))}
                      </article>
                    ),
                )
              ) : (
                <Empty title="การ์ดของคุณจะแสดงที่นี่">
                  <p>สร้างจากเนื้อหาด้านบน หรือกด “เพิ่มเอง”</p>
                </Empty>
              )}
            </div>
          </section>
        </div>
        <aside hidden={!id && !deck.cards.length} className="panel stack sticky deck-summary">
          <div>
            <span className="editor-step">{id ? 'ชุดการ์ดของคุณ' : 'ขั้นตอนที่ 3'}</span>
            <h2>ตั้งชื่อและบันทึก</h2>
            <p className="small muted">{deck.cards.length} ใบในชุดนี้ · ตรวจคำตอบก่อนบันทึก</p>
          </div>
          <label className="field">
            ชื่อชุดการ์ด
            <input
              value={deck.name}
              maxLength={120}
              disabled={locked}
              onChange={(e) => change('name', e.target.value)}
              placeholder="เช่น Data Structures บทที่ 1"
            />
          </label>
          <details className="deck-options" open={id ? true : undefined}>
            <summary>
              รายละเอียดเพิ่มเติม <span className="muted">(ไม่บังคับ)</span>
            </summary>
            <div className="stack">
              <label className="field">
                หมวดหมู่ / แท็ก
                <input
                  value={deck.category}
                  maxLength={60}
                  disabled={locked}
                  onChange={(e) => change('category', e.target.value)}
                />
              </label>
              <label className="field">
                คำอธิบาย
                <textarea
                  aria-label="คำอธิบาย"
                  value={deck.description}
                  maxLength={1000}
                  disabled={locked}
                  onChange={(e) => change('description', e.target.value)}
                  placeholder="ชุดการ์ดนี้เกี่ยวกับอะไร"
                />
              </label>
              <label className="field">
                สีประจำชุด
                <select
                  value={deck.color}
                  disabled={locked}
                  onChange={(e) => change('color', e.target.value)}
                >
                  {[
                    ['purple', 'ม่วงลาเวนเดอร์'],
                    ['blue', 'ฟ้า'],
                    ['green', 'เขียวเซจ'],
                    ['orange', 'ส้มพีช'],
                  ].map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
          <p className="small muted">บันทึกแล้วจะกลับไปที่คลังการ์ด เพื่อเริ่มทบทวนได้ทันที</p>
          <button className="btn" disabled={busy || sync.refreshing} onClick={save}>
            <Icon name="check" />
            บันทึกชุดการ์ด
          </button>
          {id && (
            <>
              <button className="btn secondary" disabled={locked} onClick={exportDeck}>
                ดาวน์โหลดชุดการ์ด JSON
              </button>
              <button className="btn danger" disabled={locked} onClick={remove}>
                ลบชุดการ์ด
              </button>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
