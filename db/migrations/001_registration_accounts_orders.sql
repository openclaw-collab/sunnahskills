-- Guardian passwordless accounts (magic link + account number sign-in)
CREATE TABLE IF NOT EXISTS guardian_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  account_number TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
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
  full_name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT,
  medical_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_students_account ON saved_students(guardian_account_id);

-- Multi-line checkout batch (links many registrations)
CREATE TABLE IF NOT EXISTS enrollment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guardian_account_id INTEGER REFERENCES guardian_accounts(id),
  guardian_id INTEGER REFERENCES guardians(id),
  status TEXT DEFAULT 'draft',
  total_cents INTEGER NOT NULL DEFAULT 0,
  amount_due_today_cents INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enrollment_orders_guardian ON enrollment_orders(guardian_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_orders_account ON enrollment_orders(guardian_account_id);

-- Semester config for admin-driven pricing (per program)
CREATE TABLE IF NOT EXISTS semesters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(id),
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

-- Registrations: link to batch order (nullable for legacy rows)
ALTER TABLE registrations ADD COLUMN enrollment_order_id INTEGER;
ALTER TABLE registrations ADD COLUMN payment_choice TEXT;
ALTER TABLE registrations ADD COLUMN line_subtotal_cents INTEGER;
ALTER TABLE registrations ADD COLUMN sibling_discount_applied INTEGER DEFAULT 0;

-- Payments: Stripe Invoice (Option D)
ALTER TABLE payments ADD COLUMN stripe_invoice_id TEXT;
ALTER TABLE payments ADD COLUMN enrollment_order_id INTEGER;
