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
