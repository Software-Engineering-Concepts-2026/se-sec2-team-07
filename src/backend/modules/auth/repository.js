export function authRepository(pool) {
  return {
    async byEmail(email) { return (await pool.query('SELECT * FROM users WHERE email=$1', [email])).rows[0]; },
    async byId(id) { return (await pool.query('SELECT id,name,email,token_version FROM users WHERE id=$1', [id])).rows[0]; },
    async create({ name, email, password }) {
      return (await pool.query('INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email,token_version', [name, email, password])).rows[0];
    },
    async revoke(id) { await pool.query('UPDATE users SET token_version=token_version+1 WHERE id=$1', [id]); },
  };
}
