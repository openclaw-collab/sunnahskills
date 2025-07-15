# 🗄️ Database & Email Setup Guide

## **Step 1: Create Cloudflare D1 Database**

### 1.1 Create Database
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Workers & Pages"** in the left sidebar
3. Click **"D1"** in the left sidebar
4. Click **"Create database"**
5. Enter:
   - **Database name**: `sunnah-skills-admin`
   - **Location**: Choose closest to your users
6. Click **"Create"**

### 1.2 Get Database ID
1. After creating, click on your database
2. Copy the **Database ID** (looks like: `12345678-1234-1234-1234-123456789abc`)
3. Replace `your-database-id-here` in `wrangler.toml` with your actual Database ID

### 1.3 Initialize Database Schema
```bash
# Install Wrangler locally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Apply the database schema
wrangler d1 execute sunnah-skills-admin --file=./db/schema.sql
```

## **Step 2: Configure Email Notifications**

### 2.1 Set up Cloudflare Email
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Email"** in the left sidebar
3. Click **"Email Routing"**
4. Add your domain: `sunnahskills.pages.dev`
5. Create a **Custom address**:
   - **Email**: `noreply@sunnahskills.pages.dev`
   - **Destination**: `mysunnahskill@gmail.com`

### 2.2 Configure DNS Records
Add these DNS records to your domain:
```
Type: TXT
Name: @
Content: v=spf1 include:_spf.mx.cloudflare.net ~all

Type: MX
Name: @
Priority: 1
Content: route1.mx.cloudflare.net
```

## **Step 3: Deploy**

### 3.1 Update Configuration
1. Update `wrangler.toml` with your Database ID
2. Commit and push changes:
```bash
git add .
git commit -m "Add D1 database and email configuration"
git push
```

### 3.2 Test
1. Submit a contact form at: `https://sunnahskills.pages.dev/contact`
2. Check admin page: `https://sunnahskills.pages.dev/admin`
3. Check your email: `mysunnahskill@gmail.com`

## **✅ What You'll Get:**

- **Persistent Storage**: Contact data never gets lost
- **Email Notifications**: Get emails for every submission
- **Admin Interface**: View all submissions at `/admin`
- **Database Backup**: Automatic backups by Cloudflare

## **🔧 Troubleshooting:**

### Database Issues
- Make sure Database ID is correct in `wrangler.toml`
- Check Cloudflare D1 dashboard for errors
- Verify schema was applied correctly

### Email Issues
- Check DNS records are correct
- Verify email routing is set up
- Check spam folder for test emails

## **📞 Support**

If you encounter issues:
1. Check Cloudflare dashboard logs
2. Verify all configuration steps
3. Test with simple contact form submission 