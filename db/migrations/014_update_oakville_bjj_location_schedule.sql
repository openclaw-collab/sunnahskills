UPDATE locations
SET address = '2200 Speers Road, Oakville'
WHERE id = 'oakville';

UPDATE program_sessions
SET
  name = CASE
    WHEN age_group = 'girls-5-10' THEN 'Oakville Girls 5-10 - Monday'
    WHEN age_group = 'boys-7-13' THEN 'Oakville Boys 7-13 - Monday'
    ELSE name
  END,
  day_of_week = 'Monday',
  start_time = '14:30',
  end_time = '15:30',
  start_date = '2026-07-01',
  end_date = '2026-07-26',
  status = 'active',
  visible = 1
WHERE program_id = 'bjj'
  AND location_id = 'oakville'
  AND day_of_week = 'Tuesday'
  AND start_time = '17:00'
  AND end_time = '18:00'
  AND age_group IN ('girls-5-10', 'boys-7-13');

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, start_date, end_date, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Girls 5-10 - Monday', NULL, 'Monday', '14:30', '15:30',
       'girls-5-10', 'female', 16, '2026-07-01', '2026-07-26', 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND location_id = 'oakville'
    AND age_group = 'girls-5-10'
    AND day_of_week = 'Monday'
    AND start_time = '14:30'
    AND end_time = '15:30'
);

UPDATE program_sessions
SET start_date = '2026-07-01', end_date = '2026-07-26'
WHERE program_id = 'bjj'
  AND location_id = 'oakville'
  AND age_group IN ('girls-5-10', 'boys-7-13')
  AND day_of_week IN ('Monday', 'Wednesday')
  AND start_time = '14:30'
  AND end_time = '15:30';

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, start_date, end_date, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Boys 7-13 - Monday', NULL, 'Monday', '14:30', '15:30',
       'boys-7-13', 'male', 16, '2026-07-01', '2026-07-26', 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND location_id = 'oakville'
    AND age_group = 'boys-7-13'
    AND day_of_week = 'Monday'
    AND start_time = '14:30'
    AND end_time = '15:30'
);

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, start_date, end_date, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Girls 5-10 - Wednesday', NULL, 'Wednesday', '14:30', '15:30',
       'girls-5-10', 'female', 16, '2026-07-01', '2026-07-26', 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND location_id = 'oakville'
    AND age_group = 'girls-5-10'
    AND day_of_week = 'Wednesday'
    AND start_time = '14:30'
    AND end_time = '15:30'
);

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, start_date, end_date, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Boys 7-13 - Wednesday', NULL, 'Wednesday', '14:30', '15:30',
       'boys-7-13', 'male', 16, '2026-07-01', '2026-07-26', 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND location_id = 'oakville'
    AND age_group = 'boys-7-13'
    AND day_of_week = 'Wednesday'
    AND start_time = '14:30'
    AND end_time = '15:30'
);
