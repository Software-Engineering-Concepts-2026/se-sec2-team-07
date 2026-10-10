CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 255),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 60000),
  content BYTEA NOT NULL CHECK(octet_length(content) BETWEEN 1 AND 20971520),
  created TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX documents_owner ON documents(user_id);
