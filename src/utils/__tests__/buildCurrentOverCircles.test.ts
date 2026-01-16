// src/utils/__tests__/buildCurrentOverCircles.test.ts
import { buildCurrentOverCircles } from "../buildCurrentOverCircles";
import { wide, noBall, bye, legBye, run, wicket } from "../../test/factories/ballEvents";

// ------------------------
// buildCurrentOverCircles logic tests
// ------------------------
describe("buildCurrentOverCircles – logic", () => {

  // 1 Normal deliveries
  describe("Normal deliveries", () => {
    it("renders dot ball correctly", () => {
      const { circles } = buildCurrentOverCircles([run(0)], { wideIsExtraBall: true });
      expect(circles.length).toBe(1);
      expect(circles[0]?.runs).toBe(0);
    });

    [1, 2, 3, 4, 6].forEach(r => {
      it(`renders run of ${r} correctly`, () => {
        const { circles } = buildCurrentOverCircles([run(r)], { wideIsExtraBall: true });
        expect(circles.length).toBe(1);
        expect(circles[0]?.runs).toBe(r);
      });
    });
  });

  // 2 Extras (no wicket)
  describe("Extras", () => {
    it("renders wide with no runs", () => {
      const { circles } = buildCurrentOverCircles([wide()], { wideIsExtraBall: true });
      expect(circles.length).toBe(2);
      expect(circles.filter(Boolean).length).toBe(1);
      expect(circles[0]?.extraType).toBe("wide");
    });

    it("renders wide + runs", () => {
      const { circles } = buildCurrentOverCircles([wide(2)], { wideIsExtraBall: true });
      expect(circles.length).toBe(2);
      expect(circles[0]?.runs).toBe(2);
    });

    it("renders no-ball", () => {
      const { circles } = buildCurrentOverCircles([noBall()], { wideIsExtraBall: true });
      expect(circles.length).toBe(2);
      expect(circles[0]?.extraType).toBe("noBall");
    });

    it("renders no-ball + runs", () => {
      const { circles } = buildCurrentOverCircles([noBall(2)], { wideIsExtraBall: true });
      expect(circles.length).toBe(2);
      expect(circles[0]?.runs).toBe(2);
    });

    it("adds extra circle only if wideIsExtraBall = true", () => {
      const { circles } = buildCurrentOverCircles([wide()], { wideIsExtraBall: true });
      expect(circles.length).toBe(2);
    });

    it("does not add extra circle if wideIsExtraBall = false", () => {
      const { circles } = buildCurrentOverCircles([wide()], { wideIsExtraBall: false });
      expect(circles.length).toBe(1);
    });
  });

  // 3 Wickets (no extras)
  describe("Wickets without extras", () => {
    ["bowled", "caught", "runOut", "stumped"].forEach(kind => {
      it(`renders ${kind} correctly`, () => {
        const { circles } = buildCurrentOverCircles([wicket(kind)], { wideIsExtraBall: true });
        expect(circles.length).toBe(1);
        expect(circles[0]?.type).toBe("wicket");
      });
    });
  });

  // 4 Wickets + extras (high-risk)
  describe("Wickets + extras", () => {
    const scenarios = [
      { kind: "stumped", extraType: "wide", runs: 0, expectedCircles: 2 },
      { kind: "stumped", extraType: "wide", runs: 1, expectedCircles: 2 },
      { kind: "bowled", extraType: "noBall", runs: 0, expectedCircles: 2 },
      { kind: "runOut", extraType: "noBall", runs: 0, expectedCircles: 2 },
      { kind: "runOut", extraType: "noBall", runs: 2, expectedCircles: 2 },
      { kind: "runOut", extraType: "bye", runs: 0, expectedCircles: 1 },
      { kind: "runOut", extraType: "legBye", runs: 0, expectedCircles: 1 },
    ];

    describe.each(scenarios)(
      "$kind + $extraType + runs: $runs",
      ({ kind, extraType, runs, expectedCircles }) => {
        it(`renders ${expectedCircles} circle(s)`, () => {
          const { circles } = buildCurrentOverCircles([
            wicket(kind, { isExtra: !!extraType, extraType: extraType as any, runs, countsAsBall: false })
          ], { wideIsExtraBall: true });
          expect(circles.length).toBe(expectedCircles);
        });
      }
    );
  });

  // 5 Over display behaviour
  describe("Over display behaviour", () => {
    it("extra delivery adds extra circle slot", () => {
      const { circles } = buildCurrentOverCircles([wide()], { wideIsExtraBall: true });
      expect(circles.length).toBe(2);
    });

    it("over pads to correct length with nulls", () => {
      const { circles } = buildCurrentOverCircles([run(1)], { wideIsExtraBall: true });
      expect(circles.length).toBe(6); // LEGAL_BALLS default
    });

    it("first-ball flag is correct", () => {
      const { isFirstBall } = buildCurrentOverCircles([run(1)], { wideIsExtraBall: true });
      expect(isFirstBall).toBe(true);
    });

    it("over rolls after 6 legal balls", () => {
      const events = Array(6).fill(null).map(() => run(1));
      const { circles } = buildCurrentOverCircles(events, { wideIsExtraBall: true });
      expect(circles.length).toBe(6);
    });

    it("extra deliveries do NOT advance over count incorrectly", () => {
      const events = [wide(), wide(), run(1)];
      const { circles } = buildCurrentOverCircles(events, { wideIsExtraBall: true });
      expect(circles.length).toBe(4); // 2 wides + 1 ball + padding
    });
  });

  // 6 Overflow handling
  describe("Overflow handling", () => {
    it("triggers overflow mode when circles > maxCircles", () => {
      const events = Array(12).fill(null).map(() => run(1));
      const { circles } = buildCurrentOverCircles(events, { wideIsExtraBall: true }, 6, 10);
      expect(circles.length).toBeLessThanOrEqual(10);
    });

    it("legal balls remain visible during overflow", () => {
      const events = Array(12).fill(null).map(() => run(1));
      const { circles } = buildCurrentOverCircles(events, { wideIsExtraBall: true }, 6, 10);
      expect(circles.filter(e => e?.type === "ball").length).toBe(6);
    });

    it("extras collapse into Ex + count during overflow", () => {
      const events = [wide(), wide(), wide(), wide(), wide(), wide(), wide()];
      const { circles } = buildCurrentOverCircles(events, { wideIsExtraBall: true }, 6, 5);
      expect(circles.some(e => "extraCount" in (e || {}))).toBe(true);
    });
  });

  // 7 Wickets + negative runs (table-driven)
  describe("Wickets (wicketsAsNegativeRuns = true)", () => {
    const wicketExtraCombos = [
      { kind: "stumped", extra: "wide", runs: 1 },
      { kind: "stumped", extra: "wide", runs: 0 },
      { kind: "runOut", extra: "noBall", runs: 2 },
      { kind: "bowled", extra: "noBall", runs: 0 },
      { kind: "runOut", extra: null, runs: 1 },
      { kind: "caught", extra: null, runs: 0 },
    ];

    describe.each(wicketExtraCombos)(
      "wicket: $kind + extra: $extra + runs: $runs",
      ({ kind, extra, runs }) => {
        it("applies negative runs automatically", () => {
          const event = wicket(kind, {
            runs,
            isExtra: extra !== null,
            extraType: extra as any,
            countsAsBall: extra === null,
          });

          const { circles } = buildCurrentOverCircles([event], {
            wideIsExtraBall: true,
            wicketsAsNegativeRuns: true,
          });

          const circle = circles[0];
          const expectedRuns = runs > 0 ? -runs : 0;

          expect(circle?.runs).toBe(expectedRuns);
        });
      }
    );
  });
});

