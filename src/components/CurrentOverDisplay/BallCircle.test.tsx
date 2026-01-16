// src/utils/__tests__/BallCircle.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { BallCircle } from "../BallCircle";
import { wicketExtraScenarios } from "./scenarios";

describe("BallCircle – wicket + extras rendering", () => {
  wicketExtraScenarios.forEach(event => {
    const label = `${event.kind}${event.isExtra ? ` + ${event.extraType}` : ""} + ${event.runs} runs`;

    it(`renders ${label}`, () => {
      const { getByText } = render(<BallCircle item={event} />);

      // Always show 'W' for wickets
      expect(getByText("W")).toBeTruthy();

      // Show runs + extra label if applicable
      const runsText = event.runs > 0 ? `+${event.runs}` : event.runs < 0 ? `${event.runs}` : "";
      const extraText = event.isExtra && event.extraType ? ` ${event.extraType[0].toUpperCase()}${event.extraType.slice(1, 2)}` : "";

      if (runsText || extraText) {
        expect(getByText(`${runsText}${extraText}`.trim())).toBeTruthy();
      }
    });
  });
});
