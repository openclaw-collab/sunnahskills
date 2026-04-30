UPDATE program_sessions
SET start_date = '2026-05-18',
    end_date = '2026-06-26'
WHERE program_id = 'bjj'
  AND location_id = 'oakville'
  AND age_group IN ('girls-5-10', 'boys-7-13')
  AND day_of_week IN ('Monday', 'Wednesday')
  AND start_time = '14:30'
  AND end_time = '15:30';
