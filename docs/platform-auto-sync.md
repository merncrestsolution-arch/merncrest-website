# MernCrest Platform Auto-Sync

Unified **real-time** sync across **merncrest.lk**, **system.merncrest.lk**, and **MernCrest Connect**.

## Real-time model

| Layer | Mechanism | Latency |
|-------|-----------|---------|
| **Primary** | SSE `/api/platform/stream` | Instant (<1s) |
| **Fallback** | REST `/api/platform/sync` | Every 2 min (safety net) |
| **Reconnect** | Auto 2s on disconnect | All clients |

## What syncs instantly

- Notifications (create / read)
- Live chat (website widget ↔ staff ↔ mobile)
- Tasks (status / Pomodoro)
- Tickets (claim / reply / close)
- Announcements (publish)
- Attendance (clock in/out)
- KPI snapshots (unread, chats, tasks, tickets)

## Client integration

| Surface | File |
|---------|------|
| Staff portal | `PlatformSyncProvider` + `useSyncRefresh()` in panels |
| Mobile | `PlatformSyncService` — SSE on iOS/Android/Web |
| Website chat | Existing chat SSE + platform bridge |

## Usage (staff panels)

```tsx
useSyncRefresh(["task", "chat"], () => loadData());
```

Restart `npm run dev` and hot-restart Flutter (`R`) after pulling.
