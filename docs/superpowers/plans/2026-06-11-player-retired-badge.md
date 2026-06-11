# Player "Retired" Badge (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a "Retired" badge on the player-detail page and suppress the Buy button for unowned retired players, consuming the `retired` field the backend already returns.

**Architecture:** Add `retired?: boolean` to the `Player` API type; `PlayerPage` renders a badge and switches its buy/sell logic to three-way (own→Sell, retired→nothing, else→Buy). A small CSS pill mirrors the existing `.token-badge`. One i18n key in `en.json`/`is.json`.

**Tech Stack:** React + TypeScript, react-i18next (keys typed from `en.json`), Vitest + Testing Library. Typecheck: `npx tsc -b`. Tests: `npx vitest run <file>`. Full suite: `npm test`.

**Spec:** `docs/superpowers/specs/2026-06-11-player-retired-badge-design.md`

---

## File Structure

**Modified:**
- `src/api/types.ts` — add `retired?: boolean` to `Player`.
- `src/i18n/locales/en.json` — add `player.retired`.
- `src/i18n/locales/is.json` — add `player.retired` (Icelandic, flagged for owner review).
- `src/styles/app.css` — add `.retired-badge`.
- `src/pages/PlayerPage.tsx` — render badge + suppress Buy when retired.
- `src/pages/PlayerPage.test.tsx` — add tests for the new behavior.

No new files.

---

## Task 1: Plumbing — type, i18n keys, and badge style

This task adds the supporting pieces with no behavior change. It ends green on typecheck and the existing test suite.

**Files:**
- Modify: `src/api/types.ts`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/is.json`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Add `retired` to the `Player` type**

In `src/api/types.ts`, in the `Player` interface (currently ending with the `rating?` line), add a `retired` field:

```typescript
export interface Player {
  playerId: string;
  name: string;
  jerseyNumber: string | null;
  dateOfBirth: string | null;
  age: number | null;
  teamId: string;
  clubId: string;
  clubName: string | null;
  gender: string;
  position?: string | null;  // ADD — optional
  price?: Money | null;      // ADD — optional
  rating?: number | null; // current-season fantasy rating (Backend#78); 0 = no games, null = uncomputable
  retired?: boolean; // true = player has retired (Backend bootstrap/manual flag); absent/false = active
}
```

- [ ] **Step 2: Add the English i18n key**

In `src/i18n/locales/en.json`, in the `"player"` object, add a `"retired"` key (place it after `"price": "Price"` — remember to add the comma after `"Price"`):

```json
  "player": {
    "notFound": "Player not found",
    "seasonHistory": "Season history",
    "matches": "Matches",
    "noMatches": "No matches.",
    "total": "Total",
    "detail": "Detail",
    "view": "View",
    "noHistory": "No history",
    "age": "Age {{age}}",
    "goalsCount": "{{count}} goals",
    "fantasyHeading": "Fantasy · this season",
    "rating": "Rating",
    "price": "Price",
    "retired": "Retired"
  },
```

- [ ] **Step 3: Add the Icelandic i18n key (placeholder — flag for owner review)**

In `src/i18n/locales/is.json`, in the `"player"` object, add the matching key. Use `"Hætt(ur)"` as a placeholder pending owner review (consistent with the project's other Icelandic copy). Add it as the last key of the `player` block, adding a comma to the preceding line as needed:

```json
    "retired": "Hætt(ur)"
```

- [ ] **Step 4: Add the badge style**

In `src/styles/app.css`, immediately after the existing `.token-badge` rules (the block starting `.token-badge { ... }` near line 1245), add:

```css
.retired-badge { display: inline-block; background: var(--ink); color: #f1e6cc; font-size: 11px;
  font-weight: 800; text-transform: uppercase; letter-spacing: .04em; border-radius: 5px;
  padding: 2px 7px; vertical-align: middle; margin-left: 8px; }
```

- [ ] **Step 5: Typecheck and run the existing suite to confirm no regression**

Run: `npx tsc -b`
Expected: completes with no errors.

Run: `npm test`
Expected: all existing tests pass (no behavior changed yet).

- [ ] **Step 6: Commit**

```bash
git add src/api/types.ts src/i18n/locales/en.json src/i18n/locales/is.json src/styles/app.css
git commit -m "feat: add retired field, i18n key, and badge style"
```

---

## Task 2: PlayerPage — render the badge and suppress Buy when retired

**Files:**
- Modify: `src/pages/PlayerPage.test.tsx`
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Write the failing tests**

In `src/pages/PlayerPage.test.tsx`, add these four tests at the end of the file. They reuse the existing `authed`, `renderPlayer`, and `mockPlayerPageQueries` helpers already defined in the file, plus inline `getPlayer` mocks for the retired cases.

```typescript
test("shows the Retired badge when the player is retired", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar", retired: true } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  renderWithProviders(<Routes><Route path="/players/:playerId" element={<PlayerPage />} /></Routes>, { initialEntries: ["/players/7"] });
  expect(await screen.findByText("Retired")).toBeInTheDocument();
});

