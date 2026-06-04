import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PlayerTable, type PlayerColumn } from "./PlayerTable";
import { renderWithProviders } from "../test/renderWithQuery";

interface Row { playerId: string; name: string | null; clubName: string | null; position: string | null; }

const rows: Row[] = [
  { playerId: "p1", name: "Aron", clubName: "Stjarnan", position: "VS" },
  { playerId: "p2", name: null, clubName: null, position: null },
];
const after: PlayerColumn<Row>[] = [
  { key: "pos", header: "Pos", align: "left", render: (r) => r.position ?? "—" },
];

test("renders a row per entry with player link, club, and after-columns", () => {
  renderWithProviders(<PlayerTable<Row> rows={rows} after={after} />);
  expect(screen.getByRole("link", { name: "Aron" })).toHaveAttribute("href", "/players/p1");
  expect(screen.getByText("Stjarnan")).toBeInTheDocument();
  expect(screen.getByText("VS")).toBeInTheDocument();
});

test("falls back to placeholders for null name and club", () => {
  renderWithProviders(<PlayerTable<Row> rows={rows} after={after} />);
  expect(screen.getByText("Unknown player")).toBeInTheDocument();
  expect(screen.getAllByText("—").length).toBeGreaterThan(0);
});

test("shows the empty label when there are no rows", () => {
  renderWithProviders(<PlayerTable<Row> rows={[]} emptyLabel="Nothing here yet." />);
  expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
});
