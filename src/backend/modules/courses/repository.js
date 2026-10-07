import { assertRevision, saveOnce } from '../../shared/sync.js';
import { transaction } from '../../db/pool.js';
import { HttpError, notFound } from '../../shared/errors.js';

export const cardCoursesSql = `COALESCE((SELECT json_agg(json_build_object('id',co.id,'name',co.name) ORDER BY co.id)
  FROM course_cards cc JOIN courses co ON co.id=cc.course_id WHERE cc.card_id=c.id),'[]'::json)`;
const noteCoursesSql = `COALESCE((SELECT json_agg(json_build_object('id',co.id,'name',co.name) ORDER BY co.id)
  FROM course_notes cn JOIN courses co ON co.id=cn.course_id WHERE cn.note_id=n.id),'[]'::json)`;

export async function assertCardsUnlinked(client, ids) {
  if (!ids.length) return;
  const linked = (
    await client.query(
      `SELECT DISTINCT co.name FROM course_cards cc JOIN courses co ON co.id=cc.course_id
    WHERE cc.card_id=ANY($1::int[]) ORDER BY co.name`,
      [ids],
    )
  ).rows;
  if (linked.length)
    throw new HttpError(
      409,
      `ไม่สามารถลบการ์ดที่ใช้ในรายวิชา: ${linked.map((c) => c.name).join(', ')} กรุณานำออกจากรายวิชาก่อน`,
    );
}

export function courseRepository(pool) {
  async function contents(uid, courseId = null) {
    const cards = (
      await pool.query(
        `SELECT c.*,d.name deck_name,${cardCoursesSql} courses
      FROM cards c JOIN decks d ON d.id=c.deck_id WHERE d.user_id=$1
      AND ($2::int IS NULL OR EXISTS(SELECT 1 FROM course_cards cc WHERE cc.card_id=c.id AND cc.course_id=$2)) ORDER BY c.id`,
        [uid, courseId],
      )
    ).rows;
    const notes = (
      await pool.query(
        `SELECT n.*,${noteCoursesSql} courses FROM notes n WHERE n.user_id=$1
      AND ($2::int IS NULL OR EXISTS(SELECT 1 FROM course_notes cn WHERE cn.note_id=n.id AND cn.course_id=$2)) ORDER BY n.id`,
        [uid, courseId],
      )
    ).rows;
    return { cards, notes };
  }
  return {
    async list(uid) {
      return (
        await pool.query(
          `SELECT co.*, (SELECT count(*)::int FROM course_cards WHERE course_id=co.id) card_count,
        (SELECT count(*)::int FROM course_notes WHERE course_id=co.id) note_count FROM courses co WHERE user_id=$1 ORDER BY co.id`,
          [uid],
        )
      ).rows;
    },
    library: contents,
    async get(uid, id) {
      const course = (
        await pool.query('SELECT * FROM courses WHERE id=$1 AND user_id=$2', [id, uid])
      ).rows[0];
      if (!course) throw notFound();
      return { ...course, ...(await contents(uid, id)) };
    },
    async save(uid, id, { name }) {
      if (!id)
        return (
          await pool.query('INSERT INTO courses(user_id,name) VALUES($1,$2) RETURNING id', [
            uid,
            name,
          ])
        ).rows[0].id;
      if (
        !(
          await pool.query('UPDATE courses SET name=$1 WHERE id=$2 AND user_id=$3', [name, id, uid])
        ).rowCount
      )
        throw notFound();
      return id;
    },
    async remove(uid, id) {
      if (!(await pool.query('DELETE FROM courses WHERE id=$1 AND user_id=$2', [id, uid])).rowCount)
        throw notFound();
    },
    async linkDeck(uid, courseId, deckId) {
      return transaction(pool, async (client) => {
        // Use the same source-before-course lock order as individual links.
        if (
          !(
            await client.query('SELECT id FROM decks WHERE id=$1 AND user_id=$2 FOR UPDATE', [
              deckId,
              uid,
            ])
          ).rowCount
        )
          throw notFound();
        if (
          !(
            await client.query('SELECT id FROM courses WHERE id=$1 AND user_id=$2 FOR UPDATE', [
              courseId,
              uid,
            ])
          ).rowCount
        )
          throw notFound();
        const result = await client.query(
          'INSERT INTO course_cards(course_id,card_id) SELECT $1,id FROM cards WHERE deck_id=$2 ON CONFLICT DO NOTHING',
          [courseId, deckId],
        );
        return result.rowCount;
      });
    },
    async link(uid, courseId, kind, sourceId, add) {
      return transaction(pool, async (client) => {
        // Lock source before course: deck edits/deletions take this same deck lock.
        // Always recheck the card after acquiring the lock (a preceding edit may have removed it).
        if (kind === 'cards') {
          const deck = (
            await client.query(
              `SELECT d.id FROM decks d JOIN cards c ON c.deck_id=d.id
            WHERE c.id=$1 AND d.user_id=$2 FOR UPDATE OF d`,
              [sourceId, uid],
            )
          ).rows[0];
          if (
            !deck ||
            !(
              await client.query('SELECT id FROM cards WHERE id=$1 AND deck_id=$2', [
                sourceId,
                deck.id,
              ])
            ).rowCount
          )
            throw notFound();
        } else if (
          !(
            await client.query('SELECT id FROM notes WHERE id=$1 AND user_id=$2 FOR UPDATE', [
              sourceId,
              uid,
            ])
          ).rowCount
        )
          throw notFound();
        if (
          !(
            await client.query('SELECT id FROM courses WHERE id=$1 AND user_id=$2 FOR UPDATE', [
              courseId,
              uid,
            ])
          ).rowCount
        )
          throw notFound();
        // Identifiers only come from this internal two-value choice, never from request text.
        const table = kind === 'cards' ? 'course_cards' : 'course_notes';
        const column = kind === 'cards' ? 'card_id' : 'note_id';
        if (add)
          await client.query(
            `INSERT INTO ${table}(course_id,${column}) VALUES($1,$2) ON CONFLICT DO NOTHING`,
            [courseId, sourceId],
          );
        else
          await client.query(`DELETE FROM ${table} WHERE course_id=$1 AND ${column}=$2`, [
            courseId,
            sourceId,
          ]);
      });
    },
  };
}

