-- Contacts table (existing, preserved)
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_timestamp ON contacts(timestamp);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Admin users (for proper admin auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  status TEXT DEFAULT 'active',
  permissions_json TEXT DEFAULT '{}',
  disabled_at DATETIME,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions (httpOnly cookie session tokens)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_admin_user_id INTEGER REFERENCES admin_users(id),
  subject_admin_user_id INTEGER REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_actor ON admin_activity_logs(actor_admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_subject ON admin_activity_logs(subject_admin_user_id);

-- Physical training locations / campuses
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'coming_soon', 'archived'
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

-- Programs catalog
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'recurring', 'seasonal', 'workshop'
  description TEXT,
  age_min INTEGER,
  age_max INTEGER,
  supports_trial INTEGER DEFAULT 0,
  supports_recurring INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'coming_soon', 'archived'
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Program prices (admin-editable, per age group)
CREATE TABLE IF NOT EXISTS program_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id TEXT NOT NULL REFERENCES programs(id),
  location_id TEXT REFERENCES locations(id),
  offer_id INTEGER REFERENCES program_offers(id),
  age_group TEXT NOT NULL,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL, -- cents
  frequency TEXT NOT NULL, -- 'monthly', 'per_session', 'per_workshop', 'per_series'
  registration_fee INTEGER DEFAULT 0, -- cents
  metadata TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Program offers (public/private purchasable configurations layered over sessions + prices)
CREATE TABLE IF NOT EXISTS program_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id TEXT NOT NULL REFERENCES programs(id),
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  confirmation_notes TEXT,
  is_private INTEGER DEFAULT 0,
  access_code TEXT,
  active INTEGER DEFAULT 1,
  audience_gender TEXT,
  waiver_slug TEXT DEFAULT 'registration',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_program_offers_program ON program_offers(program_id, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_offers_access_code ON program_offers(access_code);

CREATE TABLE IF NOT EXISTS program_offer_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL REFERENCES program_offers(id) ON DELETE CASCADE,
  event_date TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_program_offer_dates_offer ON program_offer_dates(offer_id, sort_order, event_date);

-- Program sessions/classes
CREATE TABLE IF NOT EXISTS program_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id TEXT NOT NULL REFERENCES programs(id),
  location_id TEXT REFERENCES locations(id),
  offer_id INTEGER REFERENCES program_offers(id),
  name TEXT NOT NULL,
  season TEXT,
  day_of_week TEXT,
  start_time TEXT,
  end_time TEXT,
  age_group TEXT,
  gender_group TEXT,
  capacity INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'waitlist_only', 'closed', 'coming_soon'
  visible INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Guardians
CREATE TABLE IF NOT EXISTS guardians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  relationship TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guardian_id INTEGER NOT NULL REFERENCES guardians(id),
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth TEXT,
  age INTEGER,
  gender TEXT,
  prior_experience TEXT,
  skill_level TEXT,
  medical_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registrations (core enrollment entity)
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guardian_id INTEGER NOT NULL REFERENCES guardians(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  program_id TEXT NOT NULL REFERENCES programs(id),
  offer_id INTEGER REFERENCES program_offers(id),
  session_id INTEGER REFERENCES program_sessions(id),
  price_id INTEGER REFERENCES program_prices(id),
  status TEXT DEFAULT 'draft', -- draft, submitted, pending_payment, paid, active, waitlisted, cancelled, refunded
  preferred_start_date TEXT,
  schedule_choice TEXT,
  sibling_registration_id INTEGER,
  program_specific_data TEXT,
  admin_notes TEXT,
  enrollment_order_id INTEGER,
  payment_choice TEXT,
  line_subtotal_cents INTEGER,
  sibling_discount_applied INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registrations_program ON registrations(program_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at);

-- Waivers / consent
CREATE TABLE IF NOT EXISTS waivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL REFERENCES registrations(id),
  waiver_document_id INTEGER REFERENCES waiver_documents(id),
  waiver_version_label TEXT,
  liability_waiver INTEGER DEFAULT 0,
  photo_consent INTEGER DEFAULT 0,
  medical_consent INTEGER DEFAULT 0,
  terms_agreement INTEGER DEFAULT 0,
  signature_text TEXT,
  signed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL REFERENCES registrations(id),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  amount INTEGER NOT NULL, -- cents
  subtotal INTEGER,
  discount_amount INTEGER DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'cad',
  status TEXT DEFAULT 'unpaid', -- unpaid, pending, paid, failed, refunded, partially_refunded
  payment_type TEXT, -- 'one_time', 'recurring', 'deposit'
  receipt_url TEXT,
  metadata TEXT,
  enrollment_order_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Discounts / promo codes
CREATE TABLE IF NOT EXISTS discounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'percentage', 'fixed', 'sibling'
  value INTEGER NOT NULL,
  program_id TEXT, -- NULL = all programs
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from DATETIME,
  valid_until DATETIME,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guardian_id INTEGER REFERENCES guardians(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(id),
  session_id INTEGER REFERENCES program_sessions(id),
  notified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GrappleMap / admin-authored technique sequences
CREATE TABLE IF NOT EXISTS technique_sequences (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  position_category TEXT NOT NULL,
  starting_position TEXT,
  ending_position TEXT,
  difficulty TEXT DEFAULT 'beginner',
  description_json TEXT DEFAULT '[]',
  markers_json TEXT DEFAULT '[]',
  frames_json TEXT DEFAULT '[]',
  sources_json TEXT DEFAULT '[]',
  verified INTEGER DEFAULT 0,
  created_by_admin_user_id INTEGER REFERENCES admin_users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_technique_sequences_slug ON technique_sequences(slug);
CREATE INDEX IF NOT EXISTS idx_technique_sequences_category ON technique_sequences(position_category);
-- -------------------------------------------------------
-- Stakeholder Studio (shared review sessions)
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS studio_sessions (
  id TEXT PRIMARY KEY,                   -- UUID used as URL token
  name TEXT,
  protected INTEGER DEFAULT 0,          -- 1 = requires password
  password_hash TEXT,                    -- bcrypt hash, nullable
  theme_preset_id TEXT DEFAULT 'brand',
  custom_theme_json TEXT,                -- JSON: { background, subtheme1, highlight }
  edits_json TEXT DEFAULT '[]',          -- JSON array of StudioEditEntry
  comments_json TEXT DEFAULT '[]',       -- JSON array of StudioCommentEntry
  uploads_json TEXT DEFAULT '[]',        -- JSON array of StudioUploadEntry
  positions_json TEXT DEFAULT '{}',      -- JSON object: { [componentId]: { dx, dy } }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_studio_sessions_created ON studio_sessions(created_at);

-- Rate limiting for admin login
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 1,
  first_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  blocked_until DATETIME,
  expires_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked_until);

-- Login attempt audit log
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  ip_address TEXT,
  success INTEGER DEFAULT 0,
  reason TEXT,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

-- Guardian passwordless accounts (magic link + account number)
CREATE TABLE IF NOT EXISTS guardian_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  account_number TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  account_role TEXT,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guardian_accounts_account_number ON guardian_accounts(account_number);

CREATE TABLE IF NOT EXISTS guardian_magic_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL,
  guardian_account_id INTEGER NOT NULL REFERENCES guardian_accounts(id),
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guardian_magic_tokens_hash ON guardian_magic_tokens(token_hash);

CREATE TABLE IF NOT EXISTS guardian_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guardian_account_id INTEGER NOT NULL REFERENCES guardian_accounts(id),
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guardian_sessions_token ON guardian_sessions(token);

CREATE TABLE IF NOT EXISTS saved_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guardian_account_id INTEGER NOT NULL REFERENCES guardian_accounts(id),
  participant_type TEXT DEFAULT 'child',
  is_account_holder INTEGER DEFAULT 0,
  full_name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT,
  medical_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_students_account ON saved_students(guardian_account_id);

CREATE TABLE IF NOT EXISTS enrollment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guardian_account_id INTEGER REFERENCES guardian_accounts(id),
  guardian_id INTEGER REFERENCES guardians(id),
  status TEXT DEFAULT 'draft',
  manual_review_status TEXT DEFAULT 'none',
  manual_review_reason TEXT,
  last_payment_error TEXT,
  last_payment_attempt_at DATETIME,
  total_cents INTEGER NOT NULL DEFAULT 0,
  amount_due_today_cents INTEGER DEFAULT 0,
  later_amount_cents INTEGER NOT NULL DEFAULT 0,
  later_payment_date TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT,
  second_stripe_payment_intent_id TEXT,
  later_charge_reminder_sent_at DATETIME,
  waiver_version_id INTEGER,
  waiver_version_label TEXT,
  waiver_accepted_at DATETIME,
  waiver_signature_text TEXT,
  trial_credit_cents INTEGER NOT NULL DEFAULT 0,
  sibling_discount_cents INTEGER NOT NULL DEFAULT 0,
  proration_code TEXT,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enrollment_orders_guardian ON enrollment_orders(guardian_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_orders_account ON enrollment_orders(guardian_account_id);

CREATE TABLE IF NOT EXISTS semesters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(id),
  location_id TEXT REFERENCES locations(id),
  start_date TEXT,
  end_date TEXT,
  classes_in_semester INTEGER NOT NULL DEFAULT 12,
  price_per_class_cents INTEGER,
  registration_fee_cents INTEGER DEFAULT 0,
  later_payment_date TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_semesters_program ON semesters(program_id);

CREATE TABLE IF NOT EXISTS waiver_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body_html TEXT NOT NULL,
  version_label TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waiver_documents_slug_active ON waiver_documents(slug, active, published_at DESC);

CREATE TABLE IF NOT EXISTS trial_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id TEXT NOT NULL REFERENCES programs(id),
  account_holder_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  participant_type TEXT NOT NULL,
  participant_full_name TEXT NOT NULL,
  participant_age INTEGER NOT NULL,
  participant_gender TEXT NOT NULL,
  desired_date TEXT NOT NULL,
  notes TEXT,
  qr_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'booked',
  verified_at DATETIME,
  verified_by TEXT,
  redeemed_order_id INTEGER REFERENCES enrollment_orders(id),
  redeemed_registration_id INTEGER REFERENCES registrations(id),
  matched_guardian_account_id INTEGER REFERENCES guardian_accounts(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trial_bookings_email ON trial_bookings(email);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_status ON trial_bookings(status);

CREATE TABLE IF NOT EXISTS proration_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  note TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_by_admin_email TEXT,
  redeemed_at DATETIME,
  redeemed_order_id INTEGER REFERENCES enrollment_orders(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proration_codes_active ON proration_codes(active, redeemed_at);
