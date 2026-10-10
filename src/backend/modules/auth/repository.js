export function authRepository(pool) {
  return {
    async byEmail(email) {
      return pool.prisma.user.findUnique({ where: { email } });
    },
    async byId(id) {
      return (await pool.query('SELECT id,name,email,token_version FROM users WHERE id=$1', [id]))
        .rows[0];
    },
    async create({ name, email, password }) {
      return pool.prisma.user.create({
        data: { name, email, password },
        select: { id: true, name: true, email: true, token_version: true },
      });
    },
    async revoke(id) {
      await pool.prisma.user.update({ where: { id }, data: { token_version: { increment: 1 } } });
    },
  };
}