export function noteRepository(pool) {
  return {
    async list(uid) {
      return (
        await pool.query(
          `SELECT n.*,${noteCoursesSql} courses FROM notes n WHERE user_id=$1 ORDER BY id`,
          [uid],
        )
      ).rows;
    },
    async save(uid, id, input) {
      return transaction(pool, async (client) =>
        saveOnce(client, uid, 'note', id, input, async () => {
          const { title, body } = input;
          if (!id)
            return (
              await client.query(
                'INSERT INTO notes(user_id,title,body) VALUES($1,$2,$3) RETURNING id',
                [uid, title, body],
              )
            ).rows[0].id;
          const current = (
            await client.query('SELECT revision FROM notes WHERE id=$1 AND user_id=$2 FOR UPDATE', [
              id,
              uid,
            ])
          ).rows[0];
          if (!current) throw notFound();
          assertRevision(current, input.revision);
          await client.query('UPDATE notes SET title=$1,body=$2,revision=revision+1 WHERE id=$3', [
            title,
            body,
            id,
          ]);
          return id;
        }),
      );
    },
    async remove(uid, id, revision) {
      return transaction(pool, async (client) => {
        const current = (
          await client.query('SELECT revision FROM notes WHERE id=$1 AND user_id=$2 FOR UPDATE', [
            id,
            uid,
          ])
        ).rows[0];
        if (!current) throw notFound();
        assertRevision(current, revision);
        const linked = (
          await client.query(
            'SELECT co.name FROM course_notes cn JOIN courses co ON co.id=cn.course_id WHERE cn.note_id=$1 ORDER BY co.id',
            [id],
          )
        ).rows;
        if (linked.length)
          throw new HttpError(
            409,
            `ไม่สามารถลบโน้ตที่ใช้ในรายวิชา: ${linked.map((c) => c.name).join(', ')} กรุณานำออกจากรายวิชาก่อน`,
          );
        await client.query('DELETE FROM notes WHERE id=$1', [id]);
      });
    },
  };
}
