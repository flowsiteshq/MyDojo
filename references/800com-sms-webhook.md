# 800.com SMS Webhook Reference

## WebhookSmsReceivedPayload

When a member replies to an SMS, 800.com POSTs this JSON to our webhook URL:

```json
{
  "id": 0,
  "recipient": "string",   // Our number (e.g. +18774693656)
  "sender": "string",       // Member's phone number (e.g. +12818189288)
  "inbound": true,
  "message": "string",      // The text body the member sent
  "media": ["string"]       // Optional MMS media URLs
}
```

## Webhook Features
- `sms_received` — fires when a member replies to an SMS from our number

## Creating a Webhook via API
POST https://api.800.com/v2/companies/{company}/webhooks
```json
{
  "method": "POST",
  "url": "https://mydojo-fitness-lu5er8yq.manus.space/api/sms/inbound",
  "features": ["sms_received"]
}
```

## Sending SMS via 800.com
POST https://api.800.com/v2/companies/{company}/messages
```json
{
  "to": "+12818189288",
  "from": "+18774693656",
  "message": "Hi! This is MyDojo Assistant..."
}
```

## Auth
All requests use: `Authorization: Bearer {EIGHT_HUNDRED_API_KEY}`
