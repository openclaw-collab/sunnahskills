-- Seed data for Sunnah Skills programs, sessions, and prices
-- BJJ sessions match merged plan: kids Fri 10 / Tue 2:30–3:30; Women Tue + Thu; Men Fri/Sat 8–9pm

INSERT INTO programs (id, name, slug, type, description, age_min, age_max, supports_trial, supports_recurring, status)
VALUES
  ('bjj', 'Brazilian Jiu-Jitsu', 'bjj', 'recurring', 'Structured gi/no-gi grappling for youth and teens.', 5, 17, 1, 1, 'active'),
  ('archery', 'Seasonal Archery', 'archery', 'seasonal', 'Foundations of traditional archery in a seasonal format.', 8, 18, 0, 0, 'coming_soon'),
  ('outdoor', 'Outdoor Workshops', 'outdoor', 'workshop', 'Bushcraft, navigation, and outdoor skills intensives.', 10, 18, 0, 0, 'coming_soon'),
  ('bullyproofing', 'Bullyproofing Workshops', 'bullyproofing', 'workshop', 'Short-format bullyproofing series for youth.', 6, 16, 0, 0, 'coming_soon')
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  slug = excluded.slug,
  type = excluded.type,
  description = excluded.description,
  age_min = excluded.age_min,
  age_max = excluded.age_max,
  supports_trial = excluded.supports_trial,
  supports_recurring = excluded.supports_recurring,
  status = excluded.status;

-- BJJ launch pricing:
-- Girls/Boys: $12/class across their scheduled class count
-- Men 14+: $14/class across their scheduled class count
-- Women Tue or Thu: $80/month per day, represented internally as $20/class
INSERT INTO program_prices (id, program_id, age_group, label, amount, frequency, registration_fee, metadata, active)
VALUES
  (1, 'bjj', 'girls-5-10', 'Girls 5–10', 1200, 'per_session', 0, '{"track":"girls-5-10","weekly_sessions":2}', 1),
  (2, 'bjj', 'boys-7-13', 'Boys 7–13', 1200, 'per_session', 0, '{"track":"boys-7-13","weekly_sessions":2}', 1),
  (3, 'bjj', 'women-11-tue', 'Women 11+ — Tuesday', 2000, 'per_session', 0, '{"track":"women-11-tue","weekly_sessions":1,"monthly_price_cents":8000}', 1),
  (4, 'bjj', 'women-11-thu', 'Women 11+ — Thursday', 2000, 'per_session', 0, '{"track":"women-11-thu","weekly_sessions":1,"monthly_price_cents":8000}', 1),
  (5, 'bjj', 'men-14', 'Men 14+', 1400, 'per_session', 0, '{"track":"men-14","weekly_sessions":2}', 1),
  (6, 'archery', '8-12', 'Season (8-12)', 18000, 'per_series', 0, NULL, 1),
  (7, 'archery', '13-18', 'Season (13-18)', 20000, 'per_series', 0, NULL, 1),
  (8, 'outdoor', '10-18', 'Single Workshop', 7500, 'per_workshop', 0, NULL, 1),
  (9, 'bullyproofing', '6-16', 'Workshop Series', 12500, 'per_series', 0, NULL, 1)
ON CONFLICT(id) DO UPDATE SET
  program_id = excluded.program_id,
  age_group = excluded.age_group,
  label = excluded.label,
  amount = excluded.amount,
  frequency = excluded.frequency,
  registration_fee = excluded.registration_fee,
  metadata = excluded.metadata,
  active = excluded.active;

UPDATE program_sessions
SET status = 'coming_soon',
    visible = 0
WHERE program_id = 'bjj'
  AND NOT (
    (age_group = 'girls-5-10' AND gender_group = 'female' AND day_of_week = 'Friday' AND start_time = '10:00' AND end_time = '11:00') OR
    (age_group = 'girls-5-10' AND gender_group = 'female' AND day_of_week = 'Tuesday' AND start_time = '14:30' AND end_time = '15:30') OR
    (age_group = 'boys-7-13' AND gender_group = 'male' AND day_of_week = 'Friday' AND start_time = '10:00' AND end_time = '11:00') OR
    (age_group = 'boys-7-13' AND gender_group = 'male' AND day_of_week = 'Tuesday' AND start_time = '14:30' AND end_time = '15:30') OR
    (age_group = 'women-11-tue' AND gender_group = 'female' AND day_of_week = 'Tuesday' AND start_time = '12:30' AND end_time = '14:00') OR
    (age_group = 'women-11-thu' AND gender_group = 'female' AND day_of_week = 'Thursday' AND start_time = '20:00' AND end_time = '21:30') OR
    (age_group = 'men-14' AND gender_group = 'male' AND day_of_week = 'Friday' AND start_time = '20:00' AND end_time = '21:00') OR
    (age_group = 'men-14' AND gender_group = 'male' AND day_of_week = 'Saturday' AND start_time = '20:00' AND end_time = '21:00')
  );

UPDATE program_sessions
SET name = 'Girls 5–10 — Friday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'girls-5-10' AND gender_group = 'female' AND day_of_week = 'Friday' AND start_time = '10:00' AND end_time = '11:00';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Girls 5–10 — Friday', NULL, 'Friday', '10:00', '11:00', 'girls-5-10', 'female', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'girls-5-10' AND gender_group = 'female' AND day_of_week = 'Friday' AND start_time = '10:00' AND end_time = '11:00'
);

