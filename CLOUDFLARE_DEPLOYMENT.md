# 🚀 Cloudflare Pages + Workers Deployment Guide

## Overview
This project has been restructured to work with Cloudflare Pages (frontend) + Cloudflare Workers (backend API).

## 📁 Project Structure
```
sunnahskills/
├── client/                 # React frontend
├── functions/             # Cloudflare Workers API
│   └── api/[[route]].ts  # API handler
├── dist/                  # Build output
├── wrangler.toml         # Cloudflare configuration
└── package.json          # Frontend dependencies only
```

## 🔧 Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Deploy to Cloudflare Pages

#### Option A: Deploy via Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Pages → Create a project
3. Connect your GitHub repository
4. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

#### Option B: Deploy via Wrangler CLI
```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=sunnahskills
```

## 🌐 API Endpoints

This project uses Cloudflare Pages Functions under `functions/api/*`.

### Contact Form
- **POST** `/api/contact` - Submit contact form

### Registration + Payment
- **POST** `/api/register` - Create registration
- **POST** `/api/payments/create-intent` - Create Stripe PaymentIntent (one-time)
- **POST** `/api/payments/create-subscription` - Create Stripe Subscription (BJJ recurring)
- **POST** `/api/payments/webhook` - Stripe webhook handler

### Admin auth + admin APIs
- **POST** `/api/auth/login`
- **POST** `/api/auth/logout`
- **GET** `/api/auth/me`
- **GET** `/api/admin/registrations`
- **GET** `/api/admin/registrations/:id`
- **PATCH** `/api/admin/registrations/:id`
- **GET** `/api/admin/payments`
- **GET** `/api/admin/programs`
- **PATCH** `/api/admin/programs`
- **PATCH** `/api/admin/sessions`
- **GET** `/api/admin/contacts`
- **GET** `/api/admin/export`

## 🔄 How It Works

1. **Frontend**: React app built with Vite, deployed to Cloudflare Pages
2. **Backend**: Cloudflare Workers handle API requests
3. **Storage**: In-memory storage (replace with D1 database for production)
4. **CORS**: Handled automatically by Workers

## 🛠️ Development

### Local Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 📝 Notes

- **Storage**: Currently using in-memory storage. For production, set up Cloudflare D1 database
- **Environment Variables**: Add any needed environment variables in Cloudflare Pages dashboard
- **Custom Domain**: Set up custom domain in Cloudflare Pages settings

## 🚨 Important Changes Made

1. **Removed server dependencies**: Express, database connections, etc.
2. **Updated API calls**: Frontend now calls `/api/contact` instead of `/api/contacts`
3. **Simplified build**: Only builds frontend, Workers handle backend
4. **CORS handling**: Workers automatically handle CORS headers

## 🎯 Next Steps

1. Deploy to Cloudflare Pages
2. Test the contact form
3. Set up D1 database for persistent storage
4. Add authentication for admin endpoints
5. Configure custom domain

## 📞 Support

If you encounter any issues:
1. Check Cloudflare Pages deployment logs
2. Verify API endpoints are working
3. Test locally with `npm run dev` 