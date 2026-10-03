import { HttpError } from '../../shared/errors.js';

export function documentRepository(pool) {
  const missing = () => new HttpError(404, 'ไม่พบเอกสาร');
  return {
    async list(user_id) {
      return pool.prisma.document.findMany({ where: { user_id },
        select: { id: true, title: true, name: true, body: true, created: true },
        orderBy: [{ created: 'desc' }, { id: 'desc' }] });
    },
    async create(user_id, { title, name, body, content }) {
      return (await pool.prisma.document.create({ data: { user_id, title, name, body, content }, select: { id: true } })).id;
    },
    async download(user_id, id) {
      const file = await pool.prisma.document.findFirst({ where: { user_id, id }, select: { name: true, content: true } });
      if (!file) throw missing();
      return { name: file.name, content: Buffer.from(file.content) };
    },
    async rename(user_id, id, title) {
      if (!(await pool.prisma.document.updateMany({ where: { user_id, id }, data: { title } })).count) throw missing();
    },
    async remove(user_id, id) {
      if (!(await pool.prisma.document.deleteMany({ where: { user_id, id } })).count) throw missing();
    },
  };
}
