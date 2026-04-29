# CLAUDE.md — Music Streaming Platform

This file is the project context for Claude Code. Place it at the **root of the repository** (next to `package.json`). Claude Code reads it automatically every time it runs in this directory.

---

## Project overview

A modern music streaming web app inspired by Spotify and SoundCloud, with a unique visual identity (deep dark theme + purple-to-pink gradient accents). Users can browse music, create and curate playlists, like songs, and listen with a polished playback experience.

This is a **portfolio project** intended to demonstrate full-stack proficiency to prospective employers. Quality over feature breadth.

A future iteration will include an AI agent that analyzes song lyrics and stylistic features — **do not implement that yet**, but design the architecture to make it cleanly addable later (e.g., keep song metadata extensible, leave room for an `analysis` relation on Song).

---

## Tech stack

- **Framework:** Next.js 15 (App Router) with TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui (New York style, slate base)
- **State:** Zustand for client-side player state; React Server Components + Server Actions for everything else
- **Database:** PostgreSQL hosted on Railway
- **ORM:** Prisma
- **Auth:** NextAuth.js (Auth.js v5) with Google OAuth provider
- **Audio playback:** Howler.js
- **Icons:** lucide-react
- **Forms:** react-hook-form + zod
- **Animations:** framer-motion (sparingly — only for transitions and the lyrics panel)
- **Deployment:** Vercel (frontend) + Railway (Postgres)

---

## Folder structure

```
/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── audio/        # placeholder audio files for development
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (app)/
│   │   │   ├── layout.tsx       # sidebar + topbar + player wrapper
│   │   │   ├── page.tsx         # /
│   │   │   ├── library/
│   │   │   │   ├── page.tsx     # /library
│   │   │   │   ├── liked/page.tsx
│   │   │   │   └── playlist/[id]/page.tsx
│   │   │   ├── search/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [query]/page.tsx
│   │   │   └── now-playing/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── og/route.tsx
│   │   ├── actions/             # server actions (mutation logic)
│   │   ├── layout.tsx           # root html/body
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/              # Sidebar, TopBar, PlayerBar
│   │   ├── playlist/            # PlaylistCard, PlaylistHeader, SongRow
│   │   ├── song/                # SongRow, SongMenu
│   │   ├── shared/              # EmptyState, GenreCard, SearchInput
│   │   └── ui/                  # shadcn-generated — DO NOT EDIT manually
│   ├── lib/
│   │   ├── prisma.ts            # singleton Prisma client
│   │   ├── auth.ts              # NextAuth config
│   │   ├── utils.ts             # cn() and other helpers
│   │   ├── genreColors.ts       # gradient definitions per genre
│   │   └── format.ts            # duration, date, number formatters
│   ├── hooks/
│   │   ├── useAudioEngine.ts
│   │   ├── useDebounce.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── store/
│   │   └── playerStore.ts       # Zustand player store
│   └── types/
│       └── index.ts             # shared TS types
├── .env.example
├── CLAUDE.md                    # this file
├── README.md
└── package.json
```

When adding new files, follow this structure. Don't create new top-level folders without a strong reason.

---

## Database schema (Prisma)

```prisma
model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  image         String?
  createdAt     DateTime     @default(now())

  accounts      Account[]
  sessions      Session[]
  playlists     Playlist[]
  likedSongs    LikedSong[]
  playHistory   PlayHistory[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Song {
  id         String          @id @default(cuid())
  title      String
  artist     String
  album      String?
  genre      String?
  duration   Int             // seconds
  audioUrl   String?
  coverUrl   String?
  createdAt  DateTime        @default(now())

  playlists  PlaylistSong[]
  likedBy    LikedSong[]
  history    PlayHistory[]

  @@index([title])
  @@index([artist])
  @@index([genre])
}

model Playlist {
  id          String          @id @default(cuid())
  name        String
  description String?
  coverUrl    String?
  isPublic    Boolean         @default(false)
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  songs       PlaylistSong[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([userId])
}

model PlaylistSong {
  playlistId String
  songId     String
  position   Int
  addedAt    DateTime @default(now())

  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  song       Song     @relation(fields: [songId], references: [id], onDelete: Cascade)

  @@id([playlistId, songId])
  @@index([playlistId, position])
}

model LikedSong {
  userId  String
  songId  String
  likedAt DateTime @default(now())

  user    User @relation(fields: [userId], references: [id], onDelete: Cascade)
  song    Song @relation(fields: [songId], references: [id], onDelete: Cascade)

  @@id([userId, songId])
  @@index([userId, likedAt])
}

model PlayHistory {
  id        String   @id @default(cuid())
  userId    String
  songId    String
  playedAt  DateTime @default(now())

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  song      Song @relation(fields: [songId], references: [id], onDelete: Cascade)

  @@index([userId, playedAt])
}
```

When extending the schema, always run `npx prisma migrate dev --name <descriptive_name>` and commit the migration files together with the schema change.

---

## Coding conventions

**Components:**
- Server components by default. Add `'use client'` only when the file uses hooks, browser APIs, or event handlers.
- One component per file. Filename matches export. PascalCase.
- Props interface declared right above the component as `type Props = { ... }`.
- No default exports for components — use named exports for grep-ability. Pages and layouts are the exception (Next.js requires default exports).

**Styling:**
- Tailwind utility classes only. No CSS modules, no styled-components.
- Use `cn()` from `@/lib/utils` to compose classNames conditionally.
- Avoid arbitrary values (`bg-[#ff00aa]`) — extend `tailwind.config.ts` instead.
- Dark theme is the default. The app does not have a light mode (this is intentional — Spotify/SoundCloud aesthetic).

