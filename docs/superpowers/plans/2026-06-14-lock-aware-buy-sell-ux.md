# Lock-Aware Buy/Sell UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a gameweek locks between page load and a buy/sell submit, tell the user (via a toast) which gameweek their change actually landed on; and fix the squad cache to unwrap the new `{ squad, gameweek }` response shape.

**Architecture:** Backend#60 changed buy/sell responses from a bare squad to `{ squad, gameweek: { appliedToGameweek, currentGameweekLocked } }`. The mutation hooks unwrap `.squad` into the squad cache and invalidate the current-gameweek query. A shared `useGameweekApplyNotice()` hook compares the echoed `appliedToGameweek` against the cached current-gameweek number (the baseline the user saw) and toasts only when they differ — the deferral edge. Both `BuyButton` and `SellButton` call it on success. Happy path stays silent.

**Tech Stack:** React 18, TypeScript, TanStack Query v5, react-i18next, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-14-lock-aware-buy-sell-ux-design.md`

---

## File Structure

- `src/api/types.ts` — **modify**: add `GameweekApplyEcho` + `SquadMutationResult`.
- `src/api/endpoints.ts` — **modify**: `buyPlayer`/`sellPlayer` return `SquadMutationResult`.
- `src/query/hooks.ts` — **modify**: `useBuyPlayer`/`useSellPlayer` unwrap `.squad`, invalidate `["gameweek-current"]`.
- `src/query/hooks.test.tsx` — **modify**: existing buy/sell tests use the wrapped shape; assert unwrap + invalidation.
- `src/i18n/locales/en.json`, `src/i18n/locales/is.json` — **modify**: add `gameweek.applyDeferred` + `gameweek.applyLocked`.
- `src/components/gameweek/useGameweekApplyNotice.ts` — **create**: the shared deferral-notice hook.
- `src/components/gameweek/useGameweekApplyNotice.test.tsx` — **create**: notice logic tests.
- `src/components/BuyButton.tsx`, `src/components/SellButton.tsx` — **modify**: call the notice on success.
- `src/components/BuyButton.test.tsx`, `src/components/SellButton.test.tsx` — **modify**: mocks return the wrapped shape.

### Test-run notes

- A stray `.worktrees/` checkout can pollute an unscoped `vitest run`. Always scope per-task runs to an explicit file path (e.g. `npx vitest run src/components/gameweek/useGameweekApplyNotice.test.tsx`). Use `npm run test` only for the final full-suite check.
- Type errors surface via `npm run build` (`tsc -b && vite build`). The typed `t()` (`src/i18n/i18next.d.ts`) binds keys to `en.json`, so missing i18n keys fail `tsc`.

---

## Task 1: Response contract + squad-cache unwrap

**Files:**
- Modify: `src/api/types.ts` (after the `MyGameweeks` interface, ~line 366)
- Modify: `src/api/endpoints.ts:123-130`
- Modify: `src/query/hooks.ts:199-206` and `src/query/hooks.ts:228-234`
- Test: `src/query/hooks.test.tsx:50-77`

- [ ] **Step 1: Update the two failing hook tests to the wrapped shape**

In `src/query/hooks.test.tsx`, replace the `useBuyPlayer` and `useSellPlayer` tests (lines ~50-77) with these versions. They mock the new `{ squad, gameweek }` shape, assert the **unwrapped** squad lands in cache, and assert the current-gameweek query is invalidated:

```tsx
test("useBuyPlayer unwraps result.squad into the cache and invalidates gameweek-current", async () => {
  const squad = { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 91, currency: "ISK" }, squadValue: { amount: 9, currency: "ISK" } };
  vi.spyOn(api, "buyPlayer").mockResolvedValue({ squad, gameweek: { appliedToGameweek: 3, currentGameweekLocked: false } } as never);
  const client = createQueryClient();
  client.setQueryData(["gameweek-current"], { current: { number: 3 }, lastSettled: null });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useBuyPlayer(), { wrapper });
  await act(async () => { await result.current.mutateAsync("123"); });
  expect(client.getQueryData(["squad", "fantasy"])).toMatchObject({ remainingBudget: { amount: 91 } });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["gameweek-current"] });
});

