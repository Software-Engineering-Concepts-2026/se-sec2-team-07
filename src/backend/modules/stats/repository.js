export function statsRepository(pool) {
  return {
    async history(uid) {
      return (
        await pool.query(
          `SELECT r.rating,r.seconds,r.created,r.card_id,d.id AS deck_id,d.name AS deck_name
      FROM reviews r JOIN cards c ON c.id=r.card_id JOIN decks d ON d.id=c.deck_id
      WHERE r.user_id=$1 AND d.user_id=$1 ORDER BY r.created`,
          [uid],
        )
      ).rows;
    },
  };
}
