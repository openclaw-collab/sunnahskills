-- Seed data for Sunnah Skills programs, sessions, and prices
-- BJJ sessions match merged plan: kids Fri 10 / Tue 2:30–3:30; Women Tue + Thu; Men Fri/Sat 8–9pm

INSERT OR REPLACE INTO programs (id, name, slug, type, description, age_min, age_max, supports_trial, supports_recurring, status)
VALUES
  ('bjj', 'Brazilian Jiu-Jitsu', 'bjj', 'recurring', 'Structured gi/no-gi grappling for youth and teens.', 5, 17, 1, 1, 'active'),
  ('archery', 'Seasonal Archery', 'archery', 'seasonal', 'Foundations of traditional archery in a seasonal format.', 8, 18, 0, 0, 'coming_soon'),
  ('outdoor', 'Outdoor Workshops', 'outdoor', 'workshop', 'Bushcraft, navigation, and outdoor skills intensives.', 10, 18, 0, 0, 'coming_soon'),
  ('bullyproofing', 'Bullyproofing Workshops', 'bullyproofing', 'workshop', 'Short-format bullyproofing series for youth.', 6, 16, 0, 0, 'coming_soon');

-- Kids: $12.50/class (1250¢); semester length variable — default 12 classes in metadata
INSERT OR REPLACE INTO program_prices (id, program_id, age_group, label, amount, frequency, registration_fee, metadata, active)
VALUES
  (1, 'bjj', 'girls-5-10', 'Girls 5–10 (per class)', 1250, 'per_session', 2500, '{"classes_in_semester_default":12,"track":"girls-5-10"}', 1),
  (2, 'bjj', 'boys-7-13', 'Boys 7–13 (per class)', 1250, 'per_session', 2500, '{"classes_in_semester_default":12,"track":"boys-7-13"}', 1),
  (3, 'bjj', 'women-11-tue', 'Teens+ Women 11+ — Tuesday', 1500, 'per_session', 2500, '{"classes_in_semester_default":12,"track":"women-11-tue"}', 1),
  (4, 'bjj', 'women-11-thu', 'Teens+ Women 11+ — Thursday', 1500, 'per_session', 2500, '{"classes_in_semester_default":12,"track":"women-11-thu"}', 1),
  (5, 'bjj', 'men-14', 'Teens+ Men 14+', 1500, 'per_session', 2500, '{"classes_in_semester_default":12,"track":"men-14"}', 1),
  (6, 'archery', '8-12', 'Season (8-12)', 18000, 'per_series', 0, NULL, 1),
  (7, 'archery', '13-18', 'Season (13-18)', 20000, 'per_series', 0, NULL, 1),
  (8, 'outdoor', '10-18', 'Single Workshop', 7500, 'per_workshop', 0, NULL, 1),
  (9, 'bullyproofing', '6-16', 'Workshop Series', 12500, 'per_series', 0, NULL, 1);

DELETE FROM program_sessions WHERE program_id = 'bjj';

INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
VALUES
  ('bjj', 'Girls 5–10 — Friday', NULL, 'Friday', '10:00', '11:00', 'girls-5-10', 'female', 16, 'active', 1),
  ('bjj', 'Girls 5–10 — Tuesday', NULL, 'Tuesday', '14:30', '15:30', 'girls-5-10', 'female', 16, 'active', 1),
  ('bjj', 'Boys 7–13 — Friday', NULL, 'Friday', '10:00', '11:00', 'boys-7-13', 'male', 16, 'active', 1),
  ('bjj', 'Boys 7–13 — Tuesday', NULL, 'Tuesday', '14:30', '15:30', 'boys-7-13', 'male', 16, 'active', 1),
  ('bjj', 'Teens+ Women 11+ — Tuesday', NULL, 'Tuesday', '12:30', '14:00', 'women-11-tue', 'female', 14, 'active', 1),
  ('bjj', 'Teens+ Women 11+ — Thursday', NULL, 'Thursday', '20:00', '21:30', 'women-11-thu', 'female', 14, 'active', 1),
  ('bjj', 'Teens+ Men 14+ — Friday', NULL, 'Friday', '20:00', '21:00', 'men-14', 'male', 18, 'active', 1),
  ('bjj', 'Teens+ Men 14+ — Saturday', NULL, 'Saturday', '20:00', '21:00', 'men-14', 'male', 18, 'active', 1);

INSERT OR REPLACE INTO semesters (id, name, program_id, start_date, end_date, classes_in_semester, price_per_class_cents, registration_fee_cents, later_payment_date, active)
VALUES
  (1, 'Spring 2026', 'bjj', '2026-03-01', '2026-06-15', 12, 1250, 2500, NULL, 1);
