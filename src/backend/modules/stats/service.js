const dateKey = (time) => new Date(time + 7 * 3600000).toISOString().slice(0, 10);
export function summarize(rows, now = Date.now()) {
  const days = new Map();
  const daily = new Map(),
    topics = new Map(),
    uniqueCards = new Set();
  const bucket = () => ({ total: 0, cards: new Set(), success: 0, again: 0, hard: 0 });
  const record = (entry, row) => {
    entry.total++;
    if (row.card_id != null) entry.cards.add(row.card_id);
    if (row.rating === 'good' || row.rating === 'easy') entry.success++;
    if (row.rating === 'again' || row.rating === 'hard') entry[row.rating]++;
  };
  const distribution = { again: 0, hard: 0, good: 0, easy: 0 };
  let seconds = 0;
  for (const row of rows) {
    const day = dateKey(row.created * 1000);
    days.set(day, (days.get(day) || 0) + 1);
    if (!daily.has(day)) daily.set(day, bucket());
    record(daily.get(day), row);
    if (row.card_id != null) uniqueCards.add(row.card_id);
    if (row.deck_id != null) {
      if (!topics.has(row.deck_id))
        topics.set(row.deck_id, { ...bucket(), id: row.deck_id, name: row.deck_name });
      record(topics.get(row.deck_id), row);
    }
    distribution[row.rating]++;
    seconds += row.seconds;
  }
  let cursor = days.has(dateKey(now)) ? now : now - 86400000;
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor -= 86400000;
  }
  return {
    total: rows.length,
    today: days.get(dateKey(now)) || 0,
    seconds,
    streak,
    distribution,
    uniqueCards: uniqueCards.size,
    todayUniqueCards: daily.get(dateKey(now))?.cards.size || 0,
    topics: [...topics.values()]
      .sort((a, b) => a.success / a.total - b.success / b.total || b.total - a.total || a.id - b.id)
      .map((topic) => ({
        id: topic.id,
        name: topic.name,
        total: topic.total,
        uniqueCards: topic.cards.size,
        accuracy: Math.round((100 * topic.success) / topic.total),
        again: topic.again,
        hard: topic.hard,
        recommended: topic.total >= 3 && topic.success / topic.total < 0.7,
      })),
    history: Array.from({ length: 30 }, (_, i) => {
      const date = dateKey(now - (29 - i) * 86400000),
        entry = daily.get(date);
      return {
        date,
        count: entry?.total || 0,
        uniqueCards: entry?.cards.size || 0,
        accuracy: entry ? Math.round((100 * entry.success) / entry.total) : null,
      };
    }),
    accuracy: rows.length
      ? Math.round((100 * (distribution.good + distribution.easy)) / rows.length)
      : 0,
    weekly: Array.from({ length: 7 }, (_, i) => {
      const date = dateKey(now - (6 - i) * 86400000);
      return { date, count: days.get(date) || 0 };
    }),
  };
}