UPDATE program_sessions
SET name = 'Girls 5–10 — Tuesday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'girls-5-10' AND gender_group = 'female' AND day_of_week = 'Tuesday' AND start_time = '14:30' AND end_time = '15:30';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Girls 5–10 — Tuesday', NULL, 'Tuesday', '14:30', '15:30', 'girls-5-10', 'female', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'girls-5-10' AND gender_group = 'female' AND day_of_week = 'Tuesday' AND start_time = '14:30' AND end_time = '15:30'
);

UPDATE program_sessions
SET name = 'Boys 7–13 — Friday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'boys-7-13' AND gender_group = 'male' AND day_of_week = 'Friday' AND start_time = '10:00' AND end_time = '11:00';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Boys 7–13 — Friday', NULL, 'Friday', '10:00', '11:00', 'boys-7-13', 'male', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'boys-7-13' AND gender_group = 'male' AND day_of_week = 'Friday' AND start_time = '10:00' AND end_time = '11:00'
);

UPDATE program_sessions
SET name = 'Boys 7–13 — Tuesday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'boys-7-13' AND gender_group = 'male' AND day_of_week = 'Tuesday' AND start_time = '14:30' AND end_time = '15:30';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Boys 7–13 — Tuesday', NULL, 'Tuesday', '14:30', '15:30', 'boys-7-13', 'male', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'boys-7-13' AND gender_group = 'male' AND day_of_week = 'Tuesday' AND start_time = '14:30' AND end_time = '15:30'
);

UPDATE program_sessions
SET name = 'Teens+ Women 11+ — Tuesday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'women-11-tue' AND gender_group = 'female' AND day_of_week = 'Tuesday' AND start_time = '12:30' AND end_time = '14:00';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Teens+ Women 11+ — Tuesday', NULL, 'Tuesday', '12:30', '14:00', 'women-11-tue', 'female', 14, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'women-11-tue' AND gender_group = 'female' AND day_of_week = 'Tuesday' AND start_time = '12:30' AND end_time = '14:00'
);

UPDATE program_sessions
SET name = 'Teens+ Women 11+ — Thursday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'women-11-thu' AND gender_group = 'female' AND day_of_week = 'Thursday' AND start_time = '20:00' AND end_time = '21:30';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Teens+ Women 11+ — Thursday', NULL, 'Thursday', '20:00', '21:30', 'women-11-thu', 'female', 14, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'women-11-thu' AND gender_group = 'female' AND day_of_week = 'Thursday' AND start_time = '20:00' AND end_time = '21:30'
);

UPDATE program_sessions
SET name = 'Teens+ Men 14+ — Friday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'men-14' AND gender_group = 'male' AND day_of_week = 'Friday' AND start_time = '20:00' AND end_time = '21:00';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Teens+ Men 14+ — Friday', NULL, 'Friday', '20:00', '21:00', 'men-14', 'male', 18, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'men-14' AND gender_group = 'male' AND day_of_week = 'Friday' AND start_time = '20:00' AND end_time = '21:00'
);

UPDATE program_sessions
SET name = 'Teens+ Men 14+ — Saturday', season = NULL, capacity = 20, status = 'active', visible = 1
WHERE program_id = 'bjj' AND age_group = 'men-14' AND gender_group = 'male' AND day_of_week = 'Saturday' AND start_time = '20:00' AND end_time = '21:00';
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
SELECT 'bjj', 'Teens+ Men 14+ — Saturday', NULL, 'Saturday', '20:00', '21:00', 'men-14', 'male', 18, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj' AND age_group = 'men-14' AND gender_group = 'male' AND day_of_week = 'Saturday' AND start_time = '20:00' AND end_time = '21:00'
);

INSERT INTO semesters (id, name, program_id, start_date, end_date, classes_in_semester, price_per_class_cents, registration_fee_cents, later_payment_date, active)
VALUES
  (1, 'Spring 2026', 'bjj', '2026-03-31', '2026-06-27', 13, 1200, 0, '2026-05-12', 1)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  program_id = excluded.program_id,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  classes_in_semester = excluded.classes_in_semester,
  price_per_class_cents = excluded.price_per_class_cents,
  registration_fee_cents = excluded.registration_fee_cents,
  later_payment_date = excluded.later_payment_date,
  active = excluded.active;

INSERT INTO waiver_documents (id, slug, title, body_html, version_label, active, published_at)
VALUES (
  1,
  'registration',
  'Sunnah Skills Registration Waiver',
  '<h2>Liability Waiver</h2><p>I understand that Brazilian Jiu-Jitsu and related training involve physical contact, falls, and the risk of injury. I voluntarily allow myself and/or the participant(s) on this account to take part in training at Sunnah Skills.</p><h2>Medical Authorization</h2><p>I confirm the account information and emergency contact details are accurate. In the event of an emergency, I authorize Sunnah Skills staff to seek appropriate medical care for the participant(s) in this order.</p><h2>Photo Consent</h2><p>I understand I may opt in or out of photo usage for academy updates and community highlights.</p><h2>Policies</h2><p>I understand tuition, payment-plan balances, and attendance policies are tied to this account and that installment balances may be charged automatically on the scheduled date when I choose the half-now payment option.</p>',
  '2026.03.31',
  1,
  datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  title = excluded.title,
  body_html = excluded.body_html,
  version_label = excluded.version_label,
  active = excluded.active,
  published_at = excluded.published_at;