// ------------------------
// BallCircle UI tests
// ------------------------
import React from "react";
import { render } from "@testing-library/react-native";
import { BallCircle } from "../BallCircle";

describe("BallCircle – UI rendering guarantees", () => {
  it("renders empty (unbowled) circle", () => {
    render(<BallCircle item={null} />);
  });

  it("renders wicket circle 'W'", () => {
    const { getByText } = render(<BallCircle item={wicket("bowled")} />);
    expect(getByText("W")).toBeTruthy();
  });

  it("renders wicket + runs as '+1'", () => {
    const { getByText } = render(<BallCircle item={wicket("bowled", { runs: 1 })} />);
    expect(getByText("+1")).toBeTruthy();
  });

  it("renders wicket + wide as 'Wd'", () => {
    const { getByText } = render(<BallCircle item={wicket("stumped", { isExtra: true, extraType: "wide", countsAsBall: false })} />);
    expect(getByText("Wd")).toBeTruthy();
  });

  it("renders wicket + run + wide as '+1 Wd'", () => {
    const { getByText } = render(<BallCircle item={wicket("stumped", { runs: 1, isExtra: true, extraType: "wide", countsAsBall: false })} />);
    expect(getByText("+1 Wd")).toBeTruthy();
  });

  it("extra-only balls hide main dot", () => {
    const { queryByText } = render(<BallCircle item={wide()} />);
    expect(queryByText("•")).toBeNull();
  });

  it("extra summary circle shows 'Ex' + number", () => {
    const events = [wide(), wide(), wide(), wide()];
    const { getByText } = render(<BallCircle item={{ extraCount: 4 }} />);
    expect(getByText("Ex")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
  });

  it("renders normal ball with runs > 0", () => {
    const { getByText } = render(<BallCircle item={run(2)} />);
    expect(getByText("2")).toBeTruthy();
  });

  it("renders normal ball with 0 runs as •", () => {
    const { getByText } = render(<BallCircle item={run(0)} />);
    expect(getByText("•")).toBeTruthy();
  });

  it("renders negative wicket run correctly", () => {
    const { getByText } = render(<BallCircle item={wicket("bowled", { runs: -1 })} />);
    expect(getByText("-1")).toBeTruthy();
  });
});
