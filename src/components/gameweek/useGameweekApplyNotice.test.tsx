import { render, screen, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { expect, test } from "vitest";
import type { GameweekApplyEcho } from "../../api/types";
import { i18n } from "../../i18n";
import { createQueryClient } from "../../query/queryClient";
import { ToastProvider } from "../Toast";
import { useGameweekApplyNotice } from "./useGameweekApplyNotice";

// Mirrors the repo's toast-test convention (Toast.test.tsx / SellButton.test.tsx):
// drive the real ToastProvider via a Trigger component and assert on the rendered
// role="status" node, rather than stubbing useToast.
function Trigger({ echo }: { echo: GameweekApplyEcho }) {
  const notify = useGameweekApplyNotice();
  return <button onClick={() => notify(echo)}>fire</button>;
}

function renderNotice(baseline: number | null, echo: GameweekApplyEcho) {
  const client = createQueryClient();
  client.setQueryData(["gameweek-current"], {
    current: baseline == null ? null : { number: baseline },
    lastSettled: null,
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <Trigger echo={echo} />
        </ToastProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

test("toasts the interpolated deferral message when applied differs from the baseline", () => {
  renderNotice(3, { appliedToGameweek: 4, currentGameweekLocked: false });
  act(() => screen.getByText("fire").click());
  // Asserting the fully-resolved string is swap-proof: if the hook swapped
  // locked/applied, the rendered text would read "Gameweek 4 ... Gameweek 3".
  const expected = i18n.t("gameweek.applyDeferred", { locked: 3, applied: 4 });
  expect(screen.getByRole("status")).toHaveTextContent(expected);
});

test("stays silent on the happy path (applied equals baseline)", () => {
  renderNotice(3, { appliedToGameweek: 3, currentGameweekLocked: false });
  act(() => screen.getByText("fire").click());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("toasts the generic locked message when there is no editable gameweek", () => {
  renderNotice(3, { appliedToGameweek: null, currentGameweekLocked: true });
  act(() => screen.getByText("fire").click());
  expect(screen.getByRole("status")).toHaveTextContent(i18n.t("gameweek.applyLocked"));
});

test("stays silent when there is no baseline gameweek", () => {
  renderNotice(null, { appliedToGameweek: 4, currentGameweekLocked: false });
  act(() => screen.getByText("fire").click());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
