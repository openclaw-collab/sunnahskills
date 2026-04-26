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

ALTER TABLE program_prices ADD COLUMN offer_id INTEGER REFERENCES program_offers(id);
ALTER TABLE program_sessions ADD COLUMN offer_id INTEGER REFERENCES program_offers(id);
ALTER TABLE registrations ADD COLUMN offer_id INTEGER REFERENCES program_offers(id);
ALTER TABLE waivers ADD COLUMN waiver_document_id INTEGER REFERENCES waiver_documents(id);
ALTER TABLE waivers ADD COLUMN waiver_version_label TEXT;
