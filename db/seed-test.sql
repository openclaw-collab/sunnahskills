-- Test seed data for E2E tests
-- Run after schema.sql — uses INSERT OR REPLACE for idempotency
-- IMPORTANT: Replace the bcrypt hash below before first use:
--   node -e "const b=require('bcryptjs');console.log(b.hashSync('testpassword123',10))"

-- Local admin users (password: testpassword123)
INSERT OR REPLACE INTO admin_users (id, email, password_hash, name, role, status, permissions_json)
VALUES
  (1, 'muadh@sunnahskills.com', '$2b$10$0tGYu3yQyzzeTAK98nJW3.wMm2fpFJZbRgrDrdQy1DQ2bT5rSuIHu', 'Muadh', 'tech', 'active', '{}'),
  (2, 'laila@sunnahskills.com', '$2b$10$0tGYu3yQyzzeTAK98nJW3.wMm2fpFJZbRgrDrdQy1DQ2bT5rSuIHu', 'Laila', 'admin', 'active', '{}'),
  (3, 'mustafaa@sunnahskills.com', '$2b$10$0tGYu3yQyzzeTAK98nJW3.wMm2fpFJZbRgrDrdQy1DQ2bT5rSuIHu', 'Mustafaa', 'admin', 'active', '{}'),
  (4, 'ardo@sunnahskills.com', '$2b$10$0tGYu3yQyzzeTAK98nJW3.wMm2fpFJZbRgrDrdQy1DQ2bT5rSuIHu', 'Ardo', 'admin', 'active', '{}');

-- Programs matching registration.spec.ts expectations
INSERT OR REPLACE INTO programs (id, name, slug, type, description, status, supports_trial, supports_recurring)
VALUES
  ('bjj',           'Brazilian Jiu-Jitsu', 'bjj',          'recurring', 'BJJ program for all ages',        'active', 1, 1),
  ('archery',       'Traditional Archery', 'archery',       'recurring', 'Traditional archery training',    'active', 1, 0),
  ('outdoor',       'Outdoor Workshops',   'outdoor',       'workshop',  'Outdoor adventure workshops',     'active', 0, 0),
  ('bullyproofing', 'Bullyproofing',       'bullyproofing', 'recurring', 'Confidence and self-defense',     'active', 1, 1);

-- BJJ prices
INSERT OR REPLACE INTO program_prices (id, program_id, age_group, label, amount, frequency, registration_fee, active)
VALUES
  (1, 'bjj', 'youth', 'Youth Monthly', 8000,  'monthly', 5000, 1),
  (2, 'bjj', 'adult', 'Adult Monthly', 10000, 'monthly', 5000, 1);

-- BJJ sessions
INSERT OR REPLACE INTO program_sessions (id, program_id, name, day_of_week, start_time, end_time, age_group, capacity, enrolled_count, status)
VALUES
  (1, 'bjj', 'Monday Youth BJJ', 'Monday',    '16:00', '17:00', 'youth', 15, 0, 'active'),
  (2, 'bjj', 'Wednesday BJJ',    'Wednesday', '18:00', '19:30', 'adult', 20, 0, 'active');

-- Discount code for E2E payment tests
INSERT OR REPLACE INTO discounts (id, code, type, value, max_uses, current_uses, active)
VALUES (1, 'TESTCODE', 'percentage', 10, 100, 0, 1);
