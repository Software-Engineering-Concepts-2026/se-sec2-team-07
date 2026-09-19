import { transaction } from '../../db/pool.js';
import { HttpError, notFound } from '../../shared/errors.js';
import { assertCardsUnlinked, cardCoursesSql } from '../courses/repository.js';

export function deckRepository(pool) {
  return {
    async list(uid) {
      return (await pool.query(`SELECT d.*, count(c.id)::int card_count,
        count(c.id) FILTER(WHERE c.due<=extract(epoch from now()))::int due_count,
        count(c.id) FILTER(WHERE c.interval>=4)::int learned
        FROM decks d LEFT JOIN cards c ON c.deck_id=d.id WHERE d.user_id=$1 GROUP BY d.id ORDER BY d.created DESC`, [uid])).rows;
    },
    async get(uid, id) {
      const deck = (await pool.query('SELECT * FROM decks WHERE id=$1 AND user_id=$2', [id, uid])).rows[0];
      if (!deck) throw notFound();
      deck.cards = (await pool.query(`SELECT c.*,${cardCoursesSql} courses FROM cards c WHERE deck_id=$1 ORDER BY id`, [id])).rows;
      return deck;
    },
    async save(uid, id, input) {
      return transaction(pool, async client => {
        if (id && !(await client.query('SELECT id FROM decks WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, uid])).rowCount) throw notFound();
        const { name, description, category, color, cards } = input;
        if (!id) {
          id = (await client.query('INSERT INTO decks(user_id,name,description,category,color,created) VALUES($1,$2,$3,$4,$5,extract(epoch from now())) RETURNING id', [uid, name, description, category, color])).rows[0].id;
        } else await client.query('UPDATE decks SET name=$1,description=$2,category=$3,color=$4 WHERE id=$5', [name, description, category, color, id]);
        const oldIds = new Set((await client.query('SELECT id FROM cards WHERE deck_id=$1', [id])).rows.map(c => c.id));
        const kept = new Set();
        for (const card of cards) {
          if (card.id !== undefined) {
            if (!oldIds.has(card.id) || kept.has(card.id)) throw new HttpError(400, 'รหัสการ์ดไม่ถูกต้องหรือซ้ำ');
            await client.query('UPDATE cards SET front=$1,back=$2 WHERE id=$3', [card.front, card.back, card.id]);
            kept.add(card.id);
          } else await client.query('INSERT INTO cards(deck_id,front,back,due) VALUES($1,$2,$3,extract(epoch from now()))', [id, card.front, card.back]);
        }
        const removed = [...oldIds].filter(cid => !kept.has(cid));
        if (removed.length) {
          await assertCardsUnlinked(client, removed);
          await client.query('DELETE FROM cards WHERE id=ANY($1::int[])', [removed]);
        }
        return id;
      });
    },
    async remove(uid, id) {
      return transaction(pool, async client => {
        if (!(await client.query('SELECT id FROM decks WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, uid])).rowCount) throw notFound();
        const ids = (await client.query('SELECT id FROM cards WHERE deck_id=$1', [id])).rows.map(c => c.id);
        await assertCardsUnlinked(client, ids);
        await client.query('DELETE FROM decks WHERE id=$1', [id]);
      });
    },
  };
}
