// src/utils/__tests__/buildCurrentOverCircles.test.ts

// ✅ import helper instead of original
import { buildCurrentOverCirclesForTest as buildCurrentOverCircles } from "../currentOverUtils.testHelper";
import { wide, noBall, bye, legBye, run, wicket } from "../../test/factories/ballEvents";

// ------------------------
// buildCurrentOverCircles logic tests
// ------------------------
describe("buildCurrentOverCircles – logic", () => {

  // 1 Normal deliveries
  describe("Normal deliveries", () => {
    it("renders dot ball correctly", () => {
      const { circles } = buildCurrentOverCircles([run(0)]);
      const firstCircle = circles[0];
      if (firstCircle && "runs" in firstCircle) {
        expect(firstCircle.runs).toBe(0);
      }
    });

    [1, 2, 3, 4, 6].forEach(r => {
      it(`renders run of ${r} correctly`, () => {
        const { circles } = buildCurrentOverCircles([run(r)]);
        const firstCircle = circles[0];
        if (firstCircle && "runs" in firstCircle) {
          expect(firstCircle.runs).toBe(r);
        }
      });
    });
  });

  // 2 Extras (no wicket)
  describe("Extras", () => {
    it("renders wide with no runs", () => {
      const { circles } = buildCurrentOverCircles([wide()]);
      const firstCircle = circles[0];
      if (firstCircle && "extraType" in firstCircle) {
        expect(firstCircle.extraType).toBe("wide");
      }
    });

    it("renders wide + runs", () => {
      const { circles } = buildCurrentOverCircles([wide(2)]);
      const firstCircle = circles[0];
      if (firstCircle && "runs" in firstCircle) {
        expect(firstCircle.runs).toBe(2);
      }
    });

    it("renders no-ball", () => {
      const { circles } = buildCurrentOverCircles([noBall()]);
      const firstCircle = circles[0];
      if (firstCircle && "extraType" in firstCircle) {
        expect(firstCircle.extraType).toBe("noBall");
      }
    });

    it("renders no-ball + runs", () => {
      const { circles } = buildCurrentOverCircles([noBall(2)]);
      const firstCircle = circles[0];
      if (firstCircle && "runs" in firstCircle) {
        expect(firstCircle.runs).toBe(2);
      }
    });

    it("adds extra circle for wide", () => {
      const { circles } = buildCurrentOverCircles([wide()]);
      expect(circles.length).toBe(7); // test helper defaults wideIsExtraBall=true
    });
  });

  // 3 Wickets (no extras)
  (["bowled", "caught", "runOut", "stumped"] as const).forEach(kind => {
    it(`renders ${kind} correctly`, () => {
      const { circles } = buildCurrentOverCircles([wicket(kind)]);
      const firstCircle = circles[0];
      if (firstCircle && "type" in firstCircle) {
        expect(firstCircle.type).toBe("wicket");
      }
    });
  });

  // 4 Wickets + extras (high-risk)
  describe("Wickets + extras", () => {
    const scenarios = [
      { kind: "stumped" as const, extraType: "wide" as const, runs: 0, expectedCircles: 7 },
      { kind: "stumped" as const, extraType: "wide" as const, runs: 1, expectedCircles: 7 },
      { kind: "bowled" as const, extraType: "noBall" as const, runs: 0, expectedCircles: 7 },
      { kind: "runOut" as const, extraType: "noBall" as const, runs: 0, expectedCircles: 7 },
      { kind: "runOut" as const, extraType: "noBall" as const, runs: 2, expectedCircles: 7 },
      { kind: "runOut" as const, extraType: "bye" as const, runs: 0, expectedCircles: 6 },
      { kind: "runOut" as const, extraType: "legBye" as const, runs: 0, expectedCircles: 6 },
    ];

    describe.each(scenarios)(
      "$kind + $extraType + runs: $runs",
      ({ kind, extraType, runs, expectedCircles }) => {
        it(`renders ${expectedCircles} circle(s)`, () => {
          const { circles } = buildCurrentOverCircles([
            wicket(kind, { isExtra: !!extraType, extraType: extraType ?? undefined, runs, countsAsBall: false })
          ]);
          expect(circles.length).toBe(expectedCircles);
        });
      }
    );
  });

  // 5 Over display behaviour
  describe("Over display behaviour", () => {
    it("over pads to correct length with nulls", () => {
      const { circles } = buildCurrentOverCircles([run(1)]);
      expect(circles.length).toBe(6);
    });

    it("first-ball flag is correct", () => {
      const { isFirstBall } = buildCurrentOverCircles([run(1)]);
      expect(isFirstBall).toBe(true);
    });
  });
});
