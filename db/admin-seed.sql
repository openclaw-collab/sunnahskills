-- Admin bootstrap accounts for real environments.
-- Passwords are rotated and shared out-of-band; only bcrypt hashes live in repo.

INSERT INTO admin_users (id, email, password_hash, name, role, status, permissions_json)
VALUES
  (1, 'admin@sunnahskills.com', '$2b$10$5gQ3IXc4jyJ7KBxfN5D38ud99e8posxCIK3BYpStOeBu7x08PT/F.', 'Muadh', 'tech', 'active', '{}'),
  (2, 'laila@sunnahskills.com', '$2b$10$nuy4ai8ELnCYUXdDZTexhOlP5eeXzysHvYnd8aQUiiiWZOz1auy92', 'Laila', 'admin', 'active', '{}'),
  (3, 'mustafaa@sunnahskills.com', '$2b$10$5DXgH3KTJZSmboHZlnW60uX6m6WUP/r3E72zADr9gHd7lt94lMr0C', 'Mustafaa', 'admin', 'active', '{}'),
  (4, 'ardo@sunnahskills.com', '$2b$10$UuMh0CipxBctrbsHgaKhEuDEVGTSc4KN1I8svq/wwtd9ELDLUOUl2', 'Ardo', 'admin', 'active', '{}')
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  permissions_json = excluded.permissions_json;
