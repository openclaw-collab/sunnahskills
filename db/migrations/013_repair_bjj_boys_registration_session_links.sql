-- Repair legacy BJJ boys registrations whose session_id points at a non-BJJ
-- session after production session data drift.
--
-- The original Mississauga boys Friday session occupied the old linked slot.
-- After the location migration restored BJJ sessions, the canonical
-- Mississauga boys Friday session is resolved dynamically below.

UPDATE registrations
SET
  session_id = (
    SELECT id
    FROM program_sessions
    WHERE program_id = 'bjj'
      AND age_group = 'boys-7-13'
      AND COALESCE(location_id, 'mississauga') = 'mississauga'
      AND day_of_week = 'Friday'
      AND start_time = '10:00'
      AND end_time = '11:00'
    ORDER BY id DESC
    LIMIT 1
  ),
  updated_at = datetime('now')
WHERE program_id = 'bjj'
  AND (
    schedule_choice = 'boys-7-13'
    OR program_specific_data LIKE '%boys-7-13%'
  )
  AND (
    session_id IS NULL
    OR session_id NOT IN (
      SELECT id
      FROM program_sessions
      WHERE program_id = 'bjj'
        AND age_group = 'boys-7-13'
        AND COALESCE(location_id, 'mississauga') = 'mississauga'
    )
  )
  AND EXISTS (
    SELECT 1
    FROM program_sessions
    WHERE program_id = 'bjj'
      AND age_group = 'boys-7-13'
      AND COALESCE(location_id, 'mississauga') = 'mississauga'
      AND day_of_week = 'Friday'
      AND start_time = '10:00'
      AND end_time = '11:00'
  );
