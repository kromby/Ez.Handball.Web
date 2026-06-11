# Filter & Sort Restyle (Leikmenn) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Player Hub (Leikmenn) filter dropdowns into themed "inked pills", give the column sort-headers real CSS, and remove the redundant "Raða eftir" sort dropdown so sorting lives only on the column headers.

**Architecture:** Pure front-end change in `Ez.Handball.Web`. Three shared/page components get small markup tweaks (a caret element, a wrapper) so CSS can target them; one CSS file gains two new rule blocks; the Player Hub page drops one control and an unused label map. Native `<select>` is kept (accessible, mobile-friendly) — only its default chrome is hidden. No backend, no API contract, no i18n key changes.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + Testing Library, react-i18next, hand-rolled CSS in `src/styles/app.css`. Design tokens already exist as CSS variables (`--paper-2`, `--ink`, `--amber-deep`, etc.).

**Spec:** `docs/superpowers/specs/2026-06-11-filter-and-sort-restyle-design.md`

---

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `src/pages/PlayerHubPage.tsx` | Player Hub screen: wires filters + table | Remove the sort `FilterSelect` and the unused `sortLabel` map |
| `src/pages/PlayerHubPage.test.tsx` | Page behavior tests | Replace the dropdown-sort test with a header-sort test; assert no "Sort by" dropdown |
| `src/components/SortHeader.tsx` | One sortable column header button | Move the active caret into a class-tagged `<span>` |
| `src/components/SortHeader.test.tsx` | SortHeader unit test | Add a caret-presence assertion |
| `src/components/FilterSelect.tsx` | One labelled filter dropdown | Add a caret element + keep label/select; class hooks for the pill |
| `src/components/FilterSelect.test.tsx` | FilterSelect unit test | Add a caret-presence assertion |
| `src/styles/app.css` | Global styles | Add `.filter-select` (inked pill) and `.sort-header` rule blocks |

Tasks are ordered so each leaves the suite green: Task 1 (page de-dupe) → Task 2 (SortHeader markup) → Task 3 (FilterSelect markup) → Task 4 (CSS).

---

## Task 1: Remove the redundant "Raða eftir" dropdown (header-only sorting)

The page currently renders five `FilterSelect`s — the fifth is the sort dropdown — plus a
`sortLabel` map used only by that dropdown. The clickable column headers (`SortHeader`)
already drive sorting via `update({ sort })`. We delete the dropdown and the map; sorting
stays fully functional through the headers. `SORTS`/`VALID`/`parseSort` stay (they still parse
the `sort` URL param and default to `Goals`).

**Files:**
- Modify: `src/pages/PlayerHubPage.tsx`
- Test: `src/pages/PlayerHubPage.test.tsx:48-54`

- [ ] **Step 1: Replace the dropdown-sort test with a header-sort test**

In `src/pages/PlayerHubPage.test.tsx`, replace the whole `test("choosing a sort ...")` block
(lines 48–54) with:

```tsx
test("clicking a column header re-queries getPlayers with that sort", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  await userEvent.click(screen.getByRole("button", { name: /Price/i }));
  expect(spy.mock.calls.some(([p]) => p.sort === "Price")).toBe(true);
});

test("no standalone 'Sort by' dropdown is rendered", async () => {
  mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  expect(screen.queryByRole("combobox", { name: /Sort by/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- src/pages/PlayerHubPage.test.tsx`
Expected: the `no standalone 'Sort by' dropdown` test FAILS (a combobox named "Sort by" still
exists). The header-click test should PASS already (headers work today) — that is fine.

- [ ] **Step 3: Remove the sort dropdown from the page**

In `src/pages/PlayerHubPage.tsx`, delete the fifth `FilterSelect` (the sort one) — remove this
block entirely (currently lines 114–119):

```tsx
        <FilterSelect
          label={t("playerHub.sortBy")}
          value={sort}
          options={SORTS.map((s) => ({ value: s, label: sortLabel[s] }))}
          onChange={(v) => update({ sort: v, offset: undefined })}
        />
```

