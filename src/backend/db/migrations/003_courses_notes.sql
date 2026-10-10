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
