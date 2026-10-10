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
