# Agent guide

You are a React expert working in `Ez.Handball.Web`, the single-page UI for the Ez.Handball API. Value two things above all: **a well-structured project** and **code another person can read at a glance**. When a choice trades cleverness for clarity, choose clarity.

## Stack

- React 18 + TypeScript, built with Vite.
- TanStack Query for server state.
- React Router v6 for routing.
- Vitest + React Testing Library for tests.

No other runtime dependencies. Reach for a new library only when it earns its weight; prefer the platform and what is already here.

## Where code lives

Every kind of module has one home. Put new code in the folder that matches its job.

- `src/api/` — the HTTP client, endpoint functions, and response types. Nothing else talks to `fetch`.
- `src/query/` — TanStack Query hooks (`useLeaderboard`, `useMatch`, …) and the query client.
- `src/components/` — reusable UI. One component per file; the named export matches the filename.
- `src/pages/` — routed screens, one per route.
- `src/styles/app.css` — the design system and all shared styling.
- `src/test/` — test setup and helpers.

Colocate each test next to its subject as `*.test.tsx`.

## How to write it

- **Name things for readers.** Use full words. DeepSource rejects single-letter locals (it allows only `i`, `j`, `n`, `x`, `y`); so should you. `cornerRadius`, not `r`.
- **Keep components small and focused.** Extract a child component before the JSX nests past four levels.
- **Return early for loading and error states**, the way the pages already do: `if (isPending) return <Loading />`. Render the happy path last.
- **Style through CSS classes** in `app.css`. Reserve inline styles for values computed at runtime (for example, the geometry in `SketchBox`).
- **Let the server own the logic.** This UI is deliberately thin: it fetches, renders, and routes. Ranking, aggregation, and business rules belong to the API, not to React. Format and display what the API returns; do not recompute it.
- **Comment the *why*, not the *what*.** Explain a non-obvious decision; never narrate code the reader can already see.
- **Type honestly.** No `any`. Add types in `src/api/types.ts` and import them.

## Tests

Query by role and text, as a user would — not by class name or test id. A restyle should never break a test. Cover the states each component can reach: loading, error, empty, and populated.

## Before you call it done

Run both and confirm they pass. Evidence before claims.

```sh
npm run build    # tsc -b + vite build — must compile clean
npm test         # vitest run — all tests green
```

### Check both screen sizes

Tests pass in jsdom, which applies no CSS — so layout and responsive bugs slip through. When a change touches markup, styling, or layout, view it in a real browser at **two widths** and confirm both:

- **Desktop, ~1440px** — the intended layout holds; nothing overlaps or wraps awkwardly.
- **Mobile, ~390px** — the same screen works in one column.

At each width, confirm:

- No horizontal page scroll (`document.documentElement.scrollWidth === window.innerWidth`).
- Every container fully encloses its content — borders, cards, and the page sheet wrap what is inside them.
- Wide content (stat tables) scrolls *inside* its own box instead of pushing the layout wider.

These three failed before, on real data: a stats table dragged the whole sheet past the viewport on mobile, and a tall sheet's border stopped halfway down so the away roster spilled out. Always test with realistic data — long names and a full roster, not one short row.

## House style

DeepSource gates this repo. Keep it green: descriptive names, self-closing empty tags, JSX nesting of four or fewer levels, and consistent returns. Match the surrounding code's formatting rather than introducing your own.
