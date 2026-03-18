## D1 setup (schema + seed)

### 1) Create the D1 database

In Cloudflare Dashboard → **Workers & Pages** → **D1** → create:

- Name: `sunnahskills-admin` (or your preferred name)

Update `wrangler.toml` with the database id.

### 2) Apply schema

```bash
npm i -g wrangler
wrangler login
wrangler d1 execute sunnahskills-admin --file=./db/schema.sql
```

### 3) Seed data (programs/sessions/prices)

```bash
wrangler d1 execute sunnahskills-admin --file=./db/seed.sql
```

