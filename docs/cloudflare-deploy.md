# Cloudflare Deployment

## Current setup

| Setting | Value |
|---|---|
| Platform | Cloudflare Pages |
| Project name | `sunnahskills` |
| Production branch | `main` |
| Preview branch | `prototype` |
| Build command | `npm run build` |
| Build output | `dist/` |
| Functions directory | `functions/` |
| D1 database | `sunnahskills-admin-v2` (`fc0a958f-4bfe-487f-845f-bce49d4715d5`) |

Production Pages URL: `https://sunnahskills.pages.dev`

## Deploy

The project auto-deploys production on push to the `main` branch via the GitHub integration configured in the Cloudflare Pages dashboard.
Pushes to `prototype` create preview deployments.

To deploy manually:

```bash
npm run build
npx wrangler pages deploy dist --project-name=sunnahskills
```

## First-time setup (new machine / new account)

1. **Login to Wrangler:**

```bash
npx wrangler login
```

Verify you are in the correct Cloudflare account — the one that owns the `sunnahskills` Pages project and the `sunnahskills-admin-v2` D1 database:

```bash
npx wrangler whoami
```

2. **Verify D1 exists:**

```bash
npx wrangler d1 list
```

You should see `sunnahskills-admin-v2`. If not, the D1 binding in `wrangler.toml` must be updated to match the correct database ID.

3. **Set Cloudflare secrets:**

```bash
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name=sunnahskills
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name=sunnahskills
```

`VITE_STRIPE_PUBLISHABLE_KEY` can be set as a Pages environment variable, but the app now also falls back to `/api/payments/public-config` at runtime. Keep the secret key and webhook secret in Pages secrets:

- Cloudflare Pages → sunnahskills → Settings → Environment variables
- Add `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (or `pk_live_...` for production)

4. **Apply schema and seed:**

```bash
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/schema.sql --remote
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/seed.sql --remote
```

5. **Connect GitHub:**

In the Cloudflare Pages dashboard:
- Settings → Builds & deployments → Connect to Git
- Select the `openclaw-collab/sunnahskills` repository
- Production branch: `main`
- Preview branch: `prototype`

## `wrangler.toml` reference

```toml
name = "sunnahskills"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "sunnahskills-admin-v2"
database_id = "fc0a958f-4bfe-487f-845f-bce49d4715d5"

# R2 (uncomment after enabling R2 in Cloudflare dashboard)
# [[r2_buckets]]
# binding = "STUDIO_UPLOADS"
# bucket_name = "sunnahskills-studio-uploads"

[vars]
SITE_URL = "https://sunnahskills.pages.dev"
EMAIL_FROM = "noreply@sunnahskills.pages.dev"
EMAIL_TO = "mysunnahskill@gmail.com"
```

## R2 image uploads (Studio)

R2 is not yet enabled. To enable:

1. Enable R2 in your Cloudflare Dashboard (Billing → Add-ons)
2. `npx wrangler r2 bucket create sunnahskills-studio-uploads`
3. Uncomment the `[[r2_buckets]]` block in `wrangler.toml`
4. Redeploy

Until R2 is active, Studio image uploads are stored as base64 data URLs in the D1 `studio_sessions.uploads_json` column (functional for low-volume stakeholder review).

## GitHub repository

- Org: `openclaw-collab`
- Repo: `sunnahskills`
- Production branch: `main`
- Preview branch: `prototype`

## Troubleshooting

**D1 binding not found on deploy:**
Check `wrangler.toml` `database_id` matches the ID returned by `wrangler d1 list`. Re-create the binding in the Cloudflare Pages dashboard (Settings → Functions → D1 database bindings) if needed.

**`wrangler login` goes to wrong account:**
Run `wrangler logout` then `wrangler login` again and verify with `wrangler whoami`.

**Build fails with missing env variable:**
`VITE_STRIPE_PUBLISHABLE_KEY` should be set in the Pages dashboard when you want a build-time key, but the app will also fetch the publishable key from `/api/payments/public-config` at runtime.
