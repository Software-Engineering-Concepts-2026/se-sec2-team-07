import { HttpError } from '../../shared/errors.js';

export function generateLocal(text, count) {
  const lines = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/^[-•]\s*/, ''))
    .filter((s) => s.length >= 5);
  const cards = lines.slice(0, count).map((line) => {
    const match = line.match(/^(.+?)(?:::|:|\s+คือ\s*|\s+หมายถึง\s*|\s+is\s+)(.+)$/);
    if (match)
      return { front: match[1].trim().slice(0, 2000), back: match[2].trim().slice(0, 8000) };
    const words = line.split(/\s+/);
    const split = Math.max(1, Math.floor(words.length >= 5 ? words.length / 4 : line.length / 3));
    const back = words.length >= 5 ? words.slice(0, split).join(' ') : line.slice(0, split);
    const rest = words.length >= 5 ? words.slice(split).join(' ') : line.slice(split);
    return {
      front: ('เติมข้อความที่หายไป: ____ ' + rest).slice(0, 2000),
      back: back.slice(0, 8000),
    };
  });
  if (!cards.length) throw new HttpError(400, 'กรุณาเพิ่มข้อความ เช่น คำศัพท์: ความหมาย');
  return cards;
}
