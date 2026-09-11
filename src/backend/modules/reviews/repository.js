import { transaction } from '../../db/pool.js';
import { HttpError, notFound } from '../../shared/errors.js';
import { schedule } from './service.js';
export function reviewRepository(pool) {
  return {
    async due(uid, deckId) {
      return (await pool.query(`SELECT c.*,d.name deck_name FROM cards c JOIN decks d ON d.id=c.deck_id
        WHERE d.user_id=$1 AND c.due<=extract(epoch from now()) AND ($2::int IS NULL OR d.id=$2)
        ORDER BY c.due,c.id LIMIT 100`, [uid, deckId])).rows;
    },
    async record(uid, input) {
      return transaction(pool, async client => {
        // Serialize a review with deck edits/deletions, then lock this card against parallel ratings.
        const deck = (await client.query('SELECT d.id FROM decks d JOIN cards c ON c.deck_id=d.id WHERE c.id=$1 AND d.user_id=$2 FOR UPDATE OF d', [input.card_id, uid])).rows[0];
        if (!deck) throw notFound();
        const card = (await client.query('SELECT * FROM cards WHERE id=$1 FOR UPDATE', [input.card_id])).rows[0];
        if (!card) throw notFound();
        const existing = (await client.query('SELECT * FROM reviews WHERE id=$1', [input.id])).rows[0];
        if (existing) {
          if (existing.user_id !== uid || existing.card_id !== input.card_id || existing.rating !== input.rating) throw new HttpError(409, 'รหัสการทบทวนถูกใช้แล้ว');
          return { ok: true, duplicate: true };
        }
        const now = Date.now() / 1000;
        if (card.due > now + 1) throw new HttpError(409, 'การ์ดนี้ถูกทบทวนแล้วหรือยังไม่ถึงกำหนด กรุณาโหลดใหม่');
        const interval = schedule(card.interval, input.rating);
        await client.query('INSERT INTO reviews(id,user_id,card_id,rating,seconds,created) VALUES($1,$2,$3,$4,$5,$6)', [input.id, uid, input.card_id, input.rating, input.seconds, now]);
        await client.query('UPDATE cards SET interval=$1,due=$2,reviews=reviews+1 WHERE id=$3', [interval, now + interval * 86400, card.id]);
        return { ok: true, interval };
      });
    },
  };
}
