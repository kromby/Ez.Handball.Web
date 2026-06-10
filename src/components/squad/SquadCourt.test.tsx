import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { SquadCourt, COURT_ORDER } from "./SquadCourt";
import { i18n } from "../../i18n";
import type { SquadPlayer } from "../../api/types";

const mk = (id: string, name: string, position: string): SquadPlayer => ({
  playerId: id, name, clubId: "c", clubName: "Club", position, gender: "karlar",
  price: { amount: 10_000_000, currency: "ISK" }, pricePaid: { amount: 10_000_000, currency: "ISK" }, rating: 70,
});

const NAMES = ["Siggi", "Bjössi", "Gunna", "Dalli", "Helga", "Arni", "Kata"];
const full = COURT_ORDER.map((code, i) => mk(`p-${i}`, NAMES[i], code));

const renderCourt = (ui: React.ReactElement) =>
  render(<I18nextProvider i18n={i18n}><MemoryRouter>{ui}</MemoryRouter></I18nextProvider>);

describe("SquadCourt", () => {
  it("places a token for each of the seven positions", () => {
    renderCourt(<SquadCourt players={full} selectedId={null} onSelect={vi.fn()} />);
    for (const code of COURT_ORDER) expect(screen.getByText(code)).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(7);
  });

  it("renders ghost slots (market links) for unfilled positions", () => {
    renderCourt(<SquadCourt players={[mk("p-1", "Solo", "GK")]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });

  it("lists players with an unknown position code in an 'others' strip", () => {
    renderCourt(<SquadCourt players={[mk("p-x", "Oddball", "ZZ")]} selectedId={null} onSelect={vi.fn()} />);
    const others = screen.getByTestId("court-others");
    expect(within(others).getByText("Oddball")).toBeInTheDocument();
  });
});
