## Cloudflare Pages deployment

### Build settings

- **Framework**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`

### D1 binding

This project expects a D1 binding named `DB` (see `wrangler.toml`).

### Secrets / environment variables

Set these in the Cloudflare Pages project:

- **Secrets**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

- **Vars**
  - `SITE_URL`
  - `EMAIL_FROM`
  - `EMAIL_TO`
  - `STRIPE_PUBLISHABLE_KEY` (safe to store as a variable)

### Deploy

- Via dashboard: connect repo → configure build settings → deploy.
- Via CLI:

```bash
npm i -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=sunnahskills
```

