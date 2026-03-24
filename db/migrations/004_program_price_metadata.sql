-- Legacy production/preview catalogs were created before program_prices.metadata existed.
-- Required for /api/programs and shared BJJ pricing metadata.
ALTER TABLE program_prices ADD COLUMN metadata TEXT;
