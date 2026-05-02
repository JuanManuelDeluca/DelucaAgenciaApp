# Deluca Agencia

A full-stack sports agency management app built with React Native and Expo. Designed to manage basketball players, track scouting targets, organize tasks, and schedule events — all synced in real time across Android, web, and desktop.

![Deluca Agencia](./assets/images/icon.png)

## Features

- **Player Management** — Add and manage agency players with photos, position, club, biography, and video links. Track their availability status.
- **Notes & Tasks per Player** — Attach private notes and to-do items directly to each player's profile.
- **General Task Board** — Manage agency-wide tasks with priority levels (low / medium / high), categories, due dates, and status tracking (pending → in progress → done).
- **Scouting** — Follow rival teams and track players of interest. Cycle through scouting statuses (watching → contacted → rejected → signed) and recruit directly into your agency roster.
- **Events & Notifications** — Schedule matches, reminders, and birthdays. Get push notifications on the day of each event.
- **Real-time Sync** — All data lives in Supabase (PostgreSQL). Changes made on any device appear instantly everywhere.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81 + Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| Language | TypeScript |
| Backend / Database | Supabase (PostgreSQL) |
| Notifications | expo-notifications |
| Image Picker | expo-image-picker |
| Web Deploy | Vercel |
| Android Build | EAS Build |

## Platforms

- **Android** — Standalone APK built with EAS Build (no dev server required)
- **Web** — Deployed as a PWA on Vercel → [deluca-agencia.vercel.app](https://deluca-agencia.vercel.app)
- **Desktop** — Electron wrapper installable as `.deb` / `.AppImage` on Linux

## Project Structure

```
app/
├── (tabs)/
│   ├── index.tsx        # Dashboard — stats, upcoming events, quick actions
│   ├── players.tsx      # Player list with search and filters
│   ├── tasks.tsx        # Task board
│   └── scouting.tsx     # Team scouting list
├── player/
│   ├── [id].tsx         # Player detail — notes, tasks, info tabs
│   └── new.tsx          # Create / edit player
├── task/new.tsx          # Create task
├── team/
│   ├── [id].tsx         # Team detail with scouted players
│   └── new.tsx          # Create team
└── event/new.tsx         # Create event

lib/
├── supabase.ts           # Supabase client
├── storage.ts            # Data layer — all CRUD operations
└── notifications.ts      # Push notification scheduling

types/
└── index.ts              # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/your-username/deluca-agencia.git
cd deluca-agencia
npm install
```

### Environment Setup

Create your Supabase project and run the following SQL to set up the database:

```sql
create table players (
  id text primary key, name text not null, photo text,
  position text not null, club text not null default '',
  gender text not null, birthday text, description text,
  video_url text, availability text not null default 'active',
  created_at text not null
);
create table player_notes (
  id text primary key, player_id text not null, content text not null,
  created_at text not null, updated_at text not null
);
create table tasks (
  id text primary key, title text not null, description text,
  status text not null default 'pending', priority text not null default 'medium',
  category text, player_id text, due_date text, created_at text not null
);
create table teams (
  id text primary key, name text not null, league text,
  category text, notes text, created_at text not null
);
create table scouted_players (
  id text primary key, team_id text not null, name text not null,
  position text, age integer, notes text,
  status text not null default 'watching', created_at text not null
);
create table agency_events (
  id text primary key, title text not null, type text not null,
  player_id text, event_date text not null,
  notified boolean not null default false, created_at text not null
);

alter table players disable row level security;
alter table player_notes disable row level security;
alter table tasks disable row level security;
alter table teams disable row level security;
alter table scouted_players disable row level security;
alter table agency_events disable row level security;
```

Then update `lib/supabase.ts` with your project URL and anon key.

### Run

```bash
# Mobile (Expo Go)
npx expo start

# Web
npx expo start --web
```

### Build Android APK

```bash
eas build --platform android --profile preview
```

### Deploy Web

```bash
npx expo export -p web
vercel dist/
```

## License

MIT
