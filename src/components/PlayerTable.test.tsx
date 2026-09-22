import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PlayerTable, type PlayerColumn } from "./PlayerTable";
import { renderWithProviders } from "../test/renderWithQuery";

interface Row { playerId: string; name: string | null; clubId: string | null; clubName: string | null; position: string | null; }

const rows: Row[] = [
  { playerId: "p1", name: "Aron", clubId: "c1", clubName: "Stjarnan", position: "VS" },
  { playerId: "p2", name: null, clubId: null, clubName: null, position: null },
];
const after: PlayerColumn<Row>[] = [
  { key: "pos", header: "Pos", render: (r) => r.position ?? "—" },
];

test("renders a row per entry with player link, club link, and after-columns", () => {
  renderWithProviders(<PlayerTable<Row> rows={rows} after={after} />);
  expect(screen.getByRole("link", { name: "Aron" })).toHaveAttribute("href", "/players/p1");
  expect(screen.getByRole("link", { name: "Stjarnan" })).toHaveAttribute("href", "/clubs/c1");
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

test("renders before-columns ahead of the player cell", () => {
  const before: PlayerColumn<Row & { rank: number }>[] = [
    { key: "rank", header: "#", align: "right", render: (r) => r.rank },
  ];
  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
  renderWithProviders(<PlayerTable<Row & { rank: number }> rows={ranked} before={before} after={after} />);
  expect(screen.getByText("#")).toBeInTheDocument();
  expect(screen.getByText("1")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Aron" })).toHaveAttribute("href", "/players/p1");
});

test("shows the club logo with the club name as tooltip when a logo is known", () => {
  const logos = new Map([["c1", "https://cdn.example/stjarnan.png"]]);
  renderWithProviders(<PlayerTable<Row> rows={rows} after={after} clubLogos={logos} />);
  const link = screen.getByRole("link", { name: "Stjarnan" });
  expect(link).toHaveAttribute("href", "/clubs/c1");
  expect(link).toHaveAttribute("title", "Stjarnan");
  const img = screen.getByRole("img", { name: "Stjarnan" });
  expect(img).toHaveAttribute("src", "https://cdn.example/stjarnan.png");
  expect(screen.queryByText("Stjarnan")).not.toBeInTheDocument();
});

test("falls back to the club name when the club has no logo", () => {
  renderWithProviders(<PlayerTable<Row> rows={rows} after={after} clubLogos={new Map()} />);
  expect(screen.getByRole("link", { name: "Stjarnan" })).toHaveTextContent("Stjarnan");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
