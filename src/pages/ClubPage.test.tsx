import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import ClubPage from "./ClubPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ApiError } from "../api/client";

afterEach(() => vi.restoreAllMocks());

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/clubs/:id" element={<ClubPage />} />
      <Route path="/players/:playerId" element={<div>player page</div>} />
    </Routes>,
    { initialEntries: ["/clubs/c1"] },
  );
}

test("renders club name and roster rows in server order with player links", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1",
    name: "Valur",
    logoUrl: "https://example.test/valur.png",
    venue: null,
    foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1",
    season: "2025-2026",
    players: [
      { playerId: "p7", name: "Jón Jónsson", jerseyNumber: "7", position: "Skytta", age: 24 },
      { playerId: "p9", name: "Geir Geirsson", jerseyNumber: null, position: "Leikmaður", age: null },
    ],
  });

  setup();

  expect(await screen.findByRole("heading", { name: "Valur" })).toBeInTheDocument();

  const rows = await screen.findAllByRole("row");
  const first = within(rows[1]);
  expect(first.getByRole("link", { name: "Jón Jónsson" })).toHaveAttribute("href", "/players/p7");
  expect(first.getByText("7")).toBeInTheDocument();
  expect(first.getByText("Skytta")).toBeInTheDocument();
  expect(first.getByText("24")).toBeInTheDocument();

  const second = within(rows[2]);
  expect(second.getByRole("link", { name: "Geir Geirsson" })).toHaveAttribute("href", "/players/p9");
  expect(second.getByText("—")).toBeInTheDocument();
});

test("renders an empty state when the club has no players", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });

  setup();

  expect(await screen.findByText("No players on the current roster.")).toBeInTheDocument();
});

test("renders a not-found state when the club is unknown (404)", async () => {
  vi.spyOn(api, "getClub").mockRejectedValue(new ApiError(404, "club_not_found", "not found"));
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: null, players: [],
  });

  setup();

  expect(await screen.findByText("Club not found")).toBeInTheDocument();
});

test("does not render venue or founded year while they are null", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });

  setup();

  await screen.findByRole("heading", { name: "Valur" });
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
