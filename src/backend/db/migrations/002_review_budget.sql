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
