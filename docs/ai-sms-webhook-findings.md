# 800.com Inbound SMS Webhook Findings

## Official provider contract

The 800.com OpenAPI specification documents company webhooks at:

`GET/POST https://api.800.com/v2/companies/{company}/webhooks`

The required registration fields are `url`, `method`, and `features`. For inbound SMS, the supported feature is `sms_received`. The documented event payload is an envelope with `type` and a nested `data` object. The nested `data` fields are `id`, `recipient`, `sender`, `inbound`, `message`, and optional `media`.

Sources:

- https://api.800.com/docs/api/public.v2.swagger.yml (paths `/v2/companies/{company}/webhooks`, schema `WebhookSmsReceivedPayload`, schema `WebhookFeature`)
- https://www.800.com/api (states webhooks deliver real-time server-to-server notifications for incoming and outgoing text messages)

## Live MyDojo configuration observed September 10, 2026

The MyDojo Martial Arts & Fitness company has webhook `43` registered as:

- Method: `POST`
- URL: `https://mydojo-fitness-lu5er8yq.manus.space/api/sms/inbound`
- Feature: `sms_received`

Webhook history returns HTTP 200 but sends envelopes shaped like:

```json
{
  "data": {
    "id": 24071540,
    "media": [],
    "sender": "+18774693656",
    "inbound": false,
    "message": "...",
    "recipient": "+18323618786"
  },
  "type": "sms_received"
}
```

The existing application handler expected `sender`, `message`, `id`, and `inbound` at the request root. It therefore reads an empty body and returns without storing inbound messages or generating an AI reply. It also needs to ignore `inbound: false` delivery events to prevent outbound campaign messages from entering the AI conversation handler.

