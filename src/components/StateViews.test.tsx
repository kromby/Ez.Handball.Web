import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ApiError } from "../api/client";
import { ErrorView, Loading, NotFound } from "./StateViews";

test("Loading shows a status message", () => {
  render(<Loading />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test("NotFound shows the given label", () => {
  render(<NotFound label="Player not found" />);
  expect(screen.getByText("Player not found")).toBeInTheDocument();
});

test("ErrorView renders a 404 as not-found using the fallback label", () => {
  render(<ErrorView error={new ApiError(404, "player_not_found", "x")} notFoundLabel="No such player" />);
  expect(screen.getByText("No such player")).toBeInTheDocument();
});

test("ErrorView renders a generic error otherwise", () => {
  render(<ErrorView error={new Error("boom")} notFoundLabel="No such player" />);
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
