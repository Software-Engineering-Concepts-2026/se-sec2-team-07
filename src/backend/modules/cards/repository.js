import { transaction } from '../../db/pool.js';
import { notFound } from '../../shared/errors.js';

export function cardRepository(pool) {
  return {
    async list(uid, archived) {
      const cards = await pool.prisma.card.findMany({
        where: { deck: { user_id: uid }, archived_at: archived ? { not: null } : null },
        include: { deck: { select: { name: true } } }, orderBy: [{ deck_id: 'asc' }, { id: 'asc' }],
      });
      return cards.map(({ deck, ...card }) => ({ ...card, deck_name: deck.name }));
    },
    async archive(uid, id, archived) {
      return transaction(pool, async client => {
        // Match review/editor locking order so ratings and archive changes serialize.
        const deck = (await client.query(`SELECT d.id FROM decks d JOIN cards c ON c.deck_id=d.id
          WHERE c.id=$1 AND d.user_id=$2 FOR UPDATE OF d`, [id, uid])).rows[0];
        if (!deck) throw notFound();
        const card = (await client.query('SELECT archived_at FROM cards WHERE id=$1 FOR UPDATE', [id])).rows[0];
        if (!card) throw notFound();
        if ((card.archived_at !== null) === archived) return;
        if (archived) await client.query('UPDATE cards SET archived_at=now() WHERE id=$1', [id]);
        else await client.query('UPDATE cards SET archived_at=NULL,due=LEAST(due,extract(epoch from now())) WHERE id=$1', [id]);
        await client.query('UPDATE decks SET revision=revision+1 WHERE id=$1', [deck.id]);
      });
    },
  };
}
