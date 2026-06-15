CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  captured_at TEXT NOT NULL UNIQUE,
  captured_ms INTEGER NOT NULL,
  current_period_id INTEGER,
  raw_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS snapshot_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id INTEGER NOT NULL,
  row_key TEXT NOT NULL,
  period_id INTEGER NOT NULL,
  period_label TEXT,
  title TEXT,
  guest TEXT,
  rank INTEGER,
  interaction_value INTEGER NOT NULL DEFAULT 0,
  round_amount INTEGER NOT NULL DEFAULT 0,
  on_screen_count INTEGER NOT NULL DEFAULT 0,
  is_target INTEGER NOT NULL DEFAULT 0,
  UNIQUE(snapshot_id, row_key)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_captured_ms
  ON snapshots(captured_ms);

CREATE INDEX IF NOT EXISTS idx_snapshot_rows_snapshot_id
  ON snapshot_rows(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_snapshot_rows_period_key
  ON snapshot_rows(period_id, row_key);
