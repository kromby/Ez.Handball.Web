import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BallAvatar, BallDefs } from "./BallAvatar";

describe("BallAvatar", () => {
  it("renders a use of the shared ball symbol at the given size", () => {
    const { container } = render(<BallAvatar size={40} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("40");
    expect(container.querySelector("use")?.getAttribute("href")).toBe("#pivot-ball");
  });

  it("BallDefs defines the ball symbol once", () => {
    const { container } = render(<BallDefs />);
    expect(container.querySelector("symbol#pivot-ball")).not.toBeNull();
    expect(container.querySelector("radialGradient#pivot-ballgrad")).not.toBeNull();
  });
});
