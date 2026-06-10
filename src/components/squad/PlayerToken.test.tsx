import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "../../i18n";
import { PlayerToken } from "./PlayerToken";
import type { SquadPlayer } from "../../api/types";

const player: SquadPlayer = {
  playerId: "p-1", name: "Lúkas Dahl", clubId: "c1", clubName: "Catalunya BM",
  position: "CB", gender: "karlar", price: { amount: 10_500_000, currency: "ISK" },
  pricePaid: { amount: 9_500_000, currency: "ISK" }, rating: 84,
};

const renderTok = (ui: React.ReactElement) =>
  render(<I18nextProvider i18n={i18n}><MemoryRouter>{ui}</MemoryRouter></I18nextProvider>);

describe("PlayerToken", () => {
  it("shows first name, position badge and rating for a filled slot", () => {
    renderTok(<PlayerToken code="CB" x={50} y={75} player={player} onSelect={vi.fn()} />);
    expect(screen.getByText("Lúkas")).toBeInTheDocument();
    expect(screen.getByText("CB")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
  });

  it("shows '–' when rating is 0", () => {
    renderTok(<PlayerToken code="CB" x={50} y={75} player={{ ...player, rating: 0 }} onSelect={vi.fn()} />);
    expect(screen.getByText("–")).toBeInTheDocument();
  });

  it("fires onSelect with the player id when clicked", () => {
    const onSelect = vi.fn();
    renderTok(<PlayerToken code="CB" x={50} y={75} player={player} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("p-1");
  });

  it("renders an empty ghost slot linking to the player hub when no player", () => {
    renderTok(<PlayerToken code="LP" x={50} y={40} onSelect={vi.fn()} />);
    expect(screen.getByText("LP")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/players");
  });
});
