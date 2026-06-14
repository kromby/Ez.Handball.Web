# Lock-Aware Buy/Sell UX — Design Spec

**Issue:** [Web#38](https://github.com/kromby/Ez.Handball.Web/issues/38) — Lock-aware buy/sell/lineup UX
**Date:** 2026-06-14
**Depends on:** [Backend#60](https://github.com/kromby/Ez.Handball.Backend/issues/60) (gameweek engine — merged; lock-aware mutating endpoints + `appliedToGameweek` echo)

## Goal

Make buy/sell aware that a gameweek can lock at its deadline, and that an edit submitted after the deadline applies to the **next** gameweek. When the lock fires between page load and submit, tell the user which gameweek their change actually landed on — closing the lock-between-load-and-submit race.

## Context: what already exists

- **Backend#60 is merged** and changed the buy/sell response shape. `POST /api/users/me/squad/players` and `DELETE /api/users/me/squad/players/{id}` now return `{ squad, gameweek: { appliedToGameweek, currentGameweekLocked } }` (previously a bare squad body).
- The Web client has **not** adapted: `buyPlayer`/`sellPlayer` type the response as `Squad` and `useBuyPlayer`/`useSellPlayer` write the whole body into the `["squad", flavor]` cache. Against the new shape this stores `{ squad, gameweek }` where a `Squad` is expected — a latent bug independent of this feature.
- **Lock-status display is partly built.** Web#39 added `CurrentGameweekStrip` (live "Locks in 2h" countdown + locked state), mounted on `/squad`. `/squad` is a read-only view; the actual buy/sell actions live elsewhere.
- **Buy/sell surfaces (4):** the player hub grid (`PlayerHubTable`), `ShortlistPage`, `PlayerPage` (player detail), and the squad rail (`SelectedPlayerPanel`). Buy is on the first three; sell is on player detail and the squad rail.
- **No lineup editor exists.** This app has `/squad` instead of a separate lineup/captain screen — the squad *is* the team. The backend's `PUT /api/users/me/lineup` has no Web counterpart, so its lock-aware echo is out of scope here (see Scope).

## Decisions (resolved during brainstorming)

1. **Scope = buy/sell only.** Lineup-save lock UX is not applicable: there is no lineup-editing UI in this app. Treated as not-applicable, not deferred.
2. **Edge-only feedback.** The happy path (current gameweek still open) stays silent, matching the app's current no-success-toast behavior. The UI speaks up *only* when a change was deferred to the next gameweek because the current one locked.
3. **Centralize via a shared helper (Approach A).** A single `useGameweekApplyNotice()` hook owns the "did the lock fire?" decision; both button components call it. No per-page or per-component duplication.
4. **Detection is echo-vs-baseline.** "Deferred" is meaningful only relative to the gameweek the user believed was current. Compare `echo.appliedToGameweek` against the cached current-gameweek number; a mismatch means the lock fired between load and submit.
5. **Informational, not blocking.** The mutation has already succeeded server-side by the time the echo arrives; nothing is blocked or confirmed. The feedback is purely after-the-fact.
6. **Reuse the existing `Toast`.** No new banner or visual primitive.

## Architecture

### Data contract (`src/api/types.ts`)

```ts
export interface GameweekApplyEcho {
  appliedToGameweek: number | null;   // which gameweek the change landed on
  currentGameweekLocked: boolean;     // backend: true only when no editable gameweek exists
}

export interface SquadMutationResult {
  squad: Squad;
  gameweek: GameweekApplyEcho;
}
```

### Endpoints (`src/api/endpoints.ts`)

`buyPlayer` and `sellPlayer` change their return type from `Squad` to `SquadMutationResult`. URLs, HTTP methods, and request bodies are unchanged.

### Cache fix (`src/query/hooks.ts`)

`useBuyPlayer`/`useSellPlayer` unwrap the response and refresh the gameweek strip:

```ts
onSuccess: (result) => {
  qc.setQueryData(SQUAD_KEY(flavor), result.squad);
  qc.invalidateQueries({ queryKey: ["gameweek-current"] });
},
onSettled: () => qc.invalidateQueries({ queryKey: SQUAD_KEY(flavor) }), // unchanged
```

This unwrap is the one piece that must land regardless of the rest of the feature — without it, a buy/sell today writes a malformed object into the squad cache.

### Deferral notice (`src/components/gameweek/useGameweekApplyNotice.ts`)

A shared hook owns the entire decision so the buttons stay dumb:

```ts
export function useGameweekApplyNotice() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data } = useCurrentGameweek(); // subscribes → baseline cached on every buy surface

  return useCallback((echo: GameweekApplyEcho) => {
    const baseline = data?.current?.number ?? null; // what the user believed was current
    const applied = echo.appliedToGameweek;

    // Deferred: the gameweek we showed locked between load and submit.
    if (applied != null && baseline != null && applied !== baseline) {
      toast.show(t("gameweek.applyDeferred", { locked: baseline, applied }));
      return;
    }
    // No editable gameweek left (season tail): change saved, but no "next" number to name.
    if (applied == null && baseline != null) {
      toast.show(t("gameweek.applyLocked"));
    }
    // baseline null (no gameweek context) or applied === baseline (happy path) → stay silent.
  }, [data, t, toast]);
}
```

Detection keys off `appliedToGameweek` vs the baseline, **not** `currentGameweekLocked`. The latter is part of the contract (kept on the type) but, per the backend, is true only when no editable gameweek exists at all — too narrow to signal the common deferral. Leaving it unread is intentional, not a missed branch.

Two deliberate points:

- **Baseline comes from the hook's rendered `data`, not `getQueryData`.** That's the value as of the last render — strictly before this action — so the hooks' own `gameweek-current` invalidation can't race it.
- **Calling `useCurrentGameweek()` inside the helper guarantees the baseline is populated** on every buy surface, not just `/squad`. It is the same query key, so React Query dedupes to a single request regardless of how many buttons mount.

### UI wiring

**`BuyButton`** forwards the echo to the notice; the existing `onError` toast is untouched:

```ts
const notify = useGameweekApplyNotice();
// ...
buy.mutate(player.playerId, {
  onSuccess: (result) => notify(result.gameweek),
  onError: (err) => toast.show(t(errorKey(err))),
});
```

**`SellButton`** adds the same inside its confirm handler, alongside the existing `setOpen(false)`:

```ts
const notify = useGameweekApplyNotice();
// ...
sell.mutate(player.playerId, {
  onSuccess: (result) => { setOpen(false); notify(result.gameweek); },
  onError: (err) => { setOpen(false); toast.show(t(errorKey(err))); },
});
```

This covers all four surfaces through the two button components — no per-page work.

### i18n

Two new keys under the existing `gameweek.` namespace, in both `is` and `en`:

| Key | English | Icelandic (draft — owner review) |
|---|---|---|
| `gameweek.applyDeferred` | "Gameweek {{locked}} has locked — your change applies to Gameweek {{applied}}." | "Umferð {{locked}} er læst — breytingin gildir fyrir umferð {{applied}}." |
| `gameweek.applyLocked` | "The gameweek has locked — your change is saved for the next one." | "Umferðin er læst — breytingin er vistuð fyrir næstu umferð." |

Icelandic copy ships as a draft for owner review, following the repo's i18n pattern.

## Data flow

1. User loads a buy surface. `useGameweekApplyNotice` (via `useCurrentGameweek`) caches the current gameweek number as the baseline.
2. User lingers; the gameweek deadline passes server-side. Backend now treats the next gameweek as the editable one.
3. User clicks buy/sell. The mutation succeeds against the live squad (the locked gameweek's frozen snapshot is untouched).
4. The response echo carries `appliedToGameweek` = the now-current editable gameweek.
5. `useBuyPlayer`/`useSellPlayer` `onSuccess` unwraps `result.squad` into the squad cache and invalidates `["gameweek-current"]` (the `/squad` strip refreshes to the new lock state).
6. The button's `onSuccess` calls `notify(result.gameweek)`. The notice compares `appliedToGameweek` to the rendered baseline; on mismatch it shows the deferral toast.

Happy path (current gameweek still open → `applied === baseline`) produces no toast.

## Testing (Vitest + Testing Library, repo conventions)

- **Hooks** (`hooks.test.tsx`): update existing buy/sell tests for the new shape — assert `result.squad` (not the wrapper) lands in `["squad", flavor]`, and that `["gameweek-current"]` is invalidated on success.
- **Notice helper** (new test file): deferred (`applied !== baseline` → deferral toast carrying both numbers); happy path (`applied === baseline` → silent); no-current-gameweek (`applied` null, baseline set → generic locked toast); no-baseline (`baseline` null → silent).
- **Buttons**: assert `BuyButton`/`SellButton` call the notice with `result.gameweek` on success; the error path is unchanged.

## Scope

**In:**
- Response-shape types + cache unwrap (the latent-bug fix).
- `useGameweekApplyNotice` helper.
- Wiring into `BuyButton` and `SellButton`.
- Two i18n keys (is/en).
- Tests.

**Out:**
- **Lineup-save lock UX** — not applicable; no lineup/captain editor exists (`/squad` is the team). `PUT /api/users/me/lineup` has no Web counterpart to make lock-aware.
- **Persistent "Locks in Xh" badge near off-`/squad` buy buttons** — edge-only feedback was chosen; `CurrentGameweekStrip` on `/squad` already covers the persistent-countdown need.
- **New banner/visual primitive** — reuses the existing `Toast`.
- **Calendar / current-gameweek status screen** and **per-gameweek scoring display** — separate issues (already out of scope per the issue).

## Risk

The response-shape change is already live on the backend (Backend#60 merged). The cache-unwrap fix should land regardless of the rest of the feature; without it, a buy/sell today writes a malformed `{ squad, gameweek }` object into the squad cache where a `Squad` is expected.
