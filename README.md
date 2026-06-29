# MDrive

Retro-styled web file manager for the MDrive API — a POSIX-like filesystem
over S3, authenticated via Zitadel (Google IdP).

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 6
- **UI**: React 19
- **Data**: TanStack Query, Zustand
- **API client**: Orval (regenerated from the OpenAPI spec)
- **Mocking**: MSW (development only)
- **Lint / Format**: Biome

## Getting started

```bash
npm install
npm run dev          # starts on http://localhost:3000 with MSW mocks
```

Point the frontend at a real backend by editing `next.config.mjs`
(production rewrite) and `orval.config.ts` (regeneration target).
The rewrite forwards `/api/*` to the configured API host.

## Scripts

| Command             | Description                                            |
|---------------------|--------------------------------------------------------|
| `npm run dev`       | Start the dev server with Turbopack and MSW mocks       |
| `npm run build`     | Production build (Next.js standalone output)            |
| `npm run start`     | Run the built app                                       |
| `npm run lint`      | Run Biome lint                                          |
| `npm run format`    | Format with Biome                                       |
| `npm run check`     | Biome check (lint + format rules)                       |
| `npm run api:gen`   | Regenerate the API client from the OpenAPI spec         |

## Project layout

```
src/
├── api/                # HTTP layer
│   ├── generated/      # Orval output (do not edit by hand)
│   ├── hooks/          # Domain hooks (useMe, useDrives, useDriveLs, ...)
│   ├── utils.ts        # ApiError parsing + query-key predicates
│   └── client.ts       # QueryClient setup
├── app/                # Next.js App Router pages
│   ├── page.tsx        # Drive list + OAuth login
│   ├── login/          # Redirects to /api/auth/google
│   └── [drive_id]/     # Per-drive workspace (navigator, uploader, viewers)
├── components/         # Reusable UI (XP-styled)
├── config/             # Window configuration table
├── mocks/              # MSW handlers + in-memory store (dev only)
├── store/              # Zustand stores (window, file, ui)
├── types/              # Shared types
└── utils/              # Helpers
```

## API overview

The MDrive API is documented via OpenAPI. Regenerate the client whenever
the backend spec changes:

```bash
npm run api:gen
```

Highlights of the new model:
- **Drives** (not systems) are the top-level container owned by a user
- **Files** addressed by POSIX-style paths inside a drive
- **Auth** is session-cookie based, set by the backend after the Zitadel
  OAuth callback at `/api/auth/callback`
- **Uploads** use presigned S3 PUT URLs
- **Downloads** use presigned S3 GET URLs
