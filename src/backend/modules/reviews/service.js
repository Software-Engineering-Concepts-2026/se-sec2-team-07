export function schedule(interval, rating) {
  if (rating === 'again') return 10 / 1440;
  if (rating === 'hard') return Math.max(1, interval * 1.2);
  if (rating === 'good') return Math.max(2, interval * 2);
  if (rating === 'easy') return Math.max(4, interval * 2.5);
  throw new Error('Invalid rating');
}
