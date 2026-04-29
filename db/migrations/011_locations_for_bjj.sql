CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

ALTER TABLE program_sessions ADD COLUMN location_id TEXT REFERENCES locations(id);
ALTER TABLE program_prices ADD COLUMN location_id TEXT REFERENCES locations(id);
ALTER TABLE semesters ADD COLUMN location_id TEXT REFERENCES locations(id);

INSERT INTO locations (id, display_name, city, address, status, metadata)
VALUES
  ('mississauga', 'Mississauga', 'Mississauga', '918 Dundas St. West, Mississauga', 'active', '{"sort_order":1}'),
  ('oakville', 'Oakville', 'Oakville', 'Oakville, ON — exact address shared after registration', 'active', '{"sort_order":2}')
ON CONFLICT(id) DO UPDATE SET
  display_name = excluded.display_name,
  city = excluded.city,
  address = excluded.address,
  status = excluded.status,
  metadata = excluded.metadata;

UPDATE program_sessions
SET location_id = 'mississauga'
WHERE program_id = 'bjj'
  AND location_id IS NULL;

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Girls 5–10 — Tuesday', NULL, 'Tuesday', '17:00', '18:00',
       'girls-5-10', 'female', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND location_id = 'oakville' AND age_group = 'girls-5-10'
    AND day_of_week = 'Tuesday' AND start_time = '17:00' AND end_time = '18:00'
);

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Boys 7–13 — Tuesday', NULL, 'Tuesday', '17:00', '18:00',
       'boys-7-13', 'male', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND location_id = 'oakville' AND age_group = 'boys-7-13'
    AND day_of_week = 'Tuesday' AND start_time = '17:00' AND end_time = '18:00'
);
