# Email Setup Guide for Sunnah Skills

This guide will help you set up email notifications for your contact form using Cloudflare Email Routing and MailChannels.

## Prerequisites

- Cloudflare account with your domain
- Access to Cloudflare Dashboard
- Your domain should be active on Cloudflare

## Step 1: Configure Cloudflare Email Routing

### 1.1 Access Email Routing
1. Log into your Cloudflare Dashboard
2. Select your domain (`sunnahskills.pages.dev`)
3. Go to **Email** → **Email Routing**
4. Click **Get Started**

### 1.2 Create Email Address
1. Click **Create Address**
2. Create the following email address:
   - **Email**: `noreply@sunnahskills.pages.dev`
   - **Destination**: `mysunnahskill@gmail.com`
3. Click **Create**

### 1.3 Verify DNS Records
Cloudflare will automatically add these DNS records:
- `_mailchannels.sunnahskills.pages.dev` (TXT record)
- `mailchannels.sunnahskills.pages.dev` (CNAME record)

Make sure these records are active in your DNS settings.

## Step 2: Test Email Configuration

### 2.1 Test Email Address
1. Go to **Email** → **Email Routing** → **Addresses**
2. Find your `noreply@sunnahskills.pages.dev` address
3. Click **Test** to send a test email
4. Check your `mysunnahskill@gmail.com` inbox

### 2.2 Verify MailChannels Setup
The MailChannels integration should work automatically with Cloudflare Email Routing.

## Step 3: Deploy and Test

### 3.1 Deploy Your Changes
```bash
# Commit and push your changes
git add .
git commit -m "Configure email notifications"
git push origin main
```

### 3.2 Test Contact Form
1. Go to your live site: `https://sunnahskills.pages.dev`
2. Navigate to the Contact page
3. Fill out and submit the contact form
4. Check your email for the notification

## Step 4: Email Template Customization

The current email template includes:
- **Subject**: "New Contact Form Submission: [user's subject]"
- **Content**: Name, email, subject, message, and timestamp
- **Format**: Both plain text and HTML versions

### 4.1 Customize Email Template
You can modify the email template in `/functions/api/contact.ts`:

```typescript
const emailData = {
  to: "your-email@example.com", // Change to your email
  from: "noreply@sunnahskills.pages.dev", // Your domain email
  subject: `New Contact Form Submission: ${contact.subject}`,
  // ... customize the text and html content
};
```

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify DNS records are active
3. Test email routing in Cloudflare Dashboard
4. Check Cloudflare Workers logs for errors

### DNS Issues
1. Ensure `_mailchannels` TXT record exists
2. Ensure `mailchannels` CNAME record exists
3. Wait for DNS propagation (up to 24 hours)

### API Errors
1. Check Cloudflare Workers logs
2. Verify environment variables
3. Test API endpoints directly

## Security Considerations

- The `noreply` address prevents reply-to issues
- Email notifications are sent to your verified email
- Contact form data is stored in D1 database
- Admin access is password-protected

## Next Steps

1. Set up D1 database (see `DATABASE_SETUP.md`)
2. Configure admin panel access
3. Monitor email delivery rates
4. Consider adding email templates for responses

## Support

If you encounter issues:
1. Check Cloudflare Email Routing documentation
2. Review Cloudflare Workers logs
3. Test with a simple email first
4. Contact Cloudflare support if needed 