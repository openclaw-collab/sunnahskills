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
  age_group TEXT NOT NULL,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL, -- cents
  frequency TEXT NOT NULL, -- 'monthly', 'per_session', 'per_workshop', 'per_series'
  registration_fee INTEGER DEFAULT 0, -- cents
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Program sessions/classes
CREATE TABLE IF NOT EXISTS program_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id TEXT NOT NULL REFERENCES programs(id),
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
  session_id INTEGER REFERENCES program_sessions(id),
  price_id INTEGER REFERENCES program_prices(id),
  status TEXT DEFAULT 'draft', -- draft, submitted, pending_payment, paid, active, waitlisted, cancelled, refunded
  preferred_start_date TEXT,
  schedule_choice TEXT,
  sibling_registration_id INTEGER,
  program_specific_data TEXT,
  admin_notes TEXT,
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
  stripe_subscription_id TEXT,
  amount INTEGER NOT NULL, -- cents
  subtotal INTEGER,
  discount_amount INTEGER DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'unpaid', -- unpaid, pending, paid, failed, refunded, partially_refunded
  payment_type TEXT, -- 'one_time', 'recurring', 'deposit'
  receipt_url TEXT,
  metadata TEXT,
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
