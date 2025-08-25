# Brevo Email Setup Instructions

## Steps to Complete Setup:

### 1. Create Brevo Account
1. Go to [https://www.brevo.com](https://www.brevo.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. Log into Brevo dashboard
2. Click on your name (top right) → "SMTP & API"
3. Click "Create a new API key"
4. Name it "Idlewood Capital Website"
5. Copy the API key (starts with "xkeysib-")

### 3. Add API Key to Vercel
1. Go to your Vercel dashboard
2. Select the "idlewood-capital-website" project
3. Go to Settings → Environment Variables
4. Add new variable:
   - Name: `BREVO_API_KEY`
   - Value: [paste your API key]
   - Environment: Production, Preview, Development
5. Click "Save"

### 4. Configure Sender Domain (Optional but Recommended)
1. In Brevo dashboard, go to "Senders & IP"
2. Add and verify "idlewoodcapital.com" domain
3. Add the DNS records they provide to your domain (in Wix DNS settings)
4. This allows sending from "noreply@idlewoodcapital.com"

### 5. Create Contact List (Optional)
1. In Brevo, go to "Contacts" → "Lists"
2. Create a new list called "Website Inquiries"
3. Note the List ID (usually 2 or 3)
4. Update line 87 in `api/contact.js` with your List ID

## Testing:
1. After adding the API key to Vercel, your form should work immediately
2. Test by submitting the contact form on your website
3. Check inbox at info@idlewoodcapital.com for the email
4. Check Brevo dashboard → Contacts to see if contact was added

## Troubleshooting:
- If emails aren't sending, check Vercel Functions logs for errors
- Make sure the API key is correctly added to Vercel environment variables
- Verify sender domain to avoid spam filters