The four remaining `FilterSelect`s (Season, Gender, Position, Tournament) stay unchanged.

- [ ] **Step 4: Remove the now-unused `sortLabel` map**

In the same file, delete the `sortLabel` declaration (currently lines 65–73):

```tsx
  const sortLabel: Record<PoolSort, string> = {
    Goals: t("playerHub.sortGoals"),
    Games: t("playerHub.sortGames"),
    YellowCards: t("playerHub.sortYellowCards"),
    TwoMinuteSuspensions: t("playerHub.sortTwoMinuteSuspensions"),
    RedCards: t("playerHub.sortRedCards"),
    Rating: t("playerHub.sortRating"),
    Price: t("playerHub.sortPrice"),
  };
```

Leave `SORTS`, `VALID`, `parseSort`, and the `sort` variable in place — `parseSort(params.get("sort"))`
still feeds the table's active sort and the `usePlayers` query.

- [ ] **Step 5: Run the full test suite to verify it passes**

Run: `npm run test`
Expected: PASS, including both new tests in `PlayerHubPage.test.tsx`. No TypeScript "declared
but never used" errors for `sortLabel` (it is gone) — if the build complains about an unused
import, none is expected here since `PoolSort` is still used by `parseSort`/`SORTS`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/PlayerHubPage.tsx src/pages/PlayerHubPage.test.tsx
git commit -m "Remove redundant sort dropdown from Player Hub (header-only sorting)"
```

---

## Task 2: Class-tagged caret in `SortHeader`

Today the active caret is a bare text string (`{on ? " ▾" : ""}`). Move it into a
`<span class="sort-caret" aria-hidden="true">` so CSS in Task 4 can style/position it and so the
active state is expressed structurally, not as appended text. `aria-pressed` and the accessible
name (the label) are unchanged.

**Files:**
- Modify: `src/components/SortHeader.tsx`
- Test: `src/components/SortHeader.test.tsx`

- [ ] **Step 1: Add a failing caret-presence test**

Append to `src/components/SortHeader.test.tsx`:

```tsx
test("renders a caret element only when active", () => {
  const onSort = vi.fn();
  const { rerender, container } = render(
    <SortHeader label="Goals" sortKey="Goals" active="Rating" onSort={onSort} />,
  );
  expect(container.querySelector(".sort-caret")).toBeNull();

  rerender(<SortHeader label="Goals" sortKey="Goals" active="Goals" onSort={onSort} />);
  expect(container.querySelector(".sort-caret")).not.toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/components/SortHeader.test.tsx`
Expected: FAIL on the active case — `container.querySelector(".sort-caret")` is `null` because
the caret is currently plain text, not an element with that class.

- [ ] **Step 3: Replace the bare caret text with a span**

In `src/components/SortHeader.tsx`, change the button body from:

```tsx
      {label}{on ? " ▾" : ""}
```

to:

```tsx
      {label}
      {on && <span className="sort-caret" aria-hidden="true">▾</span>}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/components/SortHeader.test.tsx`
Expected: PASS for both the existing aria-pressed test and the new caret test.

- [ ] **Step 5: Commit**

```bash
git add src/components/SortHeader.tsx src/components/SortHeader.test.tsx
git commit -m "Move SortHeader active caret into a class-tagged span"
```

---

## Task 3: Inked-pill markup for `FilterSelect`

Add a caret element next to the native `<select>` so CSS can draw the amber `▾` while the
select's own chrome is hidden (`appearance: none`). Keep the `<label className="filter-select">`
wrapper and the `filter-select-label` span. The native select keeps its `aria-label`, so the
combobox role and accessible name are unchanged.

**Files:**
- Modify: `src/components/FilterSelect.tsx`
- Test: `src/components/FilterSelect.test.tsx`

- [ ] **Step 1: Add a failing caret-presence test**

Append to `src/components/FilterSelect.test.tsx`:

```tsx
test("renders a decorative caret alongside the select", () => {
  const { container } = render(
    <FilterSelect
      label="Season"
      value="2025-26"
      options={[{ value: "2025-26", label: "2025-26" }]}
      onChange={() => {}}
    />,
  );
  expect(container.querySelector(".filter-select-caret")).not.toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/components/FilterSelect.test.tsx`
Expected: FAIL — no `.filter-select-caret` element exists yet.

- [ ] **Step 3: Add the caret element**

In `src/components/FilterSelect.tsx`, change the returned JSX from:

```tsx
    <label className="filter-select">
      <span className="filter-select-label">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
```

to:

```tsx
    <label className="filter-select">
      <span className="filter-select-label">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="filter-select-caret" aria-hidden="true">▾</span>
    </label>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- src/components/FilterSelect.test.tsx`
Expected: PASS for the existing role/value/onChange test and the new caret test.

- [ ] **Step 5: Commit**

```bash
git add src/components/FilterSelect.tsx src/components/FilterSelect.test.tsx
git commit -m "Add decorative caret element to FilterSelect for inked-pill styling"
```

---

## Task 4: Inked-pill + sort-header CSS

Add the actual styling. CSS is not exercised by jsdom unit tests, so verification is: the full
suite stays green, the production build succeeds, and a manual visual check in the dev server.
The `.market-filters` flex container already exists (`app.css:1195`) and is unchanged.

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Append the filter-pill and sort-header rules**

Add this block to the end of `src/styles/app.css`:

```css
/* ---------- Player Hub filters (inked pill) + sortable headers ---------- */
.filter-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--paper-2);
  border: 2px solid var(--ink);
  border-radius: 999px;
  padding: 6px 30px 6px 14px; /* right padding leaves room for the caret */
  cursor: pointer;
  transition: border-color 0.15s;
}
.filter-select:hover { border-color: var(--amber-deep); }
.filter-select:focus-within {
  border-color: var(--amber-deep);
  box-shadow: 0 0 0 3px var(--amber-wash);
}
.filter-select-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.filter-select select {
  appearance: none;
  -webkit-appearance: none;
  border: none;
  background: transparent;
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
  padding: 0;
  outline: none; /* focus ring is on the pill via :focus-within */
}
.filter-select-caret {
  position: absolute;
  right: 13px;
  color: var(--amber-deep);
  font-size: 11px;
  pointer-events: none; /* clicks pass through to the select */
}

.sort-header {
  background: none;
  border: none;
  font: inherit;
  font-weight: 800;
  font-size: inherit;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-2);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.sort-header:hover { color: var(--amber-deep); }
.sort-header--on { color: var(--amber-deep); }
.sort-caret { font-size: 9px; }
```

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: PASS — no regressions (CSS changes do not affect jsdom assertions).

- [ ] **Step 3: Verify the production build compiles**

Run: `npm run build`
Expected: `tsc -b` and `vite build` both succeed with no errors.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`, open the printed local URL, navigate to `/players` (or `/`). Confirm:
- The four filters render as rounded ink-bordered pills with an uppercase label, the value,
  and an amber `▾`; opening one shows the native dropdown; hover/keyboard-focus shows the
  amber border/ring.
- There is no separate "Raða eftir / Sort by" control.
- Numeric column headers (GP, Goals, Rating, Price) read as uppercase buttons; the active one
  is amber with a small caret; hovering a header tints it amber.

- [ ] **Step 5: Commit**

```bash
git add src/styles/app.css
git commit -m "Style Player Hub filters as inked pills and add sort-header CSS"
```

---

## Self-Review Notes

- **Spec coverage:** Filter restyle → Tasks 3 + 4; sort-header CSS → Tasks 2 + 4; drop redundant
  dropdown → Task 1. `parseSort`/`sort` param preserved → Task 1 Step 4. Out-of-scope items
  (FilterChips, other pages, backend, new columns) are untouched.
- **Type consistency:** Class names are stable across tasks — `.filter-select`,
  `.filter-select-label`, `.filter-select-caret`, `.sort-header`, `.sort-header--on`,
  `.sort-caret`. `.sort-header--on` is already emitted by `SortHeader.tsx`; Task 4 styles it.
- **No placeholders:** every code/CSS step shows the full content to add or replace.
