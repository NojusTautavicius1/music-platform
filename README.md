# Sonara

A personalized music streaming platform with AI-powered recommendations, daily mixes, and a natural-language music agent.

## Stack

- **Frontend/Backend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Database**: PostgreSQL via Railway + Prisma ORM
- **Auth**: Auth.js v5 (Google OAuth)
- **Storage**: Uploadthing (audio + cover images)
- **AI**: Anthropic Claude (recommendations, Ask Sonara)
- **Music Agent**: Ruby/Sinatra service on Railway
- **Deployment**: Vercel (web) + Railway (DB + agent)

## Features

- Upload and stream songs with waveform visualization
- Daily mixes, Discover Weekly, On Repeat — auto-regenerated
- Ask Sonara: natural-language music search ("songs for a rainy evening")
- Playlist creation, sharing, and collaborative suggestions
- Lyrics display (synced + plain text)
- Browse by genre/BPM, smart shuffle, queue management
- Stats page with listening history

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in all values (see .env.example for descriptions)

# 3. Run database migrations
npx prisma migrate dev

# 4. Seed demo data (optional)
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See [.env.example](.env.example) for all required variables with descriptions.

Key vars:
| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Railway → your PostgreSQL service → Connect |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID/SECRET` | console.cloud.google.com → OAuth 2.0 |
| `UPLOADTHING_*` | uploadthing.com → dashboard |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `MUSIC_AGENT_URL` | Railway → music-agent service → public domain |

## Deployment

**Vercel (web app)**

Set all env vars in Vercel dashboard. `AUTH_URL` must match your exact Vercel domain.

```json
"build": "prisma generate && next build --webpack"
```

**Railway (music agent)**

See [../music-agent/README.md](../music-agent/README.md).

## Architecture

```
Browser
  └── Vercel (Next.js)
        ├── Railway PostgreSQL  (Prisma)
        ├── Uploadthing CDN     (audio/covers)
        ├── Anthropic API       (AI recommendations)
        └── Railway music-agent (Ruby/Sinatra → Ask Sonara)
```

## Scripts

```bash
npm run dev                              # dev server
npm run build                            # production build
npm run lint                             # ESLint
npx prisma studio                        # visual DB browser
npx prisma migrate dev --name <name>     # create migration
```
