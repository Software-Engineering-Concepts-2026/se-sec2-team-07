CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'ทั่วไป',
  color TEXT NOT NULL DEFAULT 'purple',
  created DOUBLE PRECISION NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  due DOUBLE PRECISION NOT NULL,
  interval DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK(interval >= 0),
  reviews INTEGER NOT NULL DEFAULT 0 CHECK(reviews >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK(rating IN ('again','hard','good','easy')),
  seconds INTEGER NOT NULL CHECK(seconds BETWEEN 0 AND 3600),
  created DOUBLE PRECISION NOT NULL
);
CREATE INDEX decks_owner ON decks(user_id);
CREATE INDEX cards_deck_due ON cards(deck_id, due);
CREATE INDEX reviews_owner_created ON reviews(user_id, created);
