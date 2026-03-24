-- Admin bootstrap accounts for real environments.
-- Passwords are rotated and shared out-of-band; only bcrypt hashes live in repo.

INSERT INTO admin_users (id, email, password_hash, name, role, status, permissions_json)
VALUES
  (1, 'muadh@sunnahskills.com', '$2b$10$Zznzge26W9m8xoNlmbyK5uCQLMIndCdqfVOpK0FLXQvHWUA5FIe..', 'Muadh', 'tech', 'active', '{}'),
  (2, 'laila@sunnahskills.com', '$2b$10$iPrGnazJgeDS461l3TQQYuy2YPxxUzx9.kfSNxHI2VBdH.66afp6.', 'Laila', 'admin', 'active', '{}'),
  (3, 'mustafaa@sunnahskills.com', '$2b$10$gIGGCvZ26OyicGZQxBQwCOOSjyzjNn1etgY0yvARJ29zzXaJGI2UK', 'Mustafaa', 'admin', 'active', '{}'),
  (4, 'ardo@sunnahskills.com', '$2b$10$sj7iaSrHEWt3cugz0NtquOf9w4FOTuwux5xxQidlVBG3.EyyNOJAS', 'Ardo', 'admin', 'active', '{}')
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  permissions_json = excluded.permissions_json;
