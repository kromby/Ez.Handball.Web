# Ez.Handball.Web

React + Vite + TypeScript single-page UI for the Ez.Handball API: leaderboard, player profiles, and match box scores.

## Develop

```sh
npm install
npm run dev
```

Set the API base in `.env.development` (default `http://localhost:5000`). The dev server proxies nothing — the API must allow the web origin via its `Cors:AllowedOrigins` config.

## Test

```sh
npm test
```

Vitest + React Testing Library.

## Build & deploy

```sh
npm run build      # → dist/
```

Deploy `dist/` to any static host. Because the app uses client-side routing, the host MUST rewrite unknown paths to `/index.html` (SPA fallback), or deep links like `/players/123` will 404 on refresh.

Set `VITE_API_BASE_URL` at build time to point at the deployed API (see `.env.production.example`).

## Routes

- `/` — leaderboard (home). Old `?playerId=<id>` links redirect to `/players/<id>`.
- `/players/:playerId` — profile, season history, match list.
- `/matches/:matchId` — box score.

## Deferred

Leaderboard season/tournament/gender filters await backend facets endpoints (issues #36, #37, #38).

## Design

Spec: `../Ez.Handball/docs/superpowers/specs/2026-06-01-web-react-spa-design.md`
