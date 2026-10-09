export function authRepository(pool) {
  return {
    async byEmail(email) {
      return pool.prisma.user.findUnique({ where: { email } });
    },
    async byId(id) {
      return pool.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, token_version: true },
      });
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
