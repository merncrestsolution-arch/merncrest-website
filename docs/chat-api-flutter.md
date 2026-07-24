# Chat API contract — Web widget & Flutter parity

Base URL: same host as merncrest.lk / system API (`NEXT_PUBLIC_SITE_URL`).

Realtime: REST only for v1 (no Socket.IO). Poll inbox / conversation every 15–30s when needed. Offline queue: store outgoing messages locally and flush with a client-generated UUID `clientMessageId` so retries dedupe server-side.

## Auth

| Client | Auth |
|--------|------|
| Anonymous web / Flutter visitor | Cookie `mc_visitor` + HttpOnly `mc_visitor_token`, or `Authorization: Bearer <visitorToken>` returned from `POST /api/chat/conversations` |
| Logged-in user | Existing session cookie `mc_session` |
| Staff agent | Session + staff role |

Timezone: store UTC; display Asia/Colombo (UTC+5:30).

## Endpoints

### Start or list open conversation

`POST /api/chat/conversations`

```json
{ "locale": "en", "channel": "WEB" | "FLUTTER", "pageContext": "/en/pricing" }
```

Response:

```json
{
  "sessionId": "...",
  "visitorToken": "...",
  "handlerType": "AGENT" | "AI",
  "agent": { "id", "displayName", "avatarUrl" } | null,
  "assistantName": "Nova — MernCrest Assistant",
  "messages": []
}
```

`GET /api/chat/conversations` — restore open session for visitor.

### Messages

`GET /api/chat/conversations/:id/messages`

`POST /api/chat/conversations/:id/messages`

```json
{
  "message": "Hello",
  "clientMessageId": "550e8400-e29b-41d4-a716-446655440000",
  "attachmentUrl": "https://...",
  "pageContext": "/en/services",
  "visitorName": "Aisha",
  "asAgent": false
}
```

Agent replies: set `"asAgent": true` with staff session.

### Upload

`POST /api/chat/upload` — multipart `file` (image/pdf) → `{ url }`.

### Staff

- `GET|PATCH /api/staff/presence` — `{ status: "ONLINE"|"AWAY"|"OFFLINE" }`
- `GET /api/staff/chat/inbox` — assigned + handoff-requested conversations

### Legacy adapter

`GET|POST /api/chat` still works for older clients; prefer `/api/chat/conversations*`.

## Parity checklist

- [ ] Conversation history sync via sessionId
- [ ] Read receipts (`readAt` on ChatMessage — mark via future PATCH)
- [ ] Agent vs AI header states from `handlerType`
- [ ] File attachments via upload URL
- [ ] Lead capture progressive fields → CRM `CrmLead`
- [ ] Offline queue flush with `clientMessageId` dedupe
- [ ] FCM on agent reply (Flutter app-side; hook when inbox poll sees new AGENT message)

## Socket.IO (deferred)

A dedicated PM2 websocket process can later join rooms by `conversationId` on namespace `/chat`. Until then, REST + polling is the contract.
