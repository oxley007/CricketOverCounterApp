// components/CurrentOverDisplay/BallCircle.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { BallCircle } from "./BallCircle";
import { wide, run } from "../../test/factories/ballEvents";

describe("BallCircle – UI rendering", () => {
  // ------------------------
  // 0. Sanity check
  // ------------------------
  it("sanity check: test runner works", () => {
    expect(true).toBe(true);
  });

  // ------------------------
  // 1. Empty/unbowled circle
  // ------------------------
  it("renders empty (unbowled) circle", () => {
    const { getByTestId } = render(<BallCircle item={null} />);
    expect(getByTestId("unbowled-circle")).toBeTruthy();
  });

  // ------------------------
  // 2. Normal balls (runs)
  // ------------------------
  it("renders normal ball with runs > 0", () => {
    const { getByText } = render(<BallCircle item={run(2)} />);
    expect(getByText("2")).toBeTruthy();
  });

  it("renders normal ball with 0 runs as •", () => {
    const { getByText } = render(<BallCircle item={run(0)} />);
    expect(getByText("•")).toBeTruthy();
  });

  // ------------------------
  // 3. Extra-only balls
  // ------------------------
  it("extra-only ball hides main dot", () => {
    const { queryByText } = render(<BallCircle item={wide()} />);
    expect(queryByText("•")).toBeNull();
  });

  it("extra summary circle shows 'Ex' + number", () => {
    const { getByText } = render(<BallCircle item={{ extraCount: 4 }} />);
    expect(getByText("Ex")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
  });

  // ------------------------
  // 4. Negative wicket as ball (Rule A)
  // ------------------------
  it("renders negative runs when wicket is represented as a ball", () => {
    const negativeBall = {
      type: "ball",
      runs: -5,
      isExtra: false,
      countsAsBall: true,
    };

    const { getByText, queryByText } = render(<BallCircle item={negativeBall as any} />);

    expect(getByText("-5")).toBeTruthy();
    expect(queryByText("W")).toBeNull();
  });

  // ------------------------
  // 5. Plain Wicket
  // ------------------------
  it("renders plain wicket as W only", () => {
    const event = {
      type: "wicket",
      kind: "bowled",
      runs: 0,
      isExtra: false,
      countsAsBall: true,
    };

    const { getByText, queryByText } = render(<BallCircle item={event as any} />);

    expect(getByText("W")).toBeTruthy();
    expect(queryByText("+0")).toBeNull();
    expect(queryByText("•")).toBeNull();
  });

  // ------------------------
  // 6. Run-out + runs (Rule B)
  // ------------------------
  it("renders runOut wicket with runs as W + runs", () => {
    const event = {
      type: "wicket",
      kind: "runOut",
      runs: 1,
      isExtra: false,
      countsAsBall: true,
    };

    const { getByText } = render(<BallCircle item={event as any} />);

    expect(getByText("W")).toBeTruthy();
    expect(getByText("+1")).toBeTruthy();
  });

  // ------------------------
  // 7. Wicket + wide + runs
  // ------------------------
  it("renders wicket with wide and runs as subtext", () => {
    const event = {
      type: "wicket",
      kind: "stumped",
      runs: 1,
      isExtra: true,
      extraType: "wide",
      countsAsBall: false,
    };

    const { getByText } = render(<BallCircle item={event as any} />);

    expect(getByText("W")).toBeTruthy();
    expect(getByText("+1 Wd")).toBeTruthy();
  });

  // ------------------------
  // 8. Wicket + wide + 0 runs (always +1 Wd)
  // ------------------------
  it("renders wicket with wide and no runs as +1 Wd", () => {
    const event = {
      type: "wicket",
      kind: "stumped",
      runs: 1,
      isExtra: true,
      extraType: "wide",
      countsAsBall: false,
    };

    const { getByText } = render(<BallCircle item={event as any} />);

    expect(getByText("W")).toBeTruthy();
    expect(getByText("+1 Wd")).toBeTruthy(); // ✅ correct for a wide
  });
});
