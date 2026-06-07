import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

test("confirm fires onConfirm, cancel fires onCancel", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog open title="Sell?" body="Are you sure?" confirmLabel="Sell" cancelLabel="Cancel" onConfirm={onConfirm} onCancel={onCancel} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Sell" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test("renders nothing when closed", () => {
  const { container } = render(
    <ConfirmDialog open={false} title="x" body="y" confirmLabel="ok" cancelLabel="no" onConfirm={() => {}} onCancel={() => {}} />,
  );
  expect(container).toBeEmptyDOMElement();
});

test("Escape triggers cancel", () => {
  const onCancel = vi.fn();
  render(<ConfirmDialog open title="x" body="y" confirmLabel="ok" cancelLabel="no" onConfirm={() => {}} onCancel={onCancel} />);
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(onCancel).toHaveBeenCalledTimes(1);
});
