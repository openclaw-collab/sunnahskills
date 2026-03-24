ALTER TABLE guardian_accounts ADD COLUMN emergency_contact_name TEXT;
ALTER TABLE guardian_accounts ADD COLUMN emergency_contact_phone TEXT;
ALTER TABLE guardian_accounts ADD COLUMN account_role TEXT;
ALTER TABLE guardian_accounts ADD COLUMN completed_at DATETIME;

ALTER TABLE saved_students ADD COLUMN participant_type TEXT DEFAULT 'child';
ALTER TABLE saved_students ADD COLUMN is_account_holder INTEGER DEFAULT 0;

ALTER TABLE enrollment_orders ADD COLUMN waiver_version_id INTEGER;
ALTER TABLE enrollment_orders ADD COLUMN waiver_version_label TEXT;
ALTER TABLE enrollment_orders ADD COLUMN waiver_accepted_at DATETIME;
ALTER TABLE enrollment_orders ADD COLUMN waiver_signature_text TEXT;
ALTER TABLE enrollment_orders ADD COLUMN trial_credit_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enrollment_orders ADD COLUMN sibling_discount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enrollment_orders ADD COLUMN proration_code TEXT;

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

CREATE INDEX IF NOT EXISTS idx_waiver_documents_slug_active
  ON waiver_documents(slug, active, published_at DESC);

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