**Data fetching:**
- Server components fetch directly with the Prisma client. Don't create REST endpoints for read operations.
- Mutations use Server Actions (`'use server'` at the top of action files). Call `revalidatePath` or `revalidateTag` after mutations.
- Validate all server action inputs with zod schemas defined in the same file.

**Auth in server code:**
- Use `auth()` from `@/lib/auth` to get the session. Throw or redirect when missing in protected routes.
- Never trust `userId` passed from the client — always read from the session.

**TypeScript:**
- Strict mode is on. No `any`. Use `unknown` and narrow.
- Prefer Prisma's generated types. Use `Prisma.PlaylistGetPayload<{ include: { songs: true } }>` for typed shapes.
- Shared types in `src/types/index.ts`.

**Imports:**
- Use the `@/*` alias for all internal imports.
- Group imports: external → internal → types → styles. Prettier handles ordering.

**Naming:**
- Components: PascalCase (`PlaylistCard.tsx`)
- Hooks: camelCase, `use` prefix (`useAudioEngine.ts`)
- Server actions: camelCase verbs (`addSongToPlaylist`)
- Database: singular models (`Song`, not `Songs`)
- Routes: kebab-case folders (`now-playing`)

**Error handling:**
- Server components: use `notFound()` for missing resources, `redirect()` for auth.
- Server actions: return `{ ok: true, data }` or `{ ok: false, error: 'message' }` shapes — no thrown errors crossing the boundary.
- Client components: use `try/catch` around server action calls; display errors via shadcn toast.

---

## Useful commands

```bash
# development
npm run dev                            # start dev server on :3000

# database
npx prisma migrate dev --name <name>   # create + apply migration
npx prisma migrate deploy              # production migration (used in Vercel build)
npx prisma generate                    # regenerate Prisma Client (auto-runs after migrate)
npx prisma studio                      # GUI for browsing the DB
npx prisma db seed                     # run prisma/seed.ts

# code quality
npm run lint                           # ESLint
npm run typecheck                      # tsc --noEmit
npm run format                         # Prettier

# build
npm run build                          # next build (production)
npm run start                          # serve built app
```

---

## Skills to use (Claude-side)

When working in this project, lean on these skills as appropriate:

- **engineering:system-design** — when designing a new subsystem (e.g., the audio engine, the future AI agent pipeline). Sketch the architecture first, then implement.
- **engineering:architecture** — when picking between options (e.g., Howler vs native `<audio>`, Zustand vs Context, UploadThing vs Cloudinary). Document the decision.
- **engineering:code-review** — before merging any feature branch into main. Review for correctness, performance (especially N+1 queries on Prisma), accessibility, and security (auth checks on every server action).
- **engineering:debug** — when something doesn't work. Reproduce → isolate → diagnose → fix. Don't paper over symptoms.
- **engineering:testing-strategy** — when adding tests for the audio engine, server actions, and critical UI flows.
- **engineering:documentation** — when writing the README, component docs, or runbooks (e.g., "how to seed a fresh DB").
- **design:design-critique** — periodic review of how the implementation compares to the Figma mockups.
- **design:accessibility-review** — once the app is feature-complete, run a full a11y audit (color contrast, keyboard nav, focus states, ARIA labels on icon buttons).
- **design:design-handoff** — when picking up a new screen from Figma, extract design tokens and component specs before coding.
- **design:ux-copy** — for empty states, error messages, button labels, toast text. Don't ship "Untitled Playlist" — make copy feel intentional.

When the user asks for something that maps to one of these skills, invoke it. Otherwise stay focused on the task.

---

## Things to be careful about

- **Audio playback memory leaks.** Howl instances must be `unload()`-ed when songs change or the engine unmounts. Test by switching songs rapidly and watching the network tab — you should not see lingering audio downloads.
- **Hydration mismatches.** The PlayerBar reads from Zustand which is client-only. Render a placeholder during SSR or guard with `useEffect` mount checks.
- **Prisma in dev mode.** Hot reload re-instantiates clients. Use the `globalThis` singleton pattern in `src/lib/prisma.ts`.
- **Server action body size limits.** Don't pass full song lists through server actions — pass IDs and let the server fetch.
- **Image optimization.** All cover images go through `next/image`. Allow the `picsum.photos` and your storage domain in `next.config.js`.
- **Auth-protected routes.** Every server action and route handler that mutates must call `auth()` and verify the user owns the resource (e.g., the playlist they're modifying).
- **Don't modify `src/components/ui/*`** — those are shadcn-generated. If a component needs custom behavior, wrap it in `src/components/shared/`.

---

## Out of scope (for now)

- The AI agent (lyrics analysis, stylistic recognition) — separate roadmap, not yet.
- Social features (following users, sharing, comments).
- Mobile native apps.
- Real audio streaming infrastructure (CDN, DRM). Use placeholder audio files for the demo.
- Real music licensing — all tracks in the demo are royalty-free or placeholders.
- Light theme.

If a request would touch any of these, push back and confirm the user wants to expand scope.

---

## When in doubt

- **Match Figma.** When implementing a UI screen, the Figma file is the source of truth. Ask for the screenshot if not provided.
- **Smaller is better.** Prefer many small components and small commits over big sweeping changes.
- **Run before showing.** After any change, run `npm run dev` and verify in the browser before reporting "done."
- **Ask, don't assume.** If a requirement is ambiguous (e.g., "add a delete button" — soft delete? confirmation dialog? cascade?), ask one clarifying question before proceeding.
