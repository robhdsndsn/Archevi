# Calendar Integration

Sync your document expiry dates to your favorite calendar app (Google Calendar, Apple Calendar, Outlook) via iCal feed subscription.

## Overview

The Calendar Integration feature allows you to:

- **Subscribe** to a personalized iCal feed URL
- **Receive reminders** before documents expire (1 day, 1 week, 2 weeks, 1 month)
- **Filter by category** which document types appear in your calendar
- **Auto-sync** - calendar updates automatically when you add documents with expiry dates
- **Secure access** via unique token (regenerate anytime to revoke access)

## Setting Up Calendar Integration

### Step 1: Access Settings

Navigate to **Settings** in the Archevi app. You'll find the **Calendar Integration** card after the Notifications section.

### Step 2: Configure Your Feed

1. **Enable/Disable** - Toggle the calendar feed on or off
2. **Copy Feed URL** - Click the copy button to get your unique iCal URL
3. **Select Categories** - Choose which document types to include:
   - Insurance
   - Legal
   - Medical
   - Financial
   - Receipts
   - Auto
   - Home
4. **Set Reminders** - Choose when to receive alerts before expiry:
   - 1 day before
   - 1 week before
   - 2 weeks before
   - 1 month before

### Step 3: Subscribe in Your Calendar App

#### Google Calendar

1. Copy the feed URL from Archevi Settings
2. Open [Google Calendar](https://calendar.google.com)
3. Click the **+** next to "Other calendars" in the left sidebar
4. Select **From URL**
5. Paste the feed URL
6. Click **Add calendar**

Your document expiry dates will appear within a few minutes.

#### Apple Calendar (macOS)

1. Copy the feed URL from Archevi Settings
2. Open Calendar app
3. Go to **File > New Calendar Subscription**
4. Paste the feed URL
5. Click **Subscribe**
6. Configure refresh interval (recommended: every hour)
7. Click **OK**

#### Apple Calendar (iOS)

1. Copy the feed URL from Archevi Settings
2. Open **Settings > Calendar > Accounts**
3. Tap **Add Account > Other**
4. Tap **Add Subscribed Calendar**
5. Paste the feed URL
6. Tap **Next** and then **Save**

#### Microsoft Outlook

1. Copy the feed URL from Archevi Settings
2. Open Outlook
3. Go to **Calendar > Add Calendar > Subscribe from web**
4. Paste the feed URL
5. Give the calendar a name
6. Click **Import**

## How It Works

### Document Expiry Dates

When you upload a document to Archevi, the AI automatically extracts expiry dates from:

- Insurance policies (renewal dates)
- Contracts and leases (end dates)
- Licenses and certifications (expiration dates)
- Warranties (coverage end dates)
- Prescriptions (refill dates)

These dates are stored in the document's metadata and synced to your calendar feed.

### iCal Feed Format

The feed generates standard RFC 5545 iCal format with:

- **VEVENT** for each expiry date
- **VALARM** reminders based on your configured timing
- **CATEGORIES** for filtering in calendar apps
- **URL** linking back to the document in Archevi

Example event:

```
BEGIN:VEVENT
UID:abc123@archevi.ca
DTSTART;VALUE=DATE:20250315
SUMMARY:Car Insurance Policy - Renewal
DESCRIPTION:Renewal for Car Insurance Policy\n\nCategory: insurance
CATEGORIES:INSURANCE
URL:https://archevi.ca/documents/123
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:Reminder: Car Insurance Policy - Renewal in 7 days
END:VALARM
END:VEVENT
```

### Security

- Each tenant has a **unique feed token** (64-character hex string)
- Token is embedded in the URL: `https://archevi.ca/api/calendar/{token}.ics`
- No authentication required for calendar apps (they don't support it)
- **Regenerate URL** anytime to revoke access and get a new token
- Access is logged (last accessed, access count)

## API Reference

### Get Calendar Settings

```
POST /api/w/family-brain/jobs/run_wait_result/p/f/chatbot/get_calendar_settings

{
  "tenant_id": "uuid",
  "action": "get"
}
```

Response:
```json
{
  "success": true,
  "settings": {
    "feed_id": "uuid",
    "feed_url": "https://archevi.ca/api/calendar/{token}.ics",
    "is_enabled": true,
    "reminder_days": [7, 30],
    "include_categories": ["insurance", "legal", "medical", "financial"],
    "last_accessed_at": "2025-12-09T10:30:00Z",
    "access_count": 42,
    "created_at": "2025-12-09T03:22:24Z"
  },
  "message": "Calendar settings retrieved successfully"
}
```

### Update Calendar Settings

```
POST /api/w/family-brain/jobs/run_wait_result/p/f/chatbot/get_calendar_settings

{
  "tenant_id": "uuid",
  "action": "update",
  "is_enabled": true,
  "reminder_days": [1, 7, 14, 30],
  "include_categories": ["insurance", "medical"]
}
```

### Regenerate Feed Token

```
POST /api/w/family-brain/jobs/run_wait_result/p/f/chatbot/get_calendar_settings

{
  "tenant_id": "uuid",
  "action": "regenerate_token"
}
```

This invalidates the old URL immediately. Update your calendar subscription with the new URL.

### Generate iCal Feed

```
POST /api/w/family-brain/jobs/run_wait_result/p/f/chatbot/generate_calendar_feed

{
  "feed_token": "64-character-hex-token"
}
```

Response:
```json
{
  "ics_content": "BEGIN:VCALENDAR\r\n...",
  "content_type": "text/calendar; charset=utf-8",
  "event_count": 5,
  "tenant_name": "The Hudson Family",
  "error": null
}
```

## Database Schema

### calendar_feeds Table

```sql
CREATE TABLE calendar_feeds (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    feed_token VARCHAR(64) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    reminder_days INTEGER[] DEFAULT '{7, 30}',
    include_categories TEXT[] DEFAULT ARRAY['insurance', 'legal', 'medical', 'financial'],
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Auto-Creation

A trigger automatically creates a calendar feed when a new tenant is created:

```sql
CREATE TRIGGER trigger_create_calendar_feed
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_calendar_feed_for_tenant();
```

## Troubleshooting

### Calendar Not Updating

- **Check feed is enabled** in Settings
- **Verify categories match** your documents
- Calendar apps typically refresh every 15-60 minutes
- Try removing and re-adding the subscription

### Events Not Showing

- Documents must have expiry dates in their metadata
- Only future expiry dates are included
- Document category must be in your include list

### URL Stopped Working

- Someone may have regenerated the token
- Check Settings for the current URL
- Update your calendar subscription with the new URL

### Privacy Concerns

- Use "Regenerate URL" to create a new token anytime
- Old URLs immediately stop working
- Consider this when sharing access with family members

## Related Features

- [Document Upload](/docs/document-upload) - How documents get expiry dates
- [AI Extraction](/docs/ai-extraction) - Automatic metadata extraction
- [Notifications](/docs/notifications) - In-app expiry alerts
