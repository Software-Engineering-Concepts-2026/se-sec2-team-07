import { transaction } from '../../db/pool.js';
import { HttpError, notFound } from '../../shared/errors.js';

export function exportRepository(pool) {
  return {
    async snapshot(uid, input) {
      return transaction(pool, async (client) => {
        await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const decks = (
          await client.query(
            'SELECT id,name,category,description FROM decks WHERE user_id=$1 AND id=ANY($2::int[])',
            [uid, input.deck_ids],
          )
        ).rows;
        if (decks.length !== input.deck_ids.length) throw notFound();
        const owner = (await client.query('SELECT name FROM users WHERE id=$1', [uid])).rows[0];
        // Check byte size before loading text; the rendered document also has a final size guard.
        if (input.include_cards) {
          const { bytes } = (
            await client.query(
              'SELECT coalesce(sum(octet_length(front)+octet_length(back)),0)::text bytes FROM cards WHERE deck_id=ANY($1::int[])',
              [input.deck_ids],
            )
          ).rows[0];
          if (Number(bytes) > 5 * 1024 * 1024)
            throw new HttpError(413, 'ไฟล์ส่งออกใหญ่เกิน 5 MB กรุณาลดจำนวนชุดการ์ด');
        }
        const cards = input.include_cards
          ? (
              await client.query(
                'SELECT deck_id,front,back FROM cards WHERE deck_id=ANY($1::int[]) ORDER BY id',
                [input.deck_ids],
              )
            ).rows
          : [];
        const learning = input.include_learning
          ? (
              await client.query(
                `SELECT c.deck_id,
        count(DISTINCT c.id)::int total_cards, count(r.id)::int attempts,
        count(DISTINCT r.card_id)::int reviewed_cards, coalesce(sum(r.seconds),0)::float8 seconds,
        count(r.id) FILTER(WHERE r.rating='again')::int again,
        count(r.id) FILTER(WHERE r.rating='hard')::int hard,
        count(r.id) FILTER(WHERE r.rating='good')::int good,
        count(r.id) FILTER(WHERE r.rating='easy')::int easy
        FROM cards c LEFT JOIN reviews r ON r.card_id=c.id AND r.user_id=$1
        WHERE c.deck_id=ANY($2::int[]) GROUP BY c.deck_id`,
                [uid, input.deck_ids],
              )
            ).rows
          : [];
        return {
          name: owner.name,
          decks: input.deck_ids.map((id) => decks.find((deck) => deck.id === id)),
          cards,
          learning,
        };
      });
    },
  };
}
