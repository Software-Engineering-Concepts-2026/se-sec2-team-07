const dateKey = time => new Date(time + 7 * 3600000).toISOString().slice(0, 10);
export function summarize(rows, now = Date.now()) {
  const days = new Map();
  const distribution = { again: 0, hard: 0, good: 0, easy: 0 };
  let seconds = 0;
  for (const row of rows) {
    const day = dateKey(row.created * 1000);
    days.set(day, (days.get(day) || 0) + 1);
    distribution[row.rating]++;
    seconds += row.seconds;
  }
  let cursor = days.has(dateKey(now)) ? now : now - 86400000;
  let streak = 0;
  while (days.has(dateKey(cursor))) { streak++; cursor -= 86400000; }
  return { total: rows.length, today: days.get(dateKey(now)) || 0, seconds, streak, distribution,
    accuracy: rows.length ? Math.round(100 * (distribution.good + distribution.easy) / rows.length) : 0,
    weekly: Array.from({ length: 7 }, (_, i) => {
      const date = dateKey(now - (6 - i) * 86400000);
      return { date, count: days.get(date) || 0 };
    }),
  };
}
