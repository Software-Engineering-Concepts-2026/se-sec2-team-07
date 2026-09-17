const DAY = 86400;
export const bangkokDate = seconds => new Date((seconds + 7 * 3600) * 1000).toISOString().slice(0, 10);

// Forecast each card's next review once. Later repetitions depend on future answers.
export function planReviews(cards, minutes, spent, averageSeconds, now = Date.now() / 1000) {
  const secondsPerCard = Math.max(15, Math.min(120, Math.ceil(Number(averageSeconds) || 30)));
  const remainingSeconds = Math.max(0, minutes * 60 - spent);
  const midnight = Date.parse(`${bangkokDate(now)}T00:00:00+07:00`) / 1000;
  const sorted = [...cards].sort((a, b) => a.due - b.due || b.reviews - a.reviews || a.interval - b.interval || a.id - b.id);
  const ready = sorted.filter(c => c.due <= now);
  const selected = ready.slice(0, Math.floor(remainingSeconds / secondsPerCard));
  const pending = [...sorted];
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = midnight + i * DAY;
    const budgetSeconds = i === 0 ? remainingSeconds : minutes * 60;
    const capacity = Math.floor(budgetSeconds / secondsPerCard);
    const assigned = [];
    while (assigned.length < capacity && pending.length && pending[0].due < start + DAY) assigned.push(pending.shift());
    return { date: bangkokDate(start), count: assigned.length, estimated_seconds: assigned.length * secondsPerCard,
      budget_seconds: budgetSeconds, cards: assigned.map(c => ({ id: c.id, front: c.front, deck_name: c.deck_name, due: c.due })) };
  });
  return { minutes, spent_seconds: spent, remaining_seconds: remainingSeconds, seconds_per_card: secondsPerCard,
    due_count: ready.length, deferred_count: ready.length - selected.length, cards: selected, days,
    beyond_week: pending.length, next_due: sorted.find(c => c.due > now)?.due ?? null };
}
