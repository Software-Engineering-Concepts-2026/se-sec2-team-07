import { HttpError } from '../../shared/errors.js';

export function documentRepository(pool) {
  const requireRow = result => {
    if (!result.rows[0]) throw new HttpError(404, 'ไม่พบเอกสาร');
    return result.rows[0];
  };
  return {
    async list(userId) {
      return (await pool.query('SELECT id,title,name,body,created FROM documents WHERE user_id=$1 ORDER BY created DESC,id DESC', [userId])).rows;
    },
    async create(userId, { title, name, body, content }) {
      return (await pool.query('INSERT INTO documents(user_id,title,name,body,content) VALUES($1,$2,$3,$4,$5) RETURNING id', [userId, title, name, body, content])).rows[0].id;
    },
    async download(userId, id) {
      return requireRow(await pool.query('SELECT name,content FROM documents WHERE user_id=$1 AND id=$2', [userId, id]));
    },
    async rename(userId, id, title) {
      requireRow(await pool.query('UPDATE documents SET title=$3 WHERE user_id=$1 AND id=$2 RETURNING id', [userId, id, title]));
    },
    async remove(userId, id) {
      requireRow(await pool.query('DELETE FROM documents WHERE user_id=$1 AND id=$2 RETURNING id', [userId, id]));
    },
  };
}
