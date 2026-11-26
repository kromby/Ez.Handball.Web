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

## Contributing

1. Create a branch off `main` (for example `feat/<short-name>` or `fix/<short-name>`).
2. Set up locally as described in [Develop](#develop).
3. Make your change following the conventions in [`AGENTS.md`](AGENTS.md): where code lives (`src/api`, `src/query`, `src/components`, `src/pages`, `src/styles/app.css`), tests colocated as `*.test.tsx`, and the UI kept thin while the API owns the business logic.
4. Before opening a pull request, confirm both of these pass:

   ```sh
   npm run build   # tsc -b + vite build
   npm test        # vitest run
   ```

5. If you changed markup, styling, or layout, also check the screen in a browser at about 1440px and 390px wide: no horizontal page scroll, and containers fully enclose their content.
6. Commit, push your branch, and open a pull request against `main`. Describe what changed, why, and how you tested it. A maintainer will review it.

Pull requests are also checked by DeepSource; please fix its bug, security, and correctness findings.

Merging to `main` triggers the deploy workflow in `.github/workflows/deploy.yml`, so keep changes review-ready.

## Routes

- `/` — leaderboard (home). Old `?playerId=<id>` links redirect to `/players/<id>`.
- `/players/:playerId` — profile, season history, match list.
- `/matches/:matchId` — box score.

## Deferred

Leaderboard season/tournament/gender filters await backend facets endpoints (issues #36, #37, #38).

## Design

Spec: `../Ez.Handball/docs/superpowers/specs/2026-06-01-web-react-spa-design.md`
