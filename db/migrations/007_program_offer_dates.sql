CREATE TABLE IF NOT EXISTS program_offer_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL REFERENCES program_offers(id) ON DELETE CASCADE,
  event_date TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_program_offer_dates_offer
  ON program_offer_dates(offer_id, sort_order, event_date);
