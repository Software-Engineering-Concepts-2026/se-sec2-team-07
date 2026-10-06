import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';

import { ratings } from '../components/review/ratings';
export function useReviewSession() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const course = params.get('course');
  const { notify } = useApp();
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [remaining, setRemaining] = useState(600);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(null);
  const saving = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const elapsed = useRef(0);
  const pending = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setCards(null);
    setError('');
    setIndex(0);
    setAnswers([]);
    setFinished(false);
    setRemaining(600);
    setFlipped(false);
    setPaused(false);
    setPlan(null);
    elapsed.current = 0;
    pending.current = null;
    requestId.current = crypto.randomUUID();
    api(
      `/review${course ? `?course=${encodeURIComponent(course)}` : id ? `?deck=${id}` : ''}`,
      'GET',
      undefined,
      controller.signal,
    )
      .then((r) => {
        setCards(r.cards);
        setPlan(r);
        setRemaining(r.remaining_seconds);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [id, course]);
  useEffect(() => {
    if (!cards?.length || paused || finished || busy) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const delta = (now - last) / 1000;
      last = now;
      elapsed.current += delta;
      setRemaining((value) => Math.max(0, value - delta));
    }, 250);
    return () => clearInterval(timer);
  }, [cards, paused, finished, busy]);
  useEffect(() => {
    if (remaining === 0 && !busy) setFinished(true);
  }, [remaining, busy]);
  async function rate(rating) {
    if (saving.current || !flipped || finished || paused || remaining <= 0) return;
    saving.current = true;
    setBusy(true);
    const body = pending.current || {
      id: requestId.current,
      card_id: cards[index].id,
      rating,
      seconds: Math.min(3600, Math.round(elapsed.current)),
    };
    pending.current = body;
    try {
      const result = await api('/review', 'POST', body);
      if (result.remaining_seconds !== undefined)
        setRemaining((value) => Math.min(value, result.remaining_seconds));
      setAnswers((value) => [...value, body.rating]);
      setFlipped(false);
      setIndex((value) => value + 1);
      pending.current = null;
      requestId.current = crypto.randomUUID();
      elapsed.current = 0;
      if (index + 1 >= cards.length) setFinished(true);
    } catch (e) {
      if (e.status === 409) {
        setError(e.message);
      } else notify(`${e.message} — กดระดับเดิมเพื่อลองบันทึกอีกครั้ง`);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    const handler = (e) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
        !cards?.length ||
        busy ||
        finished ||
        paused
      )
        return;
      if (e.code === 'Space' && document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        setFlipped((v) => !v);
      }
      if (ratings[Number(e.key) - 1]) {
        e.preventDefault();
        rate(ratings[Number(e.key) - 1][0]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return {
    cards,
    error,
    index,
    flipped,
    setFlipped,
    answers,
    remaining,
    paused,
    setPaused,
    finished,
    setFinished,
    busy,
    plan,
    rate,
  };
}
