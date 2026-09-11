export function statsRepository(pool) {
  return { async history(uid) {
    return (await pool.query('SELECT rating,seconds,created FROM reviews WHERE user_id=$1 ORDER BY created', [uid])).rows;
  } };
}
