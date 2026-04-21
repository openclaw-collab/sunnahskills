-- Women BJJ add-ons, second-class pricing support, and later-charge reminders.

ALTER TABLE enrollment_orders ADD COLUMN later_charge_reminder_sent_at DATETIME;

INSERT INTO program_prices (program_id, age_group, label, amount, frequency, registration_fee, metadata, active)
SELECT 'bjj', 'women-self-defense-2026-04-30', 'Women Self-Defense — Apr 30', 2500, 'per_workshop', 0, '{"track":"women-self-defense-2026-04-30","one_time":true}', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_prices WHERE program_id = 'bjj' AND age_group = 'women-self-defense-2026-04-30'
);

INSERT INTO program_prices (program_id, age_group, label, amount, frequency, registration_fee, metadata, active)
SELECT 'bjj', 'women-self-defense-2026-05-28', 'Women Self-Defense — May 28', 2500, 'per_workshop', 0, '{"track":"women-self-defense-2026-05-28","one_time":true}', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_prices WHERE program_id = 'bjj' AND age_group = 'women-self-defense-2026-05-28'
);

INSERT INTO program_prices (program_id, age_group, label, amount, frequency, registration_fee, metadata, active)
SELECT 'bjj', 'women-self-defense-2026-06-25', 'Women Self-Defense — Jun 25', 2500, 'per_workshop', 0, '{"track":"women-self-defense-2026-06-25","one_time":true}', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_prices WHERE program_id = 'bjj' AND age_group = 'women-self-defense-2026-06-25'
);

INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, start_date, end_date, status, visible)
SELECT 'bjj', 'Women Self-Defense — Apr 30', 'Last Thursday of the month', 'Thursday', '18:30', '20:00', 'women-self-defense-2026-04-30', 'female', 30, '2026-04-30', '2026-04-30', 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions WHERE program_id = 'bjj' AND age_group = 'women-self-defense-2026-04-30'
);

INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, start_date, end_date, status, visible)
SELECT 'bjj', 'Women Self-Defense — May 28', 'Last Thursday of the month', 'Thursday', '18:30', '20:00', 'women-self-defense-2026-05-28', 'female', 30, '2026-05-28', '2026-05-28', 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions WHERE program_id = 'bjj' AND age_group = 'women-self-defense-2026-05-28'
);

INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, start_date, end_date, status, visible)
SELECT 'bjj', 'Women Self-Defense — Jun 25', 'Last Thursday of the month', 'Thursday', '18:30', '20:00', 'women-self-defense-2026-06-25', 'female', 30, '2026-06-25', '2026-06-25', 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions WHERE program_id = 'bjj' AND age_group = 'women-self-defense-2026-06-25'
);
