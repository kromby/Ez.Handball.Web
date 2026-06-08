import { render, screen, act } from "@testing-library/react";
import { expect, test } from "vitest";
import { ToastProvider, useToast } from "./Toast";

function Trigger() {
  const toast = useToast();
  return <button onClick={() => toast.show("Hello there")}>fire</button>;
}

test("shows a message when toast.show is called", () => {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
  act(() => screen.getByText("fire").click());
  expect(screen.getByRole("status")).toHaveTextContent("Hello there");
});
