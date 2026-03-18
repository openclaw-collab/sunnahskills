-- Seed data for Sunnah Skills programs, sessions, and prices

INSERT INTO programs (id, name, slug, type, description, age_min, age_max, supports_trial, supports_recurring, status)
VALUES
  ('bjj', 'Brazilian Jiu-Jitsu', 'bjj', 'recurring', 'Structured gi/no-gi grappling for youth and teens.', 5, 17, 1, 1, 'active'),
  ('archery', 'Seasonal Archery', 'archery', 'seasonal', 'Foundations of traditional archery in a seasonal format.', 8, 18, 0, 0, 'active'),
  ('outdoor', 'Outdoor Workshops', 'outdoor', 'workshop', 'Bushcraft, navigation, and outdoor skills intensives.', 10, 18, 0, 0, 'active'),
  ('bullyproofing', 'Bullyproofing Workshops', 'bullyproofing', 'workshop', 'Short-format bullyproofing series for youth.', 6, 16, 0, 0, 'active');

-- Program prices (placeholder amounts in cents)
INSERT INTO program_prices (program_id, age_group, label, amount, frequency, registration_fee, active)
VALUES
  -- BJJ monthly tuition
  ('bjj', '5-11', 'Youth (5-11)', 9000, 'monthly', 2500, 1),
  ('bjj', '12+', 'Teen+ (12+)', 11000, 'monthly', 2500, 1),
  -- Archery seasonal
  ('archery', '8-12', 'Season (8-12)', 18000, 'per_series', 0, 1),
  ('archery', '13-18', 'Season (13-18)', 20000, 'per_series', 0, 1),
  -- Outdoor workshops
  ('outdoor', '10-18', 'Single Workshop', 7500, 'per_workshop', 0, 1),
  -- Bullyproofing series
  ('bullyproofing', '6-16', 'Workshop Series', 12500, 'per_series', 0, 1);

-- Program sessions (placeholder schedule)
INSERT INTO program_sessions (program_id, name, season, day_of_week, start_time, end_time, age_group, gender_group, capacity, status, visible)
VALUES
  -- BJJ
  ('bjj', 'Youth BJJ', NULL, 'Saturday', '10:00', '10:45', '5-11', 'mixed', 16, 'active', 1),
  ('bjj', 'Teen BJJ', NULL, 'Saturday', '11:00', '12:00', '12+', 'mixed', 18, 'active', 1),
  -- Archery
  ('archery', 'Summer Archery', 'Summer', 'Sunday', '14:00', '15:30', '8-12', 'mixed', 14, 'active', 1),
  ('archery', 'Fall Archery', 'Fall', 'Sunday', '14:00', '15:30', '13-18', 'mixed', 14, 'active', 1),
  -- Outdoor Workshops
  ('outdoor', 'Fire & Shelter Basics', NULL, 'One-off', '10:00', '13:00', '10-18', 'mixed', 18, 'active', 1),
  -- Bullyproofing
  ('bullyproofing', 'Bullyproofing Series', NULL, 'Weeknight', '18:00', '19:00', '6-16', 'mixed', 20, 'active', 1);

