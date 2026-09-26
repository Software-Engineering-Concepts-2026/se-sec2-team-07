import { z } from 'zod';
import { HttpError } from '../../shared/errors.js';

export const exportSchema = z.object({
  deck_ids: z.array(z.number().int().positive().max(2147483647)).min(1).max(20).refine(ids => new Set(ids).size === ids.length),
  include_cards: z.boolean(), include_learning: z.boolean(), format: z.enum(['html', 'json']),
}).strict().refine(input => input.include_cards || input.include_learning);

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function createExport(snapshot, input, now = new Date()) {
  const portfolio = {
    title: 'Focus Flashcards — ผลงานการเรียนรู้', generated_at: now.toISOString(), learner: snapshot.name,
    learning_note: input.include_learning ? 'สถิติจากการทบทวนการ์ดที่ยังอยู่ในชุด ณ เวลาส่งออก ความแม่นยำเป็นการประเมินตนเอง (จำได้ + ง่าย) / จำนวนครั้ง ไม่ใช่คะแนนสอบ' : undefined,
    decks: snapshot.decks.map(deck => {
      const result = { name: deck.name, category: deck.category, description: deck.description };
      if (input.include_cards) result.cards = snapshot.cards.filter(card => card.deck_id === deck.id).map(({ front, back }) => ({ front, back }));
      if (input.include_learning) {
        const row = snapshot.learning.find(entry => entry.deck_id === deck.id) || { attempts: 0, total_cards: 0, reviewed_cards: 0, seconds: 0, again: 0, hard: 0, good: 0, easy: 0 };
        result.learning = { attempts: row.attempts, total_cards: row.total_cards, reviewed_cards: row.reviewed_cards, seconds: row.seconds,
          distribution: { again: row.again, hard: row.hard, good: row.good, easy: row.easy },
          accuracy: row.attempts ? Math.round(100 * (row.good + row.easy) / row.attempts) : null };
      }
      return result;
    }),
  };
  const content = input.format === 'json' ? JSON.stringify(portfolio, null, 2) : renderHtml(portfolio);
  if (Buffer.byteLength(content, 'utf8') > 5 * 1024 * 1024) throw new HttpError(413, 'ไฟล์ส่งออกใหญ่เกิน 5 MB กรุณาลดจำนวนชุดการ์ด');
  return { filename: `focus-portfolio-${now.toISOString().slice(0, 10)}.${input.format}`,
    mime_type: input.format === 'html' ? 'text/html;charset=utf-8' : 'application/json;charset=utf-8', content };
}

function renderHtml(data) {
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(data.title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:#26213d;line-height:1.7}h1,h2{line-height:1.3}h2{border-bottom:2px solid #ddd4f4;padding-bottom:12px}section{margin-top:36px}.text{white-space:pre-wrap;overflow-wrap:anywhere}article{border:1px solid #ddd4f4;border-radius:12px;padding:18px;margin:16px 0;break-inside:avoid}dt{font-weight:bold}dd{margin:0 0 16px}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:8px;border-bottom:1px solid #ddd}small{color:#514962}@media print{body{margin:0;max-width:none}article{break-inside:auto}}</style></head><body>
<header><h1>${escape(data.title)}</h1><p class="text">ผู้เรียน: ${escape(data.learner)}</p><p>ส่งออกเมื่อ: ${escape(data.generated_at)} (UTC)</p>${data.learning_note ? `<small>${escape(data.learning_note)}</small>` : ''}</header>
${data.decks.map(deck => `<section><h2 class="text">${escape(deck.name)}</h2><p class="text">หมวดหมู่: ${escape(deck.category)}</p><p class="text">${escape(deck.description)}</p>
${deck.learning ? `<h3>ผลการทบทวน</h3><table><tbody>${[
    ['การ์ดทั้งหมด (ใบ)', deck.learning.total_cards], ['การ์ดที่เคยทบทวนไม่ซ้ำ (ใบ)', deck.learning.reviewed_cards],
    ['การทบทวน (ครั้ง)', deck.learning.attempts], ['เวลาที่บันทึก (วินาที)', deck.learning.seconds],
    ['ความแม่นยำจากการประเมินตนเอง', deck.learning.accuracy === null ? 'ยังไม่มีข้อมูล' : `${deck.learning.accuracy}%`],
    ['จำไม่ได้ (ครั้ง)', deck.learning.distribution.again], ['ยาก (ครั้ง)', deck.learning.distribution.hard], ['จำได้ (ครั้ง)', deck.learning.distribution.good], ['ง่าย (ครั้ง)', deck.learning.distribution.easy],
  ].map(([label, value]) => `<tr><th scope="row">${escape(label)}</th><td>${escape(value)}</td></tr>`).join('')}</tbody></table>` : ''}
${deck.cards ? `<h3>แฟลชการ์ด (${deck.cards.length} ใบ)</h3>${deck.cards.map((card, i) => `<article><h4>การ์ด ${i + 1}</h4><dl><dt>คำถาม</dt><dd class="text">${escape(card.front)}</dd><dt>คำตอบ</dt><dd class="text">${escape(card.back)}</dd></dl></article>`).join('')}` : ''}</section>`).join('')}
</body></html>`;
}