test("does not show the Retired badge for an active player", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar" } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  renderWithProviders(<Routes><Route path="/players/:playerId" element={<PlayerPage />} /></Routes>, { initialEntries: ["/players/7"] });
  await screen.findByText("Vik");
  expect(screen.queryByText("Retired")).not.toBeInTheDocument();
});

test("suppresses the Buy button for an unowned retired player", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar", position: "LB", price: { amount: 9_000_000, currency: "ISK" }, retired: true } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { LB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  renderPlayer();
  await screen.findByText("Vik");
  expect(screen.queryByRole("button", { name: /buy/i })).not.toBeInTheDocument();
});

test("still shows the Sell button for an owned retired player", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar", position: "LB", price: { amount: 9_000_000, currency: "ISK" }, retired: true } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { LB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [{ playerId: "7", name: "Vik", clubId: "c1", clubName: "Aalvik", position: "LB", gender: "karlar", price: { amount: 9_000_000, currency: "ISK" }, rating: 70, pricePaid: { amount: 9_000_000, currency: "ISK" } }], budgetUsed: { amount: 9_000_000, currency: "ISK" }, remainingBudget: { amount: 91_000_000, currency: "ISK" }, squadValue: { amount: 9_000_000, currency: "ISK" } });
  renderPlayer();
  expect(await screen.findByRole("button", { name: /sell/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `npx vitest run src/pages/PlayerPage.test.tsx`
Expected: the badge test and the buy-suppression test FAIL (no "Retired" text rendered; Buy button still present for the retired unowned player). The "does not show badge" and "owned retired shows Sell" tests pass already.

- [ ] **Step 3: Render the badge and switch buy/sell to three-way logic**

In `src/pages/PlayerPage.tsx`, update the `title-row` block. Change the heading + buy/sell from:

```tsx
          <h1 className="title">
            {p.jerseyNumber && <span className="jersey">#{p.jerseyNumber}</span>}
            {p.name}
          </h1>
          <StarToggle playerId={playerId} name={p.name} />
          {owned ? (
            <SellButton player={{ playerId: p.playerId, name: p.name }} />
          ) : (
            <BuyButton player={{ playerId: p.playerId, name: p.name, position: p.position ?? null, price: p.price ?? null }} />
          )}
```

to:

```tsx
          <h1 className="title">
            {p.jerseyNumber && <span className="jersey">#{p.jerseyNumber}</span>}
            {p.name}
            {p.retired && <span className="retired-badge">{t("player.retired")}</span>}
          </h1>
          <StarToggle playerId={playerId} name={p.name} />
          {owned ? (
            <SellButton player={{ playerId: p.playerId, name: p.name }} />
          ) : p.retired ? null : (
            <BuyButton player={{ playerId: p.playerId, name: p.name, position: p.position ?? null, price: p.price ?? null }} />
          )}
```

- [ ] **Step 4: Run the PlayerPage tests to verify they pass**

Run: `npx vitest run src/pages/PlayerPage.test.tsx`
Expected: all PlayerPage tests pass (the four new ones plus all pre-existing ones).

- [ ] **Step 5: Typecheck and run the full suite**

Run: `npx tsc -b`
Expected: no errors.

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/PlayerPage.tsx src/pages/PlayerPage.test.tsx
git commit -m "feat: show Retired badge and hide Buy for retired players on PlayerPage"
```

---

## Self-Review Notes

- **Spec coverage:** type+data (Task 1 Step 1), badge render (Task 2 Step 3 + tests), three-way buy/sell incl. Sell-when-owned (Task 2 Step 3 + tests), badge style (Task 1 Step 4), i18n en+is (Task 1 Steps 2–3), tests (Task 2 Step 1). All spec sections map to a task.
- **Out of scope (per spec):** squad/lineup owned-retired indicator (needs backend), server-side buy block.
- **Type consistency:** `retired?: boolean` is the single new field; `t("player.retired")` is the single new key; `.retired-badge` is the single new class. All three names are used consistently in Task 2.
- **i18n typing:** keys are typed from `en.json` via `src/i18n/i18next.d.ts`, so adding `player.retired` to `en.json` (Task 1 Step 2) is what makes `t("player.retired")` typecheck — that step must precede Task 2.
