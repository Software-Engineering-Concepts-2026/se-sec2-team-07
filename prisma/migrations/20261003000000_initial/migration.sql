CREATE TABLE schema_migrations(name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());

-- Preserved legacy migration: 001_initial.sql
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

INSERT INTO schema_migrations(name) VALUES('001_initial.sql');

-- Preserved legacy migration: 002_review_budget.sql
ALTER TABLE users ADD COLUMN review_minutes INTEGER NOT NULL DEFAULT 10 CHECK (review_minutes BETWEEN 1 AND 120);
CREATE TABLE review_days (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0 CHECK (seconds >= 0),
  PRIMARY KEY(user_id, day)
);
INSERT INTO review_days(user_id, day, seconds)
SELECT user_id, (to_timestamp(created) AT TIME ZONE 'Asia/Bangkok')::date, sum(seconds)::int
FROM reviews GROUP BY user_id, (to_timestamp(created) AT TIME ZONE 'Asia/Bangkok')::date;

INSERT INTO schema_migrations(name) VALUES('002_review_budget.sql');

-- Preserved legacy migration: 003_courses_notes.sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120)
);
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 60000)
);
CREATE TABLE course_cards (
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  PRIMARY KEY(course_id, card_id)
);
CREATE TABLE course_notes (
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  PRIMARY KEY(course_id, note_id)
);
CREATE INDEX courses_owner ON courses(user_id);
CREATE INDEX notes_owner ON notes(user_id);
CREATE INDEX course_cards_source ON course_cards(card_id);
CREATE INDEX course_notes_source ON course_notes(note_id);

INSERT INTO schema_migrations(name) VALUES('003_courses_notes.sql');

-- Preserved legacy migration: 004_documents.sql
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

INSERT INTO schema_migrations(name) VALUES('004_documents.sql');

-- Preserved legacy migration: 005_sync.sql
ALTER TABLE decks ADD COLUMN revision integer NOT NULL DEFAULT 1 CHECK (revision > 0);
ALTER TABLE notes ADD COLUMN revision integer NOT NULL DEFAULT 1 CHECK (revision > 0);

CREATE TABLE sync_receipts (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('deck','note')),
  request_id uuid NOT NULL,
  input_hash text NOT NULL,
  result_id integer NOT NULL,
  created timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,kind,request_id)
);

INSERT INTO schema_migrations(name) VALUES('005_sync.sql');

-- Preserved legacy migration: 006_card_archive.sql
ALTER TABLE cards ADD COLUMN archived_at timestamptz;

INSERT INTO schema_migrations(name) VALUES('006_card_archive.sql');
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "decks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_days" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schema_migrations" ENABLE ROW LEVEL SECURITY;