test("useSellPlayer unwraps result.squad into the cache and invalidates gameweek-current", async () => {
  const squad = { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 33, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } };
  vi.spyOn(api, "sellPlayer").mockResolvedValue({ squad, gameweek: { appliedToGameweek: 3, currentGameweekLocked: false } } as never);
  const client = createQueryClient();
  client.setQueryData(["gameweek-current"], { current: { number: 3 }, lastSettled: null });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useSellPlayer(), { wrapper });
  await act(async () => { await result.current.mutateAsync("p1"); });
  expect(client.getQueryData(["squad", "fantasy"])).toMatchObject({ remainingBudget: { amount: 33 } });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["gameweek-current"] });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/query/hooks.test.tsx`
Expected: FAIL — the buy/sell tests fail because the hook currently stores the whole `{ squad, gameweek }` wrapper (so `remainingBudget` is undefined) and never invalidates `["gameweek-current"]`.

- [ ] **Step 3: Add the response types**

In `src/api/types.ts`, after the `MyGameweeks` interface (~line 366), add:

```ts
export interface GameweekApplyEcho {
  appliedToGameweek: number | null; // which gameweek the change landed on
  currentGameweekLocked: boolean;   // backend: true only when no editable gameweek exists
}

export interface SquadMutationResult {
  squad: Squad;
  gameweek: GameweekApplyEcho;
}
```

- [ ] **Step 4: Update the endpoint return types**

In `src/api/endpoints.ts`, replace the `buyPlayer`/`sellPlayer` functions (lines ~123-130) with:

```ts
export function buyPlayer(playerId: string, flavor = "fantasy"): Promise<SquadMutationResult> {
  return authedSend<SquadMutationResult>("/api/users/me/squad/players", "POST", { playerId, flavor });
}

export function sellPlayer(playerId: string, flavor = "fantasy"): Promise<SquadMutationResult> {
  return authedSend<SquadMutationResult>(
    `/api/users/me/squad/players/${encodeURIComponent(playerId)}?flavor=${encodeURIComponent(flavor)}`,
    "DELETE",
  );
}
```

Then add `SquadMutationResult` to the type import block at the top of `src/api/endpoints.ts` (the `import type { ... } from "./types"` list), keeping it alphabetical near `Squad`.

- [ ] **Step 5: Update the hooks to unwrap and invalidate**

In `src/query/hooks.ts`, replace the body of `useBuyPlayer` (lines ~199-206) with:

```ts
export function useBuyPlayer(flavor = "fantasy") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => api.buyPlayer(playerId, flavor),
    onSuccess: (result) => {
      qc.setQueryData(SQUAD_KEY(flavor), result.squad);
      qc.invalidateQueries({ queryKey: ["gameweek-current"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SQUAD_KEY(flavor) }),
  });
}
```

And replace the body of `useSellPlayer` (lines ~228-234) with:

```ts
export function useSellPlayer(flavor = "fantasy") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => api.sellPlayer(playerId, flavor),
    onSuccess: (result) => {
      qc.setQueryData(SQUAD_KEY(flavor), result.squad);
      qc.invalidateQueries({ queryKey: ["gameweek-current"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SQUAD_KEY(flavor) }),
  });
}
```

The `Squad` type import in `hooks.ts` (line 3) is still used elsewhere (`useSquad`); leave it. The `onSuccess` param is now inferred as `SquadMutationResult`, so the explicit `: Squad` annotation is gone.

- [ ] **Step 6: Run the hook tests to verify they pass**

Run: `npx vitest run src/query/hooks.test.tsx`
Expected: PASS (all tests, including the two rewritten ones).

- [ ] **Step 7: Typecheck**

Run: `npm run build`
Expected: build succeeds. (If `BuyButton.test.tsx`/`SellButton.test.tsx` are flagged by `tsc`, that's expected — their mocks are fixed in Task 4. `tsc -b` checks test files too; if the build fails only on those two test mocks, proceed — Task 4 resolves them. If you prefer a green build at every task, do Step 1 of Task 4 now.)

- [ ] **Step 8: Commit**

```bash
git add src/api/types.ts src/api/endpoints.ts src/query/hooks.ts src/query/hooks.test.tsx
git commit -m "fix: unwrap {squad,gameweek} buy/sell response into squad cache (Web#38)"
```

---

## Task 2: Add i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json` (inside the `gameweek` object)
- Modify: `src/i18n/locales/is.json` (inside the `gameweek` object)

