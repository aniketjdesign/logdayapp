# Auth Rate Limiting Edge Function

This Edge function implements rate limiting for authentication actions using Upstash Redis rate limiting.

## Features

- IP-based rate limiting: 2 signup attempts per IP address every 5 minutes
- Email-based rate limiting: 3 failed signup attempts per email address per hour

## Setup

### Requirements

- An Upstash Redis database (https://upstash.com/)
- Supabase project

### Environment Variables

Set the following environment variables in your Supabase project:

```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

You can set these in the Supabase dashboard under Settings > API > Environment Variables.

### Deployment

Deploy the Edge function using the Supabase CLI:

```bash
supabase functions deploy auth-ratelimit --project-ref your-project-ref
```

## Usage

The Edge function supports the following actions:

### Check Rate Limits

```javascript
// Check if a user is allowed to attempt signup
const response = await fetch(
  'https://your-project-ref.supabase.co/functions/v1/auth-ratelimit',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'check_signup_limits',
      email: 'user@example.com', // Optional, only needed for email-based limits
    }),
  }
);

const data = await response.json();
// { allowed: true } or { allowed: false, reason: 'ip_limit', ... }
```

### Record Failed Signup

```javascript
// Record a failed signup attempt for an email
await fetch(
  'https://your-project-ref.supabase.co/functions/v1/auth-ratelimit',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'record_failed_signup',
      email: 'user@example.com',
    }),
  }
);
``` 