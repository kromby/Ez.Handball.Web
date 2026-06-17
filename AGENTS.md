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
- **Keep components small and focused.** Extract a child component when the JSX gets hard to read. Deep nesting is a smell, not a hard limit — extract because it clarifies, not to hit a number. (DeepSource's JSX-max-depth rule, JS-0415, is treated as advisory here — see House style.)
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

DeepSource gates this repo. Keep it green: descriptive names, self-closing empty tags, and consistent returns. Match the surrounding code's formatting rather than introducing your own.

Fix DeepSource's **bug, security, and correctness** findings — those earn their keep. Treat its **style/antipattern** findings as advice, not law: apply them when they improve the code, skip them when they don't. In particular, **JSX max depth (JS-0415)** is **not** enforced here — don't extract components solely to drop a nesting level. It's ignored repo-wide via the DeepSource dashboard (Issue → Ignore → "For all files"); suppress a stray one inline with `// skipcq: JS-0415` if needed.

### Settled antipattern findings — don't re-litigate these

These flags recur on every PR. The decisions below are final; follow them instead of "fixing" the warning, and don't waste a review cycle debating them.

- **Wildcard import of endpoints — keep it.** Import the endpoint module as a namespace: `import * as api from "../api/endpoints"` (then `api.getManager()`), in **both** production and test files. This is the repo-wide convention — see `src/query/hooks.ts`. It is required for tests, which spy with `vi.spyOn(api, "getManager")`; a named import (`import { getManager }`) cannot be spied that way. DeepSource's "explicitly import the specific method" / wildcard-import antipattern is **declined** here — ignore it repo-wide on the dashboard, don't switch to named imports to silence it. (Named imports remain correct for everything that is *not* the endpoint module — components, hooks, types.)

- **Fire-and-forget promise in a sync callback — return it, don't `void` it.** When a synchronous callback (e.g. an `onEnter`/`onClick` prop) kicks off a promise it doesn't await, write `onEnter={() => doThing().then(next)}` — return the promise from the arrow. Do **not** use the `void` operator (`() => { void doThing(); }`); DeepSource flags the `void` operator as an antipattern. Only reach for this when the promise can't reject (or attach a `.catch`).

- **Single/two-letter locals — already covered above.** "Name things for readers" governs; `red`/`green`/`blue`, not `r`/`g`/`b`. DeepSource allows only `i`, `j`, `n`, `x`, `y` — but prefer a full word even then unless it's a trivial loop index.