- [ ] **Step 1: Add the English keys**

In `src/i18n/locales/en.json`, inside the `gameweek` object, add two keys immediately after the `"versus": "vs",` line (before the `"status"` sub-object):

```json
    "applyDeferred": "Gameweek {{locked}} has locked — your change applies to Gameweek {{applied}}.",
    "applyLocked": "The gameweek has locked — your change is saved for the next one.",
```

- [ ] **Step 2: Add the Icelandic keys (draft — owner review)**

In `src/i18n/locales/is.json`, inside the `gameweek` object, add immediately after the `"versus": "—",` line (before the `"status"` sub-object):

```json
    "applyDeferred": "Umferð {{locked}} er læst — breytingin gildir fyrir umferð {{applied}}.",
    "applyLocked": "Umferðin er læst — breytingin er vistuð fyrir næstu umferð.",
```

- [ ] **Step 3: Typecheck (confirms the keys are recognized by the typed `t()`)**

Run: `npm run build`
Expected: build succeeds. (Same caveat as Task 1 Step 7 about the two button-test mocks, if Task 4 isn't done yet.)

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/is.json
git commit -m "i18n: add gameweek deferral/locked apply messages (Web#38)"
```

---

## Task 3: The `useGameweekApplyNotice` hook

**Files:**
- Create: `src/components/gameweek/useGameweekApplyNotice.ts`
- Test: `src/components/gameweek/useGameweekApplyNotice.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/gameweek/useGameweekApplyNotice.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { afterEach, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { createQueryClient } from "../../query/queryClient";
import { i18n } from "../../i18n";
import * as ToastModule from "../Toast";
import { useGameweekApplyNotice } from "./useGameweekApplyNotice";

afterEach(() => vi.restoreAllMocks());

function setup(currentNumber: number | null) {
  const client = createQueryClient();
  client.setQueryData(["gameweek-current"], { current: currentNumber == null ? null : { number: currentNumber }, lastSettled: null });
  const show = vi.fn();
  vi.spyOn(ToastModule, "useToast").mockReturnValue({ show });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nextProvider>
  );
  const { result } = renderHook(() => useGameweekApplyNotice(), { wrapper });
  return { notify: result.current, show };
}

test("toasts a deferral message when applied differs from the baseline", () => {
  const { notify, show } = setup(3);
  notify({ appliedToGameweek: 4, currentGameweekLocked: false });
  expect(show).toHaveBeenCalledTimes(1);
  expect(show.mock.calls[0][0]).toContain("3");
  expect(show.mock.calls[0][0]).toContain("4");
});

test("stays silent on the happy path (applied equals baseline)", () => {
  const { notify, show } = setup(3);
  notify({ appliedToGameweek: 3, currentGameweekLocked: false });
  expect(show).not.toHaveBeenCalled();
});

test("toasts the generic locked message when there is no editable gameweek", () => {
  const { notify, show } = setup(3);
  notify({ appliedToGameweek: null, currentGameweekLocked: true });
  expect(show).toHaveBeenCalledTimes(1);
});

test("stays silent when there is no baseline gameweek", () => {
  const { notify, show } = setup(null);
  notify({ appliedToGameweek: 4, currentGameweekLocked: false });
  expect(show).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/gameweek/useGameweekApplyNotice.test.tsx`
Expected: FAIL — `useGameweekApplyNotice` does not exist yet (import error).

- [ ] **Step 3: Implement the hook**

Create `src/components/gameweek/useGameweekApplyNotice.ts`:

```ts
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { GameweekApplyEcho } from "../../api/types";
import { useCurrentGameweek } from "../../query/hooks";
import { useToast } from "../Toast";

/**
 * Returns a callback that, given a buy/sell response's gameweek echo, toasts the
 * user IF the lock fired between page load and submit (the deferral edge). The
 * baseline is the current gameweek as of the last render — strictly before this
 * action — so the mutation's own gameweek-current invalidation can't race it.
 * Subscribing to useCurrentGameweek here guarantees the baseline is cached on
 * every buy surface, not just /squad. Detection keys off appliedToGameweek vs the
 * baseline; currentGameweekLocked is part of the contract but intentionally unread
 * (it's true only when no editable gameweek exists at all — too narrow to signal
 * the common deferral).
 */
export function useGameweekApplyNotice() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data } = useCurrentGameweek();

  return useCallback(
    (echo: GameweekApplyEcho) => {
      const baseline = data?.current?.number ?? null;
      const applied = echo.appliedToGameweek;

      if (applied != null && baseline != null && applied !== baseline) {
        toast.show(t("gameweek.applyDeferred", { locked: baseline, applied }));
        return;
      }
      if (applied == null && baseline != null) {
        toast.show(t("gameweek.applyLocked"));
      }
      // baseline null (no gameweek context) or applied === baseline (happy path) → silent.
    },
    [data, t, toast],
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/gameweek/useGameweekApplyNotice.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/gameweek/useGameweekApplyNotice.ts src/components/gameweek/useGameweekApplyNotice.test.tsx
git commit -m "feat: add useGameweekApplyNotice deferral hook (Web#38)"
```

---

## Task 4: Wire the notice into BuyButton and SellButton

**Files:**
- Modify: `src/components/BuyButton.tsx:87` (the `buy.mutate` call) + imports
- Modify: `src/components/SellButton.tsx:24-29` (the `sell.mutate` call) + imports
- Test: `src/components/BuyButton.test.tsx:57`, `src/components/SellButton.test.tsx:14`

- [ ] **Step 1: Fix the button-test mocks to the wrapped shape, and add deferral assertions**

In `src/components/BuyButton.test.tsx`, change the success mock at line ~57 from the bare squad to the wrapped shape. Replace:

```tsx
  vi.spyOn(api, "buyPlayer").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 0, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
```

with:

```tsx
  vi.spyOn(api, "buyPlayer").mockResolvedValue({ squad: { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 0, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } }, gameweek: { appliedToGameweek: 3, currentGameweekLocked: false } });
```

In `src/components/SellButton.test.tsx`, change the success mock at line ~14. Replace:

```tsx
  const sell = vi.spyOn(api, "sellPlayer").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 10, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
```

with:

```tsx
  const sell = vi.spyOn(api, "sellPlayer").mockResolvedValue({ squad: { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 10, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } }, gameweek: { appliedToGameweek: 3, currentGameweekLocked: false } });
```

- [ ] **Step 2: Add a deferral-toast test to BuyButton.test.tsx**

Append this test to `src/components/BuyButton.test.tsx` (it seeds a baseline GW, mocks a deferred echo, and asserts a toast appears). It reuses the file's existing `mockBackend`, `renderBtn`, and `authed` helpers — confirm their names match before pasting; if `renderBtn` isn't present, render with `renderWithProviders(<ToastProvider><BuyButton .../></ToastProvider>, { auth: authed })` as the other tests do:

```tsx
test("toasts a deferral notice when the gameweek locked between load and buy", async () => {
  mockBackend({ remaining: 100_000_000 });
  const squad = { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 0, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } };
  vi.spyOn(api, "buyPlayer").mockResolvedValue({ squad, gameweek: { appliedToGameweek: 4, currentGameweekLocked: false } });
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({ current: { number: 3, roundLabel: "3", tournamentId: "t", deadline: "2026-06-14T18:00:00Z", status: "Open", matches: [] }, lastSettled: null });
  renderBtn({ playerId: "p9", position: "GK", price: { amount: 1, currency: "ISK" } });
  const btn = await screen.findByRole("button", { name: /buy/i });
  fireEvent.click(btn);
  expect(await screen.findByRole("status")).toHaveTextContent(/Gameweek 3/);
});
```

- [ ] **Step 3: Run the button tests to verify the new one fails (and shape mocks compile)**

Run: `npx vitest run src/components/BuyButton.test.tsx src/components/SellButton.test.tsx`
Expected: the new deferral test FAILS (no toast shown yet — `BuyButton` doesn't call the notice). Other tests pass with the corrected mock shape.

- [ ] **Step 4: Wire the notice into BuyButton**

In `src/components/BuyButton.tsx`, add the import near the other component imports:

```tsx
import { useGameweekApplyNotice } from "./gameweek/useGameweekApplyNotice";
```

Inside `BuyButton`, add the hook alongside the existing hooks (near `const buy = useBuyPlayer();`):

```tsx
  const notify = useGameweekApplyNotice();
