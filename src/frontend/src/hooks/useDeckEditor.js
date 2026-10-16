import { useRemoteSync } from './useRemoteSync';
import { useRetryableSave } from './useRetryableSave';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';
import { useUnsavedChanges } from './useUnsavedChanges';

const draftCard = (card) => ({ ...card, draftKey: crypto.randomUUID() });
const newDeck = () => ({
  name: '',
  category: 'ทั่วไป',
  description: '',
  color: 'purple',
  cards: [],
});
export function useDeckEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ai, notify, confirm } = useApp();
  const [deck, setDeck] = useState(newDeck);
  const [conflict, setConflict] = useState(false);
  const [actionError, setActionError] = useState('');
  const [progress, setProgress] = useState('');
  const [removedCards, setRemovedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [mode, setMode] = useState('local');
  const [count, setCount] = useState(10);
  const [language, setLanguage] = useState('Thai');
  const [ocrPages, setOcrPages] = useState([]);
  const [reviewed, setReviewed] = useState(false);
  const [sourceType, setSourceType] = useState('text');
  const [dragging, setDragging] = useState(false);
  const dirty = useRef(false);
  const cardsSection = useRef(null);
  const inFlight = useRef(false);
  const originalCards = useRef([]);
  useUnsavedChanges(dirty);
  const mutation = useRetryableSave(id || 'new-deck');
  useEffect(() => {
    dirty.current = false;
    setActionError('');
    setConflict(false);
    setRemovedCards([]);
    setOcrPages([]);
    setReviewed(false);
    setSourceType('text');
    setFileName('');
    setSelectedCard('');
    setDeck(newDeck());
    originalCards.current = [];
    setSource('');
  }, [id]);
  const sync = useRemoteSync({
    resource: `deck:${id}`,
    enabled: Boolean(id),
    blocked: () => dirty.current || inFlight.current || mutation.uncertain,
    load: (signal) => api(`/decks/${id}`, 'GET', undefined, signal),
    apply: (value) => {
      originalCards.current = value.cards;
      setDeck({ ...value, cards: value.cards.map(draftCard) });
      dirty.current = false;
      setRemovedCards([]);
      setSelectedCard('');
      setActionError('');
      setConflict(false);
    },
  });
  const loading = id && sync.loading;
  const locked = busy || mutation.uncertain || sync.refreshing;
  async function reload() {
    if (
      dirty.current &&
      !(await confirm(
        'ดึงข้อมูลล่าสุดและแทนที่ร่าง?',
        'ร่างที่ยังไม่บันทึกจะถูกแทนที่เมื่อดึงข้อมูลสำเร็จ กรุณาคัดลอกข้อความที่ต้องการเก็บก่อน',
      ))
    )
      return;
    sync.reload(true);
  }
  function change(key, value) {
    dirty.current = true;
    setDeck((d) => ({ ...d, [key]: value }));
  }
  async function run(action) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setActionError('');
    setConflict(false);
    try {
      await action();
    } catch (e) {
      setConflict(e.status === 409);
      setActionError(e.message);
      notify(e.message);
    } finally {
      inFlight.current = false;
      setBusy(false);
      setProgress('');
    }
  }
  async function readFile(file) {
    if (!file || locked) return;
    await run(async () => {
      if (!/\.(pdf|pptx|txt|md)$/i.test(file.name))
        throw Error('รูปแบบไฟล์ไม่รองรับ กรุณาเลือก PDF, PPTX, TXT หรือ MD');
      if (!file.size) throw Error('ไฟล์ว่าง กรุณาเลือกไฟล์ที่มีข้อความ');
      if (file.size > 20 * 1024 * 1024) throw Error('ไฟล์ต้องมีขนาดไม่เกิน 20 MB');
      setProgress('กำลังอ่านเอกสาร หากต้องอ่านจากภาพอาจใช้เวลา 1–3 นาที…');
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(Error('อ่านไฟล์ไม่สำเร็จ'));
        reader.readAsDataURL(file);
      });
      try {
        const result = await api('/extract', 'POST', { name: file.name, content });
        if (typeof result?.text !== 'string' || !result.text.trim())
          throw Error('เซิร์ฟเวอร์ส่งข้อความจากไฟล์ไม่ครบ กรุณาลองอัปโหลดอีกครั้ง');
        setOcrPages(result.requiresReview ? result.ocrPages || [1] : []);
        setReviewed(false);
        setSource(result.text);
        setFileName(file.name);
        dirty.current = true;
        setDeck((d) => ({ ...d, name: d.name || file.name.replace(/\.[^.]+$/, '') }));
        notify(
          result.requiresReview
            ? 'อ่านจากภาพแล้ว กรุณาตรวจและยืนยันข้อความก่อนสร้างการ์ด'
            : 'อ่านข้อความแล้ว พร้อมสร้างการ์ด',
        );
      } catch (e) {
        throw Error(`${e.message} — เลือกไฟล์ใหม่หรือวางข้อความแทน เนื้อหาเดิมยังอยู่`, { cause: e });
      }
    });
  }
  async function generateCards() {
    await run(async () => {
      if (ocrPages.length && !reviewed)
        throw Error('กรุณาตรวจและยืนยันข้อความที่อ่านจากภาพก่อนสร้างการ์ด');
      if (deck.cards.length >= 500)
        throw Error('ชุดการ์ดมีได้ไม่เกิน 500 ใบ กรุณาลบการ์ดก่อนสร้างเพิ่ม');
      if (source.trim().length < 5) throw Error('กรุณาเลือกไฟล์หรือวางข้อความอย่างน้อย 5 ตัวอักษร');
      setProgress(
        mode === 'ai'
          ? 'AI กำลังสร้างคำถามและคำตอบ อาจใช้เวลาสักครู่…'
          : 'กำลังสร้างการ์ดจากข้อความ…',
      );
      const result = await api('/generate', 'POST', {
        text: source,
        count: Math.min(count, 500 - deck.cards.length),
        mode,
        language,
        ...(mode === 'ai' ? { level } : {}),
      });
      change('cards', [...deck.cards, ...result.cards.map(draftCard)]);
      notify(`เพิ่ม ${result.cards.length} การ์ดแล้ว กรุณาตรวจและแก้ไขก่อนบันทึก`);
      cardsSection.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  async function save() {
    await run(async () => {
      if (!deck.name.trim()) throw Error('กรุณาตั้งชื่อชุดการ์ด');
      if (!deck.cards.length) throw Error('กรุณาเพิ่มการ์ดอย่างน้อย 1 ใบก่อนบันทึก');
      const invalidIndex = deck.cards.findIndex((c) => !c.front.trim() || !c.back.trim());
      if (invalidIndex !== -1) {
        setSelectedCard(deck.cards[invalidIndex].draftKey);
        cardsSection.current?.scrollIntoView({ behavior: 'smooth' });
        throw Error(`กรุณากรอกคำถามและคำตอบของการ์ดใบที่ ${invalidIndex + 1} ให้ครบ`);
      }
      const shared = deck.cards.filter(
        (card) =>
          card.courses?.length &&
          originalCards.current.some(
            (old) => old.id === card.id && (old.front !== card.front || old.back !== card.back),
          ),
      );
      if (
        shared.length &&
        !(await confirm(
          'บันทึกการแก้ไขต้นฉบับ?',
          `การเปลี่ยนแปลงมีผลกับรายวิชา: ${[...new Set(shared.flatMap((card) => card.courses.map((course) => course.name)))].join(', ')}`,
        ))
      )
        return;
      dirty.current = true;
      await mutation.save(`/decks${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', {
        ...deck,
        cards: deck.cards.map(({ id, front, back }) => ({ id, front, back })),
        category: deck.category.trim() || 'ทั่วไป',
      });
      dirty.current = false;
      notify('บันทึกชุดการ์ดเรียบร้อย');
      navigate('/decks');
    });
  }
  function removeCard(index) {
    if (deck.cards[index].courses?.length) {
      setActionError('นำการ์ดออกจากรายวิชาที่เชื่อมทั้งหมดก่อนลบต้นฉบับ');
      return;
    }
    setSelectedCard('');
    setRemovedCards((items) => [...items, { card: deck.cards[index], index }]);
    change(
      'cards',
      deck.cards.filter((_, i) => i !== index),
    );
  }
  function undoRemove() {
    const removed = removedCards.at(-1);
    if (!removed || deck.cards.length >= 500) return;
    const cards = [...deck.cards];
    cards.splice(removed.index, 0, removed.card);
    setSelectedCard('');
    change('cards', cards);
    setRemovedCards((items) => items.slice(0, -1));
  }
  async function remove() {
    const courses = [
      ...new Set(
        originalCards.current.flatMap((card) => (card.courses || []).map((course) => course.name)),
      ),
    ];
    if (courses.length) {
      setActionError(`นำการ์ดออกจากรายวิชาที่เชื่อมก่อนลบชุดต้นฉบับ: ${courses.join(', ')}`);
      return;
    }
    if (await confirm('ลบชุดการ์ดนี้?', 'การ์ดและประวัติการทบทวนของชุดนี้จะถูกลบถาวร'))
      await run(async () => {
        await api(`/decks/${id}`, 'DELETE', { revision: deck.revision });
        dirty.current = false;
        notify('ลบชุดการ์ดแล้ว');
        navigate('/decks');
      });
  }
  function exportDeck() {
    const data = {
      name: deck.name,
      description: deck.description,
      category: deck.category,
      cards: deck.cards.map(({ front, back }) => ({ front, back })),
    };
    const href = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = href;
    a.download = `${deck.name.replace(/[^\p{L}\p{N} _-]/gu, '') || 'flashcards'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  return {
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
  };
}
