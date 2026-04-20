-- Seed data for Sunnah Skills programs, sessions, and prices
-- BJJ sessions match merged plan: kids Fri 10 / Tue 2:30–3:30; Women Tue + Thu; Men Fri/Sat 8–9pm

INSERT INTO programs (id, name, slug, type, description, age_min, age_max, supports_trial, supports_recurring, status)
VALUES
  ('bjj', 'Brazilian Jiu-Jitsu', 'bjj', 'recurring', 'Structured gi/no-gi grappling for youth and teens.', 5, 17, 1, 1, 'active'),
  ('archery', 'Traditional Archery', 'archery', 'seasonal', 'Foundations of traditional archery in a seasonal format.', NULL, NULL, 0, 0, 'active'),
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

INSERT INTO program_offers (id, program_id, name, slug, description, confirmation_notes, is_private, access_code, active, audience_gender, waiver_slug)
VALUES
  (
    1,
    'archery',
    'May 2026 Four-Week Series',
    'archery-may-2026-series',
    'Four Sunday sessions with two time slots and all equipment included.',
    'Please make your calendars. All equipment is provided and first-timers complete a mandatory 30-minute safety lesson.',
    0,
    NULL,
    1,
    NULL,
    'archery'
  ),
  (
    2,
    'archery',
    'Women''s Archery Campfire Session',
    'archery-womens-apr-2026',
    'A women-only private one-off with campfire and marshmallows included.',
    'Bring layered clothing for the range and outdoor social time after shooting.',
    1,
    'WOMENS19',
    0,
    'female',
    'archery'
  )
ON CONFLICT(id) DO UPDATE SET
  program_id = excluded.program_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  confirmation_notes = excluded.confirmation_notes,
  is_private = excluded.is_private,
  access_code = excluded.access_code,
  active = excluded.active,
  audience_gender = excluded.audience_gender,
  waiver_slug = excluded.waiver_slug;

INSERT OR REPLACE INTO program_offer_dates (id, offer_id, event_date, sort_order)
VALUES
  (1, 1, '2026-05-10', 1),
  (2, 1, '2026-05-17', 2),
  (3, 1, '2026-05-24', 3),
  (4, 1, '2026-05-31', 4),
  (5, 2, '2026-04-19', 1);

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
  (6, 'archery', 'all', 'May 2026 Four-Week Series', 12500, 'per_series', 0, '{"offer_id":1}', 1),
  (7, 'archery', 'female', 'Women''s One-Off Session', 4500, 'per_workshop', 0, '{"offer_id":2}', 0),
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

UPDATE program_prices
SET offer_id = CASE id
  WHEN 6 THEN 1
  WHEN 7 THEN 2
  ELSE offer_id
END
WHERE program_id = 'archery';

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

INSERT INTO program_sessions (id, program_id, offer_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, enrolled_count, start_date, end_date, status, visible)
VALUES
  (
    21,
    'archery',
    1,
    'May Series — Morning Slot',
    'May 10, 17, 24, 31',
    'Sunday',
    '10:00',
    '12:00',
    'all',
    NULL,
    15,
    0,
    '2026-05-10',
    '2026-05-31',
    'active',
    1
  ),
  (
    22,
    'archery',
    1,
    'May Series — Afternoon Slot',
    'May 10, 17, 24, 31',
    'Sunday',
    '13:00',
    '15:00',
    'all',
    NULL,
    15,
    0,
    '2026-05-10',
    '2026-05-31',
    'active',
    1
  ),
  (
    23,
    'archery',
    2,
    'Women''s One-Off',
    'April 19, 2026',
    'Sunday',
    '12:00',
    '14:30',
    'all',
    'female',
    25,
    0,
    '2026-04-19',
    '2026-04-19',
    'closed',
    0
  )
ON CONFLICT(id) DO UPDATE SET
  program_id = excluded.program_id,
  offer_id = excluded.offer_id,
  name = excluded.name,
  season = excluded.season,
  day_of_week = excluded.day_of_week,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  age_group = excluded.age_group,
  gender_group = excluded.gender_group,
  capacity = excluded.capacity,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  visible = excluded.visible;

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

INSERT INTO waiver_documents (id, slug, title, body_html, version_label, active, published_at)
VALUES (
  2,
  'archery',
  'Sunnah Skills Archery Waiver',
  '<h2>Archery waiver</h2><p>In consideration of Ibraheem Gaied (the instructor), Sunnah Skills (the organizers) and their volunteers permitting me or any Dependant Registrants listed to participate in the activity of Archery, I agree to release, indemnify and save harmless Ibraheem Gaied (the instructor), Sunnah Skills (the organizers) and their volunteers from and against all claims, proceedings and/or actions in respect of any costs, losses, damage or injury arising by reason of my or the Dependant Registrants'' participation in the activity of Archery.</p><p>I fully understand that this activity involves risk of serious bodily injury which may be caused by my own actions, or inactions, those of others participating in the activity, the conditions in which the activity takes place, or the negligence of the instructor, organizers and/or their volunteers; and that there may be other risks either not known to me or not readily foreseeable at this time; and I fully accept and assume all such risks and all responsibility for losses, costs, and damages I incur as a result of my own participation in the activity. I understand that the rules set by the instructor, organizers and volunteers must be followed at all times.</p><p>I hereby release, discharge, and hold harmless Ibraheem Gaied (the instructor), Sunnah Skills (the organizers), their volunteers and other participants.</p><p><strong>Participant Signatures</strong></p><h2>Parent Consent</h2><p>I, the minor''s parent and/or legal guardian, understand the nature of the above referenced activity (Archery) and the minor''s experience and capabilities and believe the minor to be qualified to participate in such activity. I hereby release, discharge, hold harmless and agree to indemnify and save and hold harmless Ibraheem Gaied (the instructor), Sunnah Skills (the organizers) and their volunteers from all liability, claims, demands, losses, or damages on the minor''s account.</p><p><strong>Participant Signature</strong><br />If under 18, parent/guardian signature required.</p>',
  '2026.04.09',
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
