# Email Forwarding Setup Guide

This guide explains how to set up the email forwarding feature that allows users to save documents by forwarding emails to `save@archevi.ca`.

## Overview

The email forwarding feature works as follows:

1. User forwards an email to `save@archevi.ca`
2. Windmill receives the email via SMTP
3. The `process_email_forward` script:
   - Verifies the sender is a registered family member
   - Extracts subject (title) and body (content)
   - Processes PDF attachments
   - Saves the document with AI features (auto-categorization, tags)
   - Sends confirmation email back to sender

## Prerequisites

- Windmill instance (cloud or self-hosted)
- Domain with DNS access (for MX records)
- Resend account for sending confirmation emails

## Setup Steps

### 1. Deploy the Script

```bash
# Set your Windmill token
export WINDMILL_TOKEN=your_token_here

# Deploy the script
python scripts/deploy_email_forward.py
```

### 2. Configure DNS (Self-Hosted Only)

For self-hosted Windmill, you need to configure DNS records:

**Option A: Port 25 on same IP as Windmill**

```
# MX record
mail.archevi.ca  MX  10  archevi.ca
```

**Option B: Port 25 on different IP**

```
# A record for mail server
mail.archevi.ca  A  <mail-server-ip>

# MX record
archevi.ca  MX  10  mail.archevi.ca
```

### 3. Configure Windmill Email Domain

1. Go to Windmill Admin Settings
2. Navigate to "Core" tab
3. Set "Email Domain" to `archevi.ca`
4. Save settings

### 4. Create Email Trigger

1. Go to the script: `f/chatbot/process_email_forward`
2. Click "Triggers" tab
3. Click "Add Trigger" -> "Email"
4. Configure:
   - **Local part**: `save` (creates `save@archevi.ca`)
   - Or create a custom email trigger for more control

### 5. Verify Resend Configuration

Ensure the Resend API key is configured:

```
Windmill Variable: u/admin/resend_api_key
Value: re_xxxxxxxxxxxx
```

## Usage

### Basic Usage

Forward any email to `save@archevi.ca` from your registered email address.

### With Category

Add query parameters to the email address:

```
save+category=medical@archevi.ca
save+category=financial@archevi.ca
save+visibility=private@archevi.ca
```

### Supported Attachments

- **PDF files**: Text is extracted automatically
- **Images**: Noted but not OCR'd (use web upload for OCR)
- **Other files**: Ignored

## Email Processing Flow

```
Email received at save@archevi.ca
           │
           ▼
    Extract sender email
           │
           ▼
    Verify sender is registered ──No──> Send rejection email
           │
          Yes
           │
           ▼
    Extract subject → title
    Extract body → content
           │
           ▼
    Process PDF attachments
           │
           ▼
    Check for duplicates ──Duplicate──> Return error
           │
          New
           │
           ▼
    Auto-categorize content
    Extract tags
           │
           ▼
    Generate embedding
    Save to database
           │
           ▼
    Send confirmation email
```

## Troubleshooting

### Email not received

1. Check DNS MX records with `dig MX archevi.ca`
2. Verify port 25 is open: `telnet archevi.ca 25`
3. Check Windmill email domain setting
4. Review Windmill logs for SMTP errors

### Sender not recognized

1. Verify sender email matches exactly (case-insensitive)
2. Check family_members table has the email with `is_active = true`
3. Ensure member has set their password (completed registration)

### Confirmation email not sent

1. Check Resend API key is configured
2. Verify Resend has the sending domain verified
3. Review Windmill script logs for errors

### PDF attachment not processed

1. Check attachment is under 10MB
2. Verify it's a valid PDF (not password-protected)
3. Check pypdf is in script dependencies

## Rate Limits

- **Windmill Community Edition**: 100 emails/day
- **Windmill Pro**: Unlimited
- **Resend Free Tier**: 100 emails/day, 3000/month

## Security Considerations

1. **Sender verification**: Only registered family members can save documents
2. **Duplicate detection**: Prevents the same email from being saved twice
3. **Content isolation**: Documents are saved to the sender's tenant only
4. **Rate limiting**: Consider adding per-sender rate limits for production

## Future Enhancements

- [ ] Server-side OCR for image attachments
- [ ] Support for per-family email addresses (`save@hudson.archevi.ca`)
- [ ] Email threading (group related emails)
- [ ] Virus scanning for attachments
- [ ] Per-sender rate limiting
