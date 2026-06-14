import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithProviders } from "../../test/renderWithQuery";
import { PlayerScoreLine } from "./PlayerScoreLine";

test("renders a captain line with multiplier badge and final points", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Aron Pálmarsson"
      position="GK"
      rawPoints={9}
      points={18}
      played
      autoSubbedIn={false}
      captainApplied
      multiplier={2}
    />,
  );
  expect(screen.getByText("Aron Pálmarsson")).toBeInTheDocument();
  expect(screen.getByText("C ×2")).toBeInTheDocument();
  expect(screen.getByText("18")).toBeInTheDocument();
});

test("renders an auto-sub badge", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Gísli Kristjánsson"
      position="CB"
      rawPoints={8}
      points={8}
      played
      autoSubbedIn
      captainApplied={false}
      multiplier={1}
    />,
  );
  expect(screen.getByText("↑ sub")).toBeInTheDocument();
});

test("renders a DNP starter dimmed with zero points", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Bjarki Már Elísson"
      position="RB"
      rawPoints={0}
      points={0}
      played={false}
      autoSubbedIn={false}
      captainApplied={false}
      multiplier={1}
    />,
  );
  expect(screen.getByText("DNP")).toBeInTheDocument();
  expect(screen.getByText("Bjarki Már Elísson").closest(".gwsc-line")).toHaveClass("gwsc-line--dnp");
});
