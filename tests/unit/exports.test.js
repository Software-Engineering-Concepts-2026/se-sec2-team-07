import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExport, exportSchema } from '../../src/backend/modules/exports/service.js';

const input = { deck_ids: [2], include_cards: true, include_learning: true, format: 'json' };
const snapshot = { name: '<img src=x onerror=alert(1)>', decks: [{ id: 2, name: '<script>alert(1)</script>', category: '"&\'', description: 'line 1\nline 2' }],
  cards: [{ deck_id: 2, front: '</dd><script>bad</script>', back: 'หนึ่ง\nสอง & <สาม>' }, { deck_id: 3, front: 'excluded', back: 'excluded' }],
  learning: [{ deck_id: 2, attempts: 3, total_cards: 1, reviewed_cards: 1, seconds: 91, again: 1, hard: 0, good: 1, easy: 1 }] };
const now = new Date('2026-09-26T01:00:00Z');
test('export keeps complete selected text and real learning figures without internal identifiers', () => {
  const result = createExport(snapshot, input, now), data = JSON.parse(result.content);
  assert.equal(result.filename, 'focus-portfolio-2026-09-26.json');
  assert.equal(data.generated_at, now.toISOString());
  assert.deepEqual(data.decks[0].cards, [{ front: snapshot.cards[0].front, back: snapshot.cards[0].back }]);
  assert.deepEqual(data.decks[0].learning, { attempts: 3, total_cards: 1, reviewed_cards: 1, seconds: 91, distribution: { again: 1, hard: 0, good: 1, easy: 1 }, accuracy: 67 });
  assert.equal(result.content.includes('deck_id'), false);
  assert.equal(result.content.includes('excluded'), false);
});
test('HTML escapes all user text and keeps multiline content without active scripts', () => {
  const { content } = createExport(snapshot, { ...input, format: 'html' }, now);
  assert.equal(content.includes('<script>'), false);
  assert.equal(content.includes('<img'), false);
  assert.ok(content.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(content.includes('&quot;&amp;&#39;'));
  assert.ok(content.includes('หนึ่ง\nสอง &amp; &lt;สาม&gt;'));
  assert.ok(content.includes("default-src 'none'"));
});
test('inclusion switches omit content entirely and unreviewed data has null accuracy', () => {
  const data = JSON.parse(createExport({ ...snapshot, learning: [] }, { ...input, include_cards: false }).content);
  assert.equal('cards' in data.decks[0], false);
  assert.equal(data.decks[0].learning.accuracy, null);
  const cards = JSON.parse(createExport(snapshot, { ...input, include_learning: false }).content);
  assert.equal('learning' in cards.decks[0], false);
  assert.equal('learning_note' in cards, false);
});
test('export validation rejects ambiguous selections and oversized output fails rather than truncates', () => {
  for (const patch of [{ deck_ids: [] }, { deck_ids: [2, 2] }, { deck_ids: ['2'] }, { deck_ids: [2147483648] }, { deck_ids: Array.from({ length: 21 }, (_, i) => i + 1) }, { include_cards: false, include_learning: false }, { format: 'pdf' }]) {
    assert.equal(exportSchema.safeParse({ ...input, ...patch }).success, false);
  }
  assert.throws(() => createExport({ ...snapshot, cards: [{ deck_id: 2, front: '&'.repeat(1100000), back: 'complete' }] }, { ...input, format: 'html' }), error => error.status === 413);
});