```

Replace the `onClick` mutate call (line ~87) with:

```tsx
    buy.mutate(player.playerId, {
      onSuccess: (result) => notify(result.gameweek),
      onError: (err) => toast.show(t(errorKey(err))),
    });
```

- [ ] **Step 5: Wire the notice into SellButton**

In `src/components/SellButton.tsx`, add the import:

```tsx
import { useGameweekApplyNotice } from "./gameweek/useGameweekApplyNotice";
```

Inside `SellButton`, add alongside `const sell = useSellPlayer();`:

```tsx
  const notify = useGameweekApplyNotice();
```

Replace the `onConfirm` handler (lines ~24-29) with:

```tsx
  const onConfirm = () => {
    sell.mutate(player.playerId, {
      onSuccess: (result) => { setOpen(false); notify(result.gameweek); },
      onError: (err) => { setOpen(false); toast.show(t(errorKey(err))); },
    });
  };
```

- [ ] **Step 6: Run the button tests to verify they pass**

Run: `npx vitest run src/components/BuyButton.test.tsx src/components/SellButton.test.tsx`
Expected: PASS (including the new deferral test).

- [ ] **Step 7: Commit**

```bash
git add src/components/BuyButton.tsx src/components/SellButton.tsx src/components/BuyButton.test.tsx src/components/SellButton.test.tsx
git commit -m "feat: surface gameweek deferral notice on buy/sell (Web#38)"
```

---

## Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass. (If unrelated failures appear from a stray `.worktrees/` checkout, re-run scoped: `npx vitest run --root src`.)

- [ ] **Step 2: Typecheck + production build**

Run: `npm run build`
Expected: `tsc -b` and `vite build` both succeed with no errors.

- [ ] **Step 3: Final commit (only if Steps 1-2 produced any fixups)**

```bash
git add -A
git commit -m "test: lock-aware buy/sell UX green across suite (Web#38)"
```

---

## Self-Review Notes

- **Spec coverage:** response-shape types (Task 1) ✓; cache unwrap + gameweek-current invalidation (Task 1) ✓; `useGameweekApplyNotice` with baseline-from-render + subscribe-to-populate (Task 3) ✓; edge-only detection incl. `applied==null` generic + `baseline==null` silent (Task 3) ✓; BuyButton/SellButton wiring across all four surfaces (Task 4, via the two shared components) ✓; two i18n keys is/en (Task 2) ✓; tests for hooks/notice/buttons (Tasks 1,3,4) ✓.
- **Out of scope (per spec):** lineup save, persistent off-`/squad` badge, new banner primitive — none introduced.
- **Type consistency:** `SquadMutationResult.squad`/`.gameweek`, `GameweekApplyEcho.appliedToGameweek`/`.currentGameweekLocked`, and the `["gameweek-current"]` / `["squad", flavor]` keys are used identically across Tasks 1, 3, and 4.
