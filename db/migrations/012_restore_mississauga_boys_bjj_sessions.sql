INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, status, visible
)
SELECT 'bjj', 'mississauga', 'Boys 7–13 — Friday', NULL, 'Friday', '10:00', '11:00',
       'boys-7-13', 'male', 20, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND COALESCE(location_id, 'mississauga') = 'mississauga'
    AND age_group = 'boys-7-13'
    AND gender_group = 'male'
    AND day_of_week = 'Friday'
    AND start_time = '10:00'
    AND end_time = '11:00'
);

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, status, visible
)
SELECT 'bjj', 'mississauga', 'Boys 7–13 — Tuesday', NULL, 'Tuesday', '14:30', '15:30',
       'boys-7-13', 'male', 20, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND COALESCE(location_id, 'mississauga') = 'mississauga'
    AND age_group = 'boys-7-13'
    AND gender_group = 'male'
    AND day_of_week = 'Tuesday'
    AND start_time = '14:30'
    AND end_time = '15:30'
);
