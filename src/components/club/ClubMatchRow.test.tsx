import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { expect, test } from "vitest";
import type { ClubMatch } from "../../api/types";
import { i18n } from "../../i18n";
import { ClubMatchRow } from "./ClubMatchRow";

function base(overrides: Partial<ClubMatch> = {}): ClubMatch {
  return {
    matchId: "m1",
    tournamentId: "8444",
    tournamentName: "Olís deild karla",
    round: "12",
    date: "2026-03-14T17:00:00Z",
    venue: "Höllin",
    status: "played",
    isHome: true,
    opponentClubId: "c2",
    opponentName: "Haukar",
    opponentLogoUrl: "https://example.test/haukar.png",
    clubScore: 28,
    opponentScore: 24,
    ...overrides,
  };
}

function renderRow(match: ClubMatch) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ClubMatchRow match={match} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

test("played row shows the score, win accent, opponent link, and H badge", () => {
  renderRow(base());
  expect(screen.getByText("28–24")).toBeInTheDocument();
  expect(document.querySelector(".club-match-score--win")).not.toBeNull();
  expect(screen.getByRole("link", { name: "Haukar" })).toHaveAttribute("href", "/clubs/c2");
  expect(screen.getByText("H")).toBeInTheDocument();
});

test("loss is accented as loss and away shows A", () => {
  renderRow(base({ isHome: false, clubScore: 22, opponentScore: 25 }));
  expect(document.querySelector(".club-match-score--loss")).not.toBeNull();
  expect(screen.getByText("A")).toBeInTheDocument();
});

test("draw is accented as draw", () => {
  renderRow(base({ clubScore: 25, opponentScore: 25 }));
  expect(document.querySelector(".club-match-score--draw")).not.toBeNull();
});

test("upcoming row hides the score and shows a kickoff time instead", () => {
  renderRow(base({ status: "upcoming", clubScore: null, opponentScore: null }));
  expect(screen.queryByText(/–/u)).not.toBeInTheDocument();
  expect(document.querySelector(".club-match-time")).not.toBeNull();
});

test("falls back to a placeholder when the opponent name is null", () => {
  renderRow(base({ opponentName: null }));
  expect(screen.getByRole("link", { name: "TBD" })).toHaveAttribute("href", "/clubs/c2");
});

test("renders a blank logo placeholder when opponent logo is null", () => {
  renderRow(base({ opponentLogoUrl: null }));
  expect(document.querySelector(".club-match-logo--blank")).not.toBeNull();
  expect(document.querySelector("img.club-match-logo")).toBeNull();
});
