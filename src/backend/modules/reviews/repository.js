import { transaction } from '../../db/pool.js';
import { HttpError, notFound } from '../../shared/errors.js';
import { schedule } from './service.js';
import { planReviews, bangkokDate } from './planner.js';
export function reviewRepository(pool) {
  return {
    async plan(uid, deckId = null, courseId = null) {
      if (
        courseId &&
        !(await pool.query('SELECT id FROM courses WHERE id=$1 AND user_id=$2', [courseId, uid]))
          .rowCount
      )
        throw notFound();
      const now = Date.now() / 1000;
      const settings = (
        await pool.query(
          `SELECT u.review_minutes,
          COALESCE((SELECT seconds FROM review_days WHERE user_id=u.id AND day=$2),0) spent_seconds,
          (SELECT avg(seconds) FROM (SELECT seconds FROM reviews WHERE user_id=$1 AND seconds>0 ORDER BY created DESC LIMIT 100) recent) average_seconds
          FROM users u WHERE u.id=$1`,
          [uid, bangkokDate(now)],
        )
      ).rows[0];
      const cards = (
        await pool.query(
          `SELECT c.*, d.name deck_name FROM cards c JOIN decks d ON d.id=c.deck_id
        WHERE d.user_id=$1 AND c.archived_at IS NULL AND ($2::int IS NULL OR d.id=$2)
        AND ($3::int IS NULL OR EXISTS(SELECT 1 FROM course_cards cc WHERE cc.card_id=c.id AND cc.course_id=$3))`,
          [uid, deckId, courseId],
        )
      ).rows;
      return planReviews(
        cards,
        settings.review_minutes,
        settings.spent_seconds,
        settings.average_seconds,
        now,
      );
    },
    async setMinutes(uid, minutes) {
      await pool.query('UPDATE users SET review_minutes=$1 WHERE id=$2', [minutes, uid]);
    },
    async record(uid, input) {
      return transaction(pool, async (client) => {
        const user = (
          await client.query('SELECT review_minutes FROM users WHERE id=$1 FOR UPDATE', [uid])
        ).rows[0];
        // Serialize a review with deck edits/deletions, then lock this card against parallel ratings.
        const deck = (
          await client.query(
            'SELECT d.id FROM decks d JOIN cards c ON c.deck_id=d.id WHERE c.id=$1 AND d.user_id=$2 FOR UPDATE OF d',
            [input.card_id, uid],
          )
        ).rows[0];
        if (!deck) throw notFound();
        const card = (
          await client.query('SELECT * FROM cards WHERE id=$1 FOR UPDATE', [input.card_id])
        ).rows[0];
        if (!card) throw notFound();
        const existing = (await client.query('SELECT * FROM reviews WHERE id=$1', [input.id]))
          .rows[0];
        if (existing) {
          if (
            existing.user_id !== uid ||
            existing.card_id !== input.card_id ||
            existing.rating !== input.rating
          )
            throw new HttpError(409, 'รหัสการทบทวนถูกใช้แล้ว');
          return { ok: true, duplicate: true };
        }
        if (card.archived_at)
          throw new HttpError(409, 'การ์ดนี้เก็บเป็นเรียนจบแล้ว กรุณาโหลดรายการทบทวนใหม่');
        const now = Date.now() / 1000;
        const day = bangkokDate(now);
        const spent =
          (
            await client.query('SELECT seconds FROM review_days WHERE user_id=$1 AND day=$2', [
              uid,
              day,
            ])
          ).rows[0]?.seconds || 0;
        const remaining = Math.max(0, user.review_minutes * 60 - spent);
        if (!remaining)
          throw new HttpError(409, 'ครบเวลาทบทวนวันนี้แล้ว ดูตารางหรือปรับเวลาที่สะดวกได้');
        const seconds = Math.min(remaining, Math.max(1, input.seconds));
        if (card.due > now + 1)
          throw new HttpError(409, 'การ์ดนี้ถูกทบทวนแล้วหรือยังไม่ถึงกำหนด กรุณาโหลดใหม่');
        const interval = schedule(card.interval, input.rating);
        await client.query(
          'INSERT INTO reviews(id,user_id,card_id,rating,seconds,created) VALUES($1,$2,$3,$4,$5,$6)',
          [input.id, uid, input.card_id, input.rating, seconds, now],
        );
        await client.query('UPDATE cards SET interval=$1,due=$2,reviews=reviews+1 WHERE id=$3', [
          interval,
          now + interval * 86400,
          card.id,
        ]);
        await client.query(
          `INSERT INTO review_days(user_id,day,seconds) VALUES($1,$2,$3)
          ON CONFLICT(user_id,day) DO UPDATE SET seconds=review_days.seconds+excluded.seconds`,
          [uid, day, seconds],
        );
        return {
          ok: true,
          interval,
          due: now + interval * 86400,
          remaining_seconds: remaining - seconds,
        };
      });
    },
  };
}
