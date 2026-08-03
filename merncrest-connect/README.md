# MernCrest Connect

Staff mobile app for **system.merncrest.lk** — built from Google Stitch project [`16091446373131283598`](https://stitch.withgoogle.com/projects/16091446373131283598).

## Stack

| Layer | Technology |
|-------|------------|
| Mobile UI | **Flutter** (iOS + Android) |
| Backend API | **Next.js / React** (`app/api/*` in monorepo) |
| Android push (optional) | **Java** FCM service stub in `android/` |
| Design | Google Stitch · Luminous Enterprise light theme |

## Stitch screens implemented

| Stitch screen | Flutter route |
|---------------|---------------|
| Staff Login (Light) v2 | Login |
| Dashboard (Light) v2 | Home tab |
| Work & Attendance (Light) v2 | Work → Attendance |
| Tasks (Light) | Work → Tasks |
| Leave & Absence (Light) | Work → Leave |
| Live Chat (Light) v2 | Chat tab |
| Client Detail (Light) | Clients tab |
| Sales Pipeline (Updated) | More → Sales |
| Billing (Light) | More → Billing |
| Ticket Detail (Light) | More → Helpdesk |
| Notifications (Light) | App bar |
| Project Hub (Light) | More → Projects |
| Resources Hub (Light) | More → Resources |
| WhatsApp CRM (Updated) | More → WhatsApp |

## API endpoints (mobile)

```
POST /api/auth/mobile/login     → Bearer accessToken
GET  /api/auth/mobile/me        → profile + permissions
GET  /api/staff/navigation      → dynamic tabs + drawer
GET  /api/staff                 → dashboard data
GET  /api/staff/command-center  → KPIs
GET  /api/staff/attendance      → clock in/out
GET  /api/staff/tasks           → Kanban tasks
GET  /api/staff/chat/inbox      → live chat
```

Auth: `Authorization: Bearer <token>` (see `lib/auth.ts`).

## Run locally

1. Start the Next.js API:
   ```bash
   npm run dev
   ```

2. Run Flutter (Android emulator uses `10.0.2.2:3000`):
   ```bash
   cd merncrest-connect
   flutter pub get
   flutter run
   ```

3. Point to production:
   ```bash
   flutter run --dart-define=API_BASE=https://system.merncrest.lk
   ```

## Build release

```bash
cd merncrest-connect
flutter build apk --release --dart-define=API_BASE=https://system.merncrest.lk
```

Copy the APK to the web app for hosting:

```bash
cp build/app/outputs/flutter-apk/app-release.apk ../public/downloads/merncrest-connect.apk
```

**Download page:** [https://system.merncrest.lk/downloads](https://system.merncrest.lk/downloads)  
**Direct APK:** [https://system.merncrest.lk/downloads/merncrest-connect.apk](https://system.merncrest.lk/downloads/merncrest-connect.apk)

```bash
flutter build ios --release --dart-define=API_BASE=https://system.merncrest.lk
```

## App icon

Source: `assets/images/app_icon.png` (MernCrest Connect branding).

To regenerate launcher icons:
```bash
dart run flutter_launcher_icons
```
(Configure `flutter_launcher_icons` in `pubspec.yaml` when ready.)

## Project structure

```
merncrest-connect/
├── lib/
│   ├── config/api_config.dart
│   ├── theme/connect_theme.dart      # Stitch tokens
│   ├── services/                     # API + auth
│   ├── providers/app_state.dart
│   ├── screens/                      # Stitch screens
│   └── widgets/
├── assets/images/app_icon.png
└── android/                          # Java/Kotlin + FCM hook
```

## Related docs

- `docs/chat-api-flutter.md` — live chat contract
- `docs/staff-portal-master-prompt.md` — full module spec
- `.cursor/skills/staff-portal-design/SKILL.md` — web design workflow